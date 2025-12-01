'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  label: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function FormField({ label, required, children, className }: FormFieldProps) {
  return (
    <div className={cn('flex-shrink-0', className)}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && ' *'}
      </label>
      {children}
    </div>
  );
}

