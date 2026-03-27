'use client';

import { memo, useMemo, useCallback } from 'react';
import Link from 'next/link';
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
            <button
              onClick={handleAprobar}
              style={{ background: '#dcfce7', color: '#166534', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
              disabled={isDisabled}
            >
              {isUpdatingEstado ? '...' : '✓ Aprobar'}
            </button>
            <button
              onClick={handleRechazar}
              style={{ background: '#fef2f2', color: '#dc2626', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
              disabled={isDisabled}
            >
              {isUpdatingEstado ? '...' : '✗ Rechazar'}
            </button>
          </>
        )}
        {(mural.estado === 'aprobado' || mural.estado === 'modificado_aprobado') && !tieneModificacionesPendientes && (
          <button
            onClick={handleRechazar}
            style={{ background: '#fef2f2', color: '#dc2626', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
            disabled={isDisabled}
          >
            {isUpdatingEstado ? '...' : 'Rechazar'}
          </button>
        )}
        {mural.estado === 'rechazado' && (
          <button
            onClick={handleAprobar}
            style={{ background: '#dcfce7', color: '#166534', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
            disabled={isDisabled}
          >
            {isUpdatingEstado ? '...' : 'Aprobar'}
          </button>
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

