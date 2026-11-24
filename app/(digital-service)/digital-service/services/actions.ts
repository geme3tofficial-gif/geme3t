"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import { getPrismaClient } from "@/lib/prisma";

export async function createCategory(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Category name is required.");
  await getPrismaClient().digitalServiceCategory.create({ data: { name } });
  revalidatePath("/digital-service/services");
}

export async function updateCategory(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) throw new Error("Category and name are required.");
  await getPrismaClient().digitalServiceCategory.update({ where: { id }, data: { name } });
  revalidatePath("/digital-service/services");
}

export async function deleteCategory(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Category is required.");
  await getPrismaClient().digitalServiceCategory.delete({ where: { id } });
  revalidatePath("/digital-service/services");
}

export async function createService(formData: FormData) {
  await requireAdmin();
  const categoryId = String(formData.get("categoryId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const unit = String(formData.get("unit") ?? "unit").trim();
  const price = Number(formData.get("price"));
  if (!categoryId || !name || !unit || !Number.isFinite(price) || price < 0) {
    throw new Error("A valid category, name, unit, and non-negative price are required.");
  }
  await getPrismaClient().digitalServiceService.create({
    data: { categoryId, name, unit, price },
  });
  revalidatePath("/digital-service/services");
  revalidatePath("/customer/performance/[token]", "page");
}

export async function updateService(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const unit = String(formData.get("unit") ?? "").trim();
  const price = Number(formData.get("price"));
  if (!id || !name || !unit || !Number.isFinite(price) || price < 0) {
    throw new Error("A valid name, unit, and non-negative price are required.");
  }
  await getPrismaClient().digitalServiceService.update({
    where: { id },
    data: { name, unit, price },
  });
  revalidatePath("/digital-service/services");
  revalidatePath("/customer/performance/[token]", "page");
}

export async function deleteService(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Service is required.");
  await getPrismaClient().digitalServiceService.delete({ where: { id } });
  revalidatePath("/digital-service/services");
  revalidatePath("/customer/performance/[token]", "page");
}
