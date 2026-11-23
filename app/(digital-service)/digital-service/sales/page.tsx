import type { Metadata } from "next";
import { getPrismaClient } from "@/lib/prisma";
import { formatNaira } from "@/lib/domain/digital-service/format";
import { SalesWizard } from "@/components/domain/digital-service/sales-wizard";

export const metadata: Metadata = { title: "New digital service sale" };

export default async function SalesPage() {
  const [categories, customers, coupons, quotes, creditSetting] = await Promise.all([
    getPrismaClient().digitalServiceCategory.findMany({ include: { services: true }, orderBy: { name: "asc" } }),
    getPrismaClient().digitalServiceCustomer.findMany({ orderBy: { name: "asc" } }),
    getPrismaClient().digitalServiceCoupon.findMany({ orderBy: { code: "asc" } }),
    getPrismaClient().digitalServiceQuote.findMany({ include: { customer: true, coupon: true }, orderBy: { createdAt: "desc" }, take: 100 }),
    getPrismaClient().digitalServiceAppSetting.findUnique({ where: { key: "customer_credit_pct" } }),
  ]);
  const serializedCategories = categories.map((category) => ({
    id: category.id,
    name: category.name,
    services: category.services.map((service) => ({
      id: service.id,
      name: service.name,
      unit: service.unit,
      price: service.price.toString(),
    })),
  }));
  return (
    <>
      <div className="topbar"><h1>New Sales</h1></div>
      <SalesWizard
        categories={serializedCategories}
        customers={customers.map((customer) => ({ id:customer.id, name:customer.name, phone:customer.phone, serviceCount:customer.serviceCount }))}
        coupons={coupons.map((coupon) => ({ id:coupon.id, code:coupon.code, customerPct:coupon.customerPct.toString(), customerDirect:coupon.customerDirect.toString(), referralOnly:coupon.referralOnly }))}
        customerCreditPct={Number(creditSetting?.value ?? 5)}
      />
      <section className="dashboard-panel" style={{ marginTop:16 }}>
        <h2>Sales history</h2>
        <div style={{ overflowX:"auto" }}>
          <table className="admin-table"><thead><tr><th>Quote</th><th>Customer</th><th>Coupon</th><th>Gross</th><th>Payable</th><th>Net</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>{quotes.map((quote)=><tr key={quote.id}><td>{quote.id.slice(0,8)}</td><td>{quote.customer?.name ?? "Guest"}</td><td>{quote.coupon?.code ?? "-"}</td><td>{formatNaira(quote.grossTotal.toString())}</td><td>{formatNaira(quote.payableTotal.toString())}</td><td>{formatNaira(quote.netProfit.toString())}</td><td>{quote.status}</td><td>{quote.createdAt.toISOString().slice(0,10)}</td></tr>)}</tbody>
          </table>
        </div>
      </section></>
  );
}
