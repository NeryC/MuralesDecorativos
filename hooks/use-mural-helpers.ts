'use client';

import { useMemo } from 'react';
import type { MuralWithModificaciones, MuralModificacion } from '@/lib/types';

export function useMuralHelpers(filter: 'all' | 'pendiente' | 'modificado_pendiente') {
  const getUltimaModificacionPendiente = useMemo(
    () => (mural: MuralWithModificaciones): MuralModificacion | undefined => {
      return mural.mural_modificaciones
        ?.filter((mod) => mod.estado_solicitud === 'pendiente')
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        )[0];
    },
    []
  );

  const getUltimaModificacionAprobada = useMemo(
    () => (mural: MuralWithModificaciones): MuralModificacion | undefined => {
      return mural.mural_modificaciones
        ?.filter((mod) => mod.estado_solicitud === 'aprobada')
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        )[0];
    },
    []
  );

  const getImagenAmostrar = useMemo(
    () => (mural: MuralWithModificaciones): { url: string; thumbnailUrl?: string | null; esAprobada: boolean } | null => {
      if (filter === 'all') {
        if (mural.estado === 'modificado_aprobado' && mural.imagen_url) {
          return {
            url: mural.imagen_url,
            thumbnailUrl: mural.imagen_thumbnail_url,
            esAprobada: true,
          };
        }

        const modAprobada = getUltimaModificacionAprobada(mural);
        if (modAprobada?.nueva_imagen_url) {
          return {
            url: modAprobada.nueva_imagen_url,
            thumbnailUrl: modAprobada.nueva_imagen_thumbnail_url,
            esAprobada: true,
          };
        }

        if (mural.imagen_url) {
          return {
            url: mural.imagen_url,
            thumbnailUrl: mural.imagen_thumbnail_url,
            esAprobada: false,
          };
        }
        return null;
      }

      return null;
    },
    [filter, getUltimaModificacionAprobada]
  );

  return {
    getUltimaModificacionPendiente,
    getUltimaModificacionAprobada,
    getImagenAmostrar,
  };
}

