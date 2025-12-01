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
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 py-8 px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <p className="text-red-600 font-semibold">
              Error: No se especificó ningún mural. Vuelve al mapa e intenta de nuevo.
            </p>
            <Link href="/" className="inline-block mt-4 text-blue-600 hover:text-blue-800">
              🗺️ Volver al Mapa
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 py-8 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="flex justify-end mb-4">
          <Link href="/" className="text-blue-600 hover:text-blue-800 font-semibold">
            🗺️ Volver al Mapa
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-red-600 mb-4">
          Reportar Mural Eliminado o Modificado
        </h1>
        <p className="text-gray-600 mb-6">
          Por favor, sube una foto actual del lugar y un comentario explicando la situación.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
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
              onChange={(e) => setFormData((prev) => ({ ...prev, nuevo_comentario: e.target.value }))}
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
