'use client';

import { Suspense, useMemo, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import ImageModal from '@/components/image-modal';
import { PageShell } from '@/components/page-shell';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { StatsGrid } from '@/components/stats-grid';
import { useMuralData } from '@/hooks/use-mural-data';

// Dynamic import to avoid SSR issues with Leaflet
const MapView = dynamic(() => import('@/components/map-view'), {
  ssr: false,
  loading: () => (
    <LoadingSpinner 
      fullScreen 
      size="lg" 
      text="Cargando mapa..." 
    />
  ),
});

function HomePageContent() {
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlight');
  const { murales, loading } = useMuralData({ highlightId });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleImageClick = useCallback((url: string) => {
    setSelectedImage(url);
  }, []);

  const handleCloseImage = useCallback(() => {
    setSelectedImage(null);
  }, []);

  // Calcular estadísticas
  const stats = useMemo(() => {
    const total = murales.length;
    const aprobados = murales.filter(m => m.estado === 'aprobado').length;
    const modificados = murales.filter(m => m.estado === 'modificado_aprobado').length;

    return [
      { label: 'Total Murales', value: total, color: '#3B82F6' },
      { label: 'Aprobados', value: aprobados, color: '#DC2626' }, // Rojo - nuevos
      { label: 'Modificados', value: modificados, color: '#10B981' }, // Verde - intervenidos
    ];
  }, [murales]);

  if (loading) {
    return <LoadingSpinner fullScreen size="lg" text="Cargando puntos..." />;
  }

  return (
    <>
      <PageShell
        title="Murales de Propaganda"
        subtitle="Todos los murales de propaganda del País"
        fullHeight
        scrollableMain={false}
        showMapButton={false}
        stats={stats}
        rightActions={
          <Link
            href="/nuevo"
            className="px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2 bg-gray-900 text-white hover:bg-gray-800"
          >
            <span className="text-xl">➕</span>
            <span className="hidden sm:inline">Agregar Nuevo</span>
            <span className="sm:hidden">Nuevo</span>
          </Link>
        }
      >
        <div className="h-full w-full px-3 md:px-4 lg:px-5 py-1 md:py-2 max-w-full overflow-hidden">
          <div
            className={`h-full w-full mx-auto card overflow-hidden relative ${
              selectedImage ? 'pointer-events-none' : ''
            }`}
            style={{ 
              height: '100%',
              maxWidth: '100%',
            }}
          >
            <MapView murales={murales} onImageClick={handleImageClick} highlightId={highlightId || undefined} />
          </div>
        </div>
      </PageShell>
      <ImageModal imageUrl={selectedImage} onClose={handleCloseImage} />
    </>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<LoadingSpinner fullScreen size="lg" text="Cargando mapa..." />}>
      <HomePageContent />
    </Suspense>
  );
}
