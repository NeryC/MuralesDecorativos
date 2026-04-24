import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { MuralForm } from "@/components/mural-form";

export const metadata: Metadata = {
  title: "Registrar mural",
  description: "Registrá un mural de propaganda política en Paraguay. Será revisado antes de publicarse.",
  robots: { index: true, follow: true },
};

export default function NuevoMuralPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="main" className="flex-1">
        <div className="mx-auto max-w-4xl px-4 md:px-6 py-6 md:py-10">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-semibold">Registrar nuevo mural</h1>
            <p className="text-muted-foreground mt-1">
              Los datos serán revisados antes de publicarse.
            </p>
          </div>
          <MuralForm />
        </div>
      </main>
    </div>
  );
}
