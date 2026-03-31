'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

interface Stat {
  label: string;
  value: string | number;
  color?: string;
}

interface PageShellProps {
  title: string;
  children: ReactNode;
  rightActions?: ReactNode;
  fullHeight?: boolean;
  scrollableMain?: boolean;
  showMapButton?: boolean;
  subtitle?: string;
  stats?: Stat[];
  adminActions?: {
    onLogout: () => void;
    showAuditoria?: boolean;
    showBackToPanel?: boolean;
    backToPanelHref?: string;
  };
}

// Sidebar de admin integrado en PageShell para mantener compatibilidad con páginas existentes
function AdminSidebar({
  onLogout,
  showAuditoria,
  showBackToPanel,
  backToPanelHref,
}: NonNullable<PageShellProps['adminActions']>) {
  const pathname = usePathname();

  const navItems = [
    { href: '/admin', label: 'Murales', icon: '🗺' },
    { href: '/admin/modificaciones', label: 'Modificaciones', icon: '🔄' },
    ...(showAuditoria !== false ? [{ href: '/admin/auditoria', label: 'Auditoría', icon: '📋' }] : []),
  ];

  return (
    <aside
      style={{ width: '180px', minWidth: '180px', background: '#0f172a' }}
      className="hidden lg:flex flex-col h-full"
    >
      <div style={{ borderBottom: '1px solid #1e293b' }} className="px-4 py-4">
        <div className="text-white font-bold text-sm">Murales Políticos</div>
        <div className="text-xs mt-0.5" style={{ color: '#64748b' }}>Panel de gestión</div>
      </div>
      <nav className="flex-1 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 px-4 py-2.5 text-sm transition-colors"
              style={{
                color: isActive ? '#60a5fa' : '#64748b',
                background: isActive ? '#1e293b' : 'transparent',
                borderRight: isActive ? '2px solid #3b82f6' : '2px solid transparent',
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div style={{ borderTop: '1px solid #1e293b' }} className="p-3">
        {showBackToPanel && backToPanelHref && (
          <Link
            href={backToPanelHref}
            className="block text-center text-xs py-2 px-3 rounded-md mb-2 transition-colors"
            style={{ color: '#94a3b8', background: '#1e293b' }}
          >
            ← Volver
          </Link>
        )}
        <button
          onClick={onLogout}
          className="w-full text-xs py-2 px-3 rounded-md transition-colors text-left"
          style={{ color: '#94a3b8', background: '#1e293b' }}
        >
          ⬡ Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

export function PageShell({
  title,
  children,
  rightActions,
  fullHeight = true,
  scrollableMain = false,
  showMapButton = true,
  subtitle,
  stats,
  adminActions,
}: PageShellProps) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const isAdmin = Boolean(adminActions);

  return (
    <div className={`flex flex-col ${fullHeight ? 'h-screen overflow-hidden' : 'min-h-screen'} w-full`} style={{ background: '#f8fafc' }}>
      {/* Header navy */}
      <header style={{ background: '#1e3a5f', flexShrink: 0 }} className="w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="flex items-center justify-center text-lg rounded-md flex-shrink-0"
              style={{ width: '32px', height: '32px', background: '#3b82f6' }}
            >
              🗺
            </div>
            <div className="min-w-0">
              <div className="font-bold text-white text-sm sm:text-base truncate">{title}</div>
              {subtitle && (
                <div className="text-xs truncate" style={{ color: '#93c5fd' }}>{subtitle}</div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {!isHomePage && showMapButton && (
              <Link
                href="/"
                className="text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
                style={{ background: 'rgba(255,255,255,0.1)', color: '#e2e8f0' }}
              >
                🗺️ Ver Mapa
              </Link>
            )}
            {rightActions}
          </div>
        </div>
      </header>

      {/* Stats bar (solo si hay stats) */}
      {stats && stats.length > 0 && (
        <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex divide-x" style={{ borderColor: '#e2e8f0' }}>
              {stats.map((stat, i) => (
                <div key={i} className="flex-1 py-2.5 px-3 text-center">
                  <div
                    className="text-xl font-extrabold leading-none"
                    style={{ color: stat.color || '#1e40af' }}
                  >
                    {stat.value}
                  </div>
                  <div
                    className="text-xs mt-0.5 uppercase tracking-wide"
                    style={{ color: '#94a3b8', fontSize: '9px', letterSpacing: '0.5px' }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Body: sidebar + main */}
      <div className={`flex flex-1 ${fullHeight ? 'min-h-0' : ''} max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 ${isAdmin ? 'gap-0' : 'py-4 gap-0'}`}>
        {isAdmin && adminActions && (
          <AdminSidebar {...adminActions} />
        )}
        <main
          className={`flex-1 min-w-0 ${isAdmin ? 'lg:pl-6 py-4' : ''} ${fullHeight && scrollableMain ? 'overflow-auto' : fullHeight ? 'overflow-hidden flex flex-col min-h-0' : ''}`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
