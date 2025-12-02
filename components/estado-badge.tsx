'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';
import type { MuralEstado } from '@/lib/types';

interface EstadoBadgeProps {
  estado: MuralEstado | 'pendiente' | 'aprobada' | 'rechazada';
  className?: string;
}

const ESTADO_STYLES: Record<string, string> = {
  pendiente: 'bg-yellow-100 text-yellow-800',
  aprobado: 'bg-green-100 text-green-800',
  rechazado: 'bg-red-100 text-red-800',
  modificado_pendiente: 'bg-orange-100 text-orange-800',
  modificado_aprobado: 'bg-blue-100 text-blue-800',
  aprobada: 'bg-green-100 text-green-800',
  rechazada: 'bg-red-100 text-red-800',
};

function EstadoBadgeComponent({ estado, className }: EstadoBadgeProps) {
  return (
    <span
      className={cn(
        'px-2 py-1 text-xs rounded-full',
        ESTADO_STYLES[estado] || 'bg-gray-100 text-gray-800',
        className
      )}
    >
      {estado}
    </span>
  );
}

export const EstadoBadge = memo(EstadoBadgeComponent);

