'use client';

import { useState, useCallback } from 'react';

interface ErrorState {
  message: string | null;
}

interface UseErrorHandlerReturn {
  error: ErrorState['message'];
  setError: (message: string | null) => void;
  clearError: () => void;
}

export function useErrorHandler(): UseErrorHandlerReturn {
  const [error, setErrorState] = useState<ErrorState['message']>(null);

  const setError = useCallback((message: string | null) => {
    setErrorState(message);
  }, []);

  const clearError = useCallback(() => {
    setErrorState(null);
  }, []);

  return {
    error,
    setError,
    clearError,
  };
}

