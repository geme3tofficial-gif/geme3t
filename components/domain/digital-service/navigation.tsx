"use client";

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

  function isActive(href: string) {
    return href === "/digital-service"
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside className="digital-service-sidebar">
      <div className="digital-service-brand">GEME3T Admin</div>
      <nav className="digital-service-nav" aria-label="Digital services">
        {links.map(([label, href]) => (
          <Link className={isActive(href) ? "active" : ""} href={href} key={href}>
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
