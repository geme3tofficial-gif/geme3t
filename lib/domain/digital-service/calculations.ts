export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

export function calculateQuote(input: {
  grossTotal: number;
  directDiscount?: number;
  customerDiscountPct?: number;
  couponDirectDiscount?: number;
  couponDiscountPct?: number;
  directCost?: number;
  affiliatePct?: number;
}) {
  const gross = Math.max(0, input.grossTotal);
  const directDiscount = clamp(input.directDiscount ?? 0, 0, gross);
  const customerPct = clamp(input.customerDiscountPct ?? 0, 0, 100);
  const couponDirect = clamp(input.couponDirectDiscount ?? 0, 0, gross);
  const couponPct = clamp(input.couponDiscountPct ?? 0, 0, 100);
  const couponDiscount = Math.min(gross, couponDirect + (gross * couponPct / 100));
  const discount = directDiscount + couponDiscount + (gross * customerPct / 100);
  const payable = Math.max(0, gross - discount);
  const directCost = Math.max(0, input.directCost ?? 0);
  const netProfit = Math.max(0, payable - directCost);
  const commission = netProfit * clamp(input.affiliatePct ?? 0, 0, 100) / 100;

  return {
    gross,
    directDiscount,
    couponDiscount,
    discount,
    payable,
    directCost,
    netProfit,
    commission,
  };
}
