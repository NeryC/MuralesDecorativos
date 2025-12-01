'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DEFAULT_COORDINATES } from '@/lib/constants';
import { generateGoogleMapsUrl } from '@/lib/utils';

interface MapPickerProps {
  onLocationSelect: (url: string, lat: number, lng: number) => void;
  initialZoom?: number;
}

export default function MapPicker({ onLocationSelect, initialZoom }: MapPickerProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onLocationSelectRef = useRef(onLocationSelect);
  const [isClient, setIsClient] = useState(false);

  // Update ref when callback changes
  useEffect(() => {
    onLocationSelectRef.current = onLocationSelect;
  }, [onLocationSelect]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || typeof window === 'undefined') return;

    // Fix Leaflet default icon issue in Next.js
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });

    // Initialize map
    if (!mapRef.current) {
      const zoom = initialZoom ?? DEFAULT_COORDINATES.zoom;
      mapRef.current = L.map('map-picker', {
        preferCanvas: false,
      }).setView(
        [DEFAULT_COORDINATES.lat, DEFAULT_COORDINATES.lng],
        zoom
      );

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 20,
        attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(mapRef.current);
      
      // Ensure the initial zoom is applied after map is ready
      requestAnimationFrame(() => {
        if (initialZoom && mapRef.current) {
          mapRef.current.setZoom(initialZoom, { animate: false });
          mapRef.current.invalidateSize();
        }
      });

      // Invalidate size to ensure map respects container width
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        mapRef.current?.invalidateSize();
      });

      // Try to get user location
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition((position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          mapRef.current?.setView([lat, lng], 15);
          requestAnimationFrame(() => {
            mapRef.current?.invalidateSize();
          });
        });
      }

      // Add click handler
      const handleMapClick = (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;

        // Preserve current zoom and view
        const currentZoom = mapRef.current?.getZoom();
        const currentCenter = mapRef.current?.getCenter();

        if (markerRef.current) {
          markerRef.current.setLatLng(e.latlng);
        } else {
          markerRef.current = L.marker(e.latlng).addTo(mapRef.current!);
        }

        // Maintain zoom and view after marker placement
        if (currentZoom && currentCenter) {
          mapRef.current?.setView(currentCenter, currentZoom, { animate: false });
        }

        const url = generateGoogleMapsUrl(lat, lng);
        onLocationSelectRef.current(url, lat, lng);
      };

      mapRef.current.on('click', handleMapClick);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.off('click');
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [isClient]);

  // Invalidate map size when component is fully mounted
  useEffect(() => {
    if (mapRef.current) {
      requestAnimationFrame(() => {
        mapRef.current?.invalidateSize();
      });
    }
  }, [isClient]);

  if (!isClient) {
    return <div className="h-full bg-gray-100 rounded-md flex items-center justify-center">Cargando mapa...</div>;
  }

  return <div id="map-picker" className="h-full w-full max-w-full rounded-md border border-gray-300 box-border overflow-hidden" />;
}
