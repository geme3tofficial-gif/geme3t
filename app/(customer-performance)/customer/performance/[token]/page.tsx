import { createHash } from "node:crypto";
import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { formatNaira } from "@/lib/domain/digital-service/format";
import { getPrismaClient } from "@/lib/prisma";
import { CustomerCouponAdBanner } from "@/components/domain/digital-service/customer-coupon-ad-banner";

export const metadata: Metadata = {
  title: "Customer coupon performance",
  description: "Customer coupon usage, rewards credit, redemptions, and commission summary.",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

function sumGroup<T extends { status: string }>(groups: T[], status: string) {
  return groups.find((group) => group.status === status);
}

export default async function CustomerPerformancePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  await connection();
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) notFound();

  const shareTokenHash = createHash("sha256").update(token).digest("hex");
  const prisma = getPrismaClient();
  const customer = await prisma.digitalServiceCustomer.findUnique({
    where: { shareTokenHash },
    select: {
      id: true,
      name: true,
      couponCode: true,
      serviceCount: true,
      serviceAmount: true,
      creditBalance: true,
      referralCredit: true,
      redeemedAmount: true,
    },
  });
  if (!customer) notFound();

  const [coupon, redemptions, services] = await Promise.all([
    customer.couponCode
      ? prisma.digitalServiceCoupon.findUnique({
          where: { code: customer.couponCode },
          select: {
            id: true,
            code: true,
            tier: true,
            referralOnly: true,
            redemptionThreshold: true,
            usageCount: true,
            affiliate: { select: { name: true, active: true } },
          },
        })
      : null,
    prisma.digitalServiceQuoteItem.aggregate({
      where: {
        redemptionAmount: { gt: 0 },
        quote: { customerId: customer.id },
      },
      _count: { _all: true },
      _sum: { redemptionAmount: true },
    }),
    prisma.digitalServiceService.findMany({
      select: { name: true },
      orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
    }),
  ]);
  const couponUseGroups = coupon
    ? await prisma.digitalServiceQuote.groupBy({
        by: ["status"],
        where: { couponId: coupon.id },
        orderBy: { status: "asc" },
        _count: { _all: true },
        _sum: {
          commissionEarned: true,
        },
      })
    : [];
  const completedUses = sumGroup(couponUseGroups, "COMPLETED");
  const pendingUses = sumGroup(couponUseGroups, "PENDING");
  const cancelledUses = sumGroup(couponUseGroups, "CANCELLED");
  const canRedeem = Boolean(
    coupon?.referralOnly &&
    customer.serviceCount > coupon.redemptionThreshold &&
    Number(customer.creditBalance) > 0,
  );
  const remainingForThreshold = coupon?.referralOnly
    ? Math.max(0, coupon.redemptionThreshold + 1 - customer.serviceCount)
    : 0;

  return (
    <main className="customer-performance-page">
      <header className="customer-performance-header">
        <p className="eyebrow">GEME3T Digital Services</p>
        <h1>Coupon & rewards dashboard</h1>
        <p>Welcome, {customer.name}. This public page summarizes your rewards and coupon activity.</p>
      </header>

      <section className="dashboard-grid">
        <article className="dashboard-panel">
          <h2>Available credit</h2>
          <p className="admin-dashboard-count">{formatNaira(customer.creditBalance.toString())}</p>
          <p>Current rewards balance on your customer account.</p>
        </article>
        <article className="dashboard-panel">
          <h2>Redeemable now</h2>
          <p className="admin-dashboard-count">{formatNaira(canRedeem ? customer.creditBalance.toString() : 0)}</p>
          <p>
            {canRedeem
              ? "Your account meets the current coupon redemption requirements."
              : coupon?.referralOnly
                ? remainingForThreshold > 0
                  ? `Complete ${remainingForThreshold} more service${remainingForThreshold === 1 ? "" : "s"} and keep a positive credit balance to qualify.`
                  : "A positive credit balance is required to redeem."
                : "This account does not currently have a redeemable referral coupon."}
          </p>
        </article>
        <article className="dashboard-panel">
          <h2>Referral credits</h2>
          <p className="admin-dashboard-count">{formatNaira(customer.referralCredit.toString())}</p>
          <p>Commissions credited to your customer rewards account.</p>
        </article>
        <article className="dashboard-panel">
          <h2>Total redeemed</h2>
          <p className="admin-dashboard-count">{formatNaira(redemptions._sum.redemptionAmount?.toString() ?? customer.redeemedAmount.toString())}</p>
          <p>{redemptions._count._all} redemption{redemptions._count._all === 1 ? "" : "s"} recorded.</p>
        </article>
        <article className="dashboard-panel">
          <h2>Completed services</h2>
          <p className="admin-dashboard-count">{customer.serviceCount}</p>
          <p>Total service spend: {formatNaira(customer.serviceAmount.toString())}</p>
        </article>
      </section>

      <section className="dashboard-panel customer-performance-coupon">
        <div className="workspace-panel-heading">
          <div>
            <h2>Your coupon</h2>
            <p>Coupon performance is aggregated; other customers&apos; names and transaction details are not shown.</p>
          </div>
        </div>
        {coupon ? (
          <>
            <div className="customer-performance-coupon-code">
              <span>{coupon.code}</span>
              <span>{coupon.tier} referral coupon</span>
            </div>
            <div className="dashboard-grid customer-performance-stats">
              <div><strong>{coupon.usageCount}</strong><span>Completed uses</span></div>
              <div><strong>{pendingUses?._count._all ?? 0}</strong><span>Pending sales</span></div>
              <div><strong>{cancelledUses?._count._all ?? 0}</strong><span>Cancelled sales</span></div>
            </div>
            <div className="customer-performance-coupon-totals">
              <div className="line">
                <span>Commission generated from completed uses</span>
                <b>{formatNaira(completedUses?._sum.commissionEarned?.toString() ?? 0)}</b>
              </div>
              <div className="line">
                <span>Commission pending sales completion</span>
                <b>{formatNaira(pendingUses?._sum.commissionEarned?.toString() ?? 0)}</b>
              </div>
              <div className="line">
                <span>Linked affiliate</span>
                <b>
                  {coupon.affiliate
                    ? `${coupon.affiliate.name}${coupon.affiliate.active ? "" : " (inactive)"}`
                    : "No affiliate linked"}
                </b>
              </div>
            </div>
            <CustomerCouponAdBanner
              couponCode={coupon.code}
              services={services.map((service) => service.name)}
            />
          </>
        ) : (
          <p>No active customer coupon is linked to this account.</p>
        )}
      </section>

      <p className="customer-performance-note">
        Anyone with this public link can view these details. If you did not expect this link, contact GEME3T to have it changed.
      </p>
    </main>
  );
}
