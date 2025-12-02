'use client';

import { useState, useCallback } from 'react';
import { compressImage, uploadImageWithThumbnail } from '@/lib/utils';
import { IMAGE_COMPRESSION } from '@/lib/constants';
import { MESSAGES } from '@/lib/messages';

interface UseImageUploadOptions {
  onError?: (error: string) => void;
}

interface UseImageUploadReturn {
  isUploading: boolean;
  uploadImage: (file: File) => Promise<{ originalUrl: string; thumbnailUrl: string } | null>;
}

export function useImageUpload({ onError }: UseImageUploadOptions = {}): UseImageUploadReturn {
  const [isUploading, setIsUploading] = useState(false);

  const uploadImage = useCallback(
    async (file: File): Promise<{ originalUrl: string; thumbnailUrl: string } | null> => {
      setIsUploading(true);

      try {
        // Compress original and thumbnail in parallel
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

        // Convert Blobs to Files
        const originalFile = new File([compressedOriginal], 'original.jpg', { type: 'image/jpeg' });
        const thumbnailFile = new File([compressedThumbnail], 'thumbnail.jpg', { type: 'image/jpeg' });

        // Upload images
        const { originalUrl, thumbnailUrl } = await uploadImageWithThumbnail(originalFile, thumbnailFile);

        return { originalUrl, thumbnailUrl };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : MESSAGES.ERROR.SUBIR_IMAGEN;
        console.error('Error uploading image:', error);
        onError?.(errorMessage);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [onError]
  );

  return {
    isUploading,
    uploadImage,
  };
}

