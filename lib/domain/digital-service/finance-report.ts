import "server-only";

import type { Prisma } from "@prisma/client";
import { getPrismaClient } from "@/lib/prisma";

export type FinanceReportFilters = {
  from: string;
  to: string;
  type: FinanceType;
  source: FinanceSource;
  search: string;
};

type FinanceType = "ALL" | "REVENUE" | "EXPENSE";
type FinanceSource = "ALL" | "manual" | "system";
type SearchParams = Record<string, string | string[] | undefined>;

function isFinanceType(value: string): value is FinanceType {
  return value === "ALL" || value === "REVENUE" || value === "EXPENSE";
}

function isFinanceSource(value: string): value is FinanceSource {
  return value === "ALL" || value === "manual" || value === "system";
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function parseFinanceReportFilters(params: SearchParams) {
  const from = firstValue(params.from);
  const to = firstValue(params.to);
  const typeValue = firstValue(params.type) || "ALL";
  const sourceValue = firstValue(params.source) || "ALL";
  const search = firstValue(params.q).trim();
  const errors: string[] = [];

  if (from && !isValidDate(from)) errors.push("Enter a valid start date.");
  if (to && !isValidDate(to)) errors.push("Enter a valid end date.");
  if (from && to && isValidDate(from) && isValidDate(to) && from > to) {
    errors.push("The start date must be on or before the end date.");
  }
  if (!isFinanceType(typeValue)) {
    errors.push("Choose a valid transaction type.");
  }
  if (!isFinanceSource(sourceValue)) {
    errors.push("Choose a valid transaction source.");
  }
  if (search.length > 100) errors.push("Search must be 100 characters or fewer.");

  return {
    filters: {
      from,
      to,
      type: isFinanceType(typeValue) ? typeValue : "ALL",
      source: isFinanceSource(sourceValue) ? sourceValue : "ALL",
      search: search.slice(0, 100),
    },
    errors,
  };
}

function buildFinanceWhere(
  filters: FinanceReportFilters,
  includeType: boolean,
): Prisma.DigitalServiceFinanceEntryWhereInput {
  const entryDate: Prisma.DateTimeFilter = {};
  if (filters.from) entryDate.gte = new Date(`${filters.from}T00:00:00.000Z`);
  if (filters.to) entryDate.lte = new Date(`${filters.to}T00:00:00.000Z`);

  return {
    ...(Object.keys(entryDate).length ? { entryDate } : {}),
    ...(filters.source === "ALL" ? {} : { source: filters.source }),
    ...(filters.search
      ? {
          OR: [
            { category: { contains: filters.search, mode: "insensitive" } },
            { description: { contains: filters.search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(includeType && filters.type !== "ALL" ? { type: filters.type } : {}),
  };
}

export async function getFinanceStatement(filters: FinanceReportFilters) {
  const prisma = getPrismaClient();
  const [dailyGroups, entries] = await prisma.$transaction([
    prisma.digitalServiceFinanceEntry.groupBy({
      by: ["entryDate", "type"],
      where: buildFinanceWhere(filters, false),
      orderBy: [{ entryDate: "desc" }, { type: "asc" }],
      _sum: { amount: true },
    }),
    prisma.digitalServiceFinanceEntry.findMany({
      where: buildFinanceWhere(filters, true),
      orderBy: [{ entryDate: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  const dailyTotals = new Map<string, { date: string; income: number; expense: number }>();
  for (const group of dailyGroups) {
    const date = group.entryDate.toISOString().slice(0, 10);
    const total = dailyTotals.get(date) ?? { date, income: 0, expense: 0 };
    const cents = Math.round(Number(group._sum?.amount ?? 0) * 100);
    if (group.type === "REVENUE") total.income += cents;
    else total.expense += cents;
    dailyTotals.set(date, total);
  }

  const days = [...dailyTotals.values()]
    .map((day) => ({ ...day, balance: day.income - day.expense }))
    .sort((left, right) => right.date.localeCompare(left.date));
  const income = days.reduce((sum, day) => sum + day.income, 0);
  const expense = days.reduce((sum, day) => sum + day.expense, 0);

  return { entries, days, income, expense, balance: income - expense };
}

export function formatFinanceCents(cents: number) {
  const amount = (Math.abs(cents) / 100).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${cents < 0 ? "-₦" : "₦"}${amount}`;
}
