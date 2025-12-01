'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import ImageModal from '@/components/image-modal';
import { PageShell } from '@/components/page-shell';
import { MuralWithModificaciones } from '@/lib/types';

// Dynamic import to avoid SSR issues with Leaflet
const MapView = dynamic(() => import('@/components/map-view'), {
  ssr: false,
  loading: () => (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="spinner"></div>
      <p className="mt-4 font-bold text-gray-700">Cargando mapa...</p>
    </div>
  ),
});

export default function HomePage() {
  const [murales, setMurales] = useState<MuralWithModificaciones[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMurales() {
      try {
        const response = await fetch('/api/murales');
        const data = await response.json();
        setMurales(data);
      } catch (error) {
        console.error('Error fetching murales:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchMurales();
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-100">
        <div className="spinner"></div>
        <p className="mt-4 font-bold text-gray-700">Cargando puntos...</p>
      </div>
    );
  }

  return (
    <>
      <PageShell
        title="Mapa de Murales Decorativos"
        fullHeight
        scrollableMain={false}
        showMapButton={false}
        rightActions={
          <Link
            href="/nuevo"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold transition-colors shadow-sm"
          >
            ➕ Agregar Nuevo
          </Link>
        }
      >
        <div
          className={`h-full w-full rounded-3xl overflow-hidden relative ${
            selectedImage ? 'pointer-events-none' : ''
          }`}
        >
          <MapView murales={murales} onImageClick={setSelectedImage} />
        </div>
      </PageShell>
      <ImageModal imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />
    </>
  );
}
