'use client';

import { useState, useRef, useEffect } from 'react';
import ImageModal from '@/components/image-modal';
import { MESSAGES } from '@/lib/messages';
import { FILE_LIMITS } from '@/lib/ui-constants';

interface ImageUploaderProps {
  onFileSelect: (file: File | null) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  resetKey?: number | string;
}

export default function ImageUploader({ onFileSelect, onError, disabled, resetKey }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset when resetKey changes
  useEffect(() => {
    if (resetKey !== undefined) {
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [resetKey]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      if (onError) {
        onError(MESSAGES.VALIDATION.ARCHIVO_INVALIDO);
      }
      return;
    }

    // Validar tamaño (máximo 10MB)
    if (file.size > FILE_LIMITS.MAX_IMAGE_SIZE_BYTES) {
      if (onError) {
        onError(MESSAGES.VALIDATION.ARCHIVO_MUY_GRANDE);
      }
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Notify parent component about the selected file
    onFileSelect(file);
  };

  const handleRemove = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onFileSelect(null); // Clear the file
  };

  return (
    <div>
      <div
        className="relative cursor-pointer transition-colors"
        style={{
          border: '2px dashed #cbd5e1',
          borderRadius: '10px',
          padding: '24px',
          textAlign: 'center',
          background: preview ? 'transparent' : '#f8fafc',
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        {preview ? (
          <img
            src={preview}
            alt="Preview"
            className="mx-auto rounded-lg object-cover"
            style={{ maxHeight: '160px', maxWidth: '100%' }}
          />
        ) : (
          <>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>📷</div>
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
              Hacer click para seleccionar foto
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
              JPG, PNG, WebP · Máx. 10MB
            </div>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      {preview && !disabled && (
        <div className="flex justify-end mt-2">
          <button
            type="button"
            onClick={handleRemove}
            className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 flex-shrink-0"
            aria-label="Eliminar imagen"
          >
            ×
          </button>
        </div>
      )}
      <ImageModal imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />
    </div>
  );
}
