'use client';

import { useState, useCallback } from 'react';
import { MESSAGES } from '@/lib/messages';

interface SubmitStatus {
  type: 'success' | 'error';
  message: string;
}

interface UseFormSubmitOptions<T> {
  onSubmit: (data: T) => Promise<Response>;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
}

interface UseFormSubmitReturn<T> {
  status: SubmitStatus | null;
  isSubmitting: boolean;
  submit: (data: T) => Promise<void>;
  reset: () => void;
  setError: (message: string) => void;
  setSuccess: (message: string) => void;
}

export function useFormSubmit<T>({
  onSubmit,
  onSuccess,
  onError,
  successMessage = MESSAGES.SUCCESS.OPERACION_COMPLETADA,
  errorMessage = MESSAGES.ERROR.PROCESAR_SOLICITUD,
}: UseFormSubmitOptions<T>): UseFormSubmitReturn<T> {
  const [status, setStatus] = useState<SubmitStatus | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = useCallback(
    async (data: T) => {
      setStatus(null);
      setIsSubmitting(true);

      try {
        const response = await onSubmit(data);

        if (response.ok) {
          const message = successMessage;
          setStatus({ type: 'success', message });
          onSuccess?.(data);
        } else {
          const errorData = await response.json().catch(() => ({}));
          const message = errorData.error || errorMessage;
          setStatus({ type: 'error', message });
          onError?.(new Error(message));
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : errorMessage;
        setStatus({ type: 'error', message });
        onError?.(error instanceof Error ? error : new Error(message));
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSubmit, onSuccess, onError, successMessage, errorMessage]
  );

  const reset = useCallback(() => {
    setStatus(null);
  }, []);

  const setError = useCallback((message: string) => {
    setStatus({ type: 'error', message });
  }, []);

  const setSuccess = useCallback((message: string) => {
    setStatus({ type: 'success', message });
  }, []);

  return {
    status,
    isSubmitting,
    submit,
    reset,
    setError,
    setSuccess,
  };
}

