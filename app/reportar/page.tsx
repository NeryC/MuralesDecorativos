'use client';

import { useState, Suspense, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageShell } from '@/components/page-shell';
import { StatusAlert } from '@/components/status-alert';
import { FormField } from '@/components/form-field';
import ImageUploader from '@/components/image-uploader';
import ImageModal from '@/components/image-modal';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useFormSubmit } from '@/hooks/use-form-submit';
import { compressImage, uploadImageWithThumbnail } from '@/lib/utils';
import { IMAGE_COMPRESSION } from '@/lib/constants';
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
  const [isUploadingImage, setIsUploadingImage] = useState(false);
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
    successMessage: '¡Reporte enviado con éxito! Gracias por tu colaboración.',
    errorMessage: 'Error al enviar el reporte.',
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
      setError('Por favor selecciona una foto.');
      return;
    }

    if (!muralId) {
      setError('ID de mural no válido.');
      return;
    }

    try {
      setIsUploadingImage(true);

      // Compress original and thumbnail in parallel
      const [compressedOriginal, compressedThumbnail] = await Promise.all([
        compressImage(
          selectedFile,
          IMAGE_COMPRESSION.maxWidth,
          IMAGE_COMPRESSION.maxHeight,
          IMAGE_COMPRESSION.quality
        ),
        compressImage(
          selectedFile,
          IMAGE_COMPRESSION.thumbnailMaxWidth,
          IMAGE_COMPRESSION.thumbnailMaxHeight,
          IMAGE_COMPRESSION.thumbnailQuality
        ),
      ]);

      // Convert Blobs to Files
      const originalFile = new File([compressedOriginal], 'original.jpg', { type: 'image/jpeg' });
      const thumbnailFile = new File([compressedThumbnail], 'thumbnail.jpg', { type: 'image/jpeg' });

      // Upload images
      const { originalUrl, thumbnailUrl } = await uploadImageWithThumbnail(originalFile, thumbnailFile);

      // Update form data with image URLs and submit
      await submit({
        ...formData,
        nueva_imagen_url: originalUrl,
        nueva_imagen_thumbnail_url: thumbnailUrl,
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      setError(error instanceof Error ? error.message : 'Error al subir la imagen');
    } finally {
      setIsUploadingImage(false);
    }
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

  const previousImageUrl = mural?.imagen_url || mural?.imagen_thumbnail_url;

  return (
    <PageShell title="Reportar Mural Eliminado o Modificado" scrollableMain>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
        <p className="text-gray-600">
          Por favor, sube una foto actual del lugar y un comentario explicando la situación.
        </p>

        {previousImageUrl && (
          <FormField label="Foto Anterior">
            <div className="relative inline-block">
              <img
                src={previousImageUrl}
                alt="Foto anterior del mural"
                className="max-w-[300px] max-h-[300px] w-auto h-auto rounded-md border border-gray-300 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setSelectedImage(previousImageUrl)}
              />
            </div>
          </FormField>
        )}

        <FormField label="Nueva Foto (Obligatorio)" required>
          <ImageUploader
            onFileSelect={handleFileSelect}
            onError={(error) => setError(error)}
            disabled={isSubmitting || isUploadingImage}
            resetKey={resetKey}
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

        <Button type="submit" variant="danger" disabled={isSubmitting || isUploadingImage} className="w-full">
          {isUploadingImage ? 'Subiendo imagen...' : isSubmitting ? 'Enviando...' : 'Enviar Reporte'}
        </Button>

        {status && (
          <StatusAlert type={status.type}>
            {status.message}
          </StatusAlert>
        )}
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
