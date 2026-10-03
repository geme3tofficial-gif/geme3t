import type { ReactNode } from "react";
import { SiteShell } from "@/components/geme3t/site-shell";

export default function Geme3tLayout({ children }: { children: ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
