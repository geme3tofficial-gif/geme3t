"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brand } from "./brand";

export type DashboardRole = "Student" | "Administrator" | "Teacher";

type NavigationItem = {
  href: string;
  icon: string;
  label: string;
};

const navigation: Record<DashboardRole, NavigationItem[]> = {
  Student: [
    { href: "/dashboard", icon: "⌂", label: "Overview" },
    { href: "/courses", icon: "▤", label: "My learning" },
    { href: "/lms-redirect", icon: "▣", label: "Learning portal" },
    { href: "/contact", icon: "?", label: "Get support" },
  ],
  Administrator: [
    { href: "/admin", icon: "⌂", label: "Overview" },
    { href: "/admin/courses", icon: "▤", label: "Courses" },
    { href: "/admin/scholarships", icon: "✦", label: "Scholarships" },
    { href: "/admin/applications", icon: "▤", label: "Applications" },
    { href: "/admin/cohorts", icon: "◷", label: "Cohorts" },
    { href: "/admin/sessions", icon: "◉", label: "Training sessions" },
    { href: "/admin/learners", icon: "♙", label: "Learners" },
    { href: "/admin/teachers", icon: "♧", label: "Teachers" },
    { href: "/admin/reports", icon: "▥", label: "Reports" },
    { href: "/admin/campaigns", icon: "%", label: "Promo campaigns" },
  ],
  Teacher: [
    { href: "/teacher", icon: "⌂", label: "Overview" },
    { href: "/teacher/classes", icon: "▤", label: "My classes" },
    { href: "/teacher/learners", icon: "♙", label: "Learners" },
    { href: "/teacher/schedule", icon: "◷", label: "Schedule" },
    { href: "/teacher/resources", icon: "▣", label: "Resources" },
  ],
};

const footerText: Record<DashboardRole, string> = {
  Student: "Need a hand?",
  Administrator: "Admin workspace",
  Teacher: "Teacher workspace",
};

export function DashboardNavigation({ role }: { role: DashboardRole }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const links = navigation[role];

  useEffect(() => {
    if (!drawerOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const firstLink =
      document.querySelector<HTMLElement>(".mobile-dashboard-drawer a");
    firstLink?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDrawerOpen(false);
        menuButtonRef.current?.focus();
        return;
      }

      if (event.key === "Tab") {
        const drawer = document.getElementById("mobile-dashboard-drawer");
        const focusable = drawer?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled])',
        );
        const first = focusable?.item(0);
        const last = focusable?.item((focusable.length ?? 1) - 1);

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [drawerOpen]);

  function closeDrawer() {
    setDrawerOpen(false);
    menuButtonRef.current?.focus();
  }

  function renderLinks(onNavigate?: () => void) {
    return links.map((item) => (
      <Link
        aria-current={pathname === item.href ? "page" : undefined}
        href={item.href}
        key={item.href}
        onClick={onNavigate}
      >
        <span aria-hidden="true" className="student-nav-icon">
          {item.icon}
        </span>
        {item.label}
      </Link>
    ));
  }

  return (
    <>
      <aside aria-label={`${role} navigation`} className="student-sidebar desktop-dashboard-sidebar">
        <Brand />
        <p className="student-nav-label">
          {role === "Student" ? "Learner space" : `${role} workspace`}
        </p>
        <nav className="student-nav">{renderLinks()}</nav>
        <div className="sidebar-bottom">
          {role === "Student" ? (
            <>
              {footerText[role]}{" "}
              <Link href="/contact">Talk to our support team</Link>
            </>
          ) : (
            <Link href="/lms-redirect">Back to GEME3T Academy</Link>
          )}
        </div>
      </aside>

      <button
        aria-controls="mobile-dashboard-drawer"
        aria-expanded={drawerOpen}
        aria-haspopup="dialog"
        aria-label={drawerOpen ? "Close dashboard navigation" : "Open dashboard navigation"}
        className="dashboard-menu-toggle"
        onClick={() => {
          if (drawerOpen) closeDrawer();
          else setDrawerOpen(true);
        }}
        ref={menuButtonRef}
        type="button"
      >
        <span aria-hidden="true">{drawerOpen ? "×" : "☰"}</span>
      </button>

      {drawerOpen && (
        <button
          aria-label="Close dashboard navigation"
          className="dashboard-drawer-backdrop"
          onClick={closeDrawer}
          type="button"
        />
      )}

      <aside
        aria-hidden={!drawerOpen}
        aria-label={`${role} navigation`}
        aria-modal="true"
        className={`student-sidebar mobile-dashboard-drawer${drawerOpen ? " is-open" : ""}`}
        id="mobile-dashboard-drawer"
        inert={!drawerOpen}
        role="dialog"
      >
        <div className="mobile-drawer-heading">
          <Brand />
          <button
            aria-label="Close dashboard navigation"
            className="dashboard-drawer-close"
            onClick={closeDrawer}
            tabIndex={drawerOpen ? 0 : -1}
            type="button"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <p className="student-nav-label">
          {role === "Student" ? "Learner space" : `${role} workspace`}
        </p>
        <nav className="student-nav">
          {renderLinks(() => setDrawerOpen(false))}
        </nav>
        <div className="sidebar-bottom">
          {role === "Student" ? (
            <>
              {footerText[role]}{" "}
              <Link href="/contact" onClick={closeDrawer}>
                Talk to our support team
              </Link>
            </>
          ) : (
            <Link href="/lms-redirect" onClick={closeDrawer}>
              Back to GEME3T Academy
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
