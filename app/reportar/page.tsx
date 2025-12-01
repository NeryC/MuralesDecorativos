'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ImageUploader from '@/components/image-uploader';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function ReportarContent() {
  const searchParams = useSearchParams();
  const muralId = searchParams.get('id');
  const muralName = searchParams.get('name');

  const [formData, setFormData] = useState({
    nuevo_comentario: '',
    nueva_imagen_url: '',
    nueva_imagen_thumbnail_url: '',
  });
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageUpload = (originalUrl: string, thumbnailUrl: string) => {
    setFormData((prev) => ({
      ...prev,
      nueva_imagen_url: originalUrl,
      nueva_imagen_thumbnail_url: thumbnailUrl,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    if (!formData.nueva_imagen_url) {
      setStatus({ type: 'error', message: 'Por favor selecciona una foto.' });
      return;
    }

    if (!muralId) {
      setStatus({ type: 'error', message: 'ID de mural no válido.' });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/murales/${muralId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setStatus({ type: 'success', message: '¡Reporte enviado con éxito! Gracias por tu colaboración.' });
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      } else {
        setStatus({ type: 'error', message: 'Error al enviar el reporte.' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'No se pudo conectar al servidor.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!muralId) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 md:p-8 flex flex-col items-center justify-center">
        <div className="w-[95%] max-w-[95%] h-[calc(100vh-2rem)] flex flex-col gap-4 md:gap-6">
          <header className="flex-none bg-white rounded-2xl shadow-sm px-6 py-4 flex justify-between items-center">
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">
              Reportar Mural
            </h1>
            <Link
              href="/"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold transition-colors shadow-sm"
            >
              🗺️ Ver Mapa
            </Link>
          </header>

          <main className="flex-1 min-h-0 w-full bg-white rounded-3xl shadow-xl p-6 md:p-8 overflow-auto">
            <div className="max-w-2xl mx-auto">
              <p className="text-red-600 font-semibold">
                Error: No se especificó ningún mural. Vuelve al mapa e intenta de nuevo.
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 flex flex-col items-center justify-center">
      <div className="w-[95%] max-w-[95%] h-[calc(100vh-2rem)] flex flex-col gap-4 md:gap-6">
        <header className="flex-none bg-white rounded-2xl shadow-sm px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">
            Reportar Mural Eliminado o Modificado
          </h1>
          <Link
            href="/"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold transition-colors shadow-sm"
          >
            🗺️ Ver Mapa
          </Link>
        </header>

        <main className="flex-1 min-h-0 w-full bg-white rounded-3xl shadow-xl p-6 md:p-8 overflow-auto">
          <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
            <p className="text-gray-600">
              Por favor, sube una foto actual del lugar y un comentario explicando la situación.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mural a reportar
              </label>
              <Input value={muralName || `Mural #${muralId}`} disabled />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nueva Foto (Obligatorio) *
              </label>
              <ImageUploader
                onUploadComplete={handleImageUpload}
                onUploadError={(error) => setStatus({ type: 'error', message: error })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comentario (Opcional)
              </label>
              <Textarea
                value={formData.nuevo_comentario}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, nuevo_comentario: e.target.value }))
                }
                rows={3}
                placeholder="Ej: El mural fue pintado encima, ahora es una pared blanca."
              />
            </div>

            <Button type="submit" variant="danger" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Enviando...' : 'Enviar Reporte'}
            </Button>

            {status && (
              <div
                className={`p-4 rounded-md ${
                  status.type === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {status.message}
              </div>
            )}
          </form>
        </main>
      </div>
    </div>
  );
}

export default function ReportarPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando...</div>}>
      <ReportarContent />
    </Suspense>
  );
}
