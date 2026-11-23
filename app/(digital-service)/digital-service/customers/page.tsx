import type { Metadata } from "next";
import { getPrismaClient } from "@/lib/prisma";
import { formatNaira } from "@/lib/domain/digital-service/format";
import { deleteCustomer, saveCustomer, setCustomerCredit } from "./actions";

export const metadata: Metadata = { title: "Digital service customers" };

export default async function CustomersPage() {
  const prisma = getPrismaClient();
  const [customers, creditSetting] = await Promise.all([
    prisma.digitalServiceCustomer.findMany({ orderBy: { name: "asc" } }),
    prisma.digitalServiceAppSetting.findUnique({ where: { key: "customer_credit_pct" } }),
  ]);
  const customerCoupons = await prisma.digitalServiceCoupon.findMany({
    where: { code: { in: customers.flatMap((customer) => customer.couponCode ? [customer.couponCode] : []) } },
    select: { code: true, affiliatePct: true },
  });
  const couponsByCode = new Map(customerCoupons.map((coupon) => [coupon.code, coupon]));
  return (
    <><div className="dashboard-welcome"><div><span className="eyebrow">Customers</span><h1>Customer accounts</h1><p>Service history, credits, and referral balances.</p></div></div>
      <section className="dashboard-panel" style={{ marginBottom:16 }}>
        <h2>Add customer</h2>
        <form action={saveCustomer} className="admin-edit-form" style={{ marginTop:12 }}>
          <label><span>Name</span><input name="name" required /></label>
          <label><span>Phone</span><input name="phone" required /></label>
          <label><span>Referral commission %</span><input name="commissionPct" type="number" min="0" max="100" step="0.01" defaultValue="5" required /></label>
          <button className="button button--small" type="submit">Add customer</button>
        </form>
        <form action={setCustomerCredit} className="admin-edit-form" style={{ marginTop:12 }}>
          <label><span>Buyer reward % of net profit</span><input name="pct" type="number" min="0" max="100" defaultValue={creditSetting?.value ?? "5"} required /></label>
          <button className="button button--small button--light" type="submit">Save setting</button>
        </form>
      </section>
      <section className="dashboard-panel"><div style={{ overflowX: "auto" }}><table className="admin-table"><thead><tr><th>Name</th><th>Phone</th><th>Services</th><th>Amount</th><th>Credit balance</th><th>Referral commission</th><th>Redeemed</th><th>Coupon commission</th><th>Actions</th></tr></thead>
        <tbody>{customers.map((customer) => {
          const commissionPct = customer.couponCode ? couponsByCode.get(customer.couponCode)?.affiliatePct.toString() ?? "5" : "5";
          return (
            <tr key={customer.id}>
              <td>{customer.name}</td>
              <td>{customer.phone}</td>
              <td>{customer.serviceCount}</td>
              <td>{formatNaira(customer.serviceAmount.toString())}</td>
              <td>{formatNaira(customer.creditBalance.toString())}</td>
              <td>{formatNaira(customer.referralCredit.toString())}</td>
              <td>{formatNaira(customer.redeemedAmount.toString())}</td>
              <td>{commissionPct}%</td>
              <td>
                <details className="digital-service-edit-details">
                  <summary className="button button--small button--light">Edit</summary>
                  <form action={saveCustomer} className="digital-service-inline-edit">
                    <input type="hidden" name="id" value={customer.id} />
                    <label><span>Name</span><input name="name" defaultValue={customer.name} required /></label>
                    <label><span>Phone</span><input name="phone" defaultValue={customer.phone} required /></label>
                    <label><span>Coupon commission %</span><input name="commissionPct" type="number" min="0" max="100" step="0.01" defaultValue={commissionPct} required /></label>
                    <button className="button button--small" type="submit">Save changes</button>
                  </form>
                </details>
                <form action={deleteCustomer} style={{ marginTop:8 }}>
                  <input type="hidden" name="id" value={customer.id} />
                  <button className="button button--small" style={{ background:"#dc2626",color:"#fff" }} type="submit">Delete</button>
                </form>
              </td>
            </tr>
          );
        })}</tbody></table></div>
        {customers.length === 0 && <p>No customers yet.</p>}
      </section></>
  );
}
