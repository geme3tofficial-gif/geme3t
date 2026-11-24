import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import {
  formatFinanceCents,
  getFinanceStatement,
  parseFinanceReportFilters,
} from "@/lib/domain/digital-service/finance-report";
import { createFinanceEntry, deleteFinanceEntry } from "./actions";

export const metadata: Metadata = { title: "Digital service finance" };

type FinanceSearchParams = Promise<Record<string, string | string[] | undefined>>;

function exportHref(
  format: "pdf" | "docx" | "xlsx",
  filters: ReturnType<typeof parseFinanceReportFilters>["filters"],
) {
  const search = new URLSearchParams({ format });
  if (filters.from) search.set("from", filters.from);
  if (filters.to) search.set("to", filters.to);
  if (filters.type !== "ALL") search.set("type", filters.type);
  if (filters.source !== "ALL") search.set("source", filters.source);
  if (filters.search) search.set("q", filters.search);
  return `/digital-service/finance/export?${search.toString()}`;
}

export default async function FinancePage({
  searchParams,
}: {
  searchParams: FinanceSearchParams;
}) {
  await connection();
  const parsedFilters = parseFinanceReportFilters(await searchParams);
  const statement = parsedFilters.errors.length
    ? null
    : await getFinanceStatement(parsedFilters.filters);
  const entries = statement?.entries ?? [];
  const days = statement?.days ?? [];
  const income = statement?.income ?? 0;
  const expense = statement?.expense ?? 0;
  const balance = statement?.balance ?? 0;

  return (
    <>
      <div className="dashboard-welcome">
        <div>
          <span className="eyebrow">Finance</span>
          <h1>Income & expenses</h1>
          <p>Filter transactions, review daily balances, and download a statement.</p>
        </div>
      </div>

      <section className="dashboard-panel" style={{ marginBottom: 16 }}>
        <h2>Add entry</h2>
        <form action={createFinanceEntry} className="admin-edit-form" style={{ marginTop: 12 }}>
          <label><span>Date</span><input name="entryDate" type="date" required /></label>
          <label>
            <span>Type</span>
            <select name="type">
              <option value="REVENUE">Income</option>
              <option value="EXPENSE">Expense</option>
            </select>
          </label>
          <label><span>Category</span><input name="category" required /></label>
          <label><span>Description</span><input name="description" /></label>
          <label><span>Amount</span><input name="amount" type="number" min="0.01" step="0.01" required /></label>
          <label>
            <span>Payment method</span>
            <select name="paymentMethod">
              <option value="CASH">Cash</option>
              <option value="TRANSFER">Transfer</option>
              <option value="BOTH">Cash + transfer</option>
            </select>
          </label>
          <button className="button button--small" type="submit">Save entry</button>
        </form>
      </section>

      <section className="dashboard-panel digital-service-finance-filters">
        <h2>Statement filters</h2>
        <form action="/digital-service/finance" className="digital-service-finance-filter-form" method="get">
          <label>
            <span>From</span>
            <input name="from" type="date" defaultValue={parsedFilters.filters.from} />
          </label>
          <label>
            <span>To</span>
            <input name="to" type="date" defaultValue={parsedFilters.filters.to} />
          </label>
          <label>
            <span>Transaction type</span>
            <select name="type" defaultValue={parsedFilters.filters.type}>
              <option value="ALL">All types</option>
              <option value="REVENUE">Income</option>
              <option value="EXPENSE">Expense</option>
            </select>
          </label>
          <label>
            <span>Source</span>
            <select name="source" defaultValue={parsedFilters.filters.source}>
              <option value="ALL">All sources</option>
              <option value="manual">Manual</option>
              <option value="system">System-generated</option>
            </select>
          </label>
          <label className="digital-service-finance-search">
            <span>Category or description</span>
            <input
              maxLength={100}
              name="q"
              placeholder="Search statement"
              defaultValue={parsedFilters.filters.search}
            />
          </label>
          <div className="digital-service-finance-filter-actions">
            <button className="button button--small" type="submit">Apply filters</button>
            <Link className="button button--small button--light" href="/digital-service/finance">Reset</Link>
          </div>
        </form>
        {parsedFilters.errors.length > 0 && (
          <p className="digital-service-finance-filter-error" role="alert">
            {parsedFilters.errors.join(" ")}
          </p>
        )}
      </section>

      <section className="dashboard-panel digital-service-finance-downloads">
        <div>
          <h2>Download statement</h2>
          <p>{entries.length} transaction{entries.length === 1 ? "" : "s"} in the current view.</p>
        </div>
        <div className="digital-service-finance-download-actions">
          {(["pdf", "docx", "xlsx"] as const).map((format) => (
            <a
              aria-disabled={parsedFilters.errors.length > 0}
              className={`button button--small button--light${parsedFilters.errors.length > 0 ? " is-disabled" : ""}`}
              href={parsedFilters.errors.length > 0 ? undefined : exportHref(format, parsedFilters.filters)}
              key={format}
              tabIndex={parsedFilters.errors.length > 0 ? -1 : undefined}
            >
              {format.toUpperCase()}
            </a>
          ))}
        </div>
      </section>

      <div className="dashboard-grid digital-service-finance-summary">
        <section className="dashboard-panel">
          <h2>Income</h2>
          <p className="admin-dashboard-count digital-service-finance-income">{formatFinanceCents(income)}</p>
        </section>
        <section className="dashboard-panel">
          <h2>Expenses</h2>
          <p className="admin-dashboard-count digital-service-finance-expense">{formatFinanceCents(expense)}</p>
        </section>
        <section className="dashboard-panel">
          <h2>Net balance</h2>
          <p className={`admin-dashboard-count ${balance < 0 ? "digital-service-finance-expense" : "digital-service-finance-income"}`}>
            {formatFinanceCents(balance)}
          </p>
        </section>
      </div>
      <p className="digital-service-finance-balance-note">
        Daily balance = that day&apos;s income minus that day&apos;s expenses. Totals include both types even when the transaction list is filtered by type.
      </p>

      <section className="dashboard-panel digital-service-finance-table-panel">
        <div className="workspace-panel-heading">
          <div>
            <h2>Daily balances</h2>
            <p>Each day is balanced independently; this is not a running cash balance.</p>
          </div>
        </div>
        <div className="digital-service-finance-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Date</th><th>Income</th><th>Expenses</th><th>Daily balance</th></tr>
            </thead>
            <tbody>
              {days.map((day) => (
                <tr key={day.date}>
                  <td>{day.date}</td>
                  <td className="digital-service-finance-income">{formatFinanceCents(day.income)}</td>
                  <td className="digital-service-finance-expense">{formatFinanceCents(day.expense)}</td>
                  <td className={day.balance < 0 ? "digital-service-finance-expense" : "digital-service-finance-income"}>
                    {formatFinanceCents(day.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {days.length === 0 && <p className="digital-service-finance-empty">No daily totals match these filters.</p>}
        </div>
      </section>

      <section className="dashboard-panel digital-service-finance-table-panel" style={{ marginTop: 16 }}>
        <div className="workspace-panel-heading">
          <div>
            <h2>Transactions</h2>
            <p>{entries.length} matching transaction{entries.length === 1 ? "" : "s"}.</p>
          </div>
        </div>
        <div className="digital-service-finance-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date</th><th>Type</th><th>Category</th><th>Description</th>
                <th>Amount</th><th>Payment method</th><th>Source</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const isIncome = entry.type === "REVENUE";
                return (
                  <tr className={isIncome ? "digital-service-finance-income-row" : "digital-service-finance-expense-row"} key={entry.id}>
                    <td>{entry.entryDate.toISOString().slice(0, 10)}</td>
                    <td>
                      <span className={`digital-service-finance-type ${isIncome ? "digital-service-finance-income" : "digital-service-finance-expense"}`}>
                        {isIncome ? "Income" : "Expense"}
                      </span>
                    </td>
                    <td>{entry.category}</td>
                    <td>{entry.description ?? "-"}</td>
                    <td className={isIncome ? "digital-service-finance-income" : "digital-service-finance-expense"}>
                      {formatFinanceCents(Math.round(Number(entry.amount) * 100))}
                    </td>
                    <td>{entry.paymentMethod.replace("_", " ")}</td>
                    <td>{entry.source === "system" ? "System" : "Manual"}</td>
                    <td>
                      {entry.source === "manual" ? (
                        <form action={deleteFinanceEntry}>
                          <input name="id" type="hidden" value={entry.id} />
                          <button className="button button--small button--light" type="submit">Delete</button>
                        </form>
                      ) : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {entries.length === 0 && <p className="digital-service-finance-empty">No transactions match these filters.</p>}
        </div>
      </section>
    </>
  );
}
