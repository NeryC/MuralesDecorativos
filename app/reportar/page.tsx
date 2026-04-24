import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { ReporteForm } from "@/components/reporte-form";
import { getMuralById } from "@/lib/queries/murales";

interface ReportarPageProps {
  searchParams: Promise<{ id?: string; name?: string }>;
}

export async function generateMetadata({ searchParams }: ReportarPageProps): Promise<Metadata> {
  const params = await searchParams;
  return {
    title: params.name ? `Reportar ${params.name}` : "Reportar mural",
    description: "Reportá la eliminación o modificación de un mural.",
    robots: { index: false, follow: false },
  };
}

export default async function ReportarPage({ searchParams }: ReportarPageProps) {
  const params = await searchParams;
  if (!params.id) notFound();

  const mural = await getMuralById(params.id);
  if (!mural) notFound();

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="main" className="flex-1">
        <div className="mx-auto max-w-2xl px-4 md:px-6 py-6 md:py-10">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-semibold">Reportar mural</h1>
            <p className="text-muted-foreground mt-1">
              Informá si el mural fue eliminado o modificado.
            </p>
          </div>
          <ReporteForm muralId={mural.id} muralName={mural.nombre} />
        </div>
      </main>
    </div>
  );
}
