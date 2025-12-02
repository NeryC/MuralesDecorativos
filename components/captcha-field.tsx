'use client';

import { Input } from '@/components/ui/input';
import { FormField } from '@/components/form-field';

interface CaptchaFieldProps {
  question: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
}

export function CaptchaField({
  question,
  value,
  onChange,
  required = true,
  disabled = false,
}: CaptchaFieldProps) {
  return (
    <FormField label="Verificación (anti-spam)" required={required}>
      <div className="flex items-center gap-3">
        <p className="text-sm font-medium text-gray-700 bg-gray-50 px-3 py-2 rounded-md border border-gray-200 flex-shrink-0 whitespace-nowrap">
          {question}
        </p>
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          disabled={disabled}
          placeholder="Ingresa tu respuesta"
          className="flex-1"
        />
      </div>
    </FormField>
  );
}

