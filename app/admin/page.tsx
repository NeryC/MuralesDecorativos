'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { PageShell } from '@/components/page-shell';
import { FilterButtons } from '@/components/admin/filter-buttons';
import { MuralRow } from '@/components/admin/mural-row';
import ImageModal from '@/components/image-modal';
import { useMuralHelpers } from '@/hooks/use-mural-helpers';
import type { MuralWithModificaciones } from '@/lib/types';

export default function AdminPage() {
  const [murales, setMurales] = useState<MuralWithModificaciones[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pendiente' | 'modificado_pendiente'>('pendiente');
  const [processingModificacion, setProcessingModificacion] = useState<string | null>(null);
  const [updatingEstado, setUpdatingEstado] = useState<string | null>(null);

  const { getUltimaModificacionPendiente, getImagenAmostrar } = useMuralHelpers(filter);

  useEffect(() => {
    fetchMurales();
  }, []);

  const fetchMurales = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/murales');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // Asegurar que siempre sea un array
      setMurales(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching murales:', error);
      setMurales([]); // Asegurar que sea un array vacío en caso de error
    } finally {
      setLoading(false);
    }
  }, []);

  const handleProcesarModificacion = useCallback(
    async (muralId: string, modificacionId: string, action: 'approve' | 'reject') => {
      const key = `${muralId}-${modificacionId}`;
      setProcessingModificacion(key);
      try {
        const response = await fetch(
          `/api/admin/murales/${muralId}/modificaciones/${modificacionId}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action }),
          }
        );

        if (response.ok) {
          // Forzar actualización de los datos
          await fetchMurales();
          
          // Si se aprobó, redirigir al mapa después de unos segundos
          if (action === 'approve') {
            setTimeout(() => {
              window.location.href = '/';
            }, 3000);
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          alert(errorData.error || 'Error al procesar la solicitud de modificación');
        }
      } catch (error) {
        console.error('Error processing modification:', error);
        alert('Error al procesar la solicitud de modificación');
      } finally {
        setProcessingModificacion(null);
      }
    },
    [fetchMurales]
  );

  const updateEstado = useCallback(
    async (id: string, estado: string) => {
      setUpdatingEstado(id);
      try {
        const response = await fetch(`/api/murales/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ estado }),
        });

        if (response.ok) {
          await fetchMurales();
        } else {
          alert('Error al actualizar el estado');
        }
      } catch (error) {
        console.error('Error updating estado:', error);
        alert('Error al actualizar el estado');
      } finally {
        setUpdatingEstado(null);
      }
    },
    [fetchMurales]
  );

  const filteredMurales = useMemo(
    () => {
      if (!Array.isArray(murales)) return [];
      return murales.filter((mural) => {
        if (filter === 'all') return true;
        if (filter === 'pendiente') return mural.estado === 'pendiente';
        if (filter === 'modificado_pendiente') {
          return mural.mural_modificaciones?.some((mod) => mod.estado_solicitud === 'pendiente');
        }
        return true;
      });
    },
    [murales, filter]
  );

  const counts = useMemo(
    () => {
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
          mural.mural_modificaciones?.some((mod) => mod.estado_solicitud === 'pendiente')
        ).length,
        total: murales.length,
      };
    },
    [murales]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="spinner"></div>
        <p className="mt-4 font-bold">Cargando...</p>
      </div>
    );
  }

  return (
    <PageShell title="Panel de Administración" scrollableMain>
      <div className="max-w-[1200px] mx-auto flex flex-col gap-6">
        <div>
          <FilterButtons
            filter={filter}
            onFilterChange={setFilter}
            pendienteCount={counts.pendiente}
            modificadoPendienteCount={counts.modificadoPendiente}
            totalCount={counts.total}
          />

          {filteredMurales.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No hay murales en esta categoría.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nombre</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Candidato</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Imagen</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Comentario</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Estado</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Fecha</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Acciones / Solicitudes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredMurales.map((mural) => (
                    <MuralRow
                      key={mural.id}
                      mural={mural}
                      filter={filter}
                      onImageClick={setSelectedImage}
                      onUpdateEstado={updateEstado}
                      onProcesarModificacion={handleProcesarModificacion}
                      getUltimaModificacionPendiente={getUltimaModificacionPendiente}
                      getImagenAmostrar={getImagenAmostrar}
                      isProcessingModificacion={processingModificacion !== null}
                      isUpdatingEstado={updatingEstado === mural.id}
                      processingModificacionKey={processingModificacion}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <p className="text-sm text-yellow-800">
            <strong>⚠️ Nota:</strong> Este panel NO tiene autenticación. Cualquiera con la URL puede aprobar/rechazar murales.
            La autenticación se agregará en una fase posterior.
          </p>
        </div>
        <ImageModal imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />
      </div>
    </PageShell>
  );
}
