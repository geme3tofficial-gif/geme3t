"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  ["Dashboard", "/digital-service", "dashboard"],
  ["New Sales", "/digital-service/sales", "sales"],
  ["Sales Reports", "/digital-service/sales-reports", "reports"],
  ["Services", "/digital-service/services", "services"],
  ["Customers", "/digital-service/customers", "customers"],
  ["Coupons", "/digital-service/coupons", "coupons"],
  ["Affiliates", "/digital-service/affiliates", "affiliates"],
  ["Income & Expenses", "/digital-service/finance", "finance"],
];

export function DigitalServiceNavigation() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);

  function isActive(href: string) {
    return href === "/digital-service"
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);
  }

  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow = document.body.style.overflow;
    const menuButton = menuButtonRef.current;
    document.body.style.overflow = "hidden";
    const focusable = () =>
      sidebarRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? [];
    focusable()[0]?.focus();

    function handleMenuKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const elements = focusable();
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    function closeOnNavigation() {
      setMenuOpen(false);
    }

    function closeOnDesktopResize() {
      if (window.innerWidth > 800) setMenuOpen(false);
    }

    window.addEventListener("keydown", handleMenuKeyDown);
    window.addEventListener("popstate", closeOnNavigation);
    window.addEventListener("resize", closeOnDesktopResize);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleMenuKeyDown);
      window.removeEventListener("popstate", closeOnNavigation);
      window.removeEventListener("resize", closeOnDesktopResize);
      if (window.innerWidth <= 800) menuButton?.focus();
    };
  }, [menuOpen]);

  return (
    <>
      <header className="digital-service-mobile-header">
        <div className="digital-service-mobile-brand">GEME3T Admin</div>
        <button
          aria-controls="digital-service-navigation"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          className="digital-service-menu-toggle"
          onClick={() => setMenuOpen((open) => !open)}
          ref={menuButtonRef}
          type="button"
        >
          <span aria-hidden="true" className="digital-service-menu-icon">
            <span />
            <span />
            <span />
          </span>
        </button>
      </header>
      {menuOpen && (
        <button
          aria-label="Close navigation"
          className="digital-service-sidebar-backdrop"
          onClick={() => setMenuOpen(false)}
          type="button"
        />
      )}
      <aside
        className={`digital-service-sidebar${menuOpen ? " is-open" : ""}`}
        id="digital-service-navigation"
        ref={sidebarRef}
      >
        <div className="digital-service-sidebar-heading">
          <div className="digital-service-brand">GEME3T Admin</div>
          <button
            aria-label="Close navigation"
            className="digital-service-sidebar-close"
            onClick={() => setMenuOpen(false)}
            type="button"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <nav className="digital-service-nav" aria-label="Digital services">
          {links.map(([label, href]) => (
            <Link
              aria-current={isActive(href) ? "page" : undefined}
              className={isActive(href) ? "active" : ""}
              href={href}
              key={href}
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
