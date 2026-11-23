import type { Metadata } from "next";
import { connection } from "next/server";
import { getDigitalServiceSalesReportData } from "@/lib/domain/digital-service/sales-report-data";
import { DayCloseControls } from "@/components/domain/digital-service/day-close-controls";
import { DayCloseCountdown } from "@/components/domain/digital-service/day-close-countdown";
import { SalesReportOperations } from "@/components/domain/digital-service/sales-report-operations";
import { SalesReportQuoteHistory } from "@/components/domain/digital-service/sales-report-quote-history";

export const metadata: Metadata = { title: "Digital service sales reports" };

export default async function SalesReportsPage() {
  await connection();
  const { quotes, operations } = await getDigitalServiceSalesReportData();
  const quoteHistory = quotes.map((quote) => ({
    id: quote.id,
    createdAt: quote.createdAt.toISOString(),
    status: quote.status,
    grossTotal: Number(quote.grossTotal),
    directDiscount: Number(quote.directDiscount),
    couponDiscount: Number(quote.couponDiscount),
    payableTotal: Number(quote.payableTotal),
    directCost: Number(quote.directCost),
    netProfit: Number(quote.netProfit),
    commissionEarned: Number(quote.commissionEarned),
    couponCode: quote.coupon?.code ?? null,
    customer: quote.customer
      ? {
          name: quote.customer.name,
          phone: quote.customer.phone,
          serviceCount: quote.customer.serviceCount,
          serviceAmount: Number(quote.customer.serviceAmount),
          creditBalance: Number(quote.customer.creditBalance),
          creditScore: quote.customer.creditScore,
          referralCredit: Number(quote.customer.referralCredit),
        }
      : null,
    items: quote.items.map((item) => ({
      id: item.id,
      name: item.name,
      unit: item.unit,
      unitPrice: Number(item.unitPrice),
      quantity: item.quantity,
      lineTotal: Number(item.lineTotal),
      status: item.status,
      createdAt: item.createdAt.toISOString(),
      completedAt: item.completedAt?.toISOString() ?? null,
      carryoverDate: item.carryoverDate?.toISOString().slice(0, 10) ?? null,
      paymentChannels: item.paymentChannels,
      cashAmount: Number(item.cashAmount),
      transferAmount: Number(item.transferAmount),
      redemptionAmount: Number(item.redemptionAmount),
    })),
  }));
  return (
    <>
      <div className="dashboard-welcome">
        <div><span className="eyebrow">Operations</span><h1>Sales reports</h1><p>Pending and completed sales, with item-level operations.</p></div>
        <DayCloseControls />
      </div>
      <DayCloseCountdown />
      <SalesReportOperations operations={operations} />
      <SalesReportQuoteHistory quotes={quoteHistory} />
    </>
  );
}
