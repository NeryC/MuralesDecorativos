'use client';

import { Button } from '@/components/ui/button';

interface FilterButtonsProps {
  filter: 'all' | 'pendiente' | 'modificado_pendiente';
  onFilterChange: (filter: 'all' | 'pendiente' | 'modificado_pendiente') => void;
  pendienteCount: number;
  modificadoPendienteCount: number;
  totalCount: number;
}

export function FilterButtons({
  filter,
  onFilterChange,
  pendienteCount,
  modificadoPendienteCount,
  totalCount,
}: FilterButtonsProps) {
  return (
    <div className="flex gap-4 mb-6">
      <Button
        variant={filter === 'pendiente' ? 'default' : 'outline'}
        onClick={() => onFilterChange('pendiente')}
      >
        Pendientes ({pendienteCount})
      </Button>
      <Button
        variant={filter === 'modificado_pendiente' ? 'default' : 'outline'}
        onClick={() => onFilterChange('modificado_pendiente')}
      >
        Modificados Pendientes ({modificadoPendienteCount})
      </Button>
      <Button
        variant={filter === 'all' ? 'default' : 'outline'}
        onClick={() => onFilterChange('all')}
      >
        Todos ({totalCount})
      </Button>
    </div>
  );
}

