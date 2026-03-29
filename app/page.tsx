'use client';

import { Suspense, useMemo, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import ImageModal from '@/components/image-modal';
import { PageShell } from '@/components/page-shell';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
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
    const pendientes = murales.filter(m => m.estado === 'pendiente').length;
    const modificados = murales.filter(m => m.estado === 'modificado_aprobado' || m.estado === 'modificado_pendiente').length;

    return [
      { label: 'Total', value: total, color: '#1e40af' },
      { label: 'Aprobados', value: aprobados, color: '#059669' },
      { label: 'Pendientes', value: pendientes, color: '#d97706' },
      { label: 'Modificados', value: modificados, color: '#3b82f6' },
    ];
  }, [murales]);

  if (loading) {
    return <LoadingSpinner fullScreen size="lg" text="Cargando puntos..." />;
  }

  return (
    <>
      <PageShell
        title="Murales Políticos"
        subtitle="Registro de propaganda política · Paraguay"
        fullHeight
        scrollableMain={false}
        showMapButton={false}
        stats={stats}
        rightActions={
          <Link
            href="/nuevo"
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm text-white transition-colors"
            style={{ background: '#1e40af' }}
          >
            <span>+</span>
            <span>Agregar mural</span>
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
            {/* FAB mobile: solo visible en pantallas pequeñas */}
            <Link
              href="/nuevo"
              className="sm:hidden absolute bottom-4 right-4 z-[1000] flex items-center justify-center text-white font-bold text-2xl transition-transform active:scale-95"
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: '#1e40af',
                boxShadow: '0 4px 12px rgba(30,64,175,0.4)',
              }}
              aria-label="Agregar nuevo mural"
            >
              +
            </Link>
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
