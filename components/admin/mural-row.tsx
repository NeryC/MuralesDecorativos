'use client';

import { memo } from 'react';
import Link from 'next/link';
import { EstadoBadge } from '@/components/estado-badge';
import { formatDate } from '@/lib/utils';
import { MuralImageCell } from './mural-image-cell';
import { MuralActionsCell } from './mural-actions-cell';
import type { FilterType } from '@/hooks/use-mural-filters';
import type { MuralWithModificaciones, MuralModificacion } from '@/lib/types';

interface MuralRowProps {
  mural: MuralWithModificaciones;
  filter: FilterType;
  onImageClick: (url: string) => void;
  onUpdateEstado: (id: string, estado: string) => void;
  onProcesarModificacion: (muralId: string, modificacionId: string, action: 'approve' | 'reject') => void;
  getUltimaModificacionPendiente: (mural: MuralWithModificaciones) => MuralModificacion | undefined;
  getImagenAmostrar: (mural: MuralWithModificaciones) => { url: string; thumbnailUrl?: string | null; esAprobada: boolean } | null;
  isProcessingModificacion: boolean;
  isUpdatingEstado: boolean;
  processingModificacionKey: string | null;
}

export const MuralRow = memo(function MuralRow({
  mural,
  filter,
  onImageClick,
  onUpdateEstado,
  onProcesarModificacion,
  getUltimaModificacionPendiente,
  getImagenAmostrar,
  isProcessingModificacion,
  isUpdatingEstado,
  processingModificacionKey,
}: MuralRowProps) {
  const ultimaModificacionPendiente = getUltimaModificacionPendiente(mural);
  const isDisabled = isProcessingModificacion || isUpdatingEstado;

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 text-sm">
        <span>{mural.nombre}</span>
      </td>
      <td className="px-4 py-3 text-sm">{mural.candidato || '-'}</td>
      <td className="px-4 py-3 text-sm">
        <Link
          href={`/?highlight=${mural.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 text-sm underline"
          title="Ver ubicación en el mapa"
        >
          🗺️ Ver en mapa
        </Link>
      </td>
      <td className="px-4 py-3 align-top">
        <div className="flex gap-2 mb-2">
          <MuralImageCell
            mural={mural}
            filter={filter}
            onImageClick={onImageClick}
            getImagenAmostrar={getImagenAmostrar}
          />
        </div>
      </td>
      <td className="px-4 py-3 text-sm max-w-xs">
        <div className="truncate">{mural.comentario || '-'}</div>
        {ultimaModificacionPendiente?.nuevo_comentario && (
          <div className="truncate text-red-600 mt-1">
            Nuevo: {ultimaModificacionPendiente.nuevo_comentario}
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        <EstadoBadge estado={mural.estado} />
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {formatDate(mural.created_at)}
      </td>
      <td className="px-4 py-3">
        <MuralActionsCell
          mural={mural}
          ultimaModificacionPendiente={ultimaModificacionPendiente}
          isDisabled={isDisabled}
          isUpdatingEstado={isUpdatingEstado}
          onUpdateEstado={onUpdateEstado}
        />
      </td>
    </tr>
  );
});

