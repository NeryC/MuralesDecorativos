'use client';

import { memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import type { FilterType } from '@/hooks/use-mural-filters';

interface FilterButtonsProps {
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  pendienteCount: number;
  modificadoPendienteCount: number;
  totalCount: number;
}

function FilterButtonsComponent({
  filter,
  onFilterChange,
  pendienteCount,
  modificadoPendienteCount,
  totalCount,
}: FilterButtonsProps) {
  const handlePendienteClick = useCallback(() => {
    onFilterChange('pendiente');
  }, [onFilterChange]);

  const handleModificadoClick = useCallback(() => {
    onFilterChange('modificado_pendiente');
  }, [onFilterChange]);

  const handleAllClick = useCallback(() => {
    onFilterChange('all');
  }, [onFilterChange]);

  return (
    <div className="flex gap-4 mb-6">
      <Button
        variant={filter === 'pendiente' ? 'default' : 'outline'}
        onClick={handlePendienteClick}
      >
        Pendientes ({pendienteCount})
      </Button>
      <Button
        variant={filter === 'modificado_pendiente' ? 'default' : 'outline'}
        onClick={handleModificadoClick}
      >
        Modificados Pendientes ({modificadoPendienteCount})
      </Button>
      <Button
        variant={filter === 'all' ? 'default' : 'outline'}
        onClick={handleAllClick}
      >
        Todos ({totalCount})
      </Button>
    </div>
  );
}

export const FilterButtons = memo(FilterButtonsComponent);

