'use client';

import { memo, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MURAL_ESTADOS } from '@/lib/constants';
import type { MuralWithModificaciones, MuralModificacion } from '@/lib/types';

interface MuralActionsCellProps {
  mural: MuralWithModificaciones;
  ultimaModificacionPendiente: MuralModificacion | undefined;
  isDisabled: boolean;
  isUpdatingEstado: boolean;
  onUpdateEstado: (id: string, estado: string) => void;
}

function MuralActionsCellContent({
  mural,
  ultimaModificacionPendiente,
  isDisabled,
  isUpdatingEstado,
  onUpdateEstado,
}: MuralActionsCellProps) {
  const modificacionesPendientes = useMemo(
    () => mural.mural_modificaciones?.filter(
      (mod) => mod.estado_solicitud === 'pendiente'
    ) || [],
    [mural.mural_modificaciones]
  );

  const tieneModificacionesPendientes = useMemo(
    () => modificacionesPendientes.length > 0,
    [modificacionesPendientes]
  );

  const handleAprobar = useCallback(() => {
    onUpdateEstado(mural.id, MURAL_ESTADOS.APROBADO);
  }, [mural.id, onUpdateEstado]);

  const handleRechazar = useCallback(() => {
    onUpdateEstado(mural.id, MURAL_ESTADOS.RECHAZADO);
  }, [mural.id, onUpdateEstado]);
  return (
    <div>
      <div className="flex gap-2">
        {mural.estado === 'pendiente' && (
          <>
            <Button
              variant="success"
              onClick={handleAprobar}
              className="text-xs px-2 py-1"
              disabled={isDisabled}
            >
              {isUpdatingEstado ? '...' : '✓ Aprobar'}
            </Button>
            <Button
              variant="danger"
              onClick={handleRechazar}
              className="text-xs px-2 py-1"
              disabled={isDisabled}
            >
              {isUpdatingEstado ? '...' : '✗ Rechazar'}
            </Button>
          </>
        )}
        {(mural.estado === 'aprobado' || mural.estado === 'modificado_aprobado') && !tieneModificacionesPendientes && (
          <Button
            variant="danger"
            onClick={handleRechazar}
            className="text-xs px-2 py-1"
            disabled={isDisabled}
          >
            {isUpdatingEstado ? '...' : 'Rechazar'}
          </Button>
        )}
        {mural.estado === 'rechazado' && (
          <Button
            variant="success"
            onClick={handleAprobar}
            className="text-xs px-2 py-1"
            disabled={isDisabled}
          >
            {isUpdatingEstado ? '...' : 'Aprobar'}
          </Button>
        )}
      </div>

      {modificacionesPendientes.length > 0 && (
        <div className="mt-2">
          <Link
            href="/admin/modificaciones"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <span>📋</span>
            <span>
              {modificacionesPendientes.length} solicitud{modificacionesPendientes.length !== 1 ? 'es' : ''} pendiente{modificacionesPendientes.length !== 1 ? 's' : ''}
            </span>
            <span>→</span>
          </Link>
        </div>
      )}
    </div>
  );
}

export const MuralActionsCell = memo(MuralActionsCellContent);

