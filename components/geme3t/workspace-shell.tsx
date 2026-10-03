import type { ReactNode } from "react";
import { DashboardNavigation, type DashboardRole } from "./dashboard-navigation";

export type WorkspaceRole = Exclude<DashboardRole, "Student">;

const profile: Record<WorkspaceRole, { initials: string; name: string }> = {
  Administrator: { initials: "AD", name: "Alex Morgan" },
  Teacher: { initials: "TS", name: "Taylor Smith" },
};

export function WorkspaceShell({
  children,
  role,
}: {
  children: ReactNode;
  role: WorkspaceRole;
}) {
  const user = profile[role];

  return (
    <div className="student-layout workspace-layout">
      <DashboardNavigation role={role} />
      <div className="student-main">
        <header className="student-topbar">
          <span className="student-topbar-label">
            Preview {role.toLowerCase()} dashboard
          </span>
          <div className="student-user">
            <span aria-hidden="true" className="avatar">
              {user.initials}
            </span>
            <strong>{user.name}</strong>
            <span className="workspace-role">{role}</span>
          </div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
