import type { Metadata } from "next";
import { connection } from "next/server";
import { getPrismaClient } from "@/lib/prisma";
import { decryptCustomerPerformanceToken } from "@/lib/domain/digital-service/customer-performance-token";
import { formatNaira } from "@/lib/domain/digital-service/format";
import { CustomerPerformanceLink } from "@/components/domain/digital-service/customer-performance-link";
import { CustomerEditDialog } from "@/components/domain/digital-service/customer-edit-dialog";
import { GenerateCustomerPerformanceLinksButton } from "@/components/domain/digital-service/generate-customer-performance-links-button";
import { deleteCustomer, saveCustomer, setCustomerCredit } from "./actions";

export const metadata: Metadata = { title: "Digital service customers" };

export default async function CustomersPage() {
  await connection();
  const prisma = getPrismaClient();
  const [customers, creditSetting] = await Promise.all([
    prisma.digitalServiceCustomer.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        phone: true,
        couponCode: true,
        serviceCount: true,
        serviceAmount: true,
        creditBalance: true,
        referralCredit: true,
        redeemedAmount: true,
        shareTokenHash: true,
        shareTokenEncrypted: true,
      },
    }),
    prisma.digitalServiceAppSetting.findUnique({ where: { key: "customer_credit_pct" } }),
  ]);
  const customerCoupons = await prisma.digitalServiceCoupon.findMany({
    where: { code: { in: customers.flatMap((customer) => customer.couponCode ? [customer.couponCode] : []) } },
    select: { code: true, affiliatePct: true },
  });
  const couponsByCode = new Map(customerCoupons.map((coupon) => [coupon.code, coupon]));
  return (
    <><div className="dashboard-welcome"><div><span className="eyebrow">Customers</span><h1>Customer accounts</h1><p>Service history, credits, and referral balances.</p></div></div>
      <section className="dashboard-panel customer-performance-links-panel" style={{ marginBottom: 16 }}>
        <div className="workspace-panel-heading">
          <div>
            <h2>Public customer tracking links</h2>
            <p>Manage public coupon and rewards dashboard links in each customer&apos;s row below.</p>
          </div>
          <GenerateCustomerPerformanceLinksButton
            missingCount={customers.filter((customer) => !customer.shareTokenEncrypted).length}
          />
        </div>
        <p className="customer-performance-links-warning">
          Anyone with a customer&apos;s link can view that customer&apos;s reward balance and coupon performance. Share each link directly with its customer.
        </p>
      </section>
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
      <section className="dashboard-panel"><div style={{ overflowX: "auto" }}><table className="admin-table"><thead><tr><th>Customer</th><th>Phone</th><th>Services</th><th>Amount</th><th>Credit balance</th><th>Referral commission</th><th>Redeemed</th><th>Coupon commission</th><th>Actions</th></tr></thead>
        <tbody>{customers.map((customer) => {
          const commissionPct = customer.couponCode ? couponsByCode.get(customer.couponCode)?.affiliatePct.toString() ?? "5" : "5";
          return (
            <tr key={customer.id}>
              <td className="customer-list-name-cell">
                <strong>{customer.name}</strong>
                <CustomerPerformanceLink
                  key={`${customer.id}:${customer.shareTokenHash ?? ""}`}
                  customerId={customer.id}
                  customerName={customer.name}
                  customerPhone={customer.phone}
                  hasExistingLink={Boolean(customer.shareTokenHash)}
                  initialToken={
                    customer.shareTokenEncrypted
                      ? decryptCustomerPerformanceToken(customer.shareTokenEncrypted)
                      : null
                  }
                />
              </td>
              <td>{customer.phone}</td>
              <td>{customer.serviceCount}</td>
              <td>{formatNaira(customer.serviceAmount.toString())}</td>
              <td>{formatNaira(customer.creditBalance.toString())}</td>
              <td>{formatNaira(customer.referralCredit.toString())}</td>
              <td>{formatNaira(customer.redeemedAmount.toString())}</td>
              <td>{commissionPct}%</td>
              <td>
                <div className="customer-list-row-actions">
                  <CustomerEditDialog
                    commissionPct={commissionPct}
                    customerId={customer.id}
                    customerName={customer.name}
                    customerPhone={customer.phone}
                  />
                  <form action={deleteCustomer}>
                  <input type="hidden" name="id" value={customer.id} />
                  <button className="button button--small" style={{ background:"#dc2626",color:"#fff" }} type="submit">Delete</button>
                  </form>
                </div>
              </td>
            </tr>
          );
        })}</tbody></table></div>
        {customers.length === 0 && <p>No customers yet.</p>}
      </section></>
  );
}
