"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { getPrismaClient } from "@/lib/prisma";

export async function saveAffiliate(formData: FormData) {
  await requireAdmin();
  const prisma = getPrismaClient();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const email = String(formData.get("email") ?? "").trim() || null;
  const tier = String(formData.get("tier") ?? "Custom").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const discountPct = Math.max(0, Math.min(100, Number(formData.get("discountPct")) || 0));
  const commissionPct = Math.max(0, Math.min(100, Number(formData.get("commissionPct")) || 0));
  if (!name) throw new Error("Affiliate name is required.");
  const data = { name, phone, email, tier, notes, discountPct, commissionPct };
  if (id) await prisma.digitalServiceAffiliate.update({ where: { id }, data });
  else await prisma.digitalServiceAffiliate.create({ data });
  revalidatePath("/digital-service/affiliates");
  revalidatePath("/digital-service/coupons");
}

export async function deleteAffiliate(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Affiliate is required.");
  await getPrismaClient().digitalServiceAffiliate.delete({ where: { id } });
  revalidatePath("/digital-service/affiliates");
}

export async function toggleAffiliate(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "true";
  if (!id) throw new Error("Affiliate is required.");
  await getPrismaClient().digitalServiceAffiliate.update({ where: { id }, data: { active: !active } });
  revalidatePath("/digital-service/affiliates");
}
