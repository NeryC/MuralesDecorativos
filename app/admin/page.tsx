'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Mural } from '@/lib/types';
import { Button } from '@/components/ui/button';
import ImageModal from '@/components/image-modal';
import { MURAL_ESTADOS } from '@/lib/constants';

export default function AdminPage() {
  const [murales, setMurales] = useState<Mural[]>([]);
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
    return mural.estado === filter;
  });

  const pendienteCount = murales.filter((m) => m.estado === 'pendiente').length;
  const modificadoPendienteCount = murales.filter((m) => m.estado === 'modificado_pendiente').length;

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
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredMurales.map((mural) => (
                    <tr key={mural.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{mural.nombre}</td>
                      <td className="px-4 py-3 text-sm">{mural.candidato || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {(mural.imagen_thumbnail_url || mural.imagen_url) && (
                            <img
                              src={mural.imagen_thumbnail_url || mural.imagen_url}
                              alt="Original"
                              className="w-16 h-16 object-cover rounded cursor-pointer border-2 border-gray-300"
                              onClick={() => setSelectedImage(mural.imagen_url)}
                            />
                          )}
                          {mural.estado === 'modificado_pendiente' && mural.nueva_imagen_url && (
                            <img
                              src={mural.nueva_imagen_thumbnail_url || mural.nueva_imagen_url}
                              alt="Nueva"
                              className="w-16 h-16 object-cover rounded cursor-pointer border-2 border-red-500"
                              onClick={() => setSelectedImage(mural.nueva_imagen_url || '')}
                            />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm max-w-xs">
                        <div className="truncate">{mural.comentario || '-'}</div>
                        {mural.estado === 'modificado_pendiente' && mural.nuevo_comentario && (
                          <div className="truncate text-red-600 mt-1">
                            Nuevo: {mural.nuevo_comentario}
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
                          {mural.estado === 'modificado_pendiente' && (
                            <>
                              <Button
                                variant="success"
                                onClick={() => updateEstado(mural.id, MURAL_ESTADOS.MODIFICADO_APROBADO)}
                                className="text-xs px-2 py-1"
                              >
                                ✓ Aprobar Cambio
                              </Button>
                              <Button
                                variant="danger"
                                onClick={() => updateEstado(mural.id, MURAL_ESTADOS.APROBADO)}
                                className="text-xs px-2 py-1"
                              >
                                ✗ Rechazar Cambio
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
