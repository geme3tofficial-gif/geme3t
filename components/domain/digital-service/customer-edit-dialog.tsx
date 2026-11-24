"use client";

import { useId, useRef } from "react";
import { saveCustomer } from "@/app/(digital-service)/digital-service/customers/actions";

export function CustomerEditDialog({
  customerId,
  customerName,
  customerPhone,
  commissionPct,
}: {
  customerId: string;
  customerName: string;
  customerPhone: string;
  commissionPct: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  async function save(formData: FormData) {
    await saveCustomer(formData);
    dialogRef.current?.close();
  }

  return (
    <>
      <button
        aria-haspopup="dialog"
        className="button button--small button--light"
        onClick={() => dialogRef.current?.showModal()}
        type="button"
      >
        Edit
      </button>
      <dialog
        aria-labelledby={titleId}
        className="cohort-edit-dialog customer-edit-dialog"
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
        ref={dialogRef}
      >
        <div className="cohort-edit-dialog-panel">
          <header className="cohort-edit-dialog-header">
            <div>
              <span>Edit customer</span>
              <h2 id={titleId}>{customerName}</h2>
            </div>
            <button
              aria-label="Close customer editor"
              className="cohort-edit-dialog-close"
              onClick={() => dialogRef.current?.close()}
              type="button"
            >
              <span aria-hidden="true">×</span>
            </button>
          </header>
          <div className="cohort-edit-dialog-content">
            <form action={save} className="admin-edit-form">
              <input name="id" type="hidden" value={customerId} />
              <label>
                <span>Name</span>
                <input defaultValue={customerName} name="name" required />
              </label>
              <label>
                <span>Phone</span>
                <input defaultValue={customerPhone} name="phone" required />
              </label>
              <label>
                <span>Coupon commission %</span>
                <input
                  defaultValue={commissionPct}
                  max="100"
                  min="0"
                  name="commissionPct"
                  required
                  step="0.01"
                  type="number"
                />
              </label>
              <div className="customer-edit-dialog-actions">
                <button
                  className="button button--small button--light"
                  onClick={() => dialogRef.current?.close()}
                  type="button"
                >
                  Cancel
                </button>
                <button className="button button--small" type="submit">
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </dialog>
    </>
  );
}
