import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useCurrentTerm } from '../../hooks/useCurrentTerm';

import { RevenueData } from '../../services/reportsService';

interface RevenueChartProps {
  data: RevenueData[];
  currency?: string;
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data, currency = '$' }) => {
  const { currentTerm } = useCurrentTerm();
  return (
    <div className="card p-6">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Monthly Revenue
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {currentTerm
            ? `Fee collection for ${currentTerm.name} (${currentTerm.academic_session})`
            : 'Fee collection over the past 6 months'
          }
        </p>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis
              dataKey="month"
              className="text-gray-600 dark:text-gray-400"
            />
            <YAxis className="text-gray-600 dark:text-gray-400" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--tw-color-white)',
                border: '1px solid var(--tw-color-gray-200)',
                borderRadius: '0.5rem',
              }}
              labelStyle={{ color: 'var(--tw-color-gray-900)' }}
              formatter={(value) => [`${currency}${value.toLocaleString()}`, 'Revenue']}
            />
            <Bar
              dataKey="revenue"
              fill="rgb(var(--color-secondary-500))"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueChart;
