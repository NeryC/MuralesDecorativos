'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

interface PageShellProps {
  title: string;
  children: ReactNode;
  rightActions?: ReactNode;
  fullHeight?: boolean;
  scrollableMain?: boolean;
  showMapButton?: boolean;
  subtitle?: string;
  stats?: Array<{ label: string; value: string | number; color?: string }>;
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
}: PageShellProps) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  return (
    <div 
      className="h-screen flex flex-col items-center justify-center relative overflow-hidden w-full"
      style={{
        background: '#F8FAFC',
        paddingLeft: 'clamp(1rem, 3vw, 3rem)',
        paddingRight: 'clamp(1rem, 3vw, 3rem)',
        maxWidth: '100vw',
        height: '100vh',
        overflowY: 'hidden',
      }}
    >

      <div className="relative z-10 w-full max-w-7xl mx-auto py-4 md:py-5 lg:py-6" style={{ width: '100%', maxWidth: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
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
                {!isHomePage && (
                  <Link
                    href="/"
                    className="px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                    style={{
                      background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                      color: 'white',
                    }}
                  >
                    🗺️ Ver Mapa
                  </Link>
                )}
                    {rightActions}
                  </div>
                </div>
                {stats && stats.length > 0 && (
                  <div className="flex flex-wrap gap-4 justify-center w-full">
                    {stats.map((stat, index) => (
                      <Card
                        key={index}
                        className="flex flex-col px-4 py-3 min-w-[120px]"
                        style={{
                          borderLeftWidth: '4px',
                          borderLeftColor: stat.color || '#3B82F6',
                        }}
                      >
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                          {stat.label}
                        </span>
                        <span 
                          className="text-xl md:text-2xl font-bold"
                          style={{ color: stat.color || '#3B82F6' }}
                        >
                          {stat.value}
                        </span>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CardHeader>
          </Card>

          {/* Main content con Tailwind Plus UI Blocks */}
          <Card className={`flex-1 w-full ${
            scrollableMain ? 'overflow-auto' : 'overflow-hidden flex flex-col'
          }`}
          style={!scrollableMain ? { 
            display: 'flex',
            flexDirection: 'column',
            flex: '1 1 0%',
            minHeight: 0,
          } : {}}
          >
            <CardContent className={scrollableMain ? 'p-6 md:p-8 lg:p-10' : 'p-0 h-full'}>
              {children}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}



