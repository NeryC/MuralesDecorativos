'use client';

import { useState, useRef, useEffect } from 'react';
import ImageModal from '@/components/image-modal';

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
      const errorMsg = 'Por favor selecciona un archivo de imagen válido';
      if (onError) {
        onError(errorMsg);
      }
      return;
    }

    // Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      const errorMsg = 'La imagen es demasiado grande. Máximo 10MB';
      if (onError) {
        onError(errorMsg);
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
      {!preview && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={disabled}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
          required
        />
      )}
      {preview && (
        <div className="flex items-start gap-3">
          <div className="relative inline-block">
            <img
              src={preview}
              alt="Preview"
              className="max-w-[200px] max-h-[200px] w-auto h-auto rounded-md border border-gray-300 object-contain cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setSelectedImage(preview)}
            />
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={handleRemove}
              className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 flex-shrink-0"
              aria-label="Eliminar imagen"
            >
              ×
            </button>
          )}
        </div>
      )}
      <ImageModal imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />
    </div>
  );
}
