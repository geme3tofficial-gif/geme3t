import type { ReactNode } from "react";
import { WorkspaceShell } from "@/components/geme3t/workspace-shell";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <WorkspaceShell role="Administrator">{children}</WorkspaceShell>
  );
}
