'use client';

import { useState, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageShell } from '@/components/page-shell';
import { StatusAlert } from '@/components/status-alert';
import { FormField } from '@/components/form-field';
import ImageUploader from '@/components/image-uploader';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFormSubmit } from '@/hooks/use-form-submit';
import type { ReportMuralDTO } from '@/lib/types';

const INITIAL_FORM_DATA: ReportMuralDTO = {
  nuevo_comentario: '',
  nueva_imagen_url: '',
  nueva_imagen_thumbnail_url: '',
};

function ReportarContent() {
  const searchParams = useSearchParams();
  const muralId = searchParams.get('id');
  const muralName = searchParams.get('name');

  const [formData, setFormData] = useState<ReportMuralDTO>(INITIAL_FORM_DATA);

  const { status, isSubmitting, submit, setError } = useFormSubmit<ReportMuralDTO>({
    onSubmit: async (data) => {
      if (!muralId) {
        throw new Error('ID de mural no válido.');
      }
      return fetch(`/api/murales/${muralId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
    },
    successMessage: '¡Reporte enviado con éxito! Gracias por tu colaboración.',
    errorMessage: 'Error al enviar el reporte.',
  });

  const handleImageUpload = useCallback((originalUrl: string, thumbnailUrl: string) => {
    setFormData((prev) => ({
      ...prev,
      nueva_imagen_url: originalUrl,
      nueva_imagen_thumbnail_url: thumbnailUrl,
    }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nueva_imagen_url) {
      setError('Por favor selecciona una foto.');
      return;
    }

    if (!muralId) {
      setError('ID de mural no válido.');
      return;
    }

    await submit(formData);
  };

  if (!muralId) {
    return (
      <PageShell title="Reportar Mural" scrollableMain>
        <div className="max-w-2xl mx-auto">
          <p className="text-red-600 font-semibold">
            Error: No se especificó ningún mural. Vuelve al mapa e intenta de nuevo.
          </p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Reportar Mural Eliminado o Modificado" scrollableMain>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
        <p className="text-gray-600">
          Por favor, sube una foto actual del lugar y un comentario explicando la situación.
        </p>

        <FormField label="Mural a reportar">
          <Input value={muralName || `Mural #${muralId}`} disabled />
        </FormField>

        <FormField label="Nueva Foto (Obligatorio)" required>
          <ImageUploader
            onUploadComplete={handleImageUpload}
            onUploadError={(error) => setError(error)}
          />
        </FormField>

        <FormField label="Comentario (Opcional)">
          <Textarea
            value={formData.nuevo_comentario || ''}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, nuevo_comentario: e.target.value }))
            }
            rows={3}
            placeholder="Ej: El mural fue pintado encima, ahora es una pared blanca."
          />
        </FormField>

        <Button type="submit" variant="danger" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Enviando...' : 'Enviar Reporte'}
        </Button>

        {status && (
          <StatusAlert type={status.type}>
            {status.message}
          </StatusAlert>
        )}
      </form>
    </PageShell>
  );
}

export default function ReportarPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando...</div>}>
      <ReportarContent />
    </Suspense>
  );
}
