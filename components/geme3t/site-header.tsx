import Link from "next/link";
import { connection } from "next/server";
import { getPrismaClient } from "@/lib/prisma";
import { Brand } from "./brand";
import { MobileSiteNav } from "./mobile-site-nav";

const links = [
  { href: "/courses", label: "Courses" },
  { href: "/school", label: "Schools" },
  { href: "/about-us", label: "About us" },
  { href: "/contact", label: "Contact" },
];

export async function SiteHeader() {
  await connection();
  const config = await getPrismaClient().applicationConfig.findUnique({
    where: { id: 1 },
    select: { scholarshipsEnabled: true },
  });
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
        <MobileSiteNav scholarshipsEnabled={config?.scholarshipsEnabled ?? true} />
      </div>
    </header>
  );
}
