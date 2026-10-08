"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const links = [
  { href: "/courses", label: "Courses" },
  { href: "/school", label: "Schools" },
  { href: "/about-us", label: "About us" },
  { href: "/contact", label: "Contact" },
];

export function MobileSiteNav() {
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        menuButtonRef.current?.focus();
        return;
      }

      if (event.key === "Tab") {
        const drawer = document.getElementById("mobile-site-drawer");
        const focusable = drawer?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled])',
        );
        const first = focusable?.item(0);
        const last = focusable?.item((focusable?.length ?? 1) - 1);

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function closeMenu() {
    setOpen(false);
    menuButtonRef.current?.focus();
  }

  return (
    <>
      <button
        aria-controls="mobile-site-drawer"
        aria-expanded={open}
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        className="mobile-nav-toggle"
        onClick={() => setOpen((current) => !current)}
        ref={menuButtonRef}
        type="button"
      >
        <span aria-hidden="true">{open ? "×" : "☰"}</span>
      </button>
      {open && (
        <div className="mobile-nav-layer">
          <button
            aria-label="Close navigation menu"
            className="mobile-nav-backdrop"
            onClick={closeMenu}
            tabIndex={-1}
            type="button"
          />
          <nav
            aria-label="Mobile navigation"
            aria-modal="true"
            className="mobile-nav-drawer"
            id="mobile-site-drawer"
            role="dialog"
          >
            <div className="mobile-nav-drawer-heading">
              <div>
                <span className="eyebrow">Explore GEME3T</span>
                <h2>Where would you like to go?</h2>
              </div>
              <button
                aria-label="Close navigation menu"
                className="mobile-nav-close"
                onClick={closeMenu}
                ref={closeButtonRef}
                type="button"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <div className="mobile-nav-drawer-links">
              {links.map((link) => (
                <Link href={link.href} key={link.href} onClick={closeMenu}>
                  {link.label}
                  <span aria-hidden="true">→</span>
                </Link>
              ))}
            </div>
            <div className="mobile-nav-drawer-actions">
              <Link
                className="button button--pulse"
                href="/apply"
                onClick={closeMenu}
              >
                Join Campus Tech Bootcamp <span aria-hidden="true">→</span>
              </Link>
              <Link
                className="mobile-nav-student-link"
                href="/dashboard"
                onClick={closeMenu}
              >
                Student portal <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
