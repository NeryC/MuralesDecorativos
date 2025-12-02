'use client';

import { memo, useState, useEffect, useCallback } from 'react';
import ReactModal from 'react-modal';

interface ImageModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

function ImageModalComponent({ imageUrl, onClose }: ImageModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const isOpen = !!imageUrl;

  // Reset loading state when imageUrl changes
  useEffect(() => {
    if (imageUrl) {
      setIsLoading(true);
    }
  }, [imageUrl]);

  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleImageError = useCallback(() => {
    setIsLoading(false);
  }, []);

  if (!isOpen) return null;

  return (
    <ReactModal
      isOpen={isOpen}
      onRequestClose={onClose}
      shouldCloseOnOverlayClick
      shouldCloseOnEsc
      overlayClassName="image-modal-overlay"
      className="image-modal-content"
      ariaHideApp={false}
    >
      <div className="relative flex items-center justify-center min-h-[200px] w-full">
        {isLoading && (
          <div 
            className="absolute inset-0 flex items-center justify-center rounded-lg z-50"
            style={{
              backgroundColor: '#FFFFFF',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-medium text-gray-700">Cargando imagen...</p>
            </div>
          </div>
        )}
        <img
          src={imageUrl ?? undefined}
          alt="Mural"
          className={`max-w-full max-h-[90vh] rounded-lg transition-opacity duration-300 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      </div>
    </ReactModal>
  );
}

export default memo(ImageModalComponent);
