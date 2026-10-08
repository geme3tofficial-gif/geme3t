import Image from "next/image";
import Link from "next/link";
import { MobileSiteNav } from "./mobile-site-nav";

const links = [
  { href: "/courses", label: "Courses" },
  { href: "/school", label: "Schools" },
  { href: "/about-us", label: "About us" },
  { href: "/contact", label: "Contact" },
];

export function Brand() {
  return (
    <Link
      aria-label="GEME3T Academy home"
      className="brand-link"
      href="/"
    >
      <Image
        alt="GEME3T"
        className="brand-logo"
        height={408}
        src="/images/logo-no-bg.png"
        width={612}
      />
      <span className="brand-name">
        <span>Academy</span>
      </span>
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container site-nav">
        <Brand />
        <nav aria-label="Main navigation" className="nav-links">
          {links.map((link) => (
            <Link href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
          <Link className="button button--small" href="/dashboard">
            Student portal
          </Link>
        </nav>
        <MobileSiteNav />
      </div>
    </header>
  );
}
