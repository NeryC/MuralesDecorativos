'use client';

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { EstadoBadge } from '@/components/estado-badge';
import { formatDate } from '@/lib/utils';
import { MURAL_ESTADOS } from '@/lib/constants';
import type { MuralWithModificaciones, MuralModificacion } from '@/lib/types';

interface MuralRowProps {
  mural: MuralWithModificaciones;
  filter: 'all' | 'pendiente' | 'modificado_pendiente';
  onImageClick: (url: string) => void;
  onUpdateEstado: (id: string, estado: string) => void;
  onProcesarModificacion: (muralId: string, modificacionId: string, action: 'approve' | 'reject') => void;
  getUltimaModificacionPendiente: (mural: MuralWithModificaciones) => MuralModificacion | undefined;
  getImagenAmostrar: (mural: MuralWithModificaciones) => { url: string; thumbnailUrl?: string | null; esAprobada: boolean } | null;
}

export const MuralRow = memo(function MuralRow({
  mural,
  filter,
  onImageClick,
  onUpdateEstado,
  onProcesarModificacion,
  getUltimaModificacionPendiente,
  getImagenAmostrar,
}: MuralRowProps) {
  const ultimaModificacionPendiente = getUltimaModificacionPendiente(mural);

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 text-sm">{mural.nombre}</td>
      <td className="px-4 py-3 text-sm">{mural.candidato || '-'}</td>
      <td className="px-4 py-3 align-top">
        <div className="flex gap-2 mb-2">
          {filter === 'all' ? (
            (() => {
              const imagenAmostrar = getImagenAmostrar(mural);
              if (!imagenAmostrar) return null;

              const { thumbnailUrl, url, esAprobada } = imagenAmostrar;

              return (
                <img
                  src={thumbnailUrl || url}
                  alt={esAprobada ? 'Aprobada' : 'Original'}
                  className={`w-16 h-16 object-cover rounded cursor-pointer border-2 ${
                    esAprobada ? 'border-green-500' : 'border-gray-300'
                  }`}
                  onClick={() => onImageClick(url)}
                />
              );
            })()
          ) : (
            <>
              {(mural.imagen_thumbnail_url || mural.imagen_url) && (
                <img
                  src={mural.imagen_thumbnail_url || mural.imagen_url}
                  alt="Original"
                  className="w-16 h-16 object-cover rounded cursor-pointer border-2 border-gray-300"
                  onClick={() => onImageClick(mural.imagen_url)}
                />
              )}
              {ultimaModificacionPendiente?.nueva_imagen_url && (
                <img
                  src={
                    ultimaModificacionPendiente.nueva_imagen_thumbnail_url ||
                    ultimaModificacionPendiente.nueva_imagen_url
                  }
                  alt="Nueva"
                  className="w-16 h-16 object-cover rounded cursor-pointer border-2 border-red-500"
                  onClick={() => onImageClick(ultimaModificacionPendiente.nueva_imagen_url || '')}
                />
              )}
            </>
          )}
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
        <div className="flex gap-2">
          {mural.estado === 'pendiente' && (
            <>
              <Button
                variant="success"
                onClick={() => onUpdateEstado(mural.id, MURAL_ESTADOS.APROBADO)}
                className="text-xs px-2 py-1"
              >
                ✓ Aprobar
              </Button>
              <Button
                variant="danger"
                onClick={() => onUpdateEstado(mural.id, MURAL_ESTADOS.RECHAZADO)}
                className="text-xs px-2 py-1"
              >
                ✗ Rechazar
              </Button>
            </>
          )}
          {(mural.estado === 'aprobado' || mural.estado === 'modificado_aprobado') && (
            <Button
              variant="danger"
              onClick={() => onUpdateEstado(mural.id, MURAL_ESTADOS.RECHAZADO)}
              className="text-xs px-2 py-1"
            >
              Rechazar
            </Button>
          )}
          {mural.estado === 'rechazado' && (
            <Button
              variant="success"
              onClick={() => onUpdateEstado(mural.id, MURAL_ESTADOS.APROBADO)}
              className="text-xs px-2 py-1"
            >
              Aprobar
            </Button>
          )}
        </div>

        {mural.mural_modificaciones && mural.mural_modificaciones.length > 0 && (
          <div className="mt-2 space-y-2">
            {mural.mural_modificaciones.map((mod) => (
              <div key={mod.id} className="border rounded-md p-2 bg-gray-50">
                <div className="flex items-start gap-2">
                  {mod.nueva_imagen_url && (
                    <img
                      src={mod.nueva_imagen_thumbnail_url || mod.nueva_imagen_url}
                      alt="Propuesta"
                      className="w-12 h-12 object-cover rounded cursor-pointer border border-gray-300"
                      onClick={() => onImageClick(mod.nueva_imagen_url || '')}
                    />
                  )}
                  <div className="flex-1">
                    <div className="text-xs text-gray-600">
                      {new Date(mod.created_at).toLocaleString('es-PY')}
                    </div>
                    {mod.nuevo_comentario && (
                      <div className="text-xs text-gray-800 mt-1 line-clamp-2">
                        {mod.nuevo_comentario}
                      </div>
                    )}
                  </div>
                  <EstadoBadge estado={mod.estado_solicitud} className="text-[10px]" />
                </div>
                {mod.estado_solicitud === 'pendiente' && (
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="success"
                      onClick={() => onProcesarModificacion(mural.id, mod.id, 'approve')}
                      className="text-[10px] px-2 py-1"
                    >
                      ✓ Aprobar esta
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => onProcesarModificacion(mural.id, mod.id, 'reject')}
                      className="text-[10px] px-2 py-1"
                    >
                      ✗ Rechazar
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </td>
    </tr>
  );
});

