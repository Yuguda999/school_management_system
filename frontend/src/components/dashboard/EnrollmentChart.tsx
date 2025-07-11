import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const data = [
  { month: 'Jan', students: 1100 },
  { month: 'Feb', students: 1150 },
  { month: 'Mar', students: 1180 },
  { month: 'Apr', students: 1200 },
  { month: 'May', students: 1220 },
  { month: 'Jun', students: 1250 },
];

const EnrollmentChart: React.FC = () => {
  return (
    <div className="card p-6">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Student Enrollment Trend
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Monthly enrollment over the past 6 months
        </p>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
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
            />
            <Line
              type="monotone"
              dataKey="students"
              stroke="#0ea5e9"
              strokeWidth={2}
              dot={{ fill: '#0ea5e9', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#0ea5e9', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default EnrollmentChart;
