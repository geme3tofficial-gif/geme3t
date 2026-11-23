import type { Metadata } from "next";
import { connection } from "next/server";
import { getPrismaClient } from "@/lib/prisma";
import { formatNaira } from "@/lib/domain/digital-service/format";

export const metadata: Metadata = { title: "Digital service quote reference" };

export default async function QuoteReferencePage() {
  await connection();
  const services = await getPrismaClient().digitalServiceService.findMany({ include: { category: true }, orderBy: [{ category: { name: "asc" } }, { name: "asc" }] });
  return <><div className="dashboard-welcome"><div><span className="eyebrow">Reference</span><h1>Quote reference tool</h1><p>Search the shared catalog for quick customer quotations.</p></div></div>
    <section className="dashboard-panel"><div style={{ overflowX:"auto" }}><table className="admin-table"><thead><tr><th>Category</th><th>Service</th><th>Unit</th><th>Reference price</th></tr></thead><tbody>{services.map((service)=><tr key={service.id}><td>{service.category.name}</td><td>{service.name}</td><td>{service.unit}</td><td>{formatNaira(service.price.toString())}</td></tr>)}</tbody></table></div></section></>;
}
