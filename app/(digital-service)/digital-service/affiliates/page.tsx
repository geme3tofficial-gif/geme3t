import type { Metadata } from "next";
import { getPrismaClient } from "@/lib/prisma";
import { deleteAffiliate, saveAffiliate, toggleAffiliate } from "./actions";

export const metadata: Metadata = { title: "Digital service affiliates" };

export default async function AffiliatesPage() {
  const affiliates = await getPrismaClient().digitalServiceAffiliate.findMany({ orderBy: { name: "asc" }, include: { coupons: true } });
  return (
    <><div className="dashboard-welcome"><div><span className="eyebrow">Partners</span><h1>Affiliates</h1><p>Affiliate tiers, commissions, and linked coupons.</p></div></div>
      <section className="dashboard-panel" style={{ marginBottom:16 }}>
        <h2>Add affiliate</h2>
        <form action={saveAffiliate} className="admin-edit-form" style={{ marginTop:12 }}>
          <label><span>Name</span><input name="name" required /></label>
          <label><span>Phone</span><input name="phone" /></label>
          <label><span>Email</span><input name="email" type="email" /></label>
          <label><span>Tier</span><input name="tier" defaultValue="Custom" /></label>
          <label><span>Tier discount %</span><input name="discountPct" type="number" min="0" max="100" defaultValue="0" /></label>
          <label><span>Commission %</span><input name="commissionPct" type="number" min="0" max="100" defaultValue="0" /></label>
          <label><span>Notes</span><input name="notes" /></label>
          <button className="button button--small" type="submit">Add affiliate</button>
        </form>
      </section>
      <section className="dashboard-panel"><div style={{ overflowX: "auto" }}><table className="admin-table"><thead><tr><th>Name</th><th>Phone</th><th>Tier</th><th>Commission</th><th>Coupons</th><th>Status</th></tr></thead>
        <tbody>{affiliates.map((affiliate) => <tr key={affiliate.id}><td>{affiliate.name}</td><td>{affiliate.phone ?? "-"}</td><td>{affiliate.tier}</td><td>{affiliate.commissionPct.toString()}%</td><td>{affiliate.coupons.length}</td><td>{affiliate.active ? "Active" : "Inactive"}</td><td><form action={toggleAffiliate}><input type="hidden" name="id" value={affiliate.id} /><input type="hidden" name="active" value={String(affiliate.active)} /><button className="button button--small button--light" type="submit">{affiliate.active ? "Deactivate" : "Activate"}</button></form><form action={deleteAffiliate} style={{ marginTop:8 }}><input type="hidden" name="id" value={affiliate.id} /><button className="button button--small" style={{ background:"#dc2626",color:"#fff" }} type="submit">Delete</button></form></td></tr>)}</tbody></table></div>
        {affiliates.length === 0 && <p>No affiliates yet.</p>}
      </section></>
  );
}
