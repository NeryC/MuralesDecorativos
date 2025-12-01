'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PageShell } from '@/components/page-shell';
import { getClientUser } from '@/lib/auth/client';
import { createClient } from '@/lib/supabase/client';
import type { Auditoria } from '@/lib/types';

export default function AuditoriaPage() {
  const [auditoria, setAuditoria] = useState<Auditoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState<{ email: string } | null>(null);
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
    fetchAuditoria();
  }, [router]);

  const fetchAuditoria = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/auditoria?limit=200');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setAuditoria(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching auditoria:', error);
      setAuditoria([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  }, [router]);

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getAccionLabel = (accion: string) => {
    const labels: Record<string, string> = {
      aprobar_mural: 'Aprobar Mural',
      rechazar_mural: 'Rechazar Mural',
      aprobar_modificacion: 'Aprobar Modificación',
      rechazar_modificacion: 'Rechazar Modificación',
      actualizar_estado: 'Actualizar Estado',
    };
    return labels[accion] || accion;
  };

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
    <PageShell title="Historial de Cambios" scrollableMain>
      <div className="max-w-[1400px] mx-auto flex flex-col gap-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Historial de Cambios</h1>
            <p className="text-sm text-gray-600 mt-1">
              Registro de todas las acciones realizadas en el sistema
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <a
              href="/admin"
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
            >
              Volver al Panel
            </a>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>

        {auditoria.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No hay registros de auditoría.</p>
        ) : (
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Fecha/Hora</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Usuario</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Acción</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Entidad</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Cambios</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Comentario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {auditoria.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                      {formatFecha(item.created_at)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <div>
                        <div className="font-medium">{item.usuario_email || 'Sistema'}</div>
                        {item.usuario_nombre && (
                          <div className="text-xs text-gray-500">{item.usuario_nombre}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getAccionLabel(item.accion)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <div>
                        <span className="font-medium capitalize">{item.entidad_tipo}</span>
                        <div className="text-xs text-gray-500 font-mono">{item.entidad_id.slice(0, 8)}...</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {item.datos_anteriores && item.datos_nuevos ? (
                        <div className="space-y-1">
                          {Object.keys(item.datos_nuevos).map((key) => {
                            const anterior = item.datos_anteriores?.[key];
                            const nuevo = item.datos_nuevos?.[key];
                            if (anterior === nuevo) return null;
                            return (
                              <div key={key} className="text-xs">
                                <span className="font-medium">{key}:</span>{' '}
                                <span className="text-red-600 line-through">{String(anterior)}</span>{' '}
                                → <span className="text-green-600">{String(nuevo)}</span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {item.comentario || <span className="text-gray-400">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageShell>
  );
}

