'use client';

import { useMemo } from 'react';
import type { MuralWithModificaciones } from '@/lib/types';

export type FilterType = 'all' | 'pendiente' | 'modificado_pendiente';

interface UseMuralFiltersReturn {
  filteredMurales: MuralWithModificaciones[];
  counts: {
    pendiente: number;
    modificadoPendiente: number;
    total: number;
  };
}

export function useMuralFilters(
  murales: MuralWithModificaciones[],
  filter: FilterType
): UseMuralFiltersReturn {
  const filteredMurales = useMemo(() => {
    if (!Array.isArray(murales)) return [];

    return murales.filter((mural) => {
      if (filter === 'all') return true;
      if (filter === 'pendiente') return mural.estado === 'pendiente';
      if (filter === 'modificado_pendiente') {
        return mural.mural_modificaciones?.some(
          (mod) => mod.estado_solicitud === 'pendiente'
        ) ?? false;
      }
      return true;
    });
  }, [murales, filter]);

  const counts = useMemo(() => {
    if (!Array.isArray(murales)) {
      return {
        pendiente: 0,
        modificadoPendiente: 0,
        total: 0,
      };
    }

    return {
      pendiente: murales.filter((mural) => mural.estado === 'pendiente').length,
      modificadoPendiente: murales.filter((mural) =>
        mural.mural_modificaciones?.some(
          (mod) => mod.estado_solicitud === 'pendiente'
        )
      ).length,
      total: murales.length,
    };
  }, [murales]);

  return {
    filteredMurales,
    counts,
  };
}

