"use client";

import { useEffect, useState } from "react";
import { deleteCoupon, saveCoupon } from "@/app/(digital-service)/digital-service/coupons/actions";

type AffiliateOption = {
  id: string;
  name: string;
  active: boolean;
};

type Coupon = {
  id: string;
  code: string;
  tier: string;
  customerPct: string;
  customerDirect: string;
  affiliatePct: string;
  affiliateId: string | null;
  redemptionThreshold: number;
  referralOnly: boolean;
};

export function CouponActions({
  coupon,
  affiliates,
}: {
  coupon: Coupon;
  affiliates: AffiliateOption[];
}) {
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!editing) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setEditing(false);
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [editing]);

  async function save(formData: FormData) {
    await saveCoupon(formData);
    setEditing(false);
  }

  return (
    <>
      <button
        className="button button--small button--light"
        type="button"
        onClick={() => setEditing(true)}
      >
        Edit
      </button>
      <form action={deleteCoupon} style={{ marginTop: 8 }}>
        <input type="hidden" name="id" value={coupon.id} />
        <button
          className="button button--small"
          style={{ background: "#dc2626", color: "#fff" }}
          type="submit"
        >
          Delete
        </button>
      </form>

      {editing ? (
        <div
          className="modal-overlay open digital-service-coupon-modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setEditing(false);
          }}
        >
          <div
            className="quote-modal digital-service-coupon-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`edit-coupon-${coupon.id}`}
          >
            <div className="modal-head">
              <div className="modal-title-row">
                <h2 id={`edit-coupon-${coupon.id}`}>Edit coupon</h2>
                <button
                  className="btn btn-gray"
                  type="button"
                  onClick={() => setEditing(false)}
                >
                  Close
                </button>
              </div>
            </div>
            <form action={save} className="digital-service-coupon-edit-form">
              <input type="hidden" name="id" value={coupon.id} />
              <label><span>Code</span><input name="code" defaultValue={coupon.code} required /></label>
              <label><span>Tier</span><input name="tier" defaultValue={coupon.tier} /></label>
              <label><span>Customer %</span><input name="customerPct" type="number" min="0" max="100" step="0.01" defaultValue={coupon.customerPct} required /></label>
              <label><span>Direct discount</span><input name="customerDirect" type="number" min="0" step="0.01" defaultValue={coupon.customerDirect} required /></label>
              <label><span>Commission %</span><input name="affiliatePct" type="number" min="0" max="100" step="0.01" defaultValue={coupon.affiliatePct} required /></label>
              <label>
                <span>Affiliate</span>
                <select name="affiliateId" defaultValue={coupon.affiliateId ?? ""}>
                  <option value="">None</option>
                  {affiliates.map((affiliate) => (
                    <option value={affiliate.id} key={affiliate.id}>
                      {affiliate.name}{affiliate.active ? "" : " (inactive)"}
                    </option>
                  ))}
                </select>
              </label>
              <label><span>Redemption threshold</span><input name="redemptionThreshold" type="number" min="1" defaultValue={coupon.redemptionThreshold} required /></label>
              <label className="digital-service-checkbox-label"><input name="referralOnly" type="checkbox" defaultChecked={coupon.referralOnly} /> Referral only</label>
              <div className="digital-service-coupon-modal-actions">
                <button className="button button--small" type="submit">Save changes</button>
                <button className="button button--small button--light" type="button" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
