"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { formatNaira } from "@/lib/domain/digital-service/format";
import type { DigitalServiceOperation } from "@/lib/domain/digital-service/sales-types";
import { completeDigitalServiceItem } from "@/app/(digital-service)/digital-service/sales-reports/actions";

const paymentChannels = [
  { id: "cash", label: "Cash" },
  { id: "transfer", label: "Transfer" },
  { id: "coupon_redemption", label: "Customer Coupon Redemption" },
] as const;

type PaymentChannel = (typeof paymentChannels)[number]["id"];

export function SalesReportOperations({
  operations,
  title = "Pending & completed items",
}: {
  operations: DigitalServiceOperation[];
  title?: string;
}) {
  const [activeOperation, setActiveOperation] = useState<DigitalServiceOperation | null>(null);
  const [detailsOperation, setDetailsOperation] = useState<DigitalServiceOperation | null>(null);
  const [step, setStep] = useState(1);
  const [channels, setChannels] = useState<PaymentChannel[]>(["cash"]);
  const [cashAmount, setCashAmount] = useState(0);
  const [transferAmount, setTransferAmount] = useState(0);
  const [redemptionAmount, setRedemptionAmount] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableCredit = activeOperation
    ? activeOperation.customer
      ? activeOperation.customer.creditBalance + activeOperation.projectedCredit
      : 0
    : 0;
  const prospectiveServiceCount = activeOperation
    ? (activeOperation.customer?.serviceCount ?? 0) + activeOperation.quantity
    : 0;
  const canRedeem = Boolean(
    activeOperation?.customer?.couponCode &&
    activeOperation.referralOnlyCoupon &&
    prospectiveServiceCount > activeOperation.redemptionThreshold &&
    availableCredit > 0,
  );
  const paymentTotal = useMemo(
    () => Math.round((cashAmount + transferAmount + redemptionAmount) * 100),
    [cashAmount, transferAmount, redemptionAmount],
  );
  const expectedTotal = activeOperation ? Math.round(activeOperation.lineTotal * 100) : 0;
  const discountShare = detailsOperation
    ? (detailsOperation.quoteDirectDiscount + detailsOperation.quoteCouponDiscount) *
      (detailsOperation.quoteGrossTotal > 0
        ? detailsOperation.lineTotal / detailsOperation.quoteGrossTotal
        : 0)
    : 0;
  const costShare = detailsOperation
    ? detailsOperation.quoteDirectCost *
      (detailsOperation.quoteGrossTotal > 0
        ? detailsOperation.lineTotal / detailsOperation.quoteGrossTotal
        : 0)
    : 0;
  const payableShare = detailsOperation
    ? detailsOperation.quotePayableTotal *
      (detailsOperation.quoteGrossTotal > 0
        ? detailsOperation.lineTotal / detailsOperation.quoteGrossTotal
        : 0)
    : 0;
  const netProfitShare = detailsOperation
    ? Math.max(
        0,
        detailsOperation.quoteNetProfit *
          (detailsOperation.quoteGrossTotal > 0
            ? detailsOperation.lineTotal / detailsOperation.quoteGrossTotal
            : 0),
      )
    : 0;

  function formatDateTime(value: string | null) {
    return value ? new Date(value).toLocaleString() : "-";
  }
  const paymentIsValid =
    channels.length > 0 &&
    paymentTotal === expectedTotal &&
    channels.includes("cash") === (cashAmount > 0) &&
    channels.includes("transfer") === (transferAmount > 0) &&
    channels.includes("coupon_redemption") === (redemptionAmount > 0) &&
    (redemptionAmount === 0 ||
      (canRedeem &&
        couponCode.trim().toUpperCase() === activeOperation?.customer?.couponCode?.toUpperCase() &&
        redemptionAmount <= availableCredit));

  useEffect(() => {
    if (!activeOperation && !detailsOperation) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) {
        setActiveOperation(null);
        setDetailsOperation(null);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [activeOperation, detailsOperation, isSubmitting]);

  function openCompletion(operation: DigitalServiceOperation) {
    setDetailsOperation(null);
    setActiveOperation(operation);
    setStep(1);
    setChannels(["cash"]);
    setCashAmount(operation.lineTotal);
    setTransferAmount(0);
    setRedemptionAmount(0);
    setCouponCode(operation.customer?.couponCode ?? "");
  }

  function toggleChannel(channel: PaymentChannel, checked: boolean) {
    setChannels((current) =>
      checked
        ? [...new Set([...current, channel])]
        : current.filter((value) => value !== channel),
    );
    if (!checked) {
      if (channel === "cash") setCashAmount(0);
      if (channel === "transfer") setTransferAmount(0);
      if (channel === "coupon_redemption") setRedemptionAmount(0);
      return;
    }
    if (channel === "cash" && cashAmount === 0) {
      setCashAmount(Math.max(0, activeOperation!.lineTotal - transferAmount - redemptionAmount));
    }
    if (channel === "transfer" && transferAmount === 0) {
      setTransferAmount(Math.max(0, activeOperation!.lineTotal - cashAmount - redemptionAmount));
    }
    if (channel === "coupon_redemption" && redemptionAmount === 0) {
      setRedemptionAmount(Math.min(availableCredit, Math.max(0, activeOperation!.lineTotal - cashAmount - transferAmount)));
    }
  }

  async function completeTransaction() {
    if (!activeOperation || !paymentIsValid || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await completeDigitalServiceItem({
        itemId: activeOperation.id,
        channels,
        cashAmount,
        transferAmount,
        redemptionAmount,
        couponCode,
      });
      toast.success("Service completed.");
      setActiveOperation(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not complete the transaction.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <section className="dashboard-panel" style={{ marginBottom: 16 }}>
        <h2>{title}</h2>
        <div style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr><th>Sale</th><th>Customer</th><th>Service</th><th>Quantity</th><th>Amount</th><th>Status</th><th>Transaction date</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {operations.map((operation) => (
                <tr key={operation.id}>
                  <td>{operation.quoteId.slice(0, 8)}</td>
                  <td>{operation.customer?.name ?? "Guest"}</td>
                  <td>{operation.name}</td>
                  <td>{operation.quantity} {operation.unit}</td>
                  <td>{formatNaira(operation.lineTotal)}</td>
                  <td><span className="badge">{operation.status}</span></td>
                  <td>{new Date(operation.quoteCreatedAt).toLocaleString()}</td>
                  <td style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button className="btn btn-gray" type="button" onClick={() => setDetailsOperation(operation)}>
                      Details
                    </button>
                    {operation.status === "completed" ? (
                      <span>{operation.completedAt?.slice(0, 10) ?? "-"}</span>
                    ) : (
                      <button className="btn btn-primary" type="button" onClick={() => openCompletion(operation)}>
                        Complete transaction
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {operations.length === 0 ? <tr><td className="empty" colSpan={8}>No sales items found.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>

      {detailsOperation ? (
        <div
          className="modal-overlay open"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDetailsOperation(null);
          }}
        >
          <div className="quote-modal" role="dialog" aria-modal="true" aria-labelledby="operation-details-title" style={{ maxWidth: 760 }}>
            <div className="modal-head">
              <div className="modal-title-row">
                <h2 id="operation-details-title">Service Details</h2>
                <button className="btn btn-gray" type="button" onClick={() => setDetailsOperation(null)}>Close</button>
              </div>
            </div>
            <div className="modal-body">
              <div className="grid-3">
                <div className="stat"><small>Quote</small><strong>#{detailsOperation.quoteId.slice(0, 8)}</strong></div>
                <div className="stat"><small>Service status</small><strong>{detailsOperation.status}</strong></div>
                <div className="stat"><small>Coupon used</small><strong>{detailsOperation.quoteCouponCode ?? "None"}</strong></div>
              </div>

              <div className="card" style={{ marginTop: 12 }}>
                <div className="line"><span>Customer</span><b>{detailsOperation.customer?.name ?? "Guest"}</b></div>
                <div className="line"><span>Phone</span><b>{detailsOperation.customer?.phone ?? "-"}</b></div>
                <div className="line"><span>Service count</span><b>{detailsOperation.customer?.serviceCount ?? 0}</b></div>
                <div className="line"><span>Service amount</span><b>{detailsOperation.customer ? formatNaira(detailsOperation.customer.serviceAmount) : "-"}</b></div>
                <div className="line"><span>Credit balance</span><b>{detailsOperation.customer ? formatNaira(detailsOperation.customer.creditBalance) : "-"}</b></div>
                <div className="line"><span>Referral credit</span><b>{detailsOperation.customer ? formatNaira(detailsOperation.customer.referralCredit) : "-"}</b></div>
                <div className="line"><span>Credit score</span><b>{detailsOperation.customer?.creditScore ?? "-"}</b></div>
                <div className="line"><span>Transaction entered</span><b>{formatDateTime(detailsOperation.quoteCreatedAt)}</b></div>
                <div className="line"><span>Service entered</span><b>{formatDateTime(detailsOperation.createdAt)}</b></div>
                <div className="line"><span>Service closed</span><b>{formatDateTime(detailsOperation.completedAt)}</b></div>
                <div className="line"><span>Carry-forward date</span><b>{detailsOperation.carryoverDate ?? "-"}</b></div>
              </div>

              <div className="card">
                <h3>Payment</h3>
                <div className="line"><span>Payment channels</span><b>{detailsOperation.paymentChannels.length ? detailsOperation.paymentChannels.join(", ") : "-"}</b></div>
                <div className="line"><span>Coupon redemption</span><b>{detailsOperation.redemptionAmount > 0 ? "Yes" : "No"}</b></div>
                <div className="line"><span>Cash amount</span><b>{formatNaira(detailsOperation.cashAmount)}</b></div>
                <div className="line"><span>Transfer amount</span><b>{formatNaira(detailsOperation.transferAmount)}</b></div>
                <div className="line"><span>Redemption amount</span><b>{formatNaira(detailsOperation.redemptionAmount)}</b></div>
              </div>

              <div className="card">
                <h3>{detailsOperation.name}</h3>
                <div className="line"><span>Quantity</span><b>{detailsOperation.quantity} {detailsOperation.unit}</b></div>
                <div className="line"><span>Unit price</span><b>{formatNaira(detailsOperation.unitPrice)}</b></div>
                <div className="line"><span>Gross service amount</span><b>{formatNaira(detailsOperation.lineTotal)}</b></div>
                <div className="line"><span>Allocated discount</span><b>{formatNaira(discountShare)}</b></div>
                <div className="line"><span>Allocated direct cost</span><b>{formatNaira(costShare)}</b></div>
                <div className="line"><span>Allocated payable</span><b>{formatNaira(payableShare)}</b></div>
                <div className="line"><span>Estimated net profit</span><b>{formatNaira(netProfitShare)}</b></div>
                <div className="line"><span>Customer credit ({detailsOperation.customerCreditPct}%)</span><b>{formatNaira(detailsOperation.projectedCredit)}</b></div>
                <div className="line"><span>Quote net profit</span><b>{formatNaira(detailsOperation.quoteNetProfit)}</b></div>
                <div className="line"><span>Affiliate commission</span><b>{formatNaira(detailsOperation.quoteCommission)}</b></div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {activeOperation ? (
        <div
          className="modal-overlay open"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isSubmitting) setActiveOperation(null);
          }}
        >
          <div className="quote-modal" role="dialog" aria-modal="true" aria-labelledby="completion-modal-title">
            <div className="modal-head">
              <div className="modal-title-row">
                <h2 id="completion-modal-title">Complete Transaction</h2>
                <button className="btn btn-gray" type="button" onClick={() => setActiveOperation(null)} disabled={isSubmitting}>Close</button>
              </div>
              <div className="modal-progress">
                {[1, 2, 3].map((number) => (
                  <div
                    className={`modal-step ${step === number ? "active" : ""} ${step > number ? "done" : ""}`}
                    key={number}
                  >
                    {number}. {number === 1 ? "Service Details" : number === 2 ? "Payment" : "Confirmation"}
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-body">
              {step === 1 ? (
                <section className="modal-pane active">
                  <h2>Service Details</h2>
                  <div className="grid-3">
                    <div className="stat"><small>Sale</small><strong>#{activeOperation.quoteId.slice(0, 8)}</strong></div>
                    <div className="stat"><small>Service status</small><strong>{activeOperation.status}</strong></div>
                    <div className="stat"><small>Amount due</small><strong>{formatNaira(activeOperation.lineTotal)}</strong></div>
                  </div>
                  <div className="card" style={{ marginTop: 12 }}>
                    <div className="line"><span>Service</span><b>{activeOperation.name}</b></div>
                    <div className="line"><span>Quantity</span><b>{activeOperation.quantity} {activeOperation.unit}</b></div>
                    <div className="line"><span>Service entered</span><b>{activeOperation.createdAt.slice(0, 10)}</b></div>
                    <div className="line"><span>Carry-forward date</span><b>{activeOperation.carryoverDate ?? "-"}</b></div>
                    <div className="line"><span>Customer</span><b>{activeOperation.customer?.name ?? "Guest"}</b></div>
                    <div className="line"><span>Phone</span><b>{activeOperation.customer?.phone ?? "-"}</b></div>
                  </div>
                </section>
              ) : null}

              {step === 2 ? (
                <section className="modal-pane active">
                  <h2>Payment Details</h2>
                  <p>Select all payment channels used, then enter the amounts collected.</p>
                  <div className="grid-3">
                    {paymentChannels.map(({ id, label }) => {
                      const disabled = id === "coupon_redemption" && !canRedeem;
                      return (
                        <div className="card" key={id} style={{ opacity: disabled ? 0.55 : 1 }}>
                          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <input
                              type="checkbox"
                              checked={channels.includes(id)}
                              disabled={disabled}
                              onChange={(event) => toggleChannel(id, event.target.checked)}
                              style={{ width: "auto" }}
                            />
                            <span>{label}</span>
                          </label>
                          {id === "cash" ? (
                            <input aria-label="Cash amount" type="number" min="0" step="0.01" value={cashAmount} onChange={(event) => setCashAmount(Math.max(0, Number(event.target.value) || 0))} />
                          ) : null}
                          {id === "transfer" ? (
                            <input aria-label="Transfer amount" type="number" min="0" step="0.01" value={transferAmount} onChange={(event) => setTransferAmount(Math.max(0, Number(event.target.value) || 0))} />
                          ) : null}
                          {id === "coupon_redemption" ? (
                            <>
                              <input aria-label="Customer redemption coupon code" value={couponCode} onChange={(event) => setCouponCode(event.target.value.toUpperCase())} placeholder="Redemption coupon code" />
                              <input aria-label="Redemption amount" type="number" min="0" step="0.01" value={redemptionAmount} onChange={(event) => setRedemptionAmount(Math.max(0, Number(event.target.value) || 0))} />
                            </>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                  <p className="digital-service-payment-status" aria-live="polite">
                    {canRedeem
                      ? `Eligible balance: ${formatNaira(availableCredit)} · ${prospectiveServiceCount} services after completion`
                      : `Coupon redemption unavailable: customer service count must exceed ${activeOperation.redemptionThreshold}, and an eligible customer coupon and balance are required.`}
                  </p>
                  <div className="line">
                    <span>Payment total</span>
                    <b>{formatNaira((cashAmount + transferAmount + redemptionAmount).toFixed(2))} / {formatNaira(activeOperation.lineTotal)}</b>
                  </div>
                  {!paymentIsValid ? (
                    <p className="digital-service-payment-error">
                      Payment channels, amounts, and eligible coupon details must match the amount due.
                    </p>
                  ) : null}
                </section>
              ) : null}

              {step === 3 ? (
                <section className="modal-pane active">
                  <h2>Review & Confirm</h2>
                  <div className="card">
                    <div className="line"><span>Service</span><b>{activeOperation.name} × {activeOperation.quantity}</b></div>
                    <div className="line"><span>Customer</span><b>{activeOperation.customer?.name ?? "Guest"}</b></div>
                    <div className="line"><span>Payment channels</span><b>{channels.map((channel) => paymentChannels.find((item) => item.id === channel)?.label).join(", ")}</b></div>
                    <div className="line"><span>Cash</span><b>{formatNaira(cashAmount.toFixed(2))}</b></div>
                    <div className="line"><span>Transfer</span><b>{formatNaira(transferAmount.toFixed(2))}</b></div>
                    <div className="line"><span>Coupon redemption</span><b>{formatNaira(redemptionAmount.toFixed(2))}</b></div>
                    {redemptionAmount > 0 ? <div className="line"><span>Redemption coupon</span><b>{couponCode.trim().toUpperCase()}</b></div> : null}
                    <div className="line"><span><strong>Total collected</strong></span><b>{formatNaira(activeOperation.lineTotal)}</b></div>
                  </div>
                  <p>Confirming completes this service and updates customer credits and finance records.</p>
                </section>
              ) : null}
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-gray"
                type="button"
                onClick={() => setStep((current) => Math.max(1, current - 1))}
                style={{ visibility: step === 1 ? "hidden" : "visible" }}
                disabled={isSubmitting}
              >
                Back
              </button>
              <div className="modal-footer-right">
                <button className="btn btn-gray" type="button" onClick={() => setActiveOperation(null)} disabled={isSubmitting}>Cancel</button>
                {step < 3 ? (
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={() => setStep((current) => current + 1)}
                    disabled={step === 2 && !paymentIsValid}
                  >
                    {step === 1 ? "Next: Payment" : "Review Transaction"}
                  </button>
                ) : (
                  <button className="btn btn-primary" type="button" onClick={completeTransaction} disabled={isSubmitting || !paymentIsValid}>
                    {isSubmitting ? "Completing..." : "Confirm & Complete"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
