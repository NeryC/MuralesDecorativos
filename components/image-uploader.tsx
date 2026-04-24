"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  onFileSelect: (file: File | null) => void;
  onError?: (msg: string) => void;
  disabled?: boolean;
  resetKey?: number;
}

const ACCEPTED = "image/jpeg,image/png,image/webp";
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

export default function ImageUploader({
  onFileSelect,
  onError,
  disabled,
  resetKey,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    setPreview(null);
    setFileName(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [resetKey]);

  const handleFile = useCallback(
    (file: File | null) => {
      if (!file) {
        setPreview(null);
        setFileName(null);
        onFileSelect(null);
        return;
      }
      if (file.size > MAX_SIZE_BYTES) {
        onError?.("La imagen supera el tamaño máximo de 10 MB.");
        return;
      }
      if (!ACCEPTED.split(",").includes(file.type)) {
        onError?.("Solo se permiten imágenes JPG, PNG o WebP.");
        return;
      }
      const url = URL.createObjectURL(file);
      setPreview(url);
      setFileName(file.name);
      onFileSelect(file);
    },
    [onFileSelect, onError],
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0] ?? null);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0] ?? null);
  };

  const clear = () => {
    handleFile(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Imagen <span className="text-destructive">*</span>
      </label>

      {preview ? (
        <div className="relative rounded-md border overflow-hidden bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt={fileName ?? "Vista previa"}
            className="w-full h-auto max-h-72 object-contain"
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={clear}
            disabled={disabled}
            className="absolute top-2 right-2"
          >
            <X className="size-4" aria-hidden="true" />
            Cambiar
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          disabled={disabled}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-8 transition-colors",
            "text-muted-foreground hover:border-accent hover:text-accent",
            dragOver && "border-accent text-accent bg-accent/5",
            disabled && "opacity-50 cursor-not-allowed",
          )}
        >
          <ImagePlus className="size-8" aria-hidden="true" />
          <span className="text-sm font-medium">
            Tocá o arrastrá una imagen
          </span>
          <span className="text-xs">JPG, PNG o WebP · máx 10 MB</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        onChange={onInputChange}
        disabled={disabled}
        className="sr-only"
      />
    </div>
  );
}
