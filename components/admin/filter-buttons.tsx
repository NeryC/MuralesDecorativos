'use client';

import { memo, useCallback } from 'react';
import type { FilterType } from '@/hooks/use-mural-filters';

interface FilterButtonsProps {
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  pendienteCount: number;
  modificadoPendienteCount: number;
  totalCount: number;
}

const pillBase: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: '20px',
  fontSize: '12px',
  fontWeight: '600',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  border: '1.5px solid #e2e8f0',
};

const pillActive: React.CSSProperties = {
  ...pillBase,
  background: '#1e40af',
  border: '1.5px solid #1e40af',
  color: 'white',
};

const pillInactive: React.CSSProperties = {
  ...pillBase,
  background: 'white',
  border: '1.5px solid #e2e8f0',
  color: '#64748b',
};

const badgeActive: React.CSSProperties = {
  background: 'rgba(255,255,255,0.25)',
  borderRadius: '10px',
  padding: '1px 7px',
  fontSize: '10px',
};

const badgeInactive: React.CSSProperties = {
  background: '#f1f5f9',
  borderRadius: '10px',
  padding: '1px 7px',
  fontSize: '10px',
};

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
    <div className="flex flex-wrap gap-2">
      <button
        style={filter === 'pendiente' ? pillActive : pillInactive}
        onClick={handlePendienteClick}
      >
        Pendientes
        <span style={filter === 'pendiente' ? badgeActive : badgeInactive}>
          {pendienteCount}
        </span>
      </button>
      <button
        style={filter === 'modificado_pendiente' ? pillActive : pillInactive}
        onClick={handleModificadoClick}
      >
        Modificados Pendientes
        <span style={filter === 'modificado_pendiente' ? badgeActive : badgeInactive}>
          {modificadoPendienteCount}
        </span>
      </button>
      <button
        style={filter === 'all' ? pillActive : pillInactive}
        onClick={handleAllClick}
      >
        Todos
        <span style={filter === 'all' ? badgeActive : badgeInactive}>
          {totalCount}
        </span>
      </button>
    </div>
  );
}

export const FilterButtons = memo(FilterButtonsComponent);

