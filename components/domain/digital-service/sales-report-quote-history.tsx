"use client";

import { useEffect, useState } from "react";
import { formatNaira } from "@/lib/domain/digital-service/format";

type QuoteDetails = {
  id: string;
  createdAt: string;
  status: string;
  grossTotal: number;
  directDiscount: number;
  couponDiscount: number;
  payableTotal: number;
  directCost: number;
  netProfit: number;
  commissionEarned: number;
  couponCode: string | null;
  customer: {
    name: string;
    phone: string;
    serviceCount: number;
    serviceAmount: number;
    creditBalance: number;
    creditScore: number;
    referralCredit: number;
  } | null;
  items: Array<{
    id: string;
    name: string;
    unit: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
    status: string;
    createdAt: string;
    completedAt: string | null;
    carryoverDate: string | null;
    paymentChannels: string[];
    cashAmount: number;
    transferAmount: number;
    redemptionAmount: number;
  }>;
};

function formatDateTime(value: string | null) {
  return value ? new Date(value).toLocaleString() : "-";
}

export function SalesReportQuoteHistory({ quotes }: { quotes: QuoteDetails[] }) {
  const [selectedQuote, setSelectedQuote] = useState<QuoteDetails | null>(null);

  useEffect(() => {
    if (!selectedQuote) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedQuote(null);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [selectedQuote]);

  return (
    <>
      <section className="dashboard-panel">
        <h2>Sales & quotes</h2>
        <div style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr><th>Quote</th><th>Customer</th><th>Gross</th><th>Payable</th><th>Net profit</th><th>Status</th><th>Transaction date</th><th>Details</th></tr>
            </thead>
            <tbody>
              {quotes.map((quote) => (
                <tr key={quote.id}>
                  <td>{quote.id.slice(0, 8)}</td>
                  <td>{quote.customer?.name ?? "Guest"}</td>
                  <td>{formatNaira(quote.grossTotal)}</td>
                  <td>{formatNaira(quote.payableTotal)}</td>
                  <td>{formatNaira(quote.netProfit)}</td>
                  <td>{quote.status}</td>
                  <td>{new Date(quote.createdAt).toLocaleString()}</td>
                  <td>
                    <button className="btn btn-gray" type="button" onClick={() => setSelectedQuote(quote)}>
                      Details
                    </button>
                  </td>
                </tr>
              ))}
              {quotes.length === 0 ? <tr><td className="empty" colSpan={8}>No sales recorded yet.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>

      {selectedQuote ? (
        <div
          className="modal-overlay open"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedQuote(null);
          }}
        >
          <div className="quote-modal" role="dialog" aria-modal="true" aria-labelledby="quote-details-title" style={{ maxWidth: 980 }}>
            <div className="modal-head">
              <div className="modal-title-row">
                <h2 id="quote-details-title">Quote Details · #{selectedQuote.id.slice(0, 8)}</h2>
                <button className="btn btn-gray" type="button" onClick={() => setSelectedQuote(null)}>Close</button>
              </div>
            </div>
            <div className="modal-body">
              <div className="grid-3">
                <div className="stat"><small>Transaction made</small><strong>{formatDateTime(selectedQuote.createdAt)}</strong></div>
                <div className="stat"><small>Sale status</small><strong>{selectedQuote.status}</strong></div>
                <div className="stat"><small>Coupon used</small><strong>{selectedQuote.couponCode ?? "None"}</strong></div>
              </div>

              <div className="card" style={{ marginTop: 12 }}>
                <h3>Customer</h3>
                <div className="line"><span>Name</span><b>{selectedQuote.customer?.name ?? "Guest"}</b></div>
                <div className="line"><span>Phone</span><b>{selectedQuote.customer?.phone ?? "-"}</b></div>
                <div className="line"><span>Services completed</span><b>{selectedQuote.customer?.serviceCount ?? 0}</b></div>
                <div className="line"><span>Service amount</span><b>{selectedQuote.customer ? formatNaira(selectedQuote.customer.serviceAmount) : "-"}</b></div>
                <div className="line"><span>Credit balance</span><b>{selectedQuote.customer ? formatNaira(selectedQuote.customer.creditBalance) : "-"}</b></div>
                <div className="line"><span>Referral credit</span><b>{selectedQuote.customer ? formatNaira(selectedQuote.customer.referralCredit) : "-"}</b></div>
                <div className="line"><span>Credit score</span><b>{selectedQuote.customer?.creditScore ?? "-"}</b></div>
              </div>

              <div className="card">
                <h3>Quote breakdown</h3>
                <div className="line"><span>Gross revenue</span><b>{formatNaira(selectedQuote.grossTotal)}</b></div>
                <div className="line"><span>Direct discount</span><b>{formatNaira(selectedQuote.directDiscount)}</b></div>
                <div className="line"><span>Coupon discount</span><b>{formatNaira(selectedQuote.couponDiscount)}</b></div>
                <div className="line"><span>Payable</span><b>{formatNaira(selectedQuote.payableTotal)}</b></div>
                <div className="line"><span>Direct cost</span><b>{formatNaira(selectedQuote.directCost)}</b></div>
                <div className="line"><span>Net profit</span><b>{formatNaira(selectedQuote.netProfit)}</b></div>
                <div className="line"><span>Affiliate commission</span><b>{formatNaira(selectedQuote.commissionEarned)}</b></div>
              </div>

              <div className="card">
                <h3>Services & transaction activity</h3>
                <div style={{ overflowX: "auto" }}>
                  <table className="admin-table">
                    <thead>
                      <tr><th>Service</th><th>Unit price</th><th>Quantity</th><th>Amount</th><th>Status</th><th>Entered / completed</th><th>Carry-forward</th><th>Payment</th></tr>
                    </thead>
                    <tbody>
                      {selectedQuote.items.map((item) => (
                        <tr key={item.id}>
                          <td>{item.name}</td>
                          <td>{formatNaira(item.unitPrice)}</td>
                          <td>{item.quantity} {item.unit}</td>
                          <td>{formatNaira(item.lineTotal)}</td>
                          <td>{item.status}</td>
                          <td>{formatDateTime(item.createdAt)}<br />{item.completedAt ? formatDateTime(item.completedAt) : "Not completed"}</td>
                          <td>{item.carryoverDate ?? "-"}</td>
                          <td>
                            <div>{item.paymentChannels.length ? item.paymentChannels.join(", ") : "-"}</div>
                            <small>Cash {formatNaira(item.cashAmount)}</small><br />
                            <small>Transfer {formatNaira(item.transferAmount)}</small><br />
                            <small>Redemption {formatNaira(item.redemptionAmount)}</small>
                          </td>
                        </tr>
                      ))}
                      {selectedQuote.items.length === 0 ? <tr><td className="empty" colSpan={8}>No service items recorded.</td></tr> : null}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
