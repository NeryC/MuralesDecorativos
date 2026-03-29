'use client';

import { useState, Suspense, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PageShell } from '@/components/page-shell';
import { StatusAlert } from '@/components/status-alert';
import ImageUploader from '@/components/image-uploader';
import ImageModal from '@/components/image-modal';
import { useFormSubmit } from '@/hooks/use-form-submit';
import { useImageUpload } from '@/hooks/use-image-upload';
import { MESSAGES } from '@/lib/messages';
import type { ReportMuralDTO, Mural } from '@/lib/types';

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [mural, setMural] = useState<Mural | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loadingMural, setLoadingMural] = useState(true);

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
      setFormData(INITIAL_FORM_DATA);
      setSelectedFile(null);
      setResetKey((prev) => prev + 1); // Reset image uploader
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
    },
    successMessage: MESSAGES.SUCCESS.REPORTE_ENVIADO,
    errorMessage: MESSAGES.ERROR.ENVIAR_REPORTE,
  });

  const { isUploading: isUploadingImage, uploadImage } = useImageUpload({
    onError: (error) => setError(error),
  });

  const handleFileSelect = useCallback((file: File | null) => {
    setSelectedFile(file);
  }, []);

  // Fetch mural data to show previous image
  useEffect(() => {
    if (!muralId) return;

    async function fetchMural() {
      try {
        const response = await fetch(`/api/murales/${muralId}`);
        if (response.ok) {
          const data = await response.json();
          setMural(data);
        }
      } catch (error) {
        console.error('Error fetching mural:', error);
      } finally {
        setLoadingMural(false);
      }
    }

    fetchMural();
  }, [muralId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      setError(MESSAGES.VALIDATION.SELECCIONAR_FOTO_REPORTE);
      return;
    }

    if (!muralId) {
      setError(MESSAGES.ERROR.ID_INVALIDO);
      return;
    }

    const imageUrls = await uploadImage(selectedFile);
    if (!imageUrls) {
      return; // Error already handled by useImageUpload
    }

    // Update form data with image URLs and submit
    await submit({
      ...formData,
      nueva_imagen_url: imageUrls.originalUrl,
      nueva_imagen_thumbnail_url: imageUrls.thumbnailUrl,
    });
  };

  if (!muralId) {
    return (
      <PageShell title="Reportar mural" scrollableMain>
        <div className="max-w-2xl mx-auto">
          <p className="text-red-600 font-semibold">
            Error: {MESSAGES.ERROR.ID_INVALIDO} Vuelve al mapa e intenta de nuevo.
          </p>
        </div>
      </PageShell>
    );
  }

  const previousImageUrl = mural?.imagen_url || mural?.imagen_thumbnail_url;

  return (
    <PageShell
      title="Reportar mural"
      subtitle="Reportar cambio o eliminación"
      fullHeight={false}
      scrollableMain={true}
    >
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-4">
          {muralName && (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#374151', letterSpacing: '0.5px' }}>
                Mural
              </label>
              <p className="text-sm mt-1" style={{ color: '#1e293b' }}>{muralName}</p>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#374151', letterSpacing: '0.5px' }}>
              Comentario <span style={{ color: '#64748b', fontWeight: 400, textTransform: 'none' }}>(opcional)</span>
            </label>
            <textarea
              value={formData.nuevo_comentario || ''}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, nuevo_comentario: e.target.value }))
              }
              rows={5}
              placeholder="Ej: El mural fue pintado encima, ahora es una pared blanca."
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
            <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#374151' }}>
              Foto actual del mural
            </div>
            {loadingMural ? (
              <div className="rounded-lg bg-gray-100 animate-pulse" style={{ height: '160px', border: '1px solid #e2e8f0' }} />
            ) : previousImageUrl ? (
              <img
                src={previousImageUrl}
                alt="Foto actual"
                className="rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                style={{ border: '1px solid #e2e8f0', maxHeight: '360px', width: 'auto', display: 'block' }}
                onClick={() => setSelectedImage(previousImageUrl)}
              />
            ) : (
              <div className="rounded-lg flex items-center justify-center text-sm" style={{ height: '160px', border: '1px solid #e2e8f0', color: '#94a3b8', background: '#f8fafc' }}>
                No se pudo cargar la imagen
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#374151', letterSpacing: '0.5px' }}>
              Nueva foto <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <div className="mt-1">
              <ImageUploader
                onFileSelect={handleFileSelect}
                onError={(error) => setError(error)}
                disabled={isSubmitting || isUploadingImage}
                resetKey={resetKey}
              />
            </div>
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
            disabled={isSubmitting || isUploadingImage}
            className="px-5 py-2 text-sm font-bold rounded-lg text-white transition-colors"
            style={{ background: isSubmitting || isUploadingImage ? '#93c5fd' : '#1e40af' }}
          >
            {isUploadingImage
              ? MESSAGES.LOADING.SUBIENDO_IMAGEN
              : isSubmitting
              ? 'Enviando...'
              : 'Enviar reporte →'}
          </button>
        </div>
      </form>
      <ImageModal imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />
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
