import type { Metadata } from "next";
import { getPrismaClient } from "@/lib/prisma";
import { deleteCoupon, saveCoupon } from "./actions";

export const metadata: Metadata = { title: "Digital service coupons" };

export default async function CouponsPage() {
  const prisma = getPrismaClient();
  const [coupons, affiliates] = await Promise.all([
    prisma.digitalServiceCoupon.findMany({ include: { affiliate: true }, orderBy: { code: "asc" } }),
    prisma.digitalServiceAffiliate.findMany({ orderBy: { name: "asc" } }),
  ]);
  return (
    <><div className="dashboard-welcome"><div><span className="eyebrow">Promotions</span><h1>Coupons</h1><p>Customer discounts, affiliate payouts, and referral coupons.</p></div></div>
      <section className="dashboard-panel" style={{ marginBottom:16 }}>
        <h2>Add coupon</h2>
        <form action={saveCoupon} className="admin-edit-form" style={{ marginTop:12 }}>
          <label><span>Code</span><input name="code" required /></label>
          <label><span>Tier</span><input name="tier" defaultValue="Custom" /></label>
          <label><span>Customer %</span><input name="customerPct" type="number" min="0" max="100" defaultValue="0" /></label>
          <label><span>Direct discount</span><input name="customerDirect" type="number" min="0" defaultValue="0" /></label>
          <label><span>Commission %</span><input name="affiliatePct" type="number" min="0" max="100" step="0.01" defaultValue="0" required /></label>
          <label><span>Affiliate</span><select name="affiliateId"><option value="">None</option>{affiliates.map((affiliate)=><option value={affiliate.id} key={affiliate.id}>{affiliate.name}</option>)}</select></label>
          <label><span>Redemption threshold</span><input name="redemptionThreshold" type="number" min="1" defaultValue="3" /></label>
          <label><span><input name="referralOnly" type="checkbox" /> Referral only</span></label>
          <button className="button button--small" type="submit">Create coupon</button>
        </form>
      </section>
      <section className="dashboard-panel"><div style={{ overflowX: "auto" }}><table className="admin-table"><thead><tr><th>Code</th><th>Tier</th><th>Customer %</th><th>Direct discount</th><th>Affiliate</th><th>Usage</th><th>Referral only</th><th>Commission %</th><th>Actions</th></tr></thead>
        <tbody>{coupons.map((coupon) => <tr key={coupon.id}>
          <td>{coupon.code}</td>
          <td>{coupon.tier}</td>
          <td>{coupon.customerPct.toString()}%</td>
          <td>{coupon.customerDirect.toString()}</td>
          <td>{coupon.affiliate?.name ?? "-"}</td>
          <td>{coupon.usageCount}</td>
          <td>{coupon.referralOnly ? "Yes" : "No"}</td>
          <td>{coupon.affiliatePct.toString()}%</td>
          <td>
            <details className="digital-service-edit-details">
              <summary className="button button--small button--light">Edit</summary>
              <form action={saveCoupon} className="digital-service-inline-edit">
                <input type="hidden" name="id" value={coupon.id} />
                <label><span>Code</span><input name="code" defaultValue={coupon.code} required /></label>
                <label><span>Tier</span><input name="tier" defaultValue={coupon.tier} /></label>
                <label><span>Customer %</span><input name="customerPct" type="number" min="0" max="100" step="0.01" defaultValue={coupon.customerPct.toString()} required /></label>
                <label><span>Direct discount</span><input name="customerDirect" type="number" min="0" step="0.01" defaultValue={coupon.customerDirect.toString()} required /></label>
                <label><span>Commission %</span><input name="affiliatePct" type="number" min="0" max="100" step="0.01" defaultValue={coupon.affiliatePct.toString()} required /></label>
                <label><span>Affiliate</span><select name="affiliateId" defaultValue={coupon.affiliateId ?? ""}><option value="">None</option>{affiliates.map((affiliate)=><option value={affiliate.id} key={affiliate.id}>{affiliate.name}{affiliate.active ? "" : " (inactive)"}</option>)}</select></label>
                <label><span>Redemption threshold</span><input name="redemptionThreshold" type="number" min="1" defaultValue={coupon.redemptionThreshold} required /></label>
                <label className="digital-service-checkbox-label"><input name="referralOnly" type="checkbox" defaultChecked={coupon.referralOnly} /> Referral only</label>
                <button className="button button--small" type="submit">Save changes</button>
              </form>
            </details>
            <form action={deleteCoupon} style={{ marginTop:8 }}>
              <input type="hidden" name="id" value={coupon.id} />
              <button className="button button--small" style={{ background:"#dc2626",color:"#fff" }} type="submit">Delete</button>
            </form>
          </td>
        </tr>)}</tbody></table></div>
        {coupons.length === 0 && <p>No coupons yet.</p>}
      </section></>
  );
}
