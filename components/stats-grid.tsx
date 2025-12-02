'use client';

import { memo, useMemo } from 'react';
import { StatsCard } from './stats-card';

interface Stat {
  label: string;
  value: string | number;
  color?: string;
}

interface StatsGridProps {
  stats: Stat[];
}

function StatsGridComponent({ stats }: StatsGridProps) {
  const validStats = useMemo(() => {
    return stats?.filter(Boolean) || [];
  }, [stats]);

  if (validStats.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-4 justify-center w-full">
      {validStats.map((stat, index) => (
        <StatsCard
          key={`${stat.label}-${index}`}
          label={stat.label}
          value={stat.value}
          color={stat.color}
        />
      ))}
    </div>
  );
}

export const StatsGrid = memo(StatsGridComponent);

