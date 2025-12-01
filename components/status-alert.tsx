'use client';

import type { ReactNode } from 'react';

interface StatusAlertProps {
  type: 'success' | 'error';
  children: ReactNode;
  className?: string;
}

export function StatusAlert({ type, children, className }: StatusAlertProps) {
  const baseClasses =
    'p-4 rounded-md text-sm border ' +
    (type === 'success'
      ? 'bg-green-50 text-green-800 border-green-200'
      : 'bg-red-50 text-red-800 border-red-200');

  return <div className={`${baseClasses} ${className ?? ''}`.trim()}>{children}</div>;
}



