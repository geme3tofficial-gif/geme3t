import ExcelJS from "exceljs";
import { Document, HeadingLevel, PageOrientation, Packer, Paragraph, Table, TableCell, TableRow } from "docx";
import { jsPDF } from "jspdf";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getPrismaClient } from "@/lib/prisma";

const headers = [
  "Quote ID",
  "Transaction date",
  "Customer",
  "Phone",
  "Coupon",
  "Service",
  "Unit",
  "Unit price",
  "Quantity",
  "Service amount",
  "Service status",
  "Service entered",
  "Completed at",
  "Carry-forward date",
  "Payment channels",
  "Cash amount",
  "Transfer amount",
  "Coupon redemption",
  "Quote gross",
  "Direct discount",
  "Coupon discount",
  "Quote payable",
  "Direct cost",
  "Net profit",
  "Affiliate commission",
  "Quote status",
];

const contentTypes = {
  csv: "text/csv; charset=utf-8",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pdf: "application/pdf",
};

async function getExportQuotes() {
  return getPrismaClient().digitalServiceQuote.findMany({
    include: { customer: true, coupon: true, items: { orderBy: { createdAt: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
}

type ExportQuote = Awaited<ReturnType<typeof getExportQuotes>>[number];

function money(value: number | string) {
  return `NGN ${Number(value).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function quoteRows(quote: ExportQuote) {
  return quote.items.map((item) => [
    quote.id,
    quote.createdAt.toISOString(),
    quote.customer?.name ?? "Guest",
    quote.customer?.phone ?? "",
    quote.coupon?.code ?? "",
    item.name,
    item.unit,
    item.unitPrice.toString(),
    String(item.quantity),
    item.lineTotal.toString(),
    item.status,
    item.createdAt.toISOString(),
    item.completedAt?.toISOString() ?? "",
    item.carryoverDate?.toISOString().slice(0, 10) ?? "",
    item.paymentChannels.join(", "),
    item.cashAmount.toString(),
    item.transferAmount.toString(),
    item.redemptionAmount.toString(),
    quote.grossTotal.toString(),
    quote.directDiscount.toString(),
    quote.couponDiscount.toString(),
    quote.payableTotal.toString(),
    quote.directCost.toString(),
    quote.netProfit.toString(),
    quote.commissionEarned.toString(),
    quote.status,
  ]);
}

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  const safeText = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safeText.replace(/"/g, '""')}"`;
}

async function createExcel(rows: string[][]) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "GEME3T Digital Services";
  workbook.created = new Date();
  const sheet = workbook.addWorksheet("Sales report");
  sheet.addRow(headers);
  rows.forEach((row) => sheet.addRow(row));
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.autoFilter = { from: "A1", to: `${String.fromCharCode(64 + headers.length)}${rows.length + 1}` };
  sheet.columns.forEach((column, index) => {
    column.width = [38, 24, 24, 18, 18, 30, 14, 14, 12, 16, 16, 24, 24, 18, 28, 16, 18, 18, 16, 18, 18, 18, 16, 16, 22, 16][index];
  });
  const heading = sheet.getRow(1);
  heading.font = { bold: true, color: { argb: "FFFFFFFF" } };
  heading.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
  heading.alignment = { vertical: "middle", wrapText: true };
  heading.height = 30;
  return workbook.xlsx.writeBuffer();
}

async function createWord(quotes: ExportQuote[]) {
  const children: Array<Paragraph | Table> = [
    new Paragraph({ text: "Digital Services Sales Report", heading: HeadingLevel.HEADING_1 }),
    new Paragraph({ text: `Generated ${new Date().toLocaleString()}` }),
    new Paragraph({ text: `${quotes.length} sales · ${quotes.reduce((total, quote) => total + quote.items.length, 0)} service items` }),
  ];

  for (const quote of quotes) {
    children.push(
      new Paragraph({ text: `Quote ${quote.id}`, heading: HeadingLevel.HEADING_2 }),
      new Paragraph({
        text: `Transaction: ${quote.createdAt.toISOString()} · Customer: ${quote.customer?.name ?? "Guest"} · Phone: ${quote.customer?.phone ?? "-"} · Coupon: ${quote.coupon?.code ?? "-"} · Status: ${quote.status}`,
      }),
      new Paragraph({
        text: `Gross ${money(quote.grossTotal.toString())} · Direct discount ${money(quote.directDiscount.toString())} · Coupon discount ${money(quote.couponDiscount.toString())} · Payable ${money(quote.payableTotal.toString())} · Direct cost ${money(quote.directCost.toString())} · Net profit ${money(quote.netProfit.toString())} · Commission ${money(quote.commissionEarned.toString())}`,
      }),
    );

    const tableRows = [
      ["Service", "Unit price", "Qty", "Amount", "Status", "Entered / completed", "Carry-forward", "Channels / payment"],
      ...quote.items.map((item) => [
        item.name,
        money(item.unitPrice.toString()),
        `${item.quantity} ${item.unit}`,
        money(item.lineTotal.toString()),
        item.status,
        `${item.createdAt.toISOString()}${item.completedAt ? ` / ${item.completedAt.toISOString()}` : " / not completed"}`,
        item.carryoverDate?.toISOString().slice(0, 10) ?? "-",
        `${item.paymentChannels.join(", ") || "-"}; cash ${money(item.cashAmount.toString())}; transfer ${money(item.transferAmount.toString())}; redemption ${money(item.redemptionAmount.toString())}`,
      ]),
    ].map((row) =>
      new TableRow({
        children: row.map((text) => new TableCell({ children: [new Paragraph({ text })] })),
      }),
    );
    children.push(new Table({ rows: tableRows }));
  }

  const document = new Document({
    sections: [{
      properties: { page: { size: { orientation: PageOrientation.LANDSCAPE } } },
      children,
    }],
  });
  return Packer.toBuffer(document);
}

function createPdf(quotes: ExportQuote[]) {
  const pdf = new jsPDF({ orientation: "landscape" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 14;
  let y = margin;

  function write(text: string, size = 9, bold = false) {
    pdf.setFont("helvetica", bold ? "bold" : "normal");
    pdf.setFontSize(size);
    const lines = pdf.splitTextToSize(text, pageWidth - margin * 2);
    const lineHeight = size * 0.45;
    if (y + lines.length * lineHeight > pageHeight - margin) {
      pdf.addPage();
      y = margin;
    }
    pdf.text(lines, margin, y);
    y += lines.length * lineHeight + 2;
  }

  write("GEME3T Digital Services Sales Report", 17, true);
  write(`Generated ${new Date().toLocaleString()} · ${quotes.length} sales`, 9);
  y += 3;

  for (const quote of quotes) {
    write(`Quote ${quote.id} · ${quote.status} · ${quote.createdAt.toISOString()}`, 11, true);
    write(`Customer: ${quote.customer?.name ?? "Guest"} · Phone: ${quote.customer?.phone ?? "-"} · Coupon: ${quote.coupon?.code ?? "-"}`);
    write(
      `Gross ${money(quote.grossTotal.toString())} · Direct discount ${money(quote.directDiscount.toString())} · Coupon discount ${money(quote.couponDiscount.toString())} · Payable ${money(quote.payableTotal.toString())} · Direct cost ${money(quote.directCost.toString())} · Net profit ${money(quote.netProfit.toString())} · Commission ${money(quote.commissionEarned.toString())}`,
    );
    for (const item of quote.items) {
      write(
        `${item.name} · ${item.quantity} ${item.unit} × ${money(item.unitPrice.toString())} = ${money(item.lineTotal.toString())} · ${item.status} · entered ${item.createdAt.toISOString()} · completed ${item.completedAt?.toISOString() ?? "not completed"} · carry-forward ${item.carryoverDate?.toISOString().slice(0, 10) ?? "-"} · channels ${item.paymentChannels.join(", ") || "-"} · cash ${money(item.cashAmount.toString())} · transfer ${money(item.transferAmount.toString())} · redemption ${money(item.redemptionAmount.toString())}`,
        8,
      );
    }
    y += 4;
  }

  return pdf.output("arraybuffer");
}

export async function GET(request: Request) {
  await requireAdmin();
  const format = new URL(request.url).searchParams.get("format") ?? "csv";
  if (!["csv", "xlsx", "docx", "pdf"].includes(format)) {
    return NextResponse.json({ error: "Unsupported report format." }, { status: 400 });
  }

  const quotes = await getExportQuotes();
  const rows = quotes.flatMap(quoteRows);
  const date = new Date().toISOString().slice(0, 10);
  const filename = `digital-service-sales-${date}.${format}`;
  let body: BodyInit;

  if (format === "csv") {
    body = `\uFEFF${[headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\r\n")}`;
  } else if (format === "xlsx") {
    body = new Uint8Array(await createExcel(rows));
  } else if (format === "docx") {
    body = new Uint8Array(await createWord(quotes));
  } else {
    body = new Uint8Array(createPdf(quotes));
  }

  return new NextResponse(body, {
    headers: {
      "Content-Type": contentTypes[format as keyof typeof contentTypes],
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
