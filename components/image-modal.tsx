'use client';

import ReactModal from 'react-modal';

interface ImageModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

export default function ImageModal({ imageUrl, onClose }: ImageModalProps) {
  const isOpen = !!imageUrl;

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
      <img
        src={imageUrl ?? undefined}
        alt="Mural"
        className="max-w-full max-h-[90vh] rounded-lg"
      />
    </ReactModal>
  );
}
