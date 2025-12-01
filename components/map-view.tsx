'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DEFAULT_COORDINATES } from '@/lib/constants';
import { extractCoordinates } from '@/lib/utils';
import { Mural } from '@/lib/types';

interface MapViewProps {
  murales: Mural[];
  onImageClick?: (imageUrl: string) => void;
}

export default function MapView({ murales, onImageClick }: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || typeof window === 'undefined') return;

    // Fix Leaflet default icon issue
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });

    // Red X icon for modified murals
    const redXIcon = L.divIcon({
      html: '<div style="font-size: 24px; color: red; font-weight: bold; text-shadow: 1px 1px 2px white;">❌</div>',
      className: 'custom-div-icon',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });

    // Initialize map
    if (!mapRef.current) {
      mapRef.current = L.map('map-view').setView(
        [DEFAULT_COORDINATES.lat, DEFAULT_COORDINATES.lng],
        13
      );

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 25,
        attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(mapRef.current);
    }

    // Clear existing markers
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        mapRef.current!.removeLayer(layer);
      }
    });

    // Add markers for each mural
    murales.forEach((mural) => {
      const coords = extractCoordinates(mural.url_maps);
      if (!coords || !mapRef.current) return;

      const isModified = mural.estado === 'modificado_aprobado';
      
      let popupContent = `<div style="text-align:center;"><b>${mural.nombre}</b>`;

      if (isModified) {
        popupContent += `<br><span style="color:red; font-weight:bold;">⚠️ REPORTE DE CAMBIO</span>`;
        popupContent += `<div style="display:flex; gap:5px; margin-top:5px;">`;
        
        // Before
        popupContent += `<div style="flex:1;"><u>Antes:</u><br>`;
        if (mural.imagen_thumbnail_url || mural.imagen_url) {
          const imgUrl = mural.imagen_thumbnail_url || mural.imagen_url;
          popupContent += `<img src="${imgUrl}" style="width:100%; max-width:100px; height:auto; border-radius:4px; cursor:pointer;" onclick="window.openImageModal('${mural.imagen_url}')">`;
        }
        popupContent += `<br><small>${mural.comentario || ''}</small></div>`;

        // After
        popupContent += `<div style="flex:1;"><u>Ahora:</u><br>`;
        if (mural.nueva_imagen_thumbnail_url || mural.nueva_imagen_url) {
          const imgUrl = mural.nueva_imagen_thumbnail_url || mural.nueva_imagen_url;
          popupContent += `<img src="${imgUrl}" style="width:100%; max-width:100px; height:auto; border-radius:4px; cursor:pointer;" onclick="window.openImageModal('${mural.nueva_imagen_url}')">`;
        }
        popupContent += `<br><small>${mural.nuevo_comentario || ''}</small></div>`;
        
        popupContent += `</div>`;
      } else {
        // Normal
        popupContent += `<br>${mural.comentario || ''}`;
        if (mural.imagen_thumbnail_url || mural.imagen_url) {
          const imgUrl = mural.imagen_thumbnail_url || mural.imagen_url;
          popupContent += `<br><img src="${imgUrl}" style="width:100%; max-width:200px; height:auto; margin-top:5px; border-radius:4px; cursor:pointer;" onclick="window.openImageModal('${mural.imagen_url}')">`;
        }
      }

      popupContent += `<br><a href="${mural.url_maps}" target="_blank" style="display:inline-block; margin-top:5px;">Ver en Google Maps</a>`;
      
      // Button to report removed (only if not already modified)
      if (!isModified) {
        popupContent += `<br><br><a href="/reportar?id=${mural.id}&name=${encodeURIComponent(mural.nombre)}" style="color: #d32f2f; font-size: 0.9em;">🚩 Reportar Eliminado/Modificado</a>`;
      }
      
      popupContent += `</div>`;

      const markerOptions = isModified ? { icon: redXIcon } : {};
      L.marker([coords.lat, coords.lng], markerOptions)
        .addTo(mapRef.current!)
        .bindPopup(popupContent);
    });

    // Expose function to global scope for popup clicks
    if (typeof window !== 'undefined') {
      (window as any).openImageModal = (imageUrl: string) => {
        if (onImageClick) {
          onImageClick(imageUrl);
        }
      };
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [isClient, murales, onImageClick]);

  if (!isClient) {
    return <div className="h-screen bg-gray-100 flex items-center justify-center">Cargando mapa...</div>;
  }

  return <div id="map-view" className="h-full w-full" />;
}
