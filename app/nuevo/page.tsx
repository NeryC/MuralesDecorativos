'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import ImageUploader from '@/components/image-uploader';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { isValidGoogleMapsUrl } from '@/lib/utils';

// Dynamic import to avoid SSR issues with Leaflet
const MapPicker = dynamic(() => import('@/components/map-picker'), {
  ssr: false,
  loading: () => (
    <div className="h-full bg-gray-100 rounded-md flex items-center justify-center">
      Cargando mapa...
    </div>
  ),
});

export default function NewMuralPage() {
  const [formData, setFormData] = useState({
    nombre: '',
    candidato: '',
    url_maps: '',
    comentario: '',
    imagen_url: '',
    imagen_thumbnail_url: '',
  });
  const [captcha, setCaptcha] = useState({
    a: 0,
    b: 0,
    answer: '',
  });
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setCaptcha({
      a: Math.floor(Math.random() * 9) + 1,
      b: Math.floor(Math.random() * 9) + 1,
      answer: '',
    });
  }, []);

  const handleLocationSelect = (url: string, _lat?: number, _lng?: number) => {
    setFormData((prev) => ({ ...prev, url_maps: url }));
  };

  const handleImageUpload = (originalUrl: string, thumbnailUrl: string) => {
    setFormData((prev) => ({
      ...prev,
      imagen_url: originalUrl,
      imagen_thumbnail_url: thumbnailUrl,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    // Validations
    if (!isValidGoogleMapsUrl(formData.url_maps)) {
      setStatus({ type: 'error', message: 'Por favor selecciona un punto en el mapa.' });
      return;
    }

    if (parseInt(captcha.answer) !== captcha.a + captcha.b) {
      setStatus({ type: 'error', message: 'Respuesta incorrecta en la verificación.' });
      return;
    }

    if (!formData.imagen_url) {
      setStatus({ type: 'error', message: 'Debes subir una foto del mural.' });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/murales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setStatus({ type: 'success', message: '¡Enviado! Tu mural está pendiente de aprobación.' });
        // Reset form
        setFormData({
          nombre: '',
          candidato: '',
          url_maps: '',
          comentario: '',
          imagen_url: '',
          imagen_thumbnail_url: '',
        });
        setCaptcha({
          a: Math.floor(Math.random() * 9) + 1,
          b: Math.floor(Math.random() * 9) + 1,
          answer: '',
        });
      } else {
        setStatus({ type: 'error', message: 'Error al enviar. Intenta de nuevo.' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'No se pudo conectar al servidor.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 flex flex-col items-center justify-center">
      <div className="w-[95%] max-w-[95%] h-[calc(100vh-2rem)] flex flex-col gap-4 md:gap-6">
        <header className="flex-none bg-white rounded-2xl shadow-sm px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">Enviar nueva ubicación</h1>
          <Link href="/" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold transition-colors shadow-sm">
            🗺️ Ver Mapa
          </Link>
        </header>
        
        <main className="flex-1 min-h-0 w-full bg-white rounded-3xl shadow-xl p-6 md:p-8 overflow-hidden">
          <form onSubmit={handleSubmit} className="h-full flex flex-col max-w-2xl mx-auto">
          <div className="flex-shrink-0">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del lugar *
            </label>
            <Input
              value={formData.nombre}
              onChange={(e) => setFormData((prev) => ({ ...prev, nombre: e.target.value }))}
              required
            />
          </div>

          <div className="flex-shrink-0">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Candidato (opcional)
            </label>
            <Input
              value={formData.candidato}
              onChange={(e) => setFormData((prev) => ({ ...prev, candidato: e.target.value }))}
              placeholder="Ej: Juan Pérez"
            />
          </div>

          <div className="flex-1 min-h-0 flex flex-col">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex-shrink-0">
              Selecciona la ubicación en el mapa *
            </label>
            <div className="flex-1 min-h-0">
              <MapPicker onLocationSelect={handleLocationSelect} initialZoom={20} />
            </div>
          </div>

          <div className="flex-shrink-0">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Link de Google Maps (Automático)
            </label>
            <Input value={formData.url_maps} readOnly placeholder="Selecciona un punto en el mapa..." />
          </div>

          <div className="flex-shrink-0">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comentario (opcional)
            </label>
            <Textarea
              value={formData.comentario}
              onChange={(e) => setFormData((prev) => ({ ...prev, comentario: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="flex-shrink-0">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Foto del Mural (Obligatorio) *
            </label>
            <div className="w-full">
              <ImageUploader
                onUploadComplete={handleImageUpload}
                onUploadError={(error) => setStatus({ type: 'error', message: error })}
              />
            </div>
          </div>

          <div className="flex-shrink-0">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Verificación (anti-spam) *
            </label>
            <p className="text-sm font-semibold mb-2">
              {isClient ? `¿Cuánto es ${captcha.a} + ${captcha.b}?` : 'Cargando verificación...'}
            </p>
            <Input
              type="number"
              value={captcha.answer}
              onChange={(e) => setCaptcha((prev) => ({ ...prev, answer: e.target.value }))}
              required
            />
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full flex-shrink-0">
            {isSubmitting ? 'Enviando...' : 'Enviar'}
          </Button>

          {status && (
            <div
              className={`p-4 rounded-md flex-shrink-0 ${
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
