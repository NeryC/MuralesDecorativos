import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { StatsBar } from "@/components/stats-bar";
import { FilterChips } from "@/components/filter-chips";
import { HomeMapSection } from "@/components/home-map-section";
import { Skeleton } from "@/components/ui/skeleton";
import { getMuralesStats, type EstadoFilter } from "@/lib/queries/murales";
import type { Metadata } from "next";

export const revalidate = 60;

interface HomePageProps {
  searchParams: Promise<{
    q?: string;
    estado?: string;
    highlight?: string;
  }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const stats = await getMuralesStats();
  return {
    title: `${stats.aprobados} murales registrados`,
    description: `Mapa colaborativo con ${stats.aprobados} murales de propaganda política documentados en Paraguay.`,
  };
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const estado = (params.estado ?? "todos") as EstadoFilter;
  const stats = await getMuralesStats();

  const suspenseKey = `${params.q ?? ""}-${estado}-${params.highlight ?? ""}`;

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <StatsBar stats={stats} />

      <main id="main" className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-end px-4 md:px-6 py-3 border-b bg-card">
          <FilterChips />
        </div>

        <div className="flex-1 relative">
          <Suspense key={suspenseKey} fallback={<Skeleton className="absolute inset-0 rounded-none" />}>
            <HomeMapSection q={params.q} estado={estado} highlightId={params.highlight} />
          </Suspense>
        </div>
      </main>

      <Link
        href="/nuevo"
        className="sm:hidden fixed bottom-6 right-4 z-[1000] flex items-center justify-center bg-primary text-primary-foreground shadow-lg size-14 rounded-xl"
        aria-label="Agregar nuevo mural"
      >
        <Plus className="size-6" aria-hidden="true" />
      </Link>
    </div>
  );
}
