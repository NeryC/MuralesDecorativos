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
    const q = params.get("q");

    if (q) {
      const parts = q.split(",");
      if (parts.length === 2) {
        const lat = parseFloat(parts[0]);
        const lng = parseFloat(parts[1]);

        if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
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
