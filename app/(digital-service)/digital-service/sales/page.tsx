import type { Metadata } from "next";
import { connection } from "next/server";
import { getPrismaClient } from "@/lib/prisma";
import { getDigitalServiceSalesReportData } from "@/lib/domain/digital-service/sales-report-data";
import { SalesReportOperations } from "@/components/domain/digital-service/sales-report-operations";
import { SalesWizard } from "@/components/domain/digital-service/sales-wizard";

export const metadata: Metadata = { title: "New digital service sale" };

export default async function SalesPage() {
  await connection();
  const [categories, customers, coupons, salesData] = await Promise.all([
    getPrismaClient().digitalServiceCategory.findMany({ include: { services: true }, orderBy: { name: "asc" } }),
    getPrismaClient().digitalServiceCustomer.findMany({ orderBy: { name: "asc" } }),
    getPrismaClient().digitalServiceCoupon.findMany({ orderBy: { code: "asc" } }),
    getDigitalServiceSalesReportData(),
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
        customers={customers.map((customer) => ({ id:customer.id, name:customer.name, phone:customer.phone, serviceCount:customer.serviceCount, couponCode:customer.couponCode ?? undefined }))}
        coupons={coupons.map((coupon) => ({ id:coupon.id, code:coupon.code, customerPct:coupon.customerPct.toString(), customerDirect:coupon.customerDirect.toString(), affiliatePct:coupon.affiliatePct.toString(), referralOnly:coupon.referralOnly }))}
        customerCreditPct={salesData.creditPct}
      />
      <SalesReportOperations operations={salesData.operations} title="Sales listings" />
    </>
  );
}
