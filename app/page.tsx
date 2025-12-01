'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import ImageModal from '@/components/image-modal';
import { Mural } from '@/lib/types';

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
  const [murales, setMurales] = useState<Mural[]>([]);
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

    <div className="min-h-screen bg-gray-100 p-4 md:p-8 flex flex-col items-center justify-center">
      <div className="w-[95%] max-w-[95%] h-[calc(100vh-2rem)] flex flex-col gap-4 md:gap-6">
        <header className="flex-none bg-white rounded-2xl shadow-sm px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">Mapa de Murales Decorativos</h1>
          <Link href="/nuevo" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold transition-colors shadow-sm">
            ➕ Agregar Nuevo
          </Link>
        </header>

        <main
          className={`flex-1 min-h-0 w-full bg-white rounded-3xl shadow-xl overflow-hidden relative ${
            selectedImage ? 'pointer-events-none' : ''
          }`}
        >
          <MapView murales={murales} onImageClick={setSelectedImage} />
        </main>
      </div>

      <ImageModal imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />
    </div>
  );
}
