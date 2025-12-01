import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { IMAGE_COMPRESSION } from "./constants"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Comprime una imagen a un tamaño y calidad específicos
 */
export async function compressImage(
  file: File,
  maxWidth: number = IMAGE_COMPRESSION.maxWidth,
  maxHeight: number = IMAGE_COMPRESSION.maxHeight,
  quality: number = IMAGE_COMPRESSION.quality
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calcular nuevas dimensiones manteniendo aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo obtener el contexto del canvas'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Error al comprimir la imagen'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = (err) => reject(err);
    };
    
    reader.onerror = (err) => reject(err);
  });
}

/**
 * Valida si una URL es de Google Maps
 */
export function isValidGoogleMapsUrl(url: string): boolean {
  return url.includes("google.com/maps") || url.includes("maps.app.goo.gl");
}

/**
 * Extrae coordenadas de una URL de Google Maps
 */
export function extractCoordinates(url: string): { lat: number; lng: number } | null {
  try {
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.search);
    const q = params.get('q');
    
    if (q) {
      const parts = q.split(',');
      if (parts.length === 2) {
        const lat = parseFloat(parts[0]);
        const lng = parseFloat(parts[1]);
        
        if (!isNaN(lat) && !isNaN(lng)) {
          return { lat, lng };
        }
      }
    }
  } catch (e) {
    console.error("Error parsing URL:", url, e);
  }
  
  return null;
}

/**
 * Genera una URL de Google Maps a partir de coordenadas
 */
export function generateGoogleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

/**
 * Formatea una fecha a formato legible
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-PY', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Sube una imagen al servidor
 * Retorna las URLs de la imagen original y el thumbnail
 */
export async function uploadImage(
  file: File,
  type: 'original' | 'thumbnail' = 'original'
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);

  const response = await fetch('/api/upload', {
    method: 'POST',
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
  thumbnailFile: File
): Promise<{ originalUrl: string; thumbnailUrl: string }> {
  const [originalUrl, thumbnailUrl] = await Promise.all([
    uploadImage(originalFile, 'original'),
    uploadImage(thumbnailFile, 'thumbnail'),
  ]);

  return { originalUrl, thumbnailUrl };
}