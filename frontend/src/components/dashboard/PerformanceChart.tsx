import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const data = [
  { subject: 'Math', average: 85, target: 90 },
  { subject: 'Science', average: 78, target: 85 },
  { subject: 'English', average: 92, target: 90 },
  { subject: 'History', average: 76, target: 80 },
  { subject: 'Art', average: 88, target: 85 },
  { subject: 'PE', average: 95, target: 90 },
];

const PerformanceChart: React.FC = () => {
  return (
    <div className="card p-6">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Academic Performance
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Average scores vs target performance by subject
        </p>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="subject" 
              className="text-gray-600 dark:text-gray-400"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              className="text-gray-600 dark:text-gray-400"
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--tw-color-white)',
                border: '1px solid var(--tw-color-gray-200)',
                borderRadius: '0.5rem',
              }}
              labelStyle={{ color: 'var(--tw-color-gray-900)' }}
            />
            <Legend />
            <Bar 
              dataKey="average" 
              fill="#0ea5e9" 
              name="Current Average"
              radius={[2, 2, 0, 0]}
            />
            <Bar 
              dataKey="target" 
              fill="#8b5cf6" 
              name="Target"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PerformanceChart;
