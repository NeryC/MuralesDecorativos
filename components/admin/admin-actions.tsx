'use client';

import { memo } from 'react';
import Link from 'next/link';

interface AdminActionsProps {
  onLogout: () => void;
  showAuditoria?: boolean;
  showBackToPanel?: boolean;
  backToPanelHref?: string;
}

function AdminActionsComponent({
  onLogout,
  showAuditoria = true,
  showBackToPanel = false,
  backToPanelHref = '/admin',
}: AdminActionsProps) {
  return (
    <div className="flex gap-3">
      {showBackToPanel && (
        <Link
          href={backToPanelHref}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm transition-colors"
        >
          ← Volver
        </Link>
      )}
      {showAuditoria && (
        <Link
          href="/admin/auditoria"
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm transition-colors"
        >
          Ver Historial
        </Link>
      )}
      <button
        onClick={onLogout}
        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm transition-colors"
      >
        Cerrar Sesión
      </button>
    </div>
  );
}

export const AdminActions = memo(AdminActionsComponent);

