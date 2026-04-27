"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { ImageOff } from "lucide-react";

const ImageModal = dynamic(() => import("@/components/image-modal"));

interface Props {
  thumbnailUrl: string | null | undefined;
  fullUrl: string | null | undefined;
  alt: string;
  className?: string;
  emptyText?: string;
}

export function ClickableThumbnail({
  thumbnailUrl,
  fullUrl,
  alt,
  className,
  emptyText = "Sin imagen",
}: Props) {
  const [open, setOpen] = useState(false);
  const src = thumbnailUrl || fullUrl || null;
  const target = fullUrl || thumbnailUrl || null;

  if (!src) {
    return (
      <div
        className={`${className ?? ""} flex flex-col items-center justify-center gap-1 bg-muted text-muted-foreground`}
      >
        <ImageOff className="size-4" aria-hidden="true" />
        <span className="text-xs">{emptyText}</span>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => target && setOpen(true)}
        className={`${className ?? ""} group relative overflow-hidden bg-muted cursor-zoom-in transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
        aria-label={`Ampliar imagen: ${alt}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} loading="lazy" className="w-full h-full object-cover" />
      </button>
      <ImageModal imageUrl={open ? target : null} onClose={() => setOpen(false)} />
    </>
  );
}
