"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { getPrismaClient } from "@/lib/prisma";

function startOfBusinessDate(dateText: string, timeZone: string) {
  const [year, month, day] = dateText.split("-").map(Number);
  const localMidnightAsUtc = Date.UTC(year, month - 1, day);
  let timestamp = localMidnightAsUtc;
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = Object.fromEntries(
      formatter.formatToParts(new Date(timestamp)).map((part) => [part.type, part.value]),
    );
    const representedAsUtc = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second),
    );
    const adjustment = localMidnightAsUtc - representedAsUtc;
    timestamp += adjustment;
    if (adjustment === 0) break;
  }
  return new Date(timestamp);
}

function roundCurrency(amount: number) {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

export async function closeDigitalServiceDay(formData: FormData) {
  await requireAdmin();
  const dateText = String(formData.get("date") ?? "").trim();
  const timeZone = String(formData.get("timeZone") ?? "UTC").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText)) throw new Error("A valid close date is required.");
  const date = new Date(`${dateText}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== dateText) {
    throw new Error("A valid close date is required.");
  }
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + 1);
  let start: Date;
  let end: Date;
  try {
    start = startOfBusinessDate(dateText, timeZone);
    end = startOfBusinessDate(nextDate.toISOString().slice(0, 10), timeZone);
  } catch {
    throw new Error("A valid business time zone is required.");
  }
  const prisma = getPrismaClient();

  const result = await prisma.$transaction(async (tx) => {
    const pendingWhere = {
      status: "pending",
      OR: [
        {
          AND: [
            { quote: { createdAt: { gte: start, lt: end } } },
            { OR: [{ carryoverDate: null }, { carryoverDate: { lte: date } }] },
          ],
        },
        { carryoverDate: date },
      ],
    };
    const pending = await tx.digitalServiceQuoteItem.count({ where: pendingWhere });
    await tx.digitalServiceQuoteItem.updateMany({
      where: pendingWhere,
      data: { carryoverDate: nextDate },
    });
    await tx.digitalServiceDayClose.upsert({
      where: { date },
      create: { date, pendingCount: pending },
      update: { closedAt: new Date() },
    });
    return pending;
  });
  revalidatePath("/digital-service/sales-reports");
  return {
    date: dateText,
    nextDate: nextDate.toISOString().slice(0, 10),
    pendingCount: result,
  };
}

export async function completeDigitalServiceItem(input: {
  itemId: string;
  channels: Array<"cash" | "transfer" | "coupon_redemption">;
  cashAmount: number;
  transferAmount: number;
  redemptionAmount: number;
  couponCode: string;
}) {
  await requireAdmin();
  const { itemId } = input;
  const cashAmount = input.cashAmount;
  const transferAmount = input.transferAmount;
  const redemptionAmount = input.redemptionAmount;
  if (!Array.isArray(input.channels)) throw new Error("Select at least one valid payment channel.");
  const channels = [...new Set(input.channels)];
  if (!itemId) throw new Error("Quote item is required.");
  if (
    !channels.length ||
    channels.some((channel) => !["cash", "transfer", "coupon_redemption"].includes(channel))
  ) {
    throw new Error("Select at least one valid payment channel.");
  }
  if (![cashAmount, transferAmount, redemptionAmount].every(
    (amount) => typeof amount === "number" && Number.isFinite(amount) && amount >= 0 &&
      Math.abs(amount * 100 - Math.round(amount * 100)) < 0.000001,
  )) {
    throw new Error("Payment amounts must be valid non-negative amounts.");
  }
  if (channels.includes("cash") !== (cashAmount > 0)) {
    throw new Error("Select cash only when a cash amount is entered.");
  }
  if (channels.includes("transfer") !== (transferAmount > 0)) {
    throw new Error("Select transfer only when a transfer amount is entered.");
  }
  if (channels.includes("coupon_redemption") !== (redemptionAmount > 0)) {
    throw new Error("Select coupon redemption only when a redemption amount is entered.");
  }

  const prisma = getPrismaClient();
  await prisma.$transaction(async (tx) => {
    const item = await tx.digitalServiceQuoteItem.findUnique({
      where: { id: itemId },
      include: { quote: { include: { customer: true } } },
    });
    if (!item) throw new Error("Quote item not found.");
    if (item.status === "completed") return;

    const lineTotal = Number(item.lineTotal);
    const toCents = (amount: number) => Math.round(amount * 100);
    if (toCents(cashAmount) + toCents(transferAmount) + toCents(redemptionAmount) !== toCents(lineTotal)) {
      throw new Error(`Payment must total ${lineTotal.toFixed(2)}.`);
    }

    const quote = item.quote;
    const customer = quote.customer;
    const couponCode = input.couponCode.trim().toUpperCase();
    if (redemptionAmount > 0) {
      if (!customer?.couponCode || couponCode !== customer.couponCode.toUpperCase()) {
        throw new Error("Enter the customer's valid redemption coupon code.");
      }
      const customerCoupon = await tx.digitalServiceCoupon.findUnique({
        where: { code: customer.couponCode },
      });
      if (!customerCoupon?.referralOnly) {
        throw new Error("This customer is not eligible for coupon redemption.");
      }
      if (customer.serviceCount + item.quantity <= customerCoupon.redemptionThreshold) {
        throw new Error("Customer service count has not exceeded the redemption threshold.");
      }
      const gross = Number(quote.grossTotal);
      const lineRatio = gross > 0 ? lineTotal / gross : 0;
      const netCredit = Number(quote.netProfit) * lineRatio;
      const creditSetting = await tx.digitalServiceAppSetting.findUnique({
        where: { key: "customer_credit_pct" },
      });
      const creditPct = Math.max(0, Math.min(100, Number(creditSetting?.value ?? 5)));
      const availableBalance = Number(customer.creditBalance) + netCredit * creditPct / 100;
      if (redemptionAmount > availableBalance) {
        throw new Error("Redemption amount exceeds the customer's eligible balance.");
      }
    }

    const updatedItem = await tx.digitalServiceQuoteItem.updateMany({
      where: { id: item.id, status: "pending" },
      data: {
        status: "completed",
        completedAt: new Date(),
        carryoverDate: null,
        paymentChannels: channels,
        cashAmount,
        transferAmount,
        redemptionAmount,
      },
    });
    if (updatedItem.count !== 1) throw new Error("This service was already completed.");

    const gross = Number(quote.grossTotal);
    const lineRatio = gross > 0 ? lineTotal / gross : 0;
    const netCredit = Number(quote.netProfit) * lineRatio;

    if (customer) {
      const creditSetting = await tx.digitalServiceAppSetting.findUnique({ where: { key: "customer_credit_pct" } });
      const creditPct = Math.max(0, Math.min(100, Number(creditSetting?.value ?? 5)));
      const earnedCredit = netCredit * creditPct / 100;
      const updatedCustomer = await tx.digitalServiceCustomer.updateMany({
        where: {
          id: customer.id,
          creditBalance: { gte: Math.max(0, redemptionAmount - earnedCredit) },
        },
        data: {
          serviceCount: { increment: item.quantity },
          serviceAmount: { increment: lineTotal },
          creditBalance: { increment: earnedCredit - redemptionAmount },
          redeemedAmount: { increment: redemptionAmount },
        },
      });
      if (updatedCustomer.count !== 1) throw new Error("Customer credit balance changed; review the payment and try again.");
    }

    if (quote.couponId) {
      const coupon = await tx.digitalServiceCoupon.findUnique({
        where: { id: quote.couponId },
        select: { code: true },
      });
      if (coupon) {
        const couponOwner = await tx.digitalServiceCustomer.findUnique({
          where: { couponCode: coupon.code },
        });
        const referralCommission = roundCurrency(Number(quote.commissionEarned) * lineRatio);
        if (couponOwner && referralCommission > 0) {
          await tx.digitalServiceCustomer.update({
            where: { id: couponOwner.id },
            data: {
              referralCredit: { increment: referralCommission },
              creditBalance: { increment: referralCommission },
            },
          });
        }
      }
    }

    await tx.digitalServiceFinanceEntry.create({
      data: {
        entryDate: new Date(),
        type: "REVENUE",
        category: "Completed digital service",
        description: `Quote item ${item.id}`,
        amount: cashAmount + transferAmount,
        paymentMethod:
          cashAmount > 0 && transferAmount > 0
            ? "BOTH"
            : transferAmount > 0
              ? "TRANSFER"
              : "CASH",
        source: "system",
      },
    });

    const remaining = await tx.digitalServiceQuoteItem.count({
      where: { quoteId: quote.id, status: "pending" },
    });
    if (remaining === 0) {
      await tx.digitalServiceQuote.update({
        where: { id: quote.id },
        data: { status: "COMPLETED" },
      });
      if (quote.couponId) {
        await tx.digitalServiceCoupon.update({
          where: { id: quote.couponId },
          data: { usageCount: { increment: 1 } },
        });
        const coupon = await tx.digitalServiceCoupon.findUnique({
          where: { id: quote.couponId },
          include: { affiliate: true },
        });
        if (coupon?.affiliate) {
          await tx.digitalServiceAffiliate.update({
            where: { id: coupon.affiliate.id },
            data: {
              commissionScore: { increment: Number(quote.commissionEarned) },
              customerDiscountTotal: { increment: Number(quote.customerDiscount) },
            },
          });
        }
      }
    }
  });

  revalidatePath("/digital-service/sales-reports");
  revalidatePath("/digital-service/sales");
  revalidatePath("/digital-service/customers");
  revalidatePath("/digital-service/coupons");
  revalidatePath("/digital-service/finance");
  revalidatePath("/digital-service");
}
