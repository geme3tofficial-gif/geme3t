import type { ReactNode } from "react";
import { DashboardNavigation, type DashboardRole } from "./dashboard-navigation";

export type WorkspaceRole = Exclude<DashboardRole, "Student">;

export function WorkspaceShell({
  children,
  role,
}: {
  children: ReactNode;
  role: WorkspaceRole;
}) {
  return (
    <div className="student-layout workspace-layout">
      <DashboardNavigation role={role} />
      <div className="student-main">
        <header className="student-topbar">
          <span className="student-topbar-label">
            {role} workspace
          </span>
          <div className="student-user">
            <span className="workspace-role">{role}</span>
          </div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
