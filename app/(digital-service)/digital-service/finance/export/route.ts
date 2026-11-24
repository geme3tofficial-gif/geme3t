import ExcelJS from "exceljs";
import {
  Document,
  HeadingLevel,
  PageOrientation,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
} from "docx";
import { jsPDF } from "jspdf";
import { NextResponse } from "next/server";
import {
  formatFinanceCents,
  getFinanceStatement,
  parseFinanceReportFilters,
} from "@/lib/domain/digital-service/finance-report";
import { requireAdmin } from "@/lib/admin-auth";

type ExportFormat = "xlsx" | "docx" | "pdf";
type FinanceStatement = Awaited<ReturnType<typeof getFinanceStatement>>;
type RgbColor = [number, number, number];

const contentTypes: Record<ExportFormat, string> = {
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pdf: "application/pdf",
};

const green = "15803D";
const red = "B91C1C";
const dark = "1E293B";

function isExportFormat(value: string | null): value is ExportFormat {
  return value === "xlsx" || value === "docx" || value === "pdf";
}

function scopeLabel(filters: ReturnType<typeof parseFinanceReportFilters>["filters"]) {
  const dateRange = filters.from || filters.to
    ? `${filters.from || "No start date"} to ${filters.to || "No end date"}`
    : "All dates";
  const source = filters.source === "ALL" ? "All sources" : filters.source;
  const search = filters.search ? `Search: ${filters.search}` : "";
  const transactionType = filters.type === "ALL"
    ? "All transaction types"
    : `${filters.type === "REVENUE" ? "Income" : "Expense"} only`;
  return [dateRange, source, transactionType, search].filter(Boolean).join(" | ");
}

function addExcelHeader(sheet: ExcelJS.Worksheet, rowNumber: number) {
  const row = sheet.getRow(rowNumber);
  row.font = { bold: true, color: { argb: "FFFFFFFF" } };
  row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${dark}` } };
  row.alignment = { vertical: "middle", wrapText: true };
}

async function createExcel(statement: FinanceStatement, filters: ReturnType<typeof parseFinanceReportFilters>["filters"]) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "GEME3T Digital Services";
  workbook.created = new Date();
  const sheet = workbook.addWorksheet("Financial statement");

  sheet.addRow(["GEME3T Digital Services - Financial Statement"]);
  sheet.getRow(1).font = { bold: true, size: 16, color: { argb: `FF${dark}` } };
  sheet.addRow([scopeLabel(filters)]);
  sheet.addRow(["Daily balance is income minus expenses for each day. Type filtering only limits the transaction details."]);
  sheet.addRow([]);
  sheet.addRow(["Period summary"]);
  addExcelHeader(sheet, 5);
  const summaryRows: Array<[string, number]> = [
    ["Income", statement.income],
    ["Expenses", statement.expense],
    ["Net balance", statement.balance],
  ];
  for (const [label, cents] of summaryRows) {
    sheet.addRow([label, cents / 100]);
  }

  sheet.addRow([]);
  const dailyTitle = sheet.addRow(["Daily balances"]);
  dailyTitle.font = { bold: true, size: 12 };
  const dailyHeader = sheet.addRow(["Date", "Income", "Expenses", "Daily balance"]);
  addExcelHeader(sheet, dailyHeader.number);
  for (const day of statement.days) {
    const row = sheet.addRow([day.date, day.income / 100, day.expense / 100, day.balance / 100]);
    row.getCell(2).font = { color: { argb: `FF${green}` } };
    row.getCell(3).font = { color: { argb: `FF${red}` } };
    row.getCell(4).font = { color: { argb: `FF${day.balance < 0 ? red : green}` } };
  }

  sheet.addRow([]);
  const transactionTitle = sheet.addRow(["Transactions"]);
  transactionTitle.font = { bold: true, size: 12 };
  const transactionHeader = sheet.addRow([
    "Date",
    "Type",
    "Category",
    "Description",
    "Amount",
    "Payment method",
    "Source",
  ]);
  addExcelHeader(sheet, transactionHeader.number);
  for (const entry of statement.entries) {
    const isIncome = entry.type === "REVENUE";
    const row = sheet.addRow([
      entry.entryDate.toISOString().slice(0, 10),
      isIncome ? "Income" : "Expense",
      entry.category,
      entry.description ?? "",
      Number(entry.amount),
      entry.paymentMethod,
      entry.source,
    ]);
    row.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: isIncome ? "FFF0FDF4" : "FFFEF2F2" },
      };
    });
    row.getCell(2).font = { color: { argb: `FF${isIncome ? green : red}` }, bold: true };
    row.getCell(5).font = { color: { argb: `FF${isIncome ? green : red}` } };
  }

  sheet.columns = [
    { width: 16 },
    { width: 18 },
    { width: 24 },
    { width: 40 },
    { width: 18, style: { numFmt: '"₦"#,##0.00;[Red]-"₦"#,##0.00' } },
    { width: 20 },
    { width: 16 },
  ];
  for (const column of [2, 3, 4, 5]) {
    sheet.getColumn(column).numFmt = '"₦"#,##0.00;[Red]-"₦"#,##0.00';
  }
  if (statement.entries.length > 0) {
    sheet.autoFilter = {
      from: `A${transactionHeader.number}`,
      to: `G${transactionHeader.number + statement.entries.length}`,
    };
  }
  sheet.views = [{ state: "frozen", ySplit: 4 }];
  return workbook.xlsx.writeBuffer();
}

function wordTable(rows: string[][], rowColors: Array<Record<number, string>> = []) {
  const tableRows = rows.map((row, rowIndex) =>
    new TableRow({
      children: row.map((text, columnIndex) =>
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text,
                  bold: rowIndex === 0,
                  color: rowIndex > 0
                    ? rowColors[rowIndex - 1]?.[columnIndex] ?? dark
                    : dark,
                }),
              ],
            }),
          ],
        }),
      ),
    }),
  );
  return new Table({ rows: tableRows });
}

async function createWord(
  statement: FinanceStatement,
  filters: ReturnType<typeof parseFinanceReportFilters>["filters"],
) {
  const dailyRows = [
    ["Date", "Income", "Expenses", "Daily balance"],
    ...statement.days.map((day) => [
      day.date,
      formatFinanceCents(day.income),
      formatFinanceCents(day.expense),
      formatFinanceCents(day.balance),
    ]),
  ];
  const transactionRows = [
    ["Date", "Type", "Category", "Description", "Amount", "Payment method", "Source"],
    ...statement.entries.map((entry) => [
      entry.entryDate.toISOString().slice(0, 10),
      entry.type === "REVENUE" ? "Income" : "Expense",
      entry.category,
      entry.description ?? "-",
      formatFinanceCents(Math.round(Number(entry.amount) * 100)),
      entry.paymentMethod,
      entry.source,
    ]),
  ];
  const children: Array<Paragraph | Table> = [
    new Paragraph({ text: "GEME3T Digital Services - Financial Statement", heading: HeadingLevel.HEADING_1 }),
    new Paragraph({ text: scopeLabel(filters) }),
    new Paragraph({ text: `Income: ${formatFinanceCents(statement.income)} | Expenses: ${formatFinanceCents(statement.expense)} | Net balance: ${formatFinanceCents(statement.balance)}` }),
    new Paragraph({ text: "Daily balance is income minus expenses for each day. Type filtering only limits the transaction details." }),
    new Paragraph({ text: "Daily balances", heading: HeadingLevel.HEADING_2 }),
    wordTable(
      dailyRows,
      statement.days.map((day) => ({
        1: green,
        2: red,
        3: day.balance < 0 ? red : green,
      })),
    ),
    new Paragraph({ text: "Transactions", heading: HeadingLevel.HEADING_2 }),
    wordTable(
      transactionRows,
      statement.entries.map((entry) => {
        const color = entry.type === "REVENUE" ? green : red;
        return { 1: color, 4: color };
      }),
    ),
  ];

  const document = new Document({
    sections: [{
      properties: { page: { size: { orientation: PageOrientation.LANDSCAPE } } },
      children,
    }],
  });
  return Packer.toBuffer(document);
}

function createPdf(
  statement: FinanceStatement,
  filters: ReturnType<typeof parseFinanceReportFilters>["filters"],
) {
  const pdf = new jsPDF({ orientation: "landscape" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 14;
  let y = margin;
  const pdfMoney = (cents: number) => formatFinanceCents(cents).replace("₦", "NGN ");

  function write(text: string, size = 9, color: RgbColor = [15, 23, 42], bold = false) {
    pdf.setFont("helvetica", bold ? "bold" : "normal");
    pdf.setFontSize(size);
    pdf.setTextColor(...color);
    const lines = pdf.splitTextToSize(text, pageWidth - margin * 2);
    const lineHeight = size * 0.45;
    if (y + lines.length * lineHeight > pageHeight - margin) {
      pdf.addPage();
      y = margin;
    }
    pdf.text(lines, margin, y);
    y += lines.length * lineHeight + 2;
  }

  write("GEME3T Digital Services - Financial Statement", 16, [30, 41, 59], true);
  write(scopeLabel(filters));
  write("Daily balance is income minus expenses for each day. Type filtering only limits the transaction details.");
  write(`Period income: ${pdfMoney(statement.income)} | Expenses: ${pdfMoney(statement.expense)} | Net balance: ${pdfMoney(statement.balance)}`);
  y += 3;
  write("Daily balances", 12, [30, 41, 59], true);
  for (const day of statement.days) {
    write(`${day.date} daily totals`, 9, [15, 23, 42], true);
    write(`Income: ${pdfMoney(day.income)}`, 8, [21, 128, 61]);
    write(`Expenses: ${pdfMoney(day.expense)}`, 8, [185, 28, 28]);
    write(`Balance: ${pdfMoney(day.balance)}`, 8, day.balance < 0 ? [185, 28, 28] : [21, 128, 61]);
  }
  y += 3;
  write("Transactions", 12, [30, 41, 59], true);
  for (const entry of statement.entries) {
    const isIncome = entry.type === "REVENUE";
    write(
      `${entry.entryDate.toISOString().slice(0, 10)}  |  ${isIncome ? "Income" : "Expense"}  |  ${entry.category}  |  ${entry.description ?? "-"}  |  ${pdfMoney(Math.round(Number(entry.amount) * 100))}  |  ${entry.paymentMethod}  |  ${entry.source}`,
      8,
      isIncome ? [21, 128, 61] : [185, 28, 28],
    );
  }

  return pdf.output("arraybuffer");
}

export async function GET(request: Request) {
  await requireAdmin();
  const searchParams = new URL(request.url).searchParams;
  const format = searchParams.get("format");
  if (!isExportFormat(format)) {
    return NextResponse.json({ error: "Unsupported financial statement format." }, { status: 400 });
  }

  const { filters, errors } = parseFinanceReportFilters({
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
    type: searchParams.get("type") ?? undefined,
    source: searchParams.get("source") ?? undefined,
    q: searchParams.get("q") ?? undefined,
  });
  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
  }

  const statement = await getFinanceStatement(filters);
  const date = new Date().toISOString().slice(0, 10);
  const filename = `digital-service-financial-statement-${date}.${format}`;
  let body: BodyInit;

  if (format === "xlsx") {
    body = new Uint8Array(await createExcel(statement, filters));
  } else if (format === "docx") {
    body = new Uint8Array(await createWord(statement, filters));
  } else {
    body = new Uint8Array(createPdf(statement, filters));
  }

  return new NextResponse(body, {
    headers: {
      "Content-Type": contentTypes[format],
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
