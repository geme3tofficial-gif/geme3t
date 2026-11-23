import type { Metadata } from "next";
import { getPrismaClient } from "@/lib/prisma";
import { formatNaira } from "@/lib/domain/digital-service/format";
import { deleteCustomer, saveCustomer, setCustomerCredit } from "./actions";

export const metadata: Metadata = { title: "Digital service customers" };

export default async function CustomersPage() {
  const customers = await getPrismaClient().digitalServiceCustomer.findMany({ orderBy: { name: "asc" } });
  const creditSetting = await getPrismaClient().digitalServiceAppSetting.findUnique({ where: { key: "customer_credit_pct" } });
  return (
    <><div className="dashboard-welcome"><div><span className="eyebrow">Customers</span><h1>Customer accounts</h1><p>Service history, credits, and referral balances.</p></div></div>
      <section className="dashboard-panel" style={{ marginBottom:16 }}>
        <h2>Add customer</h2>
        <form action={saveCustomer} className="admin-edit-form" style={{ marginTop:12 }}>
          <label><span>Name</span><input name="name" required /></label>
          <label><span>Phone</span><input name="phone" required /></label>
          <button className="button button--small" type="submit">Add customer</button>
        </form>
        <form action={setCustomerCredit} className="admin-edit-form" style={{ marginTop:12 }}>
          <label><span>Customer credit % of net profit</span><input name="pct" type="number" min="0" max="100" defaultValue={creditSetting?.value ?? "5"} required /></label>
          <button className="button button--small button--light" type="submit">Save setting</button>
        </form>
      </section>
      <section className="dashboard-panel"><div style={{ overflowX: "auto" }}><table className="admin-table"><thead><tr><th>Name</th><th>Phone</th><th>Services</th><th>Amount</th><th>Credit balance</th><th>Redeemed</th><th>Actions</th></tr></thead>
        <tbody>{customers.map((customer) => <tr key={customer.id}><td><form action={saveCustomer} className="admin-edit-form"><input type="hidden" name="id" value={customer.id} /><input name="name" defaultValue={customer.name} /><input name="phone" defaultValue={customer.phone} /><button className="button button--small button--light" type="submit">Save</button></form></td><td>{customer.phone}</td><td>{customer.serviceCount}</td><td>{formatNaira(customer.serviceAmount.toString())}</td><td>{formatNaira(customer.creditBalance.toString())}</td><td>{formatNaira(customer.redeemedAmount.toString())}</td><td><form action={deleteCustomer}><input type="hidden" name="id" value={customer.id} /><button className="button button--small" style={{ background:"#dc2626",color:"#fff" }} type="submit">Delete</button></form></td></tr>)}</tbody></table></div>
        {customers.length === 0 && <p>No customers yet.</p>}
      </section></>
  );
}
