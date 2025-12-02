'use client';

import { memo, useMemo, type ReactNode } from 'react';

interface StatusAlertProps {
  type: 'success' | 'error';
  children: ReactNode;
  className?: string;
  onClose?: () => void;
}

function StatusAlertComponent({ type, children, className, onClose }: StatusAlertProps) {
  const baseClasses = useMemo(() => {
    const typeClasses = type === 'success'
      ? 'bg-green-50 text-green-800 border-green-200'
      : 'bg-red-50 text-red-800 border-red-200';
    
    return `p-4 rounded-md text-sm border ${typeClasses} ${className ?? ''} ${onClose ? 'relative pr-10' : ''}`.trim();
  }, [type, className, onClose]);

  return (
    <div className={baseClasses}>
      {children}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-current opacity-60 hover:opacity-100 transition-opacity"
          aria-label="Cerrar"
        >
          ×
        </button>
      )}
    </div>
  );
}

export const StatusAlert = memo(StatusAlertComponent);



