'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PageShell } from '@/components/page-shell';
import { FilterButtons } from '@/components/admin/filter-buttons';
import { MuralRow } from '@/components/admin/mural-row';
import ImageModal from '@/components/image-modal';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { StatusAlert } from '@/components/status-alert';
import { MESSAGES } from '@/lib/messages';
import { useMuralHelpers } from '@/hooks/use-mural-helpers';
import { useMuralFilters, type FilterType } from '@/hooks/use-mural-filters';
import { getClientUser } from '@/lib/auth/client';
import type { AuthUser } from '@/lib/auth/types';
import { createClient } from '@/lib/supabase/client';
import type { MuralWithModificaciones } from '@/lib/types';

export default function AdminPage() {
  const [murales, setMurales] = useState<MuralWithModificaciones[]>([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('pendiente');

  const handleImageClick = useCallback((url: string) => {
    setSelectedImage(url);
  }, []);

  const handleCloseImage = useCallback(() => {
    setSelectedImage(null);
  }, []);
  const [processingModificacion, setProcessingModificacion] = useState<string | null>(null);
  const [updatingEstado, setUpdatingEstado] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  const { getUltimaModificacionPendiente, getImagenAmostrar } = useMuralHelpers(filter);

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

  const checkAuth = useCallback(async () => {
    const currentUser = await getClientUser();
    if (!currentUser) {
      router.push('/admin/login');
      return;
    }
    setUser(currentUser);
    setAuthLoading(false);
    fetchMurales();
  }, [router, fetchMurales]);

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo ejecutar una vez al montar

  const handleLogout = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  }, [router]);

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
          setErrorMessage(errorData.error || MESSAGES.ERROR.PROCESAR_MODIFICACION);
        }
      } catch (error) {
        console.error('Error processing modification:', error);
        setErrorMessage(MESSAGES.ERROR.PROCESAR_MODIFICACION);
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
          setErrorMessage(MESSAGES.ERROR.ACTUALIZAR_ESTADO);
        }
      } catch (error) {
        console.error('Error updating estado:', error);
        setErrorMessage(MESSAGES.ERROR.ACTUALIZAR_ESTADO);
      } finally {
        setUpdatingEstado(null);
      }
    },
    [fetchMurales]
  );

  const { filteredMurales, counts } = useMuralFilters(murales, filter);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <LoadingSpinner size="md" text="Cargando..." />
      </div>
    );
  }

  if (!user) {
    return null; // Se redirigirá al login
  }

  return (
    <PageShell 
      title="Panel de Administración" 
      scrollableMain
      showMapButton={true}
      adminActions={{
        onLogout: handleLogout,
        showAuditoria: true,
        showBackToPanel: false,
      }}
    >
      <div className="max-w-[1200px] mx-auto flex flex-col gap-6">
        {errorMessage && (
          <StatusAlert type="error" onClose={() => setErrorMessage(null)}>
            {errorMessage}
          </StatusAlert>
        )}
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
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Link del Mapa</th>
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
                      onImageClick={handleImageClick}
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

        <ImageModal imageUrl={selectedImage} onClose={handleCloseImage} />
      </div>
    </PageShell>
  );
}
