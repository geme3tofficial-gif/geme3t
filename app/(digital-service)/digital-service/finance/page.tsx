import type { Metadata } from "next";
import { connection } from "next/server";
import { getPrismaClient } from "@/lib/prisma";
import { formatNaira } from "@/lib/domain/digital-service/format";
import { createFinanceEntry, deleteFinanceEntry } from "./actions";

export const metadata: Metadata = { title: "Digital service finance" };

export default async function FinancePage() {
  await connection();
  const entries = await getPrismaClient().digitalServiceFinanceEntry.findMany({ orderBy: { entryDate: "desc" }, take: 200 });
  const revenue = entries.filter((entry) => entry.type === "REVENUE").reduce((sum, entry) => sum + Number(entry.amount), 0);
  const expenses = entries.filter((entry) => entry.type === "EXPENSE").reduce((sum, entry) => sum + Number(entry.amount), 0);
  return (
    <><div className="dashboard-welcome"><div><span className="eyebrow">Finance</span><h1>Income & expenses</h1><p>Manual and system-generated finance records.</p></div></div>
      <section className="dashboard-panel" style={{ marginBottom:16 }}>
        <h2>Add entry</h2>
        <form action={createFinanceEntry} className="admin-edit-form" style={{ marginTop:12 }}>
          <label><span>Date</span><input name="entryDate" type="date" required /></label>
          <label><span>Type</span><select name="type"><option value="REVENUE">Revenue / income</option><option value="EXPENSE">Expense</option></select></label>
          <label><span>Category</span><input name="category" required /></label>
          <label><span>Description</span><input name="description" /></label>
          <label><span>Amount</span><input name="amount" type="number" min="1" step="1" required /></label>
          <label><span>Payment method</span><select name="paymentMethod"><option value="CASH">Cash</option><option value="TRANSFER">Transfer</option><option value="BOTH">Cash + transfer</option></select></label>
          <button className="button button--small" type="submit">Save entry</button>
        </form>
      </section>
      <div className="dashboard-grid"><section className="dashboard-panel"><h2>Revenue</h2><p className="admin-dashboard-count">{formatNaira(revenue)}</p></section><section className="dashboard-panel"><h2>Expenses</h2><p className="admin-dashboard-count">{formatNaira(expenses)}</p></section><section className="dashboard-panel"><h2>Net balance</h2><p className="admin-dashboard-count">{formatNaira(revenue-expenses)}</p></section></div>
      <section className="dashboard-panel" style={{ marginTop: 16 }}><div style={{ overflowX: "auto" }}><table className="admin-table"><thead><tr><th>Date</th><th>Type</th><th>Category</th><th>Description</th><th>Amount</th><th>Source</th><th>Actions</th></tr></thead><tbody>{entries.map((entry) => <tr key={entry.id}><td>{entry.entryDate.toISOString().slice(0,10)}</td><td>{entry.type}</td><td>{entry.category}</td><td>{entry.description ?? "-"}</td><td>{formatNaira(entry.amount.toString())}</td><td>{entry.source}</td><td>{entry.source==="manual"?<form action={deleteFinanceEntry}><input type="hidden" name="id" value={entry.id} /><button className="button button--small" style={{ background:"#dc2626",color:"#fff" }} type="submit">Delete</button></form>: "-"}</td></tr>)}</tbody></table></div>{entries.length===0&&<p>No finance entries yet.</p>}</section></>
  );
}
