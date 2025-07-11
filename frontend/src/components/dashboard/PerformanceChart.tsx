import React, { useState, useEffect } from 'react';
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
import { useCurrentTerm } from '../../hooks/useCurrentTerm';

const PerformanceChart: React.FC = () => {
  const { currentTerm } = useCurrentTerm();
  const [data, setData] = useState([
    { subject: 'Math', average: 85, target: 90 },
    { subject: 'Science', average: 78, target: 85 },
    { subject: 'English', average: 92, target: 90 },
    { subject: 'History', average: 76, target: 80 },
    { subject: 'Art', average: 88, target: 85 },
    { subject: 'PE', average: 95, target: 90 },
  ]);

  useEffect(() => {
    // In a real implementation, you would fetch performance data based on currentTerm
    // For now, we'll use mock data that could vary by term
    if (currentTerm) {
      // Mock different data for different terms
      const termBasedData = [
        { subject: 'Math', average: 85 + (currentTerm.name.includes('First') ? 0 : 3), target: 90 },
        { subject: 'Science', average: 78 + (currentTerm.name.includes('First') ? 0 : 4), target: 85 },
        { subject: 'English', average: 92 + (currentTerm.name.includes('First') ? 0 : 2), target: 90 },
        { subject: 'History', average: 76 + (currentTerm.name.includes('First') ? 0 : 3), target: 80 },
        { subject: 'Art', average: 88 + (currentTerm.name.includes('First') ? 0 : 2), target: 85 },
        { subject: 'PE', average: 95 + (currentTerm.name.includes('First') ? 0 : 1), target: 90 },
      ];
      setData(termBasedData);
    }
  }, [currentTerm]);
  return (
    <div className="card p-6">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Academic Performance
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {currentTerm
            ? `Average scores vs target for ${currentTerm.name} (${currentTerm.academic_session})`
            : 'Average scores vs target performance by subject'
          }
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
