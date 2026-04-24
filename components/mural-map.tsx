'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DEFAULT_COORDINATES } from '@/lib/constants';
import { extractCoordinates } from '@/lib/utils';
import { buildPopupHTML } from '@/lib/map-popup';
import type { MuralWithModificaciones } from '@/lib/types';

interface MuralMapProps {
  murales: MuralWithModificaciones[];
  onImageClick?: (url: string) => void;
  highlightId?: string;
}

const RED_ICON = '/marker-icon-red.png';
const GREEN_ICON = '/marker-icon-green.png';
const BLUE_ICON = '/marker-icon-blue.png';
const SHADOW = '/marker-shadow.png';

function makeIcon(iconUrl: string) {
  return new L.Icon({
    iconUrl,
    iconRetinaUrl: iconUrl.replace('.png', '-2x.png'),
    shadowUrl: SHADOW,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
}

export function MuralMap({ murales, onImageClick, highlightId }: MuralMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || typeof window === 'undefined') return;

    delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });

    if (!mapRef.current) {
      const mapContainer = document.getElementById('mural-map');
      if (!mapContainer) return;

      mapRef.current = L.map('mural-map').setView(
        [DEFAULT_COORDINATES.lat, DEFAULT_COORDINATES.lng],
        13
      );

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(mapRef.current);

      const invalidate = () => mapRef.current?.invalidateSize();
      requestAnimationFrame(() => {
        invalidate();
        setTimeout(invalidate, 100);
        setTimeout(invalidate, 300);
      });
    } else {
      const invalidate = () => mapRef.current?.invalidateSize();
      requestAnimationFrame(() => {
        invalidate();
        setTimeout(invalidate, 100);
      });
    }

    // Exponer función global para clicks en imágenes dentro de popups
    if (typeof window !== 'undefined') {
      (window as unknown as Record<string, unknown>).openImageModal = (imageUrl: string) => {
        onImageClick?.(imageUrl);
      };
    }

    // Limpiar marcadores existentes
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) mapRef.current!.removeLayer(layer);
    });

    const redIcon = makeIcon(RED_ICON);
    const greenIcon = makeIcon(GREEN_ICON);
    const blueIcon = makeIcon(BLUE_ICON);

    let highlightedMarker: L.Marker | null = null;
    let highlightedCoords: { lat: number; lng: number } | null = null;

    murales.forEach((mural) => {
      const coords = extractCoordinates(mural.url_maps);
      if (!coords || !mapRef.current) return;

      const isHighlighted = highlightId === mural.id;
      const isModifiedAprobado = mural.estado === 'modificado_aprobado';
      const isAprobado = mural.estado === 'aprobado';

      if (isHighlighted) {
        highlightedCoords = coords;
      }

      const modAprobada = mural.mural_modificaciones
        ?.filter((mod) => mod.estado_solicitud === 'aprobada')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

      const popupContent = buildPopupHTML(mural, isModifiedAprobado ? modAprobada : undefined);

      let icon: L.Icon | undefined;
      if (isHighlighted) icon = blueIcon;
      else if (isModifiedAprobado) icon = greenIcon;
      else if (isAprobado) icon = redIcon;

      const marker = L.marker([coords.lat, coords.lng], icon ? { icon } : {})
        .addTo(mapRef.current!)
        .bindPopup(popupContent, { maxWidth: 280 });

      if (isHighlighted) highlightedMarker = marker;
    });

    if (highlightedMarker && highlightedCoords && mapRef.current) {
      const coords = highlightedCoords as { lat: number; lng: number };
      setTimeout(() => {
        if (mapRef.current && highlightedMarker) {
          mapRef.current.flyTo([coords.lat, coords.lng], 16, { animate: true, duration: 1.0 });
          setTimeout(() => highlightedMarker?.openPopup(), 1200);
        }
      }, 100);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [isClient, murales, onImageClick, highlightId]);

  if (!isClient) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-slate-50">
        <p className="text-slate-400 text-sm">Cargando mapa...</p>
      </div>
    );
  }

  return <div id="mural-map" className="h-full w-full" style={{ minHeight: '500px' }} />;
}
