import Link from "next/link";
import { Brand } from "./brand";

const footerGroups = [
  {
    title: "Explore",
    links: [
      { href: "/courses", label: "All courses" },
      { href: "/school", label: "Our schools" },
      { href: "/testimonials", label: "Learner stories" },
    ],
  },
  {
    title: "GEME3T Academy",
    links: [
      { href: "/about-us", label: "About us" },
      { href: "/contact", label: "Contact" },
      { href: "/dashboard", label: "Student portal" },
    ],
  },
  {
    title: "Information",
    links: [
      { href: "/privacy-policy", label: "Privacy policy" },
      { href: "/terms-condition", label: "Terms & conditions" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Brand />
            <p>
              Practical learning, personal support, and skills for the future
              workforce.
            </p>
          </div>
          {footerGroups.map((group) => (
            <div className="footer-column" key={group.title}>
              <h3>{group.title}</h3>
              <nav aria-label={group.title} className="footer-links">
                {group.links.map((link) => (
                  <Link href={link.href} key={link.href}>
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} GEME3T Academy. All rights reserved.</span>
          <span>Learn skills. Earn opportunities. Build your future.</span>
        </div>
      </div>
    </footer>
  );
}
