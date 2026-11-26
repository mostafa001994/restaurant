'use client';

import { useState } from 'react';
import { ChartMetric } from '@/lib/dashboard';
import StatChartModal from './StatChartModal';

interface Props {
  metric: ChartMetric;
  title: string;
  value: string | number;
  icon?: string;
}

export default function StatCard({ metric, title, value, icon }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-white rounded-lg shadow p-4 text-right hover:shadow-md transition w-full"
      >
        <div className="flex items-center justify-between">
          <span className="text-gray-500 text-sm">{title}</span>
          {icon && <span className="text-2xl">{icon}</span>}
        </div>
        <div className="text-2xl font-bold mt-2">{value}</div>
        <div className="text-xs text-blue-600 mt-1">مشاهده‌ی نمودار جزئیات ←</div>
      </button>

      {open && <StatChartModal metric={metric} title={title} onClose={() => setOpen(false)} />}
    </>
  );
}
