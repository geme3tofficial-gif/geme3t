"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
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
  if (id) {
    await prisma.digitalServiceCustomer.update({ where: { id }, data: { name, phone } });
  } else {
    const base = customerCouponCode(name, phone);
    let code = base;
    let suffix = 2;
    while (await prisma.digitalServiceCoupon.findUnique({ where: { code } })) {
      code = `${base.slice(0, 7)}${suffix}`;
      suffix++;
    }
    await prisma.$transaction(async (tx) => {
      await tx.digitalServiceCoupon.create({
        data: { code, tier: "Customer", referralOnly: true, customerPct: 0, customerDirect: 0, affiliatePct: 0 },
      });
      await tx.digitalServiceCustomer.create({ data: { name, phone, couponCode: code } });
    });
  }
  revalidatePath("/digital-service/customers");
  revalidatePath("/digital-service/coupons");
}

export async function deleteCustomer(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Customer is required.");
  await getPrismaClient().digitalServiceCustomer.delete({ where: { id } });
  revalidatePath("/digital-service/customers");
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
