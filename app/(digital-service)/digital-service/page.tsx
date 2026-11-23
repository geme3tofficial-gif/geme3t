import type { Metadata } from "next";
import Link from "next/link";
import { getPrismaClient } from "@/lib/prisma";
import { formatNaira } from "@/lib/domain/digital-service/format";

export const metadata: Metadata = { title: "Digital services" };

export default async function DigitalServiceDashboardPage() {
  const prisma = getPrismaClient();
  const [categories, services, customers, coupons, quotes] =
    await prisma.$transaction([
      prisma.digitalServiceCategory.count(),
      prisma.digitalServiceService.count(),
      prisma.digitalServiceCustomer.count(),
      prisma.digitalServiceCoupon.count(),
      prisma.digitalServiceQuote.findMany({
        select: { grossTotal: true, netProfit: true, status: true, payableTotal: true },
      }),
    ]);

  const gross = quotes.reduce((sum, quote) => sum + Number(quote.grossTotal), 0);
  const net = quotes.reduce((sum, quote) => sum + Number(quote.netProfit), 0);
  const completed = quotes.filter((quote) => quote.status === "COMPLETED");
  const pending = quotes.filter((quote) => quote.status === "PENDING");
  const completedAmount = completed.reduce((sum, quote) => sum + Number(quote.payableTotal), 0);
  const pendingAmount = pending.reduce((sum, quote) => sum + Number(quote.payableTotal), 0);

  const stats = [
    ["Categories", categories], ["Services", services],
    ["Customers", customers], ["Coupons", coupons], ["Sales", quotes.length],
    ["Gross revenue", formatNaira(gross)], ["Recorded net profit", formatNaira(net)],
  ];

  return (
    <>
      <div className="dashboard-welcome">
        <div><span className="eyebrow">Operations</span><h1>Digital services</h1><p>Sales, customers, catalog, finance, and print operations.</p></div>
      </div>
      <div className="dashboard-grid">
        {stats.map(([label, value]) => (
          <section className="dashboard-panel" key={String(label)}>
            <div className="workspace-panel-heading"><h2>{label}</h2></div>
            <p className="admin-dashboard-count">{value}</p>
          </section>
        ))}
      </div>
      <div className="dashboard-grid" style={{ marginTop: 16 }}>
        <section className="dashboard-panel"><h2>Completed sales</h2><p className="admin-dashboard-count">{completed.length}</p><p>{formatNaira(completedAmount)}</p></section>
        <section className="dashboard-panel"><h2>Pending sales</h2><p className="admin-dashboard-count">{pending.length}</p><p>{formatNaira(pendingAmount)}</p></section>
      </div>
      <section className="dashboard-panel" style={{ marginTop: 16 }}>
        <h2>Quick actions</h2>
        <div className="dashboard-welcome-actions" style={{ marginTop: 12, flexWrap: "wrap" }}>
          <Link className="button button--small" href="/digital-service/services">Manage services</Link>
          <Link className="button button--small" href="/digital-service/customers">Manage customers</Link>
          <Link className="button button--small" href="/digital-service/coupons">Manage coupons</Link>
          <Link className="button button--small" href="/digital-service/sales">New sale</Link>
          <Link className="button button--small" href="/digital-service/finance">Income & expenses</Link>
          <Link className="button button--small button--light" href="/digital-service/sales-reports">Open weekly report</Link>
        </div>
      </section>
    </>
  );
}
