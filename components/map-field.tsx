'use client';

import { useState, useEffect } from 'react';
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
  initialZoom = 20,
  className,
}: MapFieldProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className={`flex flex-col gap-2 ${className || ''}`}>
      <div className="flex flex-col">
        <label className="block text-sm font-semibold text-gray-900 mb-1.5 shrink-0">
          Selecciona la ubicación en el mapa{required && <span className="text-red-600 ml-1">*</span>}
        </label>
        <div className="w-full rounded-lg overflow-hidden border border-gray-300 shadow-sm" style={{ height: '450px', minHeight: '450px' }}>
          {isClient && <MapPicker onLocationSelect={onLocationSelect} initialZoom={initialZoom} />}
        </div>
      </div>

    </div>
  );
}

