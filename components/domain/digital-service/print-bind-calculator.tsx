"use client";

import { useMemo, useState } from "react";
import { formatNaira } from "@/lib/domain/digital-service/format";

export function PrintBindCalculator() {
  const [bwPrice, setBwPrice] = useState(100);
  const [colourPrice, setColourPrice] = useState(200);
  const [photocopyPrice, setPhotocopyPrice] = useState(50);
  const [bindingPrice, setBindingPrice] = useState(700);
  const [bwPages, setBwPages] = useState(0);
  const [colourPages, setColourPages] = useState(0);
  const [photocopyPages, setPhotocopyPages] = useState(0);
  const [bindingCopies, setBindingCopies] = useState(0);
  const [copies, setCopies] = useState(1);
  const [directCost, setDirectCost] = useState(0);
  const [affiliatePct, setAffiliatePct] = useState(0);
  const [customerDiscountPct, setCustomerDiscountPct] = useState(0);

  const result = useMemo(() => {
    const gross =
      (bwPages * bwPrice + colourPages * colourPrice) * copies +
      photocopyPages * photocopyPrice +
      bindingCopies * bindingPrice;
    const customerDiscount = gross * Math.max(0, Math.min(100, customerDiscountPct)) / 100;
    const payable = Math.max(0, gross - customerDiscount);
    const qualifyingProfit = Math.max(0, payable - directCost);
    const payoutCap = qualifyingProfit * 0.4;
    const affiliatePayout = Math.min(payoutCap, qualifyingProfit * Math.max(0, affiliatePct) / 100);
    const netProfit = Math.max(0, qualifyingProfit - affiliatePayout);
    return { gross, customerDiscount, payable, qualifyingProfit, affiliatePayout, netProfit };
  }, [bwPrice, colourPrice, photocopyPrice, bindingPrice, bwPages, colourPages, photocopyPages, bindingCopies, copies, directCost, affiliatePct, customerDiscountPct]);

  return (
    <section className="dashboard-panel">
      <div className="admin-edit-form">
        <label><span>B&W page price</span><input type="number" min="0" value={bwPrice} onChange={(event)=>setBwPrice(Math.max(0,Number(event.target.value)||0))} /></label>
        <label><span>Colour page price</span><input type="number" min="0" value={colourPrice} onChange={(event)=>setColourPrice(Math.max(0,Number(event.target.value)||0))} /></label>
        <label><span>Photocopy price</span><input type="number" min="0" value={photocopyPrice} onChange={(event)=>setPhotocopyPrice(Math.max(0,Number(event.target.value)||0))} /></label>
        <label><span>Binding price</span><input type="number" min="0" value={bindingPrice} onChange={(event)=>setBindingPrice(Math.max(0,Number(event.target.value)||0))} /></label>
        <label><span>B&W pages</span><input type="number" min="0" value={bwPages} onChange={(event)=>setBwPages(Math.max(0,Number(event.target.value)||0))} /></label>
        <label><span>Colour pages</span><input type="number" min="0" value={colourPages} onChange={(event)=>setColourPages(Math.max(0,Number(event.target.value)||0))} /></label>
        <label><span>Copies</span><input type="number" min="1" value={copies} onChange={(event)=>setCopies(Math.max(1,Number(event.target.value)||1))} /></label>
        <label><span>Photocopy pages</span><input type="number" min="0" value={photocopyPages} onChange={(event)=>setPhotocopyPages(Math.max(0,Number(event.target.value)||0))} /></label>
        <label><span>Binding copies</span><input type="number" min="0" value={bindingCopies} onChange={(event)=>setBindingCopies(Math.max(0,Number(event.target.value)||0))} /></label>
        <label><span>Direct cost</span><input type="number" min="0" value={directCost} onChange={(event)=>setDirectCost(Math.max(0,Number(event.target.value)||0))} /></label>
        <label><span>Affiliate payout %</span><input type="number" min="0" max="100" value={affiliatePct} onChange={(event)=>setAffiliatePct(Math.max(0,Number(event.target.value)||0))} /></label>
        <label><span>Customer discount %</span><input type="number" min="0" max="100" value={customerDiscountPct} onChange={(event)=>setCustomerDiscountPct(Math.max(0,Number(event.target.value)||0))} /></label>
      </div>
      <div className="dashboard-grid" style={{ marginTop:16 }}>
        <section className="dashboard-panel"><h2>Gross</h2><p className="admin-dashboard-count">{formatNaira(result.gross)}</p></section>
        <section className="dashboard-panel"><h2>Payable</h2><p className="admin-dashboard-count">{formatNaira(result.payable)}</p></section>
        <section className="dashboard-panel"><h2>Affiliate payout</h2><p className="admin-dashboard-count">{formatNaira(result.affiliatePayout)}</p></section>
        <section className="dashboard-panel"><h2>Net profit</h2><p className="admin-dashboard-count">{formatNaira(result.netProfit)}</p></section>
      </div>
      <button className="button" type="button" style={{ marginTop:16 }} onClick={()=>window.print()}>Print quotation</button>
    </section>
  );
}
