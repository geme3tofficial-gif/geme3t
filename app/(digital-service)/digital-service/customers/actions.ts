"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { createCustomerPerformanceToken } from "@/lib/domain/digital-service/customer-performance-token";
import { getPrismaClient } from "@/lib/prisma";

function customerCouponCode(name: string, phone: string) {
  const letters = name.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4);
  const digits = phone.replace(/\D/g, "").slice(-4);
  return (letters + digits).slice(0, 9).padEnd(9, "X");
}

export async function saveCustomer(formData: FormData) {
  await requireAdmin();
  const prisma = getPrismaClient();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  if (!name || !phone) throw new Error("Name and phone are required.");
  const commissionValue = formData.get("commissionPct");
  const commissionPct = commissionValue === null ? 5 : Number(commissionValue);
  if (!Number.isFinite(commissionPct) || commissionPct < 0 || commissionPct > 100) {
    throw new Error("Customer coupon commission must be between 0 and 100 percent.");
  }
  if (id) {
    await prisma.$transaction(async (tx) => {
      const customer = await tx.digitalServiceCustomer.update({ where: { id }, data: { name, phone } });
      if (customer.couponCode) {
        await tx.digitalServiceCoupon.update({
          where: { code: customer.couponCode },
          data: { affiliatePct: commissionPct },
        });
        return;
      }

      const base = customerCouponCode(name, phone);
      let code = base;
      let suffix = 2;
      while (await tx.digitalServiceCoupon.findUnique({ where: { code } })) {
        code = `${base.slice(0, 7)}${suffix}`;
        suffix++;
      }
      await tx.digitalServiceCoupon.create({
        data: {
          code,
          tier: "Customer",
          referralOnly: true,
          customerPct: 0,
          customerDirect: 0,
          affiliatePct: commissionPct,
        },
      });
      await tx.digitalServiceCustomer.update({ where: { id }, data: { couponCode: code } });
    });
  } else {
    const base = customerCouponCode(name, phone);
    let code = base;
    let suffix = 2;
    while (await prisma.digitalServiceCoupon.findUnique({ where: { code } })) {
      code = `${base.slice(0, 7)}${suffix}`;
      suffix++;
    }
    const shareToken = createCustomerPerformanceToken();
    await prisma.$transaction(async (tx) => {
      await tx.digitalServiceCoupon.create({
        data: { code, tier: "Customer", referralOnly: true, customerPct: 0, customerDirect: 0, affiliatePct: commissionPct },
      });
      await tx.digitalServiceCustomer.create({
        data: {
          name,
          phone,
          couponCode: code,
          shareTokenHash: shareToken.shareTokenHash,
          shareTokenEncrypted: shareToken.shareTokenEncrypted,
        },
      });
    });
  }
  revalidatePath("/digital-service/customers");
  revalidatePath("/digital-service/coupons");
  revalidatePath("/digital-service/sales");
  revalidatePath("/digital-service/sales-reports");
  revalidatePath("/digital-service");
}

export async function deleteCustomer(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Customer is required.");
  const prisma = getPrismaClient();
  await prisma.$transaction(async (tx) => {
    const customer = await tx.digitalServiceCustomer.findUnique({
      where: { id },
      select: { couponCode: true },
    });
    if (!customer) throw new Error("Customer not found.");
    await tx.digitalServiceCustomer.delete({ where: { id } });
    if (customer.couponCode) {
      await tx.digitalServiceCoupon.deleteMany({ where: { code: customer.couponCode } });
    }
  });
  revalidatePath("/digital-service/customers");
  revalidatePath("/digital-service/coupons");
  revalidatePath("/digital-service/sales");
}

export async function setCustomerCredit(formData: FormData) {
  await requireAdmin();
  const pct = Math.max(0, Math.min(100, Number(formData.get("pct"))));
  if (!Number.isFinite(pct)) throw new Error("A valid percentage is required.");
  await getPrismaClient().digitalServiceAppSetting.upsert({
    where: { key: "customer_credit_pct" },
    create: { key: "customer_credit_pct", value: String(pct) },
    update: { value: String(pct) },
  });
  revalidatePath("/digital-service/customers");
}

export async function createCustomerPerformanceLink(customerId: string) {
  await requireAdmin();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(customerId)) {
    throw new Error("A valid customer is required.");
  }
  const shareToken = createCustomerPerformanceToken();
  try {
    await getPrismaClient().digitalServiceCustomer.update({
      where: { id: customerId },
      data: {
        shareTokenHash: shareToken.shareTokenHash,
        shareTokenEncrypted: shareToken.shareTokenEncrypted,
      },
      select: { id: true },
    });
  } catch (error) {
    console.error("Could not create a customer performance link.", error);
    throw new Error("Could not create the customer performance link.");
  }
  revalidatePath("/digital-service/customers");
  return shareToken.token;
}

export async function generateMissingCustomerPerformanceLinks() {
  await requireAdmin();
  const prisma = getPrismaClient();
  const customers = await prisma.digitalServiceCustomer.findMany({
    where: { shareTokenEncrypted: null },
    select: { id: true },
  });
  if (customers.length === 0) return 0;

  const updates = customers.map((customer) => {
    const shareToken = createCustomerPerformanceToken();
    return prisma.digitalServiceCustomer.update({
      where: { id: customer.id },
      data: {
        shareTokenHash: shareToken.shareTokenHash,
        shareTokenEncrypted: shareToken.shareTokenEncrypted,
      },
    });
  });
  await prisma.$transaction(updates);
  revalidatePath("/digital-service/customers");
  return customers.length;
}

export async function revokeCustomerPerformanceLink(customerId: string) {
  await requireAdmin();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(customerId)) {
    throw new Error("A valid customer is required.");
  }
  await getPrismaClient().digitalServiceCustomer.update({
    where: { id: customerId },
    data: { shareTokenHash: null, shareTokenEncrypted: null },
    select: { id: true },
  });
  revalidatePath("/digital-service/customers");
}
