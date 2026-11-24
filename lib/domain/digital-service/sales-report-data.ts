import { getPrismaClient } from "@/lib/prisma";
import type { DigitalServiceOperation } from "@/lib/domain/digital-service/sales-types";

export async function getDigitalServiceSalesReportData() {
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
  const operations: DigitalServiceOperation[] = quotes.flatMap((quote) =>
    quote.items.map((item) => {
      const customerCoupon = quote.customer?.couponCode
        ? couponsByCode.get(quote.customer.couponCode.toUpperCase())
        : undefined;
      const gross = Number(quote.grossTotal);
      const ratio = gross > 0 ? Number(item.lineTotal) / gross : 0;
      const projectedCredit = Math.max(0, Number(quote.netProfit) * ratio) * creditPct / 100;

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
              id: quote.customer.id,
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
  return { quotes, operations, creditPct };
}
