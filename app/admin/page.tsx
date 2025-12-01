'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MuralModificacion, MuralWithModificaciones } from '@/lib/types';
import { Button } from '@/components/ui/button';
import ImageModal from '@/components/image-modal';
import { MURAL_ESTADOS } from '@/lib/constants';

export default function AdminPage() {
  const [murales, setMurales] = useState<MuralWithModificaciones[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pendiente' | 'modificado_pendiente'>('pendiente');

  useEffect(() => {
    fetchMurales();
  }, []);

  async function fetchMurales() {
    try {
      const response = await fetch('/api/admin/murales');
      const data = await response.json();
      setMurales(data);
    } catch (error) {
      console.error('Error fetching murales:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleProcesarModificacion(
    muralId: string,
    modificacionId: string,
    action: 'approve' | 'reject'
  ) {
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
        fetchMurales();
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || 'Error al procesar la solicitud de modificación');
      }
    } catch (error) {
      console.error('Error processing modification:', error);
      alert('Error al procesar la solicitud de modificación');
    }
  }

  async function updateEstado(id: string, estado: string) {
    try {
      const response = await fetch(`/api/murales/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado }),
      });

      if (response.ok) {
        // Refresh list
        fetchMurales();
      } else {
        alert('Error al actualizar el estado');
      }
    } catch (error) {
      console.error('Error updating estado:', error);
      alert('Error al actualizar el estado');
    }
  }

  const filteredMurales = murales.filter((mural) => {
    if (filter === 'all') return true;
    if (filter === 'pendiente') return mural.estado === 'pendiente';

    // modificado_pendiente => murales que tienen al menos una solicitud pendiente
    if (filter === 'modificado_pendiente') {
      return mural.mural_modificaciones?.some(
        (mod) => mod.estado_solicitud === 'pendiente'
      );
    }

    return true;
  });

  const pendienteCount = murales.filter((m) => m.estado === 'pendiente').length;
  const modificadoPendienteCount = murales.filter((m) =>
    m.mural_modificaciones?.some((mod) => mod.estado_solicitud === 'pendiente')
  ).length;

  function getUltimaModificacionPendiente(mural: MuralWithModificaciones): MuralModificacion | undefined {
    return mural.mural_modificaciones
      ?.filter((mod) => mod.estado_solicitud === 'pendiente')
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      )[0];
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="spinner"></div>
        <p className="mt-4 font-bold">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 flex flex-col items-center">
      <div className="w-[95%] max-w-[1200px] flex flex-col gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Panel de Administración</h1>
            <div className="flex gap-4">
              <Link href="/" className="text-blue-600 hover:text-blue-800 font-semibold">
                🗺️ Ver Mapa
              </Link>
              <Link href="/nuevo" className="text-blue-600 hover:text-blue-800 font-semibold">
                ➕ Agregar Nuevo
              </Link>
            </div>
          </div>

          <div className="flex gap-4 mb-6">
            <Button
              variant={filter === 'pendiente' ? 'default' : 'outline'}
              onClick={() => setFilter('pendiente')}
            >
              Pendientes ({pendienteCount})
            </Button>
            <Button
              variant={filter === 'modificado_pendiente' ? 'default' : 'outline'}
              onClick={() => setFilter('modificado_pendiente')}
            >
              Modificados Pendientes ({modificadoPendienteCount})
            </Button>
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
            >
              Todos ({murales.length})
            </Button>
          </div>

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
                    <tr key={mural.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{mural.nombre}</td>
                      <td className="px-4 py-3 text-sm">{mural.candidato || '-'}</td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex gap-2 mb-2">
                          {(mural.imagen_thumbnail_url || mural.imagen_url) && (
                            <img
                              src={mural.imagen_thumbnail_url || mural.imagen_url}
                              alt="Original"
                              className="w-16 h-16 object-cover rounded cursor-pointer border-2 border-gray-300"
                              onClick={() => setSelectedImage(mural.imagen_url)}
                            />
                          )}
                          {getUltimaModificacionPendiente(mural)?.nueva_imagen_url && (
                            <img
                              src={
                                getUltimaModificacionPendiente(mural)?.nueva_imagen_thumbnail_url ||
                                getUltimaModificacionPendiente(mural)?.nueva_imagen_url
                              }
                              alt="Nueva"
                              className="w-16 h-16 object-cover rounded cursor-pointer border-2 border-red-500"
                              onClick={() =>
                                setSelectedImage(
                                  getUltimaModificacionPendiente(mural)?.nueva_imagen_url || ''
                                )
                              }
                            />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm max-w-xs">
                        <div className="truncate">{mural.comentario || '-'}</div>
                        {getUltimaModificacionPendiente(mural)?.nuevo_comentario && (
                          <div className="truncate text-red-600 mt-1">
                            Nuevo: {getUltimaModificacionPendiente(mural)?.nuevo_comentario}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            mural.estado === 'pendiente'
                              ? 'bg-yellow-100 text-yellow-800'
                              : mural.estado === 'aprobado'
                              ? 'bg-green-100 text-green-800'
                              : mural.estado === 'rechazado'
                              ? 'bg-red-100 text-red-800'
                              : mural.estado === 'modificado_pendiente'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {mural.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(mural.created_at).toLocaleDateString('es-PY')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {mural.estado === 'pendiente' && (
                            <>
                              <Button
                                variant="success"
                                onClick={() => updateEstado(mural.id, MURAL_ESTADOS.APROBADO)}
                                className="text-xs px-2 py-1"
                              >
                                ✓ Aprobar
                              </Button>
                              <Button
                                variant="danger"
                                onClick={() => updateEstado(mural.id, MURAL_ESTADOS.RECHAZADO)}
                                className="text-xs px-2 py-1"
                              >
                                ✗ Rechazar
                              </Button>
                            </>
                          )}
                          {(mural.estado === 'aprobado' || mural.estado === 'modificado_aprobado') && (
                            <Button
                              variant="danger"
                              onClick={() => updateEstado(mural.id, MURAL_ESTADOS.RECHAZADO)}
                              className="text-xs px-2 py-1"
                            >
                              Rechazar
                            </Button>
                          )}
                          {mural.estado === 'rechazado' && (
                            <Button
                              variant="success"
                              onClick={() => updateEstado(mural.id, MURAL_ESTADOS.APROBADO)}
                              className="text-xs px-2 py-1"
                            >
                              Aprobar
                            </Button>
                          )}
                        </div>

                        {mural.mural_modificaciones && mural.mural_modificaciones.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {mural.mural_modificaciones.map((mod) => (
                              <div
                                key={mod.id}
                                className="border rounded-md p-2 bg-gray-50"
                              >
                                <div className="flex items-start gap-2">
                                  {mod.nueva_imagen_url && (
                                    <img
                                      src={mod.nueva_imagen_thumbnail_url || mod.nueva_imagen_url}
                                      alt="Propuesta"
                                      className="w-12 h-12 object-cover rounded cursor-pointer border border-gray-300"
                                      onClick={() =>
                                        setSelectedImage(mod.nueva_imagen_url || '')
                                      }
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
                                  <span
                                    className={`px-2 py-1 text-[10px] rounded-full ${
                                      mod.estado_solicitud === 'pendiente'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : mod.estado_solicitud === 'aprobada'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    {mod.estado_solicitud}
                                  </span>
                                </div>
                                {mod.estado_solicitud === 'pendiente' && (
                                  <div className="flex gap-2 mt-2">
                                    <Button
                                      variant="success"
                                      onClick={() =>
                                        handleProcesarModificacion(mural.id, mod.id, 'approve')
                                      }
                                      className="text-[10px] px-2 py-1"
                                    >
                                      ✓ Aprobar esta
                                    </Button>
                                    <Button
                                      variant="outline"
                                      onClick={() =>
                                        handleProcesarModificacion(mural.id, mod.id, 'reject')
                                      }
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
    </div>
  );
}
