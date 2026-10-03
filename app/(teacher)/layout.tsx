import type { ReactNode } from "react";
import { WorkspaceShell } from "@/components/geme3t/workspace-shell";

export default function TeacherLayout({ children }: { children: ReactNode }) {
  return <WorkspaceShell role="Teacher">{children}</WorkspaceShell>;
}
