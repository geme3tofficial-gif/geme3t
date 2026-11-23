import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/admin-auth";
import { DigitalServiceNavigation } from "@/components/domain/digital-service/navigation";
import "./digital-service.css";

export default async function DigitalServiceLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="digital-service-shell">
      <DigitalServiceNavigation />
      <main className="digital-service-main">
        <div className="digital-service-container">{children}</div>
      </main>
    </div>
  );
}
