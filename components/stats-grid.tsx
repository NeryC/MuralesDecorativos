'use client';

import { memo } from 'react';

interface Stat {
  label: string;
  value: string | number;
  color?: string;
}

interface StatsGridProps {
  stats: Stat[];
}

function StatsGridComponent({ stats }: StatsGridProps) {
  if (!stats?.length) return null;

  return (
    <div className="flex divide-x" style={{ borderColor: '#e2e8f0' }}>
      {stats.map((stat, i) => (
        <div key={i} className="flex-1 py-2.5 px-3 text-center">
          <div
            className="text-xl font-extrabold leading-none"
            style={{ color: stat.color || '#1e40af' }}
          >
            {stat.value}
          </div>
          <div
            className="uppercase tracking-wide mt-0.5"
            style={{ color: '#94a3b8', fontSize: '9px', letterSpacing: '0.5px' }}
          >
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}

export const StatsGrid = memo(StatsGridComponent);
