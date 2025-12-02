'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageShell } from '@/components/page-shell';
import { Button } from '@/components/ui/button';
import { EstadoBadge } from '@/components/estado-badge';
import ImageModal from '@/components/image-modal';
import { getClientUser } from '@/lib/auth/client';
import { createClient } from '@/lib/supabase/client';
import type { MuralWithModificaciones, MuralModificacion } from '@/lib/types';
import { formatDate } from '@/lib/utils';

export default function ModificacionesPage() {
  const [murales, setMurales] = useState<MuralWithModificaciones[]>([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [processingModificacion, setProcessingModificacion] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = useCallback(async () => {
    const currentUser = await getClientUser();
    if (!currentUser) {
      router.push('/admin/login');
      return;
    }
    setUser(currentUser);
    setAuthLoading(false);
    fetchMurales();
  }, [router]);

  const fetchMurales = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/murales');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const muralesList = Array.isArray(data) ? data : [];
      
      // Filtrar solo murales con modificaciones pendientes
      const muralesConModificaciones = muralesList.filter((mural) =>
        mural.mural_modificaciones?.some((mod) => mod.estado_solicitud === 'pendiente')
      );
      
      setMurales(muralesConModificaciones);
    } catch (error) {
      console.error('Error fetching murales:', error);
      setMurales([]);
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
          await fetchMurales();
          
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

  // Obtener todas las modificaciones pendientes
  const modificacionesPendientes = murales.flatMap((mural) => {
    const modsPendientes = mural.mural_modificaciones?.filter(
      (mod) => mod.estado_solicitud === 'pendiente'
    ) || [];
    return modsPendientes.map((mod) => ({ mural, modificacion: mod }));
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="spinner"></div>
        <p className="mt-4 font-bold">Cargando...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <PageShell 
      title="Solicitudes de Modificación Pendientes" 
      scrollableMain
      showMapButton={false}
      rightActions={
        <div className="flex gap-3">
          <Link
            href="/admin"
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
          >
            ← Volver
          </Link>
          <Link
            href="/admin/auditoria"
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
          >
            Ver Historial
          </Link>
          <button
            onClick={async () => {
              const supabase = createClient();
              await supabase.auth.signOut();
              router.push('/admin/login');
              router.refresh();
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
          >
            Cerrar Sesión
          </button>
        </div>
      }
    >
      <div className="max-w-6xl mx-auto">
        {modificacionesPendientes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No hay solicitudes de modificación pendientes.</p>
            <Link
              href="/admin"
              className="mt-4 inline-block px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Volver al panel
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>{modificacionesPendientes.length}</strong> solicitud{modificacionesPendientes.length !== 1 ? 'es' : ''} de modificación pendiente{modificacionesPendientes.length !== 1 ? 's' : ''}
              </p>
            </div>

            {modificacionesPendientes.map(({ mural, modificacion }) => {
              const modKey = `${mural.id}-${modificacion.id}`;
              const isProcessing = processingModificacion === modKey;
              const isDisabled = processingModificacion !== null;

              return (
                <div
                  key={modKey}
                  className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Imagen y datos del mural */}
                    <div className="flex-shrink-0">
                      <div className="space-y-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {mural.nombre}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Mural ID: {mural.id}
                          </p>
                          <Link
                            href={`/?highlight=${mural.id}`}
                            target="_blank"
                            className="text-sm text-blue-600 hover:text-blue-800 underline mt-1 inline-block"
                          >
                            🗺️ Ver en mapa
                          </Link>
                        </div>
                        
                        {mural.imagen_url && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-2">Imagen actual:</p>
                            <img
                              src={mural.imagen_thumbnail_url || mural.imagen_url}
                              alt="Imagen actual del mural"
                              className="w-32 h-32 object-cover rounded-md cursor-pointer border-2 border-gray-200 hover:border-blue-400 transition-colors"
                              onClick={() => setSelectedImage(mural.imagen_url)}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Nueva imagen propuesta */}
                    <div className="flex-1">
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-2">Nueva imagen propuesta:</p>
                          {modificacion.nueva_imagen_url && (
                            <img
                              src={modificacion.nueva_imagen_thumbnail_url || modificacion.nueva_imagen_url}
                              alt="Nueva imagen propuesta"
                              className="w-full max-w-md h-64 object-cover rounded-md cursor-pointer border-2 border-blue-400 hover:border-blue-600 transition-colors"
                              onClick={() => setSelectedImage(modificacion.nueva_imagen_url || '')}
                            />
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Fecha de solicitud:</span>{' '}
                            {formatDate(modificacion.created_at)}
                          </div>
                          <EstadoBadge estado={modificacion.estado_solicitud} />
                        </div>

                        {modificacion.nuevo_comentario && (
                          <div className="bg-gray-50 border-l-4 border-blue-400 rounded p-4">
                            <p className="text-sm font-medium text-gray-700 mb-1">Comentario:</p>
                            <p className="text-sm text-gray-800">{modificacion.nuevo_comentario}</p>
                          </div>
                        )}

                        <div className="flex gap-3 pt-4 border-t border-gray-200">
                          <Button
                            variant="success"
                            onClick={() => handleProcesarModificacion(mural.id, modificacion.id, 'approve')}
                            className="flex-1"
                            disabled={isDisabled}
                          >
                            {isProcessing ? 'Procesando...' : '✓ Aprobar Modificación'}
                          </Button>
                          <Button
                            variant="danger"
                            onClick={() => handleProcesarModificacion(mural.id, modificacion.id, 'reject')}
                            className="flex-1"
                            disabled={isDisabled}
                          >
                            {isProcessing ? 'Procesando...' : '✗ Rechazar'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ImageModal imageUrl={selectedImage} onClose={() => setSelectedImage(null)} />
    </PageShell>
  );
}

