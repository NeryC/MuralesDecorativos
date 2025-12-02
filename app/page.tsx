'use client';

import { useEffect, useState, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import ImageModal from '@/components/image-modal';
import { PageShell } from '@/components/page-shell';
import { MuralWithModificaciones } from '@/lib/types';

// Dynamic import to avoid SSR issues with Leaflet
const MapView = dynamic(() => import('@/components/map-view'), {
  ssr: false,
  loading: () => (
      <div 
        className="h-full w-full flex flex-col items-center justify-center"
        style={{
          background: '#F8FAFC',
        }}
      >
      <div className="spinner"></div>
      <p className="mt-6 text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        Cargando mapa...
      </p>
    </div>
  ),
});

function HomePageContent() {
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlight');
  const [murales, setMurales] = useState<MuralWithModificaciones[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMurales() {
      try {
        const response = await fetch('/api/murales');
        const data = await response.json();
        let muralesList = Array.isArray(data) ? data : [];

        // Si hay un highlightId, obtener ese mural específico aunque esté pendiente
        if (highlightId) {
          try {
            const highlightResponse = await fetch(`/api/murales/${highlightId}`);
            if (highlightResponse.ok) {
              const highlightMural = await highlightResponse.json();
              // Verificar si el mural ya está en la lista
              const exists = muralesList.some(m => m.id === highlightId);
              if (!exists) {
                // Agregar el mural resaltado a la lista
                muralesList = [highlightMural, ...muralesList];
                console.log('Mural resaltado agregado temporalmente:', highlightMural.nombre);
              }
            }
          } catch (error) {
            console.error('Error fetching highlighted mural:', error);
          }
        }

        setMurales(muralesList);
      } catch (error) {
        console.error('Error fetching murales:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchMurales();
  }, [highlightId]);

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
    return (
      <div 
        className="h-screen flex flex-col items-center justify-center"
        style={{
          background: '#F8FAFC',
        }}
      >
        <div className="spinner"></div>
        <p className="mt-6 text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Cargando puntos...
        </p>
      </div>
    );
  }

  return (
    <>
      <PageShell
        title="Mapa de Murales Decorativos"
        subtitle="Explora y descubre el arte urbano de nuestra ciudad"
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
            <MapView murales={murales} onImageClick={setSelectedImage} highlightId={highlightId || undefined} />
          </div>
        </div>
      </PageShell>
      <ImageModal imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />
    </>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div 
        className="h-screen flex flex-col items-center justify-center"
        style={{
          background: '#F8FAFC',
        }}
      >
        <div className="spinner"></div>
        <p className="mt-6 text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Cargando mapa...
        </p>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  );
}
