"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import ImageModal from "@/components/image-modal";
import { Skeleton } from "@/components/ui/skeleton";
import type { MuralWithModificaciones } from "@/lib/types";

const MuralMap = dynamic(() => import("@/components/mural-map").then((m) => m.MuralMap), {
  ssr: false,
  loading: () => <Skeleton className="absolute inset-0" />,
});

interface HomeMapClientProps {
  murales: MuralWithModificaciones[];
  highlightId?: string;
}

export function HomeMapClient({ murales, highlightId }: HomeMapClientProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleImageClick = useCallback((url: string) => {
    setSelectedImage(url);
  }, []);

  const handleCloseImage = useCallback(() => {
    setSelectedImage(null);
  }, []);

  return (
    <>
      <MuralMap murales={murales} onImageClick={handleImageClick} highlightId={highlightId} />
      <ImageModal imageUrl={selectedImage} onClose={handleCloseImage} />
    </>
  );
}
