import type { Metadata } from "next";
import { connection } from "next/server";
import { getPrismaClient } from "@/lib/prisma";
import { saveCoupon } from "./actions";
import { CouponActions } from "@/components/domain/digital-service/coupon-actions";

export const metadata: Metadata = { title: "Digital service coupons" };

export default async function CouponsPage() {
  await connection();
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
            <CouponActions
              coupon={{
                id: coupon.id,
                code: coupon.code,
                tier: coupon.tier,
                customerPct: coupon.customerPct.toString(),
                customerDirect: coupon.customerDirect.toString(),
                affiliatePct: coupon.affiliatePct.toString(),
                affiliateId: coupon.affiliateId,
                redemptionThreshold: coupon.redemptionThreshold,
                referralOnly: coupon.referralOnly,
              }}
              affiliates={affiliates.map((affiliate) => ({
                id: affiliate.id,
                name: affiliate.name,
                active: affiliate.active,
              }))}
            />
          </td>
        </tr>)}</tbody></table></div>
        {coupons.length === 0 && <p>No coupons yet.</p>}
      </section></>
  );
}
