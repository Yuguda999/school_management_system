/**
 * Benchmark Panel Component (P3.3)
 * Displays anonymized grade benchmarks for students
 */

import React, { useEffect, useState } from 'react';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import analyticsService, { BenchmarkData } from '../../services/analyticsService';
import { useSchoolCode } from '../../hooks/useSchoolCode';
import LoadingSpinner from '../ui/LoadingSpinner';
import Card from '../ui/Card';

interface BenchmarkPanelProps {
  studentId?: string;
  subjectId?: string;
  termId?: string;
}

const BenchmarkPanel: React.FC<BenchmarkPanelProps> = ({ studentId, subjectId, termId }) => {
  const schoolCode = useSchoolCode();
  const [benchmarks, setBenchmarks] = useState<BenchmarkData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBenchmarks = async () => {
      if (!schoolCode || !studentId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await analyticsService.getStudentBenchmark(schoolCode, studentId, subjectId, termId);
        setBenchmarks(data);
      } catch (err) {
        setError('Failed to load benchmark data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBenchmarks();
  }, [schoolCode, studentId, subjectId, termId]);

  if (!studentId) {
    return (
      <Card className="p-6 text-center max-w-2xl mx-auto">
        <ChartBarIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">Benchmark data will appear here when available</p>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || benchmarks.length === 0) {
    return (
      <Card className="p-6 text-center text-gray-500">
        {error || 'No benchmark data available'}
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
        <ChartBarIcon className="h-6 w-6 mr-2 text-primary-500" />
        Class Benchmarks
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {benchmarks.map((benchmark) => {
          const isAboveAverage = benchmark.student_score > benchmark.class_average;
          const diff = benchmark.student_score - benchmark.class_average;

          return (
            <Card key={`${benchmark.class_id}-${benchmark.subject_id}`} className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{benchmark.subject_name}</h3>
                  <p className="text-sm text-gray-500">{benchmark.class_name}</p>
                </div>
                <div className={`flex items-center space-x-1 ${isAboveAverage ? 'text-green-600' : 'text-red-600'}`}>
                  {isAboveAverage ? (
                    <ArrowTrendingUpIcon className="h-5 w-5" />
                  ) : (
                    <ArrowTrendingDownIcon className="h-5 w-5" />
                  )}
                  <span className="font-semibold">{diff > 0 ? '+' : ''}{diff.toFixed(1)}%</span>
                </div>
              </div>

              {/* Score Visualization */}
              <div className="relative h-8 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-4">
                {/* Class range */}
                <div
                  className="absolute h-full bg-gray-300 dark:bg-gray-600"
                  style={{
                    left: `${benchmark.class_min}%`,
                    width: `${benchmark.class_max - benchmark.class_min}%`
                  }}
                />
                {/* Class average marker */}
                <div
                  className="absolute h-full w-1 bg-blue-500"
                  style={{ left: `${benchmark.class_average}%` }}
                />
                {/* Student score marker */}
                <div
                  className="absolute h-full w-2 bg-primary-500 rounded-full"
                  style={{ left: `${benchmark.student_score}%`, transform: 'translateX(-50%)' }}
                />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-2 text-center text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Your Score</p>
                  <p className="font-bold text-primary-600">{benchmark.student_score.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Class Avg</p>
                  <p className="font-bold text-blue-600">{benchmark.class_average.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Median</p>
                  <p className="font-bold text-gray-600 dark:text-gray-300">{benchmark.class_median.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Percentile</p>
                  <p className="font-bold text-purple-600">{benchmark.percentile.toFixed(0)}th</p>
                </div>
              </div>

              {/* Grade Distribution */}
              {benchmark.grade_distribution && Object.keys(benchmark.grade_distribution).length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-xs text-gray-500 mb-2">Grade Distribution</p>
                  <div className="flex space-x-1">
                    {Object.entries(benchmark.grade_distribution).map(([grade, count]) => {
                      const total = Object.values(benchmark.grade_distribution).reduce((a, b) => a + b, 0);
                      const percentage = total > 0 ? (count / total) * 100 : 0;
                      return (
                        <div key={grade} className="flex-1 text-center">
                          <div
                            className={`h-8 rounded ${grade === 'A' ? 'bg-green-400' :
                                grade === 'B' ? 'bg-blue-400' :
                                  grade === 'C' ? 'bg-yellow-400' :
                                    grade === 'D' ? 'bg-orange-400' :
                                      'bg-red-400'
                              }`}
                            style={{ height: `${Math.max(percentage * 0.8, 4)}px` }}
                          />
                          <span className="text-xs text-gray-500">{grade}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default BenchmarkPanel;

