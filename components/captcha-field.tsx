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
      <p className="text-sm font-semibold mb-2">{question}</p>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
      />
    </FormField>
  );
}

