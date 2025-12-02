'use client';

import { memo, useMemo } from 'react';
import type { FilterType } from '@/hooks/use-mural-filters';
import type { MuralWithModificaciones } from '@/lib/types';

interface MuralImageCellProps {
  mural: MuralWithModificaciones;
  filter: FilterType;
  onImageClick: (url: string) => void;
  getImagenAmostrar: (mural: MuralWithModificaciones) => { 
    url: string; 
    thumbnailUrl?: string | null; 
    esAprobada: boolean 
  } | null;
}

function MuralImageCellContent({
  mural,
  filter,
  onImageClick,
  getImagenAmostrar,
}: MuralImageCellProps) {
  const ultimaModAprobada = useMemo(() => {
    return mural.mural_modificaciones
      ?.filter((mod) => mod.estado_solicitud === 'aprobada')
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      )[0];
  }, [mural.mural_modificaciones]);

  if (filter === 'all') {
    // Si hay modificación aprobada y tiene la imagen original guardada, mostrar ambas
    if (ultimaModAprobada?.nueva_imagen_url && ultimaModAprobada?.imagen_original_url) {
      return (
        <>
          <div className="flex flex-col items-center gap-1">
            <img
              src={ultimaModAprobada.imagen_original_thumbnail_url || ultimaModAprobada.imagen_original_url}
              alt="Antes"
              className="w-16 h-16 object-cover rounded cursor-pointer border-2 border-gray-300"
              onClick={() => onImageClick(ultimaModAprobada.imagen_original_url || '')}
            />
            <span className="text-[10px] text-gray-500">Antes</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <img
              src={ultimaModAprobada.nueva_imagen_thumbnail_url || ultimaModAprobada.nueva_imagen_url}
              alt="Ahora"
              className="w-16 h-16 object-cover rounded cursor-pointer border-2 border-green-500"
              onClick={() => onImageClick(ultimaModAprobada.nueva_imagen_url || '')}
            />
            <span className="text-[10px] text-gray-500">Ahora</span>
          </div>
        </>
      );
    }

    // Si hay modificación aprobada pero no tiene imagen original guardada
    if (ultimaModAprobada?.nueva_imagen_url && mural.imagen_url) {
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
  }

  // Para otros filtros
  if (ultimaModAprobada?.nueva_imagen_url) {
    return (
      <img
        src={
          ultimaModAprobada.nueva_imagen_thumbnail_url ||
          ultimaModAprobada.nueva_imagen_url
        }
        alt="Actualizada"
        className="w-16 h-16 object-cover rounded cursor-pointer border-2 border-green-500"
        onClick={() => onImageClick(ultimaModAprobada.nueva_imagen_url || '')}
      />
    );
  }

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
}

export const MuralImageCell = memo(MuralImageCellContent);

