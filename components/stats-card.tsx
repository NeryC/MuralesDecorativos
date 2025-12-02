'use client';

import { memo } from 'react';
import { Card } from '@/components/ui/card';

interface StatsCardProps {
  label: string;
  value: string | number;
  color?: string;
}

function StatsCardComponent({ label, value, color = '#3B82F6' }: StatsCardProps) {
  return (
    <Card
      className="flex flex-col px-4 py-3 min-w-[120px]"
      style={{
        borderLeftWidth: '4px',
        borderLeftColor: color,
      }}
    >
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
        {label}
      </span>
      <span 
        className="text-xl md:text-2xl font-bold"
        style={{ color }}
      >
        {value}
      </span>
    </Card>
  );
}

export const StatsCard = memo(StatsCardComponent);

