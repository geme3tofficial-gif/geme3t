"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { getPrismaClient } from "@/lib/prisma";
import { calculateQuote } from "@/lib/domain/digital-service/calculations";

export async function createSaleCustomer(input: { name: string; phone: string }) {
  await requireAdmin();
  const name = input.name.trim();
  const phone = input.phone.trim();
  if (!name || !phone) throw new Error("Enter both customer name and phone.");

  const prisma = getPrismaClient();
  const existing = await prisma.digitalServiceCustomer.findUnique({ where: { phone } });
  if (existing) throw new Error("Customer already exists.");

  const letters = name.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4);
  const digits = phone.replace(/\D/g, "").slice(-4);
  const base = (letters + digits).slice(0, 9).padEnd(9, "X");
  let code = base;
  let suffix = 2;
  while (await prisma.digitalServiceCoupon.findUnique({ where: { code } })) {
    code = `${base.slice(0, 7)}${suffix}`;
    suffix++;
  }

  return prisma.$transaction(async (tx) => {
    await tx.digitalServiceCoupon.create({
      data: {
        code,
        tier: "Customer",
        referralOnly: true,
        customerPct: 0,
        customerDirect: 0,
        affiliatePct: 0,
      },
    });
    const customer = await tx.digitalServiceCustomer.create({
      data: { name, phone, couponCode: code },
    });
    revalidatePath("/digital-service/customers");
    revalidatePath("/digital-service/coupons");
    revalidatePath("/digital-service/sales");
    return {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      serviceCount: customer.serviceCount,
      couponCode: code,
    };
  });
}

export async function createSale(input: {
  customerId: string | null;
  couponId: string | null;
  directDiscount: number;
  customerDiscountPct: number;
  directCost: number;
  status: "PENDING" | "COMPLETED";
  items: Array<{ serviceId: string; name: string; unit: string; unitPrice: number; quantity: number }>;
}) {
  await requireAdmin();
  const prisma = getPrismaClient();
  if (!input.items.length) throw new Error("Select at least one service.");
  if (!["PENDING", "COMPLETED"].includes(input.status)) throw new Error("Invalid sale status.");
  if (input.items.some((item) => !item.serviceId || !Number.isInteger(item.quantity) || item.quantity <= 0)) {
    throw new Error("Every selected service requires a positive whole-number quantity.");
  }

  const uniqueIds = [...new Set(input.items.map((item) => item.serviceId))];
  const services = await prisma.digitalServiceService.findMany({
    where: { id: { in: uniqueIds } },
  });
  if (services.length !== uniqueIds.length) throw new Error("One or more selected services no longer exist.");
  const serviceMap = new Map(services.map((service) => [service.id, service]));
  const serverItems = input.items.map((item) => {
    const service = serviceMap.get(item.serviceId);
    if (!service) throw new Error("Selected service not found.");
    const lineTotal = Number(service.price) * item.quantity;
    return { serviceId: service.id, name: service.name, unit: service.unit, unitPrice: Number(service.price), quantity: item.quantity, lineTotal };
  });

  const gross = serverItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const customer = input.customerId
    ? await prisma.digitalServiceCustomer.findUnique({ where: { id: input.customerId } })
    : null;
  const coupon = input.couponId
    ? await prisma.digitalServiceCoupon.findUnique({ where: { id: input.couponId }, include: { affiliate: true } })
    : null;

  if (customer && customer.serviceCount > 0) {
    throw new Error("Returning customers cannot apply referral or customer coupons.");
  }
  const calculation = calculateQuote({
    grossTotal: gross,
    directDiscount: input.directDiscount,
    customerDiscountPct: input.customerDiscountPct,
    couponDirectDiscount: coupon?.customerDirect.toNumber() ?? 0,
    couponDiscountPct: coupon?.customerPct.toNumber() ?? 0,
    directCost: input.directCost,
    affiliatePct: coupon?.affiliatePct.toNumber() ?? 0,
  });

  await prisma.$transaction(async (tx) => {
    const completedAt = input.status === "COMPLETED" ? new Date() : null;
    const quote = await tx.digitalServiceQuote.create({
      data: {
        customerId: customer?.id ?? null,
        couponId: coupon?.id ?? null,
        grossTotal: calculation.gross,
        directDiscount: calculation.directDiscount,
        couponDiscount: calculation.couponDiscount,
        payableTotal: calculation.payable,
        directCost: calculation.directCost,
        netProfit: calculation.netProfit,
        customerDiscount: calculation.discount,
        commissionEarned: calculation.commission,
        status: input.status,
        items: {
          create: serverItems.map((item) => ({
            serviceId: item.serviceId,
            name: item.name,
            unit: item.unit,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            lineTotal: item.lineTotal,
            status: input.status === "COMPLETED" ? "completed" : "pending",
            completedAt,
            paymentChannels: input.status === "COMPLETED" ? ["cash"] : [],
            cashAmount: input.status === "COMPLETED" ? item.lineTotal : 0,
            transferAmount: 0,
            redemptionAmount: 0,
          })),
        },
      },
    });
    if (coupon && input.status === "COMPLETED") {
      await tx.digitalServiceCoupon.update({
        where: { id: coupon.id },
        data: { usageCount: { increment: 1 } },
      });
      if (coupon.affiliate) {
        await tx.digitalServiceAffiliate.update({
          where: { id: coupon.affiliate.id },
          data: {
            commissionScore: { increment: calculation.commission },
            customerDiscountTotal: { increment: calculation.discount },
          },
        });
      }
    }
    if (input.status === "COMPLETED") {
      if (customer) {
        const creditSetting = await tx.digitalServiceAppSetting.findUnique({ where: { key: "customer_credit_pct" } });
        const creditPct = Math.max(0, Math.min(100, Number(creditSetting?.value ?? 5)));
        await tx.digitalServiceCustomer.update({
          where: { id: customer.id },
          data: {
            serviceCount: { increment: serverItems.reduce((sum, item) => sum + item.quantity, 0) },
            serviceAmount: { increment: calculation.payable },
            creditBalance: { increment: calculation.netProfit * creditPct / 100 },
          },
        });
      }
      await tx.digitalServiceFinanceEntry.create({
        data: {
          entryDate: new Date(),
          type: "REVENUE",
          category: "Completed digital service",
          description: `Quote ${quote.id}`,
          amount: calculation.payable,
          paymentMethod: "CASH",
          source: "system",
        },
      });
    }
  });
  revalidatePath("/digital-service/sales");
  revalidatePath("/digital-service/sales-reports");
  revalidatePath("/digital-service");
  revalidatePath("/digital-service/finance");
}
