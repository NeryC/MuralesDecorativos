'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DEFAULT_COORDINATES } from '@/lib/constants';
import { extractCoordinates } from '@/lib/utils';
import { MuralWithModificaciones } from '@/lib/types';

interface MapViewProps {
  murales: MuralWithModificaciones[];
  onImageClick?: (imageUrl: string) => void;
  highlightId?: string;
}

export default function MapView({ murales, onImageClick, highlightId }: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Debug: log highlightId
  useEffect(() => {
    if (highlightId) {
      console.log('Highlight ID recibido:', highlightId);
      console.log('Murales disponibles:', murales.length);
      const foundMural = murales.find(m => m.id === highlightId);
      console.log('Mural encontrado:', foundMural ? foundMural.nombre : 'NO ENCONTRADO');
    }
  }, [highlightId, murales]);

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

    // Red marker icon for approved murals
    const redMarkerIcon = new L.Icon({
      iconRetinaUrl:
        'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      iconUrl:
        'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
      shadowUrl:
        'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    // Green marker icon for modified_aprobado murals
    const greenMarkerIcon = new L.Icon({
      iconRetinaUrl:
        'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
      iconUrl:
        'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
      shadowUrl:
        'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    // Blue marker icon for highlighted murals
    const blueMarkerIcon = new L.Icon({
      iconRetinaUrl:
        'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
      iconUrl:
        'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
      shadowUrl:
        'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
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

    let highlightedMarker: L.Marker | null = null;
    let highlightedCoords: { lat: number; lng: number } | null = null;

    // Add markers for each mural
    murales.forEach((mural) => {
      const coords = extractCoordinates(mural.url_maps);
      if (!coords || !mapRef.current) return;

      const isHighlighted = highlightId === mural.id;
      const isModifiedAprobado = mural.estado === 'modificado_aprobado';
      const isAprobado = mural.estado === 'aprobado';
      
      // Guardar coordenadas del mural resaltado
      if (isHighlighted && coords) {
        highlightedCoords = { lat: coords.lat, lng: coords.lng };
      }
      
      // Obtener la última modificación aprobada para mostrar antes/después
      const modAprobada = mural.mural_modificaciones
        ?.filter((mod) => mod.estado_solicitud === 'aprobada')
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        )[0];
      
      let popupContent = `<div style="text-align:center;"><b>${mural.nombre}</b>`;

      if (isModifiedAprobado && modAprobada) {
        popupContent += `<br><span style="color:red; font-weight:bold;">⚠️ REPORTE DE CAMBIO</span>`;
        popupContent += `<div style="display:flex; gap:5px; margin-top:5px;">`;
        
        // Before - usar la imagen original guardada en la modificación
        popupContent += `<div style="flex:1;"><u>Antes:</u><br>`;
        if (modAprobada.imagen_original_url) {
          const imgUrl = modAprobada.imagen_original_thumbnail_url || modAprobada.imagen_original_url;
          popupContent += `<img src="${imgUrl}" style="width:100%; max-width:100px; height:auto; border-radius:4px; cursor:pointer;" onclick="window.openImageModal('${modAprobada.imagen_original_url}')">`;
        } else if (mural.imagen_thumbnail_url || mural.imagen_url) {
          // Fallback si no hay imagen original guardada (modificaciones antiguas)
          const imgUrl = mural.imagen_thumbnail_url || mural.imagen_url;
          popupContent += `<img src="${imgUrl}" style="width:100%; max-width:100px; height:auto; border-radius:4px; cursor:pointer;" onclick="window.openImageModal('${mural.imagen_url}')">`;
        }
        popupContent += `<br><small>${mural.comentario || ''}</small></div>`;

        // After - usar la imagen de la modificación aprobada
        popupContent += `<div style="flex:1;"><u>Ahora:</u><br>`;
        if (modAprobada.nueva_imagen_url) {
          const imgUrl = modAprobada.nueva_imagen_thumbnail_url || modAprobada.nueva_imagen_url;
          popupContent += `<img src="${imgUrl}" style="width:100%; max-width:100px; height:auto; border-radius:4px; cursor:pointer;" onclick="window.openImageModal('${modAprobada.nueva_imagen_url}')">`;
        } else if (mural.imagen_thumbnail_url || mural.imagen_url) {
          // Fallback a la imagen actual del mural
          const imgUrl = mural.imagen_thumbnail_url || mural.imagen_url;
          popupContent += `<img src="${imgUrl}" style="width:100%; max-width:100px; height:auto; border-radius:4px; cursor:pointer;" onclick="window.openImageModal('${mural.imagen_url}')">`;
        }
        popupContent += `<br><small>${modAprobada.nuevo_comentario || mural.comentario || ''}</small></div>`;
        
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
      if (!isModifiedAprobado) {
        popupContent += `<br><br><a href="/reportar?id=${mural.id}&name=${encodeURIComponent(mural.nombre)}" style="color: #d32f2f; font-size: 0.9em;">🚩 Reportar Eliminado/Modificado</a>`;
      }
      
      popupContent += `</div>`;

      // Determinar qué icono usar según el estado
      let markerIcon = undefined;
      if (isHighlighted) {
        // Highlight: azul
        markerIcon = blueMarkerIcon;
      } else if (isModifiedAprobado) {
        // Modificado aprobado: verde
        markerIcon = greenMarkerIcon;
      } else if (isAprobado) {
        // Aprobado: rojo
        markerIcon = redMarkerIcon;
      }

      const markerOptions = markerIcon ? { icon: markerIcon } : {};
      const marker = L.marker([coords.lat, coords.lng], markerOptions)
        .addTo(mapRef.current!)
        .bindPopup(popupContent);

      // Si es el mural resaltado, guardar referencia
      if (isHighlighted) {
        highlightedMarker = marker;
      }
    });

    // Si hay un mural resaltado, centrar el mapa y abrir el popup
    if (highlightedMarker && highlightedCoords && mapRef.current) {
      const coords: { lat: number; lng: number } = highlightedCoords;
      console.log('Resaltando mural en:', coords);
      
      // Esperar un poco para asegurar que el mapa esté listo
      setTimeout(() => {
        if (mapRef.current && highlightedMarker) {
          // Usar flyTo para una animación suave
          mapRef.current.flyTo([coords.lat, coords.lng], 16, {
            animate: true,
            duration: 1.0
          });
          
          // Abrir el popup después de que el mapa se haya movido
          setTimeout(() => {
            if (highlightedMarker && mapRef.current) {
              highlightedMarker.openPopup();
              console.log('Popup abierto para mural resaltado');
            }
          }, 1200);
        }
      }, 100);
    } else if (highlightId && !highlightedMarker) {
      console.warn('Highlight ID proporcionado pero no se encontró el mural:', highlightId);
      console.warn('Murales disponibles:', murales.map(m => ({ id: m.id, nombre: m.nombre })));
    }

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
  }, [isClient, murales, onImageClick, highlightId]);

  if (!isClient) {
    return <div className="h-screen bg-gray-100 flex items-center justify-center">Cargando mapa...</div>;
  }

  return <div id="map-view" className="h-full w-full" />;
}
