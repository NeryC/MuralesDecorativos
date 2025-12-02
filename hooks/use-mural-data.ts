'use client';

import { useEffect, useState, useCallback } from 'react';
import type { MuralWithModificaciones } from '@/lib/types';

interface UseMuralDataOptions {
  highlightId?: string | null;
  endpoint?: string;
}

interface UseMuralDataReturn {
  murales: MuralWithModificaciones[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useMuralData({ 
  highlightId, 
  endpoint = '/api/murales' 
}: UseMuralDataOptions = {}): UseMuralDataReturn {
  const [murales, setMurales] = useState<MuralWithModificaciones[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMurales = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(endpoint);
      const data = await response.json();
      let muralesList = Array.isArray(data) ? data : [];

      // Si hay un highlightId, obtener ese mural específico aunque esté pendiente
      if (highlightId) {
        try {
          const highlightResponse = await fetch(`/api/murales/${highlightId}`);
          if (highlightResponse.ok) {
            const highlightMural = await highlightResponse.json();
            // Verificar si el mural ya está en la lista
            const exists = muralesList.some((m) => m.id === highlightId);
            if (!exists) {
              // Agregar el mural resaltado a la lista
              muralesList = [highlightMural, ...muralesList];
            }
          }
        } catch (err) {
          console.error('Error fetching highlighted mural:', err);
        }
      }

      setMurales(muralesList);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error al cargar los murales');
      setError(error);
      console.error('Error fetching murales:', err);
      setMurales([]);
    } finally {
      setLoading(false);
    }
  }, [highlightId, endpoint]);

  useEffect(() => {
    fetchMurales();
  }, [fetchMurales]);

  return {
    murales,
    loading,
    error,
    refetch: fetchMurales,
  };
}

