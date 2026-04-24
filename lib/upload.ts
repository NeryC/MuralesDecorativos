/**
 * Sube una imagen al servidor
 * Retorna la URL de la imagen subida
 */
export async function uploadImage(
  file: File,
  type: "original" | "thumbnail" = "original",
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", type);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Error al subir la imagen ${type}`);
  }

  const data = await response.json();
  return data.url;
}

/**
 * Sube una imagen original y su thumbnail
 * Retorna las URLs de ambas imágenes
 */
export async function uploadImageWithThumbnail(
  originalFile: File,
  thumbnailFile: File,
): Promise<{ originalUrl: string; thumbnailUrl: string }> {
  const [originalUrl, thumbnailUrl] = await Promise.all([
    uploadImage(originalFile, "original"),
    uploadImage(thumbnailFile, "thumbnail"),
  ]);

  return { originalUrl, thumbnailUrl };
}
