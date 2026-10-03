import Link from "next/link";

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
      <span aria-hidden="true" className="brand-mark">
        G
      </span>
      <span className="brand-name">
        GEME3T <span>Academy</span>
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
        <details className="mobile-nav">
          <summary aria-label="Open navigation menu">☰</summary>
          <nav aria-label="Mobile navigation" className="mobile-nav-items">
            {links.map((link) => (
              <Link href={link.href} key={link.href}>
                {link.label}
              </Link>
            ))}
            <Link href="/dashboard">Student portal</Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
