import { IMAGE_COMPRESSION } from "./constants";

/**
 * Comprime una imagen a un tamaño y calidad específicos
 */
export async function compressImage(
  file: File,
  maxWidth: number = IMAGE_COMPRESSION.maxWidth,
  maxHeight: number = IMAGE_COMPRESSION.maxHeight,
  quality: number = IMAGE_COMPRESSION.quality,
): Promise<Blob> {
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });

  let width = bitmap.width;
  let height = bitmap.height;

  if (width > height) {
    if (width > maxWidth) {
      height = Math.round((height * maxWidth) / width);
      width = maxWidth;
    }
  } else {
    if (height > maxHeight) {
      width = Math.round((width * maxHeight) / height);
      height = maxHeight;
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("No se pudo obtener el contexto del canvas");
  }

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Error al comprimir la imagen"));
      },
      "image/webp",
      quality,
    );
  });
}
