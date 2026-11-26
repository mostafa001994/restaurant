'use client';

import { useEffect, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { vendorApi } from '@/lib/vendor';

interface Props {
  metric: 'orders' | 'revenue';
  title: string;
  onClose: () => void;
}

const PERIODS = [
  { key: 'day', label: 'روزانه (۳۰ روز اخیر)' },
  { key: 'week', label: 'هفتگی (۱۲ هفته اخیر)' },
  { key: 'month', label: 'ماهانه (۱۲ ماه اخیر)' },
  { key: 'year', label: 'سالانه (۵ سال اخیر)' },
];

export default function VendorStatChartModal({ metric, title, onClose }: Props) {
  const [period, setPeriod] = useState('day');
  const [data, setData] = useState<{ label: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    vendorApi
      .dashboardChart(metric, period)
      .then(setData)
      .finally(() => setLoading(false));
  }, [metric, period]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-xl leading-none">×</button>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`text-sm px-3 py-1 rounded-full border ${
                period === p.key ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-center text-gray-500 py-10">در حال بارگذاری نمودار...</p>
        ) : data.length === 0 ? (
          <p className="text-center text-gray-500 py-10">داده‌ای برای این بازه موجود نیست</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#059669" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
