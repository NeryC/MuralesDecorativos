import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import {
  countMuralesPendientes,
  countModificacionesPendientes,
} from "@/lib/queries/admin-murales";

export const dynamic = "force-dynamic";

export default async function AdminPanelLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [pendingMurales, pendingMods] = await Promise.all([
    countMuralesPendientes(),
    countModificacionesPendientes(),
  ]);

  return (
    <div className="flex min-h-dvh">
      <AdminSidebar
        pendingMuralesCount={pendingMurales}
        pendingModificacionesCount={pendingMods}
      />
      <div className="flex-1 flex flex-col">
        <SiteHeader />
        <main id="main" className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
