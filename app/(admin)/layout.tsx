import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/admin-auth";
import { WorkspaceShell } from "@/components/geme3t/workspace-shell";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin();

  return (
    <WorkspaceShell role="Administrator">{children}</WorkspaceShell>
  );
}
