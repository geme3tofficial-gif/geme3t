"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { formatNaira } from "@/lib/domain/digital-service/format";
import { calculateQuote } from "@/lib/domain/digital-service/calculations";
import {
  createSale,
  createSaleCustomer,
} from "@/app/(digital-service)/digital-service/sales/actions";

type CatalogService = { id: string; name: string; unit: string; price: string };
type CatalogCategory = { id: string; name: string; services: CatalogService[] };
type Customer = {
  id: string;
  name: string;
  phone: string;
  serviceCount: number;
  couponCode?: string;
};
type Coupon = {
  id: string;
  code: string;
  customerPct: string;
  customerDirect: string;
  referralOnly: boolean;
};
type SelectedItem = CatalogService & { quantity: number };

export function SalesWizard({
  categories,
  customers,
  coupons,
  customerCreditPct,
}: {
  categories: CatalogCategory[];
  customers: Customer[];
  coupons: Coupon[];
  customerCreditPct: number;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [view, setView] = useState<"customer" | "admin">("customer");
  const [selected, setSelected] = useState<SelectedItem[]>([]);
  const [customerList, setCustomerList] = useState(customers);
  const [couponList] = useState(coupons);
  const [customerId, setCustomerId] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponMode, setCouponMode] = useState<"void" | "retain">("void");
  const [directDiscount, setDirectDiscount] = useState(0);
  const [manualCustomerPct, setManualCustomerPct] = useState(0);
  const [directCost, setDirectCost] = useState(0);
  const [status, setStatus] = useState<"PENDING" | "COMPLETED">("PENDING");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const selectedCustomer = customerList.find((customer) => customer.id === customerId);
  const activeCoupon =
    couponCode.trim()
      ? couponList.find((coupon) => coupon.code.toUpperCase() === couponCode.trim().toUpperCase()) ?? null
      : null;
  const couponDisabled = Boolean(selectedCustomer?.serviceCount);

  const gross = useMemo(
    () => selected.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0),
    [selected],
  );
  const calculation = calculateQuote({
    grossTotal: gross,
    directDiscount,
    customerDiscountPct: manualCustomerPct,
    couponDirectDiscount:
      couponMode === "retain" && activeCoupon && !couponDisabled
        ? Number(activeCoupon.customerDirect)
        : 0,
    couponDiscountPct:
      couponMode === "retain" && activeCoupon && !couponDisabled
        ? Number(activeCoupon.customerPct)
        : 0,
    directCost,
  });

  function openModal() {
    setSelected([]);
    setCustomerId("");
    setCustomerSearch("");
    setCouponCode("");
    setCouponMode("void");
    setDirectDiscount(0);
    setManualCustomerPct(0);
    setDirectCost(0);
    setStatus("PENDING");
    setView("customer");
    setStep(1);
    setSearch("");
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
  }

  function changeQuantity(service: CatalogService, change: number) {
    setSelected((current) => {
      const existing = current.find((item) => item.id === service.id);
      if (existing) {
        const quantity = Math.max(0, existing.quantity + change);
        return quantity === 0
          ? current.filter((item) => item.id !== service.id)
          : current.map((item) => item.id === service.id ? { ...item, quantity } : item);
      }
      return change > 0 ? [...current, { ...service, quantity: 1 }] : current;
    });
  }

  function removeSelected(serviceId: string) {
    setSelected((current) => current.filter((item) => item.id !== serviceId));
  }

  async function saveNewCustomer() {
    try {
      const customer = await createSaleCustomer({
        name: newCustomerName,
        phone: newCustomerPhone,
      });
      setCustomerList((current) => [...current, customer]);
      setCustomerId(customer.id);
      setCustomerSearch(`${customer.name} · ${customer.phone}`);
      setNewCustomerName("");
      setNewCustomerPhone("");
      toast.success("Customer saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save customer.");
    }
  }

  async function submitSale() {
    try {
      await createSale({
        customerId: customerId || null,
        couponId:
          couponMode === "retain" && activeCoupon && !couponDisabled
            ? activeCoupon.id
            : null,
        directDiscount,
        customerDiscountPct: manualCustomerPct,
        directCost,
        status,
        items: selected.map((item) => ({
          serviceId: item.id,
          name: item.name,
          unit: item.unit,
          unitPrice: Number(item.price),
          quantity: item.quantity,
        })),
      });
      setOpen(false);
      setSelected([]);
      toast.success("Quote saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save sale.");
    }
  }

  function nextStep() {
    if (step === 1) {
      if (!selected.length) {
        toast.error("Select at least one service.");
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      setStep(3);
      return;
    }
    void submitSale();
  }

  const customerMatches = customerSearch.trim()
    ? customerList
        .filter((customer) =>
          `${customer.name} ${customer.phone}`
            .toLowerCase()
            .includes(customerSearch.trim().toLowerCase()),
        )
        .slice(0, 6)
    : [];

  const projectedCredit = selectedCustomer
    ? calculation.netProfit * Math.max(0, Math.min(100, customerCreditPct)) / 100
    : 0;
  const couponStatus =
    couponDisabled
      ? "Coupon disabled for saved/returning customers"
      : !couponCode.trim()
        ? "Optional coupon not applied"
        : activeCoupon
          ? couponMode === "void"
            ? "Coupon voided · benefits not retained"
            : `Valid coupon · ${activeCoupon.referralOnly ? "Referral" : "Custom"}`
          : "Coupon not found";

  return (
    <>
      <section className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div>
            <h2>New Sale</h2>
            <p style={{ color: "var(--muted)", margin: 0 }}>Select services, add a customer, and review the customer/admin breakdown.</p>
          </div>
          <button className="btn btn-primary" type="button" onClick={openModal}>Create New Sale</button>
        </div>
      </section>

      {open ? (
        <div
          className="modal-overlay open"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div className="quote-modal" role="dialog" aria-modal="true" aria-label="New service quote">
            <div className="modal-head">
              <div className="modal-title-row">
                <h2>New Service Quote</h2>
                <button className="btn btn-gray" type="button" onClick={closeModal}>Close</button>
              </div>
              <div className="modal-progress">
                {[1, 2, 3].map((number) => (
                  <div
                    className={`modal-step ${number === step ? "active" : ""} ${number < step ? "done" : ""}`}
                    key={number}
                  >
                    {number}. {number === 1 ? "Services" : number === 2 ? "Customer" : "Breakdown"}
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-body">
              {step === 1 ? (
                <section className="modal-pane active">
                  <div className="topbar"><h2>Select Services</h2></div>
                  <input
                    className="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search categories or services"
                  />
                  {categories.map((category) => {
                    const services = category.services.filter((service) =>
                      !search ||
                      `${category.name} ${service.name} ${service.unit}`
                        .toLowerCase()
                        .includes(search.toLowerCase()),
                    );
                    if (!services.length) return null;
                    return (
                      <div className="category" key={category.id}>
                        <div className="category-head"><h3>{category.name}</h3></div>
                        <div className="service-card-grid">
                          {services.map((service) => {
                            const selectedItem = selected.find((item) => item.id === service.id);
                            const quantity = selectedItem?.quantity ?? 0;
                            return (
                              <div className={`service-card ${quantity > 0 ? "selected" : ""}`} key={service.id}>
                                {quantity > 0 ? (
                                  <button
                                    className="btn btn-danger"
                                    type="button"
                                    style={{ float: "right", padding: "3px 7px" }}
                                    onClick={() => removeSelected(service.id)}
                                  >
                                    ×
                                  </button>
                                ) : null}
                                <div className="service-card-name">{service.name}</div>
                                <div className="service-card-price">{formatNaira(service.price)} / {service.unit}</div>
                                <div className="counter">
                                  <button className="btn btn-gray" type="button" onClick={() => changeQuantity(service, -1)}>−</button>
                                  <div className="counter-value">{quantity}</div>
                                  <button className="btn btn-primary" type="button" onClick={() => changeQuantity(service, 1)}>+</button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </section>
              ) : null}

              {step === 2 ? (
                <section className="modal-pane active">
                  <h2>Customer & Selected Services</h2>
                  <div className="card">
                    <div className="grid-3">
                      <div className="field">
                        <label>Search Customer</label>
                        <input value={customerSearch} onChange={(event) => setCustomerSearch(event.target.value)} placeholder="Name or phone" />
                        {customerMatches.length ? (
                          <div>
                            {customerMatches.map((customer) => (
                              <button
                                className="btn btn-gray"
                                type="button"
                                style={{ margin: "4px 4px 0 0" }}
                                onClick={() => {
                                  setCustomerId(customer.id);
                                  setCustomerSearch(`${customer.name} · ${customer.phone}`);
                                  if (customer.serviceCount > 0) setCouponCode("");
                                }}
                                key={customer.id}
                              >
                                {customer.name} · {customer.phone}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <div className="field">
                        <label>New Customer Name</label>
                        <input value={newCustomerName} onChange={(event) => setNewCustomerName(event.target.value)} />
                      </div>
                      <div className="field">
                        <label>New Customer Phone</label>
                        <input value={newCustomerPhone} onChange={(event) => setNewCustomerPhone(event.target.value)} />
                      </div>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <button className="btn btn-primary" type="button" onClick={saveNewCustomer}>Save New Customer</button>
                    </div>
                  </div>
                  <div className="card">
                    <h3>Previously Selected Services</h3>
                    {selected.length ? selected.map((item) => (
                      <div className="service-row" style={{ gridTemplateColumns: "minmax(160px,1fr) 80px 90px" }} key={item.id}>
                        <div><strong>{item.name}</strong><br /><small>{formatNaira(item.price)} / {item.unit}</small></div>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(event) =>
                            setSelected((current) =>
                              current.map((currentItem) =>
                                currentItem.id === item.id
                                  ? { ...currentItem, quantity: Math.max(1, Number(event.target.value) || 1) }
                                  : currentItem,
                              ),
                            )
                          }
                        />
                        <button className="btn btn-danger" type="button" onClick={() => removeSelected(item.id)}>Remove</button>
                      </div>
                    )) : <div className="empty">No services selected.</div>}
                  </div>
                </section>
              ) : null}

              {step === 3 ? (
                <section className="modal-pane active">
                  <div className="tabs">
                    <button className={`tab ${view === "customer" ? "active" : ""}`} type="button" onClick={() => setView("customer")}>Customer Breakdown</button>
                    <button className={`tab ${view === "admin" ? "active" : ""}`} type="button" onClick={() => setView("admin")}>Admin Breakdown</button>
                  </div>
                  <div className="card">
                    <div className="grid-3">
                      <div className="field">
                        <label>Optional Coupon Code</label>
                        <input
                          value={couponCode}
                          disabled={couponDisabled}
                          onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
                          placeholder="Coupon / affiliate code"
                        />
                        <small style={{ color: activeCoupon ? "#15803d" : "var(--muted)" }}>{couponStatus}</small>
                      </div>
                      <div className="field">
                        <label>Coupon Mode</label>
                        <select value={couponMode} disabled={couponDisabled} onChange={(event) => setCouponMode(event.target.value as "void" | "retain")}>
                          <option value="void">Void coupon / no benefit</option>
                          <option value="retain">Retain coupon benefits</option>
                        </select>
                      </div>
                      <div className="field">
                        <label>Direct Discount (₦)</label>
                        <input type="number" min="0" value={directDiscount} onChange={(event) => setDirectDiscount(Math.max(0, Number(event.target.value) || 0))} />
                      </div>
                    </div>
                    <div className="grid-3" style={{ marginTop: 10 }}>
                      <div className="field">
                        <label>Customer Discount (%)</label>
                        <input type="number" min="0" max="100" value={manualCustomerPct} onChange={(event) => setManualCustomerPct(Math.max(0, Math.min(100, Number(event.target.value) || 0)))} />
                      </div>
                      <div className="field">
                        <label>Service Status</label>
                        <select value={status} onChange={(event) => setStatus(event.target.value as "PENDING" | "COMPLETED")}>
                          <option value="PENDING">Pending</option>
                          <option value="COMPLETED">Completed</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {view === "customer" ? (
                    <div className="card">
                      <h2>Customer Breakdown</h2>
                      {selectedCustomer ? (
                        <div className="card" style={{ marginBottom: 10 }}>
                          <div className="line"><span>Customer</span><b>{selectedCustomer.name}</b></div>
                          <div className="line"><span>Phone</span><b>{selectedCustomer.phone}</b></div>
                          <div className="line"><span>Credit Coupon</span><b>{selectedCustomer.couponCode ?? "-"}</b></div>
                          <div className="line"><span>Projected Credit ({customerCreditPct}% of net profit)</span><b>{formatNaira(projectedCredit)}</b></div>
                        </div>
                      ) : <div className="empty" style={{ padding: 8 }}>No customer selected. Select or save a customer.</div>}
                      {selected.map((item) => {
                        const original = Number(item.price) * item.quantity;
                        const discountForItem = gross ? calculation.discount * original / gross : 0;
                        const discounted = Math.max(0, original - discountForItem);
                        return (
                          <div className="line" key={item.id}>
                            <span>{item.name} × {item.quantity}</span>
                            <b>{calculation.discount > 0 ? <><span className="original">{formatNaira(original)}</span><span className="billable">{formatNaira(discounted)}</span></> : formatNaira(original)}</b>
                          </div>
                        );
                      })}
                      <div className="line"><span>Gross</span><b>{formatNaira(calculation.gross)}</b></div>
                      <div className="line"><span>Total Discount</span><b>{formatNaira(calculation.discount)}</b></div>
                      <div className="line"><span><strong>Total Payable</strong></span><b>{formatNaira(calculation.payable)}</b></div>
                    </div>
                  ) : (
                    <div className="card">
                      <h2>Admin Breakdown</h2>
                      <div className="grid-3">
                        <div className="field"><label>Direct Cost (₦)</label><input type="number" min="0" value={directCost} onChange={(event) => setDirectCost(Math.max(0, Number(event.target.value) || 0))} /></div>
                        <div className="field"><label>Affiliate %</label><input type="number" min="0" max="100" value={activeCoupon ? activeCoupon.customerPct : 0} readOnly /></div>
                        <div className="field"><label>Direct Coupon Discount (₦)</label><input type="number" min="0" value={activeCoupon ? activeCoupon.customerDirect : 0} readOnly /></div>
                      </div>
                      <div className="line" style={{ marginTop: 10 }}><span>Gross Revenue</span><b>{formatNaira(calculation.gross)}</b></div>
                      <div className="line"><span>Direct Discount</span><b>{formatNaira(calculation.directDiscount)}</b></div>
                      <div className="line"><span>Coupon Discount</span><b>{formatNaira(calculation.couponDiscount)}</b></div>
                      <div className="line"><span>Payable</span><b>{formatNaira(calculation.payable)}</b></div>
                      <div className="line"><span>Direct Cost</span><b>{formatNaira(calculation.directCost)}</b></div>
                      <div className="line"><span>Qualifying Profit</span><b>{formatNaira(calculation.netProfit)}</b></div>
                      <div className="line"><span><strong>Net Profit</strong></span><b>{formatNaira(calculation.netProfit)}</b></div>
                    </div>
                  )}
                </section>
              ) : null}
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-gray"
                type="button"
                onClick={() => setStep((current) => Math.max(1, current - 1))}
                style={{ visibility: step === 1 ? "hidden" : "visible" }}
              >
                Back
              </button>
              <div className="modal-footer-right">
                <button className="btn btn-gray" type="button" onClick={closeModal}>Cancel</button>
                <button className="btn btn-primary" type="button" onClick={nextStep}>
                  {step === 1 ? "Next: Customer" : step === 2 ? "Next: Breakdown" : "Finish & Save Quote"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
