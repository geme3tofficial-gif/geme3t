"use client";

import { useId, useRef, useState, useSyncExternalStore } from "react";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createCustomerPerformanceLink,
  revokeCustomerPerformanceLink,
} from "@/app/(digital-service)/digital-service/customers/actions";

const subscribeToOrigin = () => () => {};
const getOrigin = () => window.location.origin;
const getServerOrigin = () => "";

export function CustomerPerformanceLink({
  customerId,
  customerName,
  customerPhone,
  hasExistingLink,
  initialToken,
}: {
  customerId: string;
  customerName: string;
  customerPhone: string;
  hasExistingLink: boolean;
  initialToken: string | null;
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const origin = useSyncExternalStore(subscribeToOrigin, getOrigin, getServerOrigin);
  const [token, setToken] = useState(initialToken ?? "");
  const [isLoading, setIsLoading] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [hasActiveLink, setHasActiveLink] = useState(hasExistingLink);
  const link = token && origin ? `${origin}/customer/performance/${token}` : "";

  async function createOrRotateLink() {
    if (isLoading) return;
    if (
      (hasActiveLink || link) &&
      !window.confirm("Regenerating this link immediately disables the customer's current private page link. Continue?")
    ) return;
    setIsLoading(true);
    try {
      const token = await createCustomerPerformanceLink(customerId);
      const shareUrl = `${window.location.origin}/customer/performance/${token}`;
      setToken(token);
      setHasActiveLink(true);
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopyFailed(false);
        toast.success("Public customer tracking link copied.");
      } catch {
        setCopyFailed(true);
        toast.error("The link was created, but could not be copied. Copy or share it below.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create the private customer link.");
    } finally {
      setIsLoading(false);
    }
  }

  async function revokeLink() {
    if (
      isLoading ||
      !window.confirm("Revoking this link immediately prevents anyone from using it. Continue?")
    ) return;
    setIsLoading(true);
    try {
      await revokeCustomerPerformanceLink(customerId);
      setToken("");
      setHasActiveLink(false);
      toast.success("Customer tracking link revoked.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not revoke the customer tracking link.");
    } finally {
      setIsLoading(false);
    }
  }

  async function copyLink() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopyFailed(false);
      toast.success("Public customer tracking link copied.");
    } catch {
      setCopyFailed(true);
      toast.error("Could not copy the link. Select and copy the text instead.");
    }
  }

  async function shareLink() {
    if (!link) return;
    if (!navigator.share) {
      await copyLink();
      return;
    }
    try {
      await navigator.share({
        title: "Your GEME3T coupon and rewards dashboard",
        text: `Track your coupon use, commissions, and rewards here:`,
        url: link,
      });
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        toast.error("Could not open the share menu. Copy the link instead.");
      }
    }
  }

  const phoneNumber = parsePhoneNumberFromString(customerPhone, "NG");
  const whatsappUrl = link && phoneNumber?.isValid()
    ? `https://wa.me/${phoneNumber.number.replace(/\D/g, "")}?text=${encodeURIComponent(
        `Hi ${customerName}, track your GEME3T coupon use and rewards here: ${link}`,
      )}`
    : null;

  return (
    <div className="customer-performance-link">
      <button
        aria-haspopup="dialog"
        className="button button--small"
        onClick={() => dialogRef.current?.showModal()}
        type="button"
      >
        {hasActiveLink || link ? "Manage performance link" : "Create performance link"}
      </button>
      <dialog
        aria-labelledby={titleId}
        className="cohort-edit-dialog customer-performance-link-dialog"
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
        ref={dialogRef}
      >
        <div className="cohort-edit-dialog-panel">
          <header className="cohort-edit-dialog-header">
            <div>
              <span>Customer performance</span>
              <h2 id={titleId}>{customerName}</h2>
            </div>
            <button
              aria-label="Close customer performance link"
              className="cohort-edit-dialog-close"
              onClick={() => dialogRef.current?.close()}
              type="button"
            >
              <span aria-hidden="true">×</span>
            </button>
          </header>
          <div className="cohort-edit-dialog-content customer-performance-link-dialog-content">
            {link ? (
              <div className="customer-performance-link-result">
                <label>
                  <span>Public tracking link</span>
                  <input aria-label="Public customer performance page link" readOnly value={link} />
                </label>
                <div className="customer-performance-link-actions">
                  <button className="button button--small" onClick={() => void copyLink()} type="button">
                    Copy link
                  </button>
                  <button className="button button--small button--light" onClick={() => void shareLink()} type="button">
                    Share
                  </button>
                  {whatsappUrl ? (
                    <a className="button button--small button--light" href={whatsappUrl} rel="noreferrer" target="_blank">
                      Send WhatsApp
                    </a>
                  ) : null}
                </div>
                {copyFailed ? <small role="status">Copy the link above and send it to the customer.</small> : null}
              </div>
            ) : hasActiveLink ? (
              <p className="customer-performance-link-status">
                This older link cannot be displayed. Regenerate it to create a copyable link; the old link will stop working.
              </p>
            ) : (
              <p className="customer-performance-link-status">
                Create a public tracking link to share this customer&apos;s coupon and rewards dashboard.
              </p>
            )}
            <div className="customer-performance-link-dialog-actions">
              <button
                className="button button--small"
                disabled={isLoading}
                onClick={() => void createOrRotateLink()}
                type="button"
              >
                {isLoading
                  ? "Updating link..."
                  : hasActiveLink || link
                    ? "Regenerate public link"
                    : "Create public link"}
              </button>
              {hasActiveLink || link ? (
                <button
                  className="button button--small button--light"
                  disabled={isLoading}
                  onClick={() => void revokeLink()}
                  type="button"
                >
                  Revoke link
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </dialog>
    </div>
  );
}
