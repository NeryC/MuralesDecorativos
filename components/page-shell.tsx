'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { StatsGrid } from '@/components/stats-grid';
import { AdminActions } from '@/components/admin/admin-actions';

interface PageShellProps {
  title: string;
  children: ReactNode;
  rightActions?: ReactNode;
  fullHeight?: boolean;
  scrollableMain?: boolean;
  showMapButton?: boolean;
  subtitle?: string;
  stats?: Array<{ label: string; value: string | number; color?: string }>;
  adminActions?: {
    onLogout: () => void;
    showAuditoria?: boolean;
    showBackToPanel?: boolean;
    backToPanelHref?: string;
  };
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

  // Si hay adminActions, usarlas; de lo contrario, usar rightActions personalizados
  const finalRightActions = adminActions ? (
    <AdminActions {...adminActions} />
  ) : rightActions;

  return (
    <div 
      className="h-screen flex flex-col items-center justify-center relative overflow-hidden w-full bg-[#F8FAFC] max-w-screen overflow-y-hidden"
      style={{
        paddingLeft: 'clamp(1rem, 3vw, 3rem)',
        paddingRight: 'clamp(1rem, 3vw, 3rem)',
      }}
    >
      <div className="relative z-10 w-full max-w-7xl mx-auto py-4 md:py-5 lg:py-6 h-full flex flex-col">
        <div
          className={`w-full flex flex-col gap-4 md:gap-5 ${
            fullHeight ? 'h-full' : ''
          }`}
        >
          {/* Header mejorado con Tailwind Plus UI Blocks */}
          <Card className="flex-shrink-0">
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-4 md:gap-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 md:gap-6">
                  <div className="flex-1">
                    <CardTitle className="text-2xl md:text-3xl lg:text-4xl text-gray-900 mb-2">
                      {title}
                    </CardTitle>
                    {subtitle && (
                      <CardDescription className="text-sm md:text-base mt-2">
                        {subtitle}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
                {!isHomePage && showMapButton && (
                  <Link
                    href="/"
                    className="px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 text-white bg-gradient-to-br from-blue-500 to-blue-600"
                  >
                    🗺️ Ver Mapa
                  </Link>
                )}
                    {finalRightActions}
                  </div>
                </div>
                {stats && stats.length > 0 && <StatsGrid stats={stats} />}
              </div>
            </CardHeader>
          </Card>

          {/* Main content con Tailwind Plus UI Blocks */}
          <Card className={`flex-1 w-full ${
            scrollableMain 
              ? 'overflow-auto' 
              : 'overflow-hidden flex flex-col min-h-0'
          }`}>
            <CardContent className={scrollableMain ? 'p-6 md:p-8 lg:p-10' : 'p-0 h-full'}>
              {children}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}



