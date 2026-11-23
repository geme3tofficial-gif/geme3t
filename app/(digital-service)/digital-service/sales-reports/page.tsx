import type { Metadata } from "next";
import { getPrismaClient } from "@/lib/prisma";
import { DayCloseControls } from "@/components/domain/digital-service/day-close-controls";
import { DayCloseCountdown } from "@/components/domain/digital-service/day-close-countdown";
import { SalesReportOperations } from "@/components/domain/digital-service/sales-report-operations";
import { SalesReportQuoteHistory } from "@/components/domain/digital-service/sales-report-quote-history";

export const metadata: Metadata = { title: "Digital service sales reports" };

export default async function SalesReportsPage() {
  const prisma = getPrismaClient();
  const [quotes, customerCoupons, creditSetting] = await Promise.all([
    prisma.digitalServiceQuote.findMany({
      include: { customer: true, coupon: true, items: { orderBy: { createdAt: "asc" } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.digitalServiceCoupon.findMany({
      where: { referralOnly: true },
      select: { code: true, redemptionThreshold: true, referralOnly: true },
    }),
    prisma.digitalServiceAppSetting.findUnique({ where: { key: "customer_credit_pct" } }),
  ]);
  const couponsByCode = new Map(customerCoupons.map((coupon) => [coupon.code.toUpperCase(), coupon]));
  const creditPct = Math.max(0, Math.min(100, Number(creditSetting?.value ?? 5)));
  const operations = quotes.flatMap((quote) =>
    quote.items.map((item) => {
      const customerCoupon = quote.customer?.couponCode
        ? couponsByCode.get(quote.customer.couponCode.toUpperCase())
        : undefined;
      const gross = Number(quote.grossTotal);
      const ratio = gross > 0 ? Number(item.lineTotal) / gross : 0;
      const projectedCredit =
        Math.max(0, Number(quote.netProfit) * ratio) * creditPct / 100;

      return {
        id: item.id,
        quoteId: quote.id,
        name: item.name,
        unit: item.unit,
        quantity: item.quantity,
        lineTotal: Number(item.lineTotal),
        unitPrice: Number(item.unitPrice),
        status: item.status,
        createdAt: item.createdAt.toISOString(),
        quoteCreatedAt: quote.createdAt.toISOString(),
        completedAt: item.completedAt?.toISOString() ?? null,
        carryoverDate: item.carryoverDate?.toISOString().slice(0, 10) ?? null,
        paymentChannels: item.paymentChannels,
        cashAmount: Number(item.cashAmount),
        transferAmount: Number(item.transferAmount),
        redemptionAmount: Number(item.redemptionAmount),
        quoteStatus: quote.status,
        quoteCouponCode: quote.coupon?.code ?? null,
        quoteGrossTotal: Number(quote.grossTotal),
        quoteDirectDiscount: Number(quote.directDiscount),
        quoteCouponDiscount: Number(quote.couponDiscount),
        quotePayableTotal: Number(quote.payableTotal),
        quoteDirectCost: Number(quote.directCost),
        quoteNetProfit: Number(quote.netProfit),
        quoteCommission: Number(quote.commissionEarned),
        customerCreditPct: creditPct,
        customer: quote.customer
          ? {
              name: quote.customer.name,
              phone: quote.customer.phone,
              serviceCount: quote.customer.serviceCount,
              serviceAmount: Number(quote.customer.serviceAmount),
              creditBalance: Number(quote.customer.creditBalance),
              creditScore: quote.customer.creditScore,
              referralCredit: Number(quote.customer.referralCredit),
              couponCode: quote.customer.couponCode,
            }
          : null,
        redemptionThreshold: customerCoupon?.redemptionThreshold ?? 3,
        referralOnlyCoupon: customerCoupon?.referralOnly ?? false,
        projectedCredit,
      };
    }),
  );
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
