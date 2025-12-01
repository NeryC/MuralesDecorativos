'use client';

import { useState, useCallback } from 'react';
import { PageShell } from '@/components/page-shell';
import { StatusAlert } from '@/components/status-alert';
import { FormField } from '@/components/form-field';
import { MapField } from '@/components/map-field';
import { CaptchaField } from '@/components/captcha-field';
import ImageUploader from '@/components/image-uploader';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useCaptcha } from '@/hooks/use-captcha';
import { useFormSubmit } from '@/hooks/use-form-submit';
import { isValidGoogleMapsUrl } from '@/lib/utils';
import type { CreateMuralDTO } from '@/lib/types';

const INITIAL_FORM_DATA: CreateMuralDTO = {
  nombre: '',
  candidato: '',
  url_maps: '',
  comentario: '',
  imagen_url: '',
  imagen_thumbnail_url: '',
};

export default function NewMuralPage() {
  const [formData, setFormData] = useState<CreateMuralDTO>(INITIAL_FORM_DATA);
  const captcha = useCaptcha();

  const { status, isSubmitting, submit, setError } = useFormSubmit<CreateMuralDTO>({
    onSubmit: async (data) => {
      return fetch('/api/murales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      setFormData(INITIAL_FORM_DATA);
      captcha.reset();
    },
    successMessage: '¡Enviado! Tu mural está pendiente de aprobación.',
    errorMessage: 'Error al enviar. Intenta de nuevo.',
  });

  const handleLocationSelect = useCallback(
    (url: string, _lat?: number, _lng?: number) => {
      setFormData((prev) => ({ ...prev, url_maps: url }));
    },
    []
  );

  const handleImageUpload = useCallback((originalUrl: string, thumbnailUrl: string) => {
    setFormData((prev) => ({
      ...prev,
      imagen_url: originalUrl,
      imagen_thumbnail_url: thumbnailUrl,
    }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!isValidGoogleMapsUrl(formData.url_maps)) {
      setError('Por favor selecciona un punto en el mapa.');
      return;
    }

    if (!captcha.isValid()) {
      setError('Respuesta incorrecta en la verificación.');
      return;
    }

    if (!formData.imagen_url) {
      setError('Debes subir una foto del mural.');
      return;
    }

    await submit(formData);
  };

  return (
    <PageShell title="Enviar nueva ubicación" scrollableMain>
      <form onSubmit={handleSubmit} className="h-full flex flex-col max-w-2xl mx-auto">
        <FormField label="Nombre del lugar" required>
          <Input
            value={formData.nombre}
            onChange={(e) => setFormData((prev) => ({ ...prev, nombre: e.target.value }))}
            required
          />
        </FormField>

        <FormField label="Candidato (opcional)">
          <Input
            value={formData.candidato || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, candidato: e.target.value }))}
            placeholder="Ej: Juan Pérez"
          />
        </FormField>

        <MapField
          value={formData.url_maps}
          onLocationSelect={handleLocationSelect}
          initialZoom={20}
        />

        <FormField label="Comentario (opcional)">
          <Textarea
            value={formData.comentario || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, comentario: e.target.value }))}
            rows={3}
          />
        </FormField>

        <FormField label="Foto del Mural (Obligatorio)" required>
          <ImageUploader
            onUploadComplete={handleImageUpload}
            onUploadError={(error) => setError(error)}
          />
        </FormField>

        <CaptchaField
          question={captcha.question}
          value={captcha.captcha.answer}
          onChange={captcha.setAnswer}
          disabled={!captcha.isClient}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full flex-shrink-0">
          {isSubmitting ? 'Enviando...' : 'Enviar'}
        </Button>

        {status && (
          <StatusAlert type={status.type} className="mt-3 flex-shrink-0">
            {status.message}
          </StatusAlert>
        )}
      </form>
    </PageShell>
  );
}
