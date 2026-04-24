"use client";

import { memo } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface ImageModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

function ImageModal({ imageUrl, onClose }: ImageModalProps) {
  const open = imageUrl !== null;
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="p-0 bg-transparent border-0 shadow-none max-w-[95vw] max-h-[95vh] w-auto h-auto">
        <DialogTitle className="sr-only">Imagen del mural</DialogTitle>
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt="Imagen ampliada del mural"
            className="max-w-full max-h-[95vh] object-contain rounded-md"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

export default memo(ImageModal);
