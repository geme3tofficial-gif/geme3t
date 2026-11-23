"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { getPrismaClient } from "@/lib/prisma";

export async function createFinanceEntry(formData: FormData) {
  await requireAdmin();
  const entryDate = String(formData.get("entryDate") ?? "");
  const type = String(formData.get("type") ?? "") as "REVENUE" | "EXPENSE";
  const category = String(formData.get("category") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const amount = Number(formData.get("amount"));
  const paymentMethod = String(formData.get("paymentMethod") ?? "CASH") as "CASH" | "TRANSFER" | "BOTH";
  if (!entryDate || !["REVENUE","EXPENSE"].includes(type) || !category || !Number.isFinite(amount) || amount <= 0) {
    throw new Error("Enter a valid date, category, type, and positive amount.");
  }
  await getPrismaClient().digitalServiceFinanceEntry.create({
    data: { entryDate: new Date(`${entryDate}T00:00:00Z`), type, category, description, amount, paymentMethod, source: "manual" },
  });
  revalidatePath("/digital-service/finance");
}

export async function deleteFinanceEntry(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Finance entry is required.");
  const prisma = getPrismaClient();
  const entry = await prisma.digitalServiceFinanceEntry.findUnique({ where: { id } });
  if (!entry || entry.source !== "manual") throw new Error("Only manual finance entries can be deleted.");
  await prisma.digitalServiceFinanceEntry.delete({ where: { id } });
  revalidatePath("/digital-service/finance");
}
