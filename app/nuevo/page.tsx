'use client';

import { useState, useCallback } from 'react';
import { PageShell } from '@/components/page-shell';
import { StatusAlert } from '@/components/status-alert';
import { FormField } from '@/components/form-field';
import { MapField } from '@/components/map-field';
import ImageUploader from '@/components/image-uploader';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useFormSubmit } from '@/hooks/use-form-submit';
import { useImageUpload } from '@/hooks/use-image-upload';
import { isValidGoogleMapsUrl } from '@/lib/utils';
import { MESSAGES } from '@/lib/messages';
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resetKey, setResetKey] = useState(0);

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
      setSelectedFile(null);
      setResetKey((prev) => prev + 1); // Reset map and image uploader
    },
    successMessage: MESSAGES.SUCCESS.MURAL_ENVIADO,
    errorMessage: MESSAGES.ERROR.ENVIAR_MURAL,
  });

  const { isUploading: isUploadingImage, uploadImage } = useImageUpload({
    onError: (error) => setError(error),
  });

  const handleLocationSelect = useCallback(
    (url: string, _lat?: number, _lng?: number) => {
      setFormData((prev) => ({ ...prev, url_maps: url }));
    },
    []
  );

  const handleFileSelect = useCallback((file: File | null) => {
    setSelectedFile(file);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!isValidGoogleMapsUrl(formData.url_maps)) {
      setError(MESSAGES.VALIDATION.SELECCIONAR_MAPA);
      return;
    }

    if (!selectedFile) {
      setError(MESSAGES.VALIDATION.SELECCIONAR_FOTO);
      return;
    }

    const imageUrls = await uploadImage(selectedFile);
    if (!imageUrls) {
      return; // Error already handled by useImageUpload
    }

    // Update form data with image URLs and submit
    await submit({
      ...formData,
      imagen_url: imageUrls.originalUrl,
      imagen_thumbnail_url: imageUrls.thumbnailUrl,
    });
  };

  return (
    <PageShell title="Enviar nueva ubicación" scrollableMain>
      <form onSubmit={handleSubmit} className="h-full flex flex-col max-w-2xl mx-auto gap-3">
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

        <div className="flex-shrink-0">
          <MapField
            key={resetKey}
            value={formData.url_maps}
            onLocationSelect={handleLocationSelect}
            initialZoom={20}
          />
        </div>

        <FormField label="Comentario (opcional)">
          <Textarea
            value={formData.comentario || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, comentario: e.target.value }))}
            rows={4}
          />
        </FormField>

        <FormField label="Foto del Mural (Obligatorio)" required>
          <ImageUploader
            onFileSelect={handleFileSelect}
            onError={(error) => setError(error)}
            disabled={isSubmitting || isUploadingImage}
            resetKey={resetKey}
          />
        </FormField>

        <div className="flex flex-col gap-2 mt-1 flex-shrink-0">
          <Button type="submit" disabled={isSubmitting || isUploadingImage} className="w-full" size="lg">
            {isUploadingImage 
              ? MESSAGES.LOADING.SUBIENDO_IMAGEN 
              : isSubmitting 
              ? MESSAGES.LOADING.ENVIANDO 
              : MESSAGES.UI.ENVIAR}
          </Button>

          {status && (
            <StatusAlert type={status.type}>
              {status.message}
            </StatusAlert>
          )}
        </div>
      </form>
    </PageShell>
  );
}
