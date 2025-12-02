'use client';

import { memo } from 'react';
import Link from 'next/link';
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
  
  // Verificar si hay modificaciones pendientes
  const tieneModificacionesPendientes = mural.mural_modificaciones?.some(
    (mod) => mod.estado_solicitud === 'pendiente'
  ) || false;
  
  // Deshabilitar todos los botones si hay alguna operación en proceso
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
          {filter === 'all' ? (
            (() => {
              // Obtener la última modificación aprobada
              const modAprobada = mural.mural_modificaciones
                ?.filter((mod) => mod.estado_solicitud === 'aprobada')
                .sort(
                  (a, b) =>
                    new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime()
                )[0];

              // Si hay modificación aprobada y tiene la imagen original guardada, mostrar ambas
              if (modAprobada?.nueva_imagen_url && modAprobada?.imagen_original_url) {
                return (
                  <>
                    <div className="flex flex-col items-center gap-1">
                      <img
                        src={modAprobada.imagen_original_thumbnail_url || modAprobada.imagen_original_url}
                        alt="Antes"
                        className="w-16 h-16 object-cover rounded cursor-pointer border-2 border-gray-300"
                        onClick={() => onImageClick(modAprobada.imagen_original_url || '')}
                      />
                      <span className="text-[10px] text-gray-500">Antes</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <img
                        src={modAprobada.nueva_imagen_thumbnail_url || modAprobada.nueva_imagen_url}
                        alt="Ahora"
                        className="w-16 h-16 object-cover rounded cursor-pointer border-2 border-green-500"
                        onClick={() => onImageClick(modAprobada.nueva_imagen_url || '')}
                      />
                      <span className="text-[10px] text-gray-500">Ahora</span>
                    </div>
                  </>
                );
              }

              // Si hay modificación aprobada pero no tiene imagen original guardada (modificaciones antiguas)
              // mostrar solo la imagen actual del mural
              if (modAprobada?.nueva_imagen_url && mural.imagen_url) {
                return (
                  <div className="flex flex-col items-center gap-1">
                    <img
                      src={mural.imagen_thumbnail_url || mural.imagen_url}
                      alt="Actual (Modificada)"
                      className="w-16 h-16 object-cover rounded cursor-pointer border-2 border-green-500"
                      onClick={() => onImageClick(mural.imagen_url)}
                    />
                    <span className="text-[10px] text-gray-500">Actual</span>
                  </div>
                );
              }

              // Si no hay modificación aprobada, mostrar solo la imagen original
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
            (() => {
              // Obtener la última modificación aprobada
              const modAprobada = mural.mural_modificaciones
                ?.filter((mod) => mod.estado_solicitud === 'aprobada')
                .sort(
                  (a, b) =>
                    new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime()
                )[0];

              // Si hay una modificación aprobada, mostrar su imagen
              if (modAprobada?.nueva_imagen_url) {
                return (
                  <img
                    src={
                      modAprobada.nueva_imagen_thumbnail_url ||
                      modAprobada.nueva_imagen_url
                    }
                    alt="Actualizada"
                    className="w-16 h-16 object-cover rounded cursor-pointer border-2 border-green-500"
                    onClick={() => onImageClick(modAprobada.nueva_imagen_url || '')}
                  />
                );
              }

              // Si no hay modificación aprobada, mostrar solo la imagen original
              if (mural.imagen_thumbnail_url || mural.imagen_url) {
                return (
                  <img
                    src={mural.imagen_thumbnail_url || mural.imagen_url}
                    alt="Original"
                    className="w-16 h-16 object-cover rounded cursor-pointer border-2 border-gray-300"
                    onClick={() => onImageClick(mural.imagen_url)}
                  />
                );
              }

              return null;
            })()
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
                disabled={isDisabled}
              >
                {isUpdatingEstado ? '...' : '✓ Aprobar'}
              </Button>
              <Button
                variant="danger"
                onClick={() => onUpdateEstado(mural.id, MURAL_ESTADOS.RECHAZADO)}
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
              onClick={() => onUpdateEstado(mural.id, MURAL_ESTADOS.RECHAZADO)}
              className="text-xs px-2 py-1"
              disabled={isDisabled}
            >
              {isUpdatingEstado ? '...' : 'Rechazar'}
            </Button>
          )}
          {mural.estado === 'rechazado' && (
            <Button
              variant="success"
              onClick={() => onUpdateEstado(mural.id, MURAL_ESTADOS.APROBADO)}
              className="text-xs px-2 py-1"
              disabled={isDisabled}
            >
              {isUpdatingEstado ? '...' : 'Aprobar'}
            </Button>
          )}
        </div>

        {(() => {
          // Filtrar solo modificaciones pendientes
          const modificacionesPendientes = mural.mural_modificaciones?.filter(
            (mod) => mod.estado_solicitud === 'pendiente'
          );

          if (!modificacionesPendientes || modificacionesPendientes.length === 0) {
            return null;
          }

          return (
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
          );
        })()}
      </td>
    </tr>
  );
});

