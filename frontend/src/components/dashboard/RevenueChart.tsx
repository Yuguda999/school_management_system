import React, { useState, useEffect } from 'react';
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

const RevenueChart: React.FC = () => {
  const { currentTerm } = useCurrentTerm();
  const [data, setData] = useState([
    { month: 'Jan', revenue: 18000 },
    { month: 'Feb', revenue: 19500 },
    { month: 'Mar', revenue: 21000 },
    { month: 'Apr', revenue: 20500 },
    { month: 'May', revenue: 22000 },
    { month: 'Jun', revenue: 23500 },
  ]);

  useEffect(() => {
    // In a real implementation, you would fetch revenue data based on currentTerm
    // For now, we'll use mock data that could vary by term
    if (currentTerm) {
      // Mock different data for different terms
      const termBasedData = [
        { month: 'Jan', revenue: 18000 + (currentTerm.name.includes('First') ? 0 : 3000) },
        { month: 'Feb', revenue: 19500 + (currentTerm.name.includes('First') ? 0 : 3000) },
        { month: 'Mar', revenue: 21000 + (currentTerm.name.includes('First') ? 0 : 3000) },
        { month: 'Apr', revenue: 20500 + (currentTerm.name.includes('First') ? 0 : 3000) },
        { month: 'May', revenue: 22000 + (currentTerm.name.includes('First') ? 0 : 3000) },
        { month: 'Jun', revenue: 23500 + (currentTerm.name.includes('First') ? 0 : 3000) },
      ];
      setData(termBasedData);
    }
  }, [currentTerm]);
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
              formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
            />
            <Bar
              dataKey="revenue"
              fill="#8b5cf6"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueChart;
