'use client';

import { useState } from 'react';
import { compressImage } from '@/lib/utils';
import { IMAGE_COMPRESSION } from '@/lib/constants';

interface ImageUploaderProps {
  onUploadComplete: (originalUrl: string, thumbnailUrl: string) => void;
  onUploadStart?: () => void;
  onUploadError?: (error: string) => void;
}

export default function ImageUploader({ onUploadComplete, onUploadStart, onUploadError }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Compress and upload
    try {
      setIsUploading(true);
      if (onUploadStart) onUploadStart();

      // Compress original and thumbnail in paralelo para mejorar rendimiento
      const [compressedOriginal, compressedThumbnail] = await Promise.all([
        compressImage(
          file,
          IMAGE_COMPRESSION.maxWidth,
          IMAGE_COMPRESSION.maxHeight,
          IMAGE_COMPRESSION.quality
        ),
        compressImage(
          file,
          IMAGE_COMPRESSION.thumbnailMaxWidth,
          IMAGE_COMPRESSION.thumbnailMaxHeight,
          IMAGE_COMPRESSION.thumbnailQuality
        ),
      ]);

      // Upload original
      const formDataOriginal = new FormData();
      formDataOriginal.append('file', compressedOriginal, 'original.jpg');
      formDataOriginal.append('type', 'original');

      const responseOriginal = await fetch('/api/upload', {
        method: 'POST',
        body: formDataOriginal,
      });

      if (!responseOriginal.ok) {
        throw new Error('Error al subir la imagen original');
      }

      const dataOriginal = await responseOriginal.json();

      // Upload thumbnail
      const formDataThumbnail = new FormData();
      formDataThumbnail.append('file', compressedThumbnail, 'thumbnail.jpg');
      formDataThumbnail.append('type', 'thumbnail');

      const responseThumbnail = await fetch('/api/upload', {
        method: 'POST',
        body: formDataThumbnail,
      });

      if (!responseThumbnail.ok) {
        throw new Error('Error al subir el thumbnail');
      }

      const dataThumbnail = await responseThumbnail.json();

      onUploadComplete(dataOriginal.url, dataThumbnail.url);
    } catch (error) {
      console.error('Error uploading image:', error);
      if (onUploadError) {
        onUploadError(error instanceof Error ? error.message : 'Error al subir la imagen');
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={isUploading}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
        required
      />
      {isUploading && (
        <p className="text-sm text-blue-600 mt-2">Subiendo imagen...</p>
      )}
      {preview && !isUploading && (
        <div className="mt-4">
          <img
            src={preview}
            alt="Preview"
            className="max-w-full max-h-64 rounded-md border border-gray-300"
          />
        </div>
      )}
    </div>
  );
}
