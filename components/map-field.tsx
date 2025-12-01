'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { FormField } from '@/components/form-field';
import { Input } from '@/components/ui/input';

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
    <div className={`flex-1 min-h-0 flex flex-col ${className || ''}`}>
      <div className="flex-1 min-h-0 flex flex-col">
        <label className="block text-sm font-medium text-gray-700 mb-2 flex-shrink-0">
          Selecciona la ubicación en el mapa{required && ' *'}
        </label>
        <div className="flex-1 min-h-[400px]">
          {isClient && <MapPicker onLocationSelect={onLocationSelect} initialZoom={initialZoom} />}
        </div>
      </div>

      <div className="flex-shrink-0 mt-4">
        <FormField label="Link de Google Maps (Automático)" required={false}>
          <Input value={value} readOnly placeholder="Selecciona un punto en el mapa..." />
        </FormField>
      </div>
    </div>
  );
}

