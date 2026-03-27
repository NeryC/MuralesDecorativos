'use client';

import { memo } from 'react';
import type { MuralEstado } from '@/lib/types';

interface EstadoBadgeProps {
  estado: MuralEstado | 'pendiente' | 'aprobada' | 'rechazada';
  className?: string;
}

interface BadgeStyle {
  backgroundColor: string;
  color: string;
  label: string;
}

const ESTADO_CONFIG: Record<string, BadgeStyle> = {
  pendiente: { backgroundColor: '#fef3c7', color: '#92400e', label: '⏳ Pendiente' },
  aprobado: { backgroundColor: '#dcfce7', color: '#166534', label: '✓ Aprobado' },
  rechazado: { backgroundColor: '#fef2f2', color: '#991b1b', label: '✗ Rechazado' },
  modificado_pendiente: { backgroundColor: '#ede9fe', color: '#5b21b6', label: '🔄 Mod. Pendiente' },
  modificado_aprobado: { backgroundColor: '#dbeafe', color: '#1e40af', label: '✓ Modificado' },
  aprobada: { backgroundColor: '#dcfce7', color: '#166534', label: '✓ Aprobada' },
  rechazada: { backgroundColor: '#fef2f2', color: '#991b1b', label: '✗ Rechazada' },
};

const DEFAULT_STYLE: BadgeStyle = {
  backgroundColor: '#f3f4f6',
  color: '#374151',
  label: '',
};

function EstadoBadgeComponent({ estado, className }: EstadoBadgeProps) {
  const config = ESTADO_CONFIG[estado] ?? DEFAULT_STYLE;

  return (
    <span
      className={className}
      style={{
        backgroundColor: config.backgroundColor,
        color: config.color,
        padding: '3px 10px',
        borderRadius: '20px',
        fontSize: '11px',
        fontWeight: '600',
        display: 'inline-block',
      }}
    >
      {config.label || estado}
    </span>
  );
}

export const EstadoBadge = memo(EstadoBadgeComponent);
