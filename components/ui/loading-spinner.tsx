'use client';

import { memo, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
}

const sizeClasses = {
  sm: 'w-6 h-6 border-2',
  md: 'w-10 h-10 border-4',
  lg: 'w-16 h-16 border-4',
};

function LoadingSpinnerComponent({ 
  className, 
  size = 'md', 
  text,
  fullScreen = false 
}: LoadingSpinnerProps) {
  const spinner = (
    <>
      <div
        className={cn(
          'border-gray-300 border-t-blue-600 rounded-full animate-spin',
          sizeClasses[size],
          className
        )}
        role="status"
        aria-label="Cargando"
      >
        <span className="sr-only">Cargando...</span>
      </div>
      {text && (
        <p className={cn(
          'mt-6 text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent',
          size === 'sm' && 'text-sm mt-2',
          size === 'lg' && 'text-xl mt-8'
        )}>
          {text}
        </p>
      )}
    </>
  );

  if (fullScreen) {
    return (
      <div
        className="h-screen flex flex-col items-center justify-center"
        style={{
          background: '#F8FAFC',
        }}
      >
        {spinner}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center">
      {spinner}
    </div>
  );
}

export const LoadingSpinner = memo(LoadingSpinnerComponent);

