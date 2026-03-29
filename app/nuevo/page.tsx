'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { PageShell } from '@/components/page-shell';
import { StatusAlert } from '@/components/status-alert';
import { MapField } from '@/components/map-field';
import ImageUploader from '@/components/image-uploader';
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
    <PageShell
      title="Registrar nuevo mural"
      subtitle="Los datos serán revisados antes de publicarse"
      fullHeight={false}
      scrollableMain={true}
    >
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Left column: text input fields */}
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#374151', letterSpacing: '0.5px' }}>
                Nombre del lugar <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                value={formData.nombre}
                onChange={(e) => setFormData((prev) => ({ ...prev, nombre: e.target.value }))}
                required
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid #e2e8f0',
                  fontSize: '13px',
                  outline: 'none',
                  background: 'white',
                }}
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#374151', letterSpacing: '0.5px' }}>
                Candidato <span style={{ color: '#64748b', fontWeight: 400, textTransform: 'none' }}>(opcional)</span>
              </label>
              <input
                value={formData.candidato || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, candidato: e.target.value }))}
                placeholder="Ej: Juan Pérez"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid #e2e8f0',
                  fontSize: '13px',
                  outline: 'none',
                  background: 'white',
                }}
              />
            </div>

            <div className="flex-shrink-0">
              <MapField
                key={resetKey}
                value={formData.url_maps}
                onLocationSelect={handleLocationSelect}
                initialZoom={13}
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#374151', letterSpacing: '0.5px' }}>
                Comentario <span style={{ color: '#64748b', fontWeight: 400, textTransform: 'none' }}>(opcional)</span>
              </label>
              <textarea
                value={formData.comentario || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, comentario: e.target.value }))}
                rows={4}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid #e2e8f0',
                  fontSize: '13px',
                  outline: 'none',
                  background: 'white',
                }}
              />
            </div>
          </div>

          {/* Right column: image uploader */}
          <div>
            <ImageUploader
              onFileSelect={handleFileSelect}
              onError={(error) => setError(error)}
              disabled={isSubmitting || isUploadingImage}
              resetKey={resetKey}
            />
          </div>
        </div>

        {status && (
          <div className="mt-4">
            <StatusAlert type={status.type}>
              {status.message}
            </StatusAlert>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6 pt-4" style={{ borderTop: '1px solid #f1f5f9' }}>
          <Link href="/" className="px-4 py-2 text-sm font-medium rounded-lg" style={{ background: 'white', border: '1.5px solid #e2e8f0', color: '#64748b' }}>
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 text-sm font-bold rounded-lg text-white transition-colors"
            style={{ background: isSubmitting ? '#93c5fd' : '#1e40af' }}
          >
            {isSubmitting ? 'Enviando...' : 'Enviar mural →'}
          </button>
        </div>
      </form>
    </PageShell>
  );
}
