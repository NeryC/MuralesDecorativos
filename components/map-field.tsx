'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

const MapPicker = dynamic(() => import('@/components/map-picker'), {
  ssr: false,
  loading: () => (
    <div className="h-full bg-gray-100 rounded-md flex items-center justify-center">
      Cargando mapa...
    </div>
  ),
});

interface MapFieldProps {
  value: string;
  onLocationSelect: (url: string, lat?: number, lng?: number) => void;
  required?: boolean;
  initialZoom?: number;
  className?: string;
}

export function MapField({
  value,
  onLocationSelect,
  required = true,
  initialZoom = 13,
  className,
}: MapFieldProps) {
  const [isClient, setIsClient] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mapActive, setMapActive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
    setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  // Deactivate map when user touches outside
  useEffect(() => {
    if (!isMobile || !mapActive) return;
    const handleTouchStart = (e: TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setMapActive(false);
      }
    };
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    return () => document.removeEventListener('touchstart', handleTouchStart);
  }, [isMobile, mapActive]);

  const handleLocationSelect = (url: string, lat?: number, lng?: number) => {
    onLocationSelect(url, lat, lng);
    // Deactivate map after selecting a location so user can scroll away
    if (isMobile) setMapActive(false);
  };

  return (
    <div className={`flex flex-col gap-2 ${className || ''}`}>
      <div className="flex flex-col">
        <label className="block text-sm font-semibold text-gray-900 mb-1.5 shrink-0">
          Selecciona la ubicación en el mapa{required && <span className="text-red-600 ml-1">*</span>}
        </label>
        <div
          ref={containerRef}
          className="w-full rounded-lg overflow-hidden border border-gray-300 shadow-sm"
          style={{ height: '400px', minHeight: '400px', position: 'relative' }}
        >
          {isClient && <MapPicker onLocationSelect={handleLocationSelect} initialZoom={initialZoom} />}

          {/* Overlay para mobile: requiere tap explícito para interactuar con el mapa */}
          {isMobile && !mapActive && (
            <div
              onTouchEnd={(e) => {
                e.preventDefault();
                setMapActive(true);
              }}
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 1000,
                background: 'rgba(0,0,0,0.35)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                borderRadius: '8px',
              }}
            >
              <span style={{ fontSize: '28px' }}>✌️</span>
              <span style={{ color: 'white', fontWeight: 600, fontSize: '14px', textAlign: 'center', padding: '0 16px' }}>
                Toca para interactuar con el mapa
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

