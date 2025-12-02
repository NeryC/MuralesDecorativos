'use client';

import { memo, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  label: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

function FormFieldComponent({ label, required, children, className }: FormFieldProps) {
  return (
    <div className={cn('shrink-0', className)}>
      <label className="block text-sm font-semibold text-gray-900 mb-1.5">
        {label}
        {required && <span className="text-red-600 ml-1">*</span>}
      </label>
      <div>
        {children}
      </div>
    </div>
  );
}

export const FormField = memo(FormFieldComponent);

