"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { getPrismaClient } from "@/lib/prisma";

function percentage(value: FormDataEntryValue | null, label: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
    throw new Error(`${label} must be between 0 and 100 percent.`);
  }
  return parsed;
}

export async function saveCoupon(formData: FormData) {
  await requireAdmin();
  const prisma = getPrismaClient();
  const id = String(formData.get("id") ?? "");
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const tier = String(formData.get("tier") ?? "Custom").trim();
  const customerPct = percentage(formData.get("customerPct"), "Customer discount");
  const customerDirect = Math.max(0, Number(formData.get("customerDirect")) || 0);
  const affiliatePct = percentage(formData.get("affiliatePct"), "Coupon commission");
  const affiliateId = String(formData.get("affiliateId") ?? "") || null;
  const referralOnly = formData.get("referralOnly") === "on";
  const redemptionThreshold = Math.max(1, Number(formData.get("redemptionThreshold")) || 3);
  if (!code) throw new Error("Coupon code is required.");
  const data = { code, tier, customerPct, customerDirect, affiliatePct, affiliateId, referralOnly, redemptionThreshold };
  if (id) await prisma.digitalServiceCoupon.update({ where: { id }, data });
  else await prisma.digitalServiceCoupon.create({ data });
  revalidatePath("/digital-service/coupons");
  revalidatePath("/digital-service/customers");
  revalidatePath("/digital-service/sales");
  revalidatePath("/digital-service/sales-reports");
  revalidatePath("/digital-service/affiliates");
  revalidatePath("/digital-service");
}

export async function deleteCoupon(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Coupon is required.");
  await getPrismaClient().digitalServiceCoupon.delete({ where: { id } });
  revalidatePath("/digital-service/coupons");
}
