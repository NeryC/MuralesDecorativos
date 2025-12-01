'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

interface PageShellProps {
  title: string;
  children: ReactNode;
  rightActions?: ReactNode;
  fullHeight?: boolean;
  scrollableMain?: boolean;
  showMapButton?: boolean;
}

export function PageShell({
  title,
  children,
  rightActions,
  fullHeight = true,
  scrollableMain = false,
  showMapButton = true,
}: PageShellProps) {
  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 flex flex-col items-center justify-center">
      <div
        className={`w-[95%] max-w-[95%] flex flex-col gap-4 md:gap-6 ${
          fullHeight ? 'h-[calc(100vh-2rem)]' : ''
        }`}
      >
        <header className="flex-none bg-white rounded-2xl shadow-sm px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">{title}</h1>
          <div className="flex items-center gap-3">
            {showMapButton && (
              <Link
                href="/"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold transition-colors shadow-sm"
              >
                🗺️ Ver Mapa
              </Link>
            )}
            {rightActions}
          </div>
        </header>

        <main
          className={`flex-1 w-full bg-white rounded-3xl shadow-xl ${
            scrollableMain ? 'p-6 md:p-8 overflow-auto' : 'overflow-hidden'
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}



