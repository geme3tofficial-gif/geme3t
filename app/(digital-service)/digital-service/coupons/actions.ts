"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { getPrismaClient } from "@/lib/prisma";

export async function saveCoupon(formData: FormData) {
  await requireAdmin();
  const prisma = getPrismaClient();
  const id = String(formData.get("id") ?? "");
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const tier = String(formData.get("tier") ?? "Custom").trim();
  const customerPct = Math.max(0, Math.min(100, Number(formData.get("customerPct")) || 0));
  const customerDirect = Math.max(0, Number(formData.get("customerDirect")) || 0);
  const affiliatePct = Math.max(0, Math.min(100, Number(formData.get("affiliatePct")) || 0));
  const affiliateId = String(formData.get("affiliateId") ?? "") || null;
  const referralOnly = formData.get("referralOnly") === "on";
  const redemptionThreshold = Math.max(1, Number(formData.get("redemptionThreshold")) || 3);
  if (!code) throw new Error("Coupon code is required.");
  const data = { code, tier, customerPct, customerDirect, affiliatePct, affiliateId, referralOnly, redemptionThreshold };
  if (id) await prisma.digitalServiceCoupon.update({ where: { id }, data });
  else await prisma.digitalServiceCoupon.create({ data });
  revalidatePath("/digital-service/coupons");
}

export async function deleteCoupon(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Coupon is required.");
  await getPrismaClient().digitalServiceCoupon.delete({ where: { id } });
  revalidatePath("/digital-service/coupons");
}
