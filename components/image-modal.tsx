'use client';

import { memo, useState, useEffect, useCallback, useRef } from 'react';

interface ImageModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

function ImageModalComponent({ imageUrl, onClose }: ImageModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (imageUrl) {
      setIsLoading(true);
    }
  }, [imageUrl]);

  // Close on Escape key
  useEffect(() => {
    if (!imageUrl) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [imageUrl, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (imageUrl) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [imageUrl]);

  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleImageError = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === backdropRef.current) onClose();
    },
    [onClose],
  );

  if (!imageUrl) return null;

  return (
    <div
      ref={backdropRef}
      role="dialog"
      aria-modal="true"
      aria-label="Imagen del mural"
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
    >
      <div className="relative flex items-center justify-center min-h-[200px] w-full max-w-5xl mx-4">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg z-50 bg-white">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-medium text-gray-700">Cargando imagen...</p>
            </div>
          </div>
        )}
        <img
          src={imageUrl}
          alt="Mural"
          className={`max-w-full max-h-[90vh] rounded-lg transition-opacity duration-300 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      </div>
    </div>
  );
}

export default memo(ImageModalComponent);
