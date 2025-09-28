import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  AcademicCapIcon,
  TrophyIcon,
  UserGroupIcon,
  DocumentChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import { Class, Term, GradeStatistics as GradeStatsType } from '../../types';
import GradeService from '../../services/gradeService';
import { academicService } from '../../services/academicService';
import { useToast } from '../../hooks/useToast';
import { useCurrentTerm } from '../../hooks/useCurrentTerm';

interface GradeStatisticsProps {
  selectedClassId?: string;
  selectedTermId?: string;
}

const GradeStatistics: React.FC<GradeStatisticsProps> = ({
  selectedClassId,
  selectedTermId
}) => {
  const { showError } = useToast();
  const { currentTerm, allTerms } = useCurrentTerm();
  const [statistics, setStatistics] = useState<GradeStatsType | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    class_id: selectedClassId || '',
    term_id: selectedTermId || ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchStatistics();
  }, [filters]);

  const fetchData = async () => {
    try {
      const classesData = await academicService.getClasses({ is_active: true });
      setClasses(classesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      showError('Failed to load data');
    }
  };

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const params = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '')
      );
      const statsData = await GradeService.getGradeStatistics(params);
      setStatistics(statsData);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      showError('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const getGradeDistributionColor = (grade: string): string => {
    switch (grade) {
      case 'A+':
        return 'bg-gradient-to-r from-green-400 to-green-600';
      case 'A':
        return 'bg-gradient-to-r from-green-500 to-green-700';
      case 'B+':
        return 'bg-gradient-to-r from-blue-400 to-blue-600';
      case 'B':
        return 'bg-gradient-to-r from-blue-500 to-blue-700';
      case 'C+':
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
      case 'C':
        return 'bg-gradient-to-r from-yellow-500 to-yellow-700';
      case 'D+':
        return 'bg-gradient-to-r from-orange-400 to-orange-600';
      case 'D':
        return 'bg-gradient-to-r from-orange-500 to-orange-700';
      case 'E':
        return 'bg-gradient-to-r from-red-400 to-red-600';
      case 'F':
        return 'bg-gradient-to-r from-red-500 to-red-700';
      default:
        return 'bg-gradient-to-r from-gray-400 to-gray-600';
    }
  };

  const calculateTotalGrades = (): number => {
    if (!statistics) return 0;
    return Object.values(statistics.grade_distribution).reduce((sum, count) => sum + count, 0);
  };

  const getPerformanceTrend = (performance: number): JSX.Element => {
    if (performance >= 80) {
      return (
        <div className="flex items-center text-green-600">
          <ArrowTrendingUpIcon className="w-4 h-4 mr-1" />
          <span className="text-sm font-medium">Excellent</span>
        </div>
      );
    } else if (performance >= 70) {
      return (
        <div className="flex items-center text-blue-600">
          <ArrowTrendingUpIcon className="w-4 h-4 mr-1" />
          <span className="text-sm font-medium">Good</span>
        </div>
      );
    } else if (performance >= 60) {
      return (
        <div className="flex items-center text-yellow-600">
          <span className="text-sm font-medium">Average</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-red-600">
          <ArrowTrendingDownIcon className="w-4 h-4 mr-1" />
          <span className="text-sm font-medium">Needs Improvement</span>
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Loading statistics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Grade Statistics
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Overview of academic performance and grade distribution
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={filters.class_id}
            onChange={(e) => setFilters({ ...filters, class_id: e.target.value })}
            className="input"
          >
            <option value="">All Classes</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
          
          <select
            value={filters.term_id}
            onChange={(e) => setFilters({ ...filters, term_id: e.target.value })}
            className="input"
          >
            <option value="">All Terms</option>
            {allTerms.map((term) => (
              <option key={term.id} value={term.id}>
                {term.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!statistics ? (
        <div className="card p-8 text-center">
          <DocumentChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No statistics available
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            No grade data found for the selected filters.
          </p>
        </div>
      ) : (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AcademicCapIcon className="w-8 h-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Exams
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {statistics.total_exams}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {statistics.published_exams} published
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="w-8 h-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Grades
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {statistics.total_grades}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {statistics.published_grades} published
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrophyIcon className="w-8 h-8 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Average Performance
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {typeof statistics.average_class_performance === 'number' 
                      ? statistics.average_class_performance.toFixed(1) 
                      : 'N/A'}%
                  </p>
                  {typeof statistics.average_class_performance === 'number' && (
                    <div className="mt-1">
                      {getPerformanceTrend(statistics.average_class_performance)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserGroupIcon className="w-8 h-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Subjects Assessed
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {statistics.subjects_assessed || 0}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Active subjects
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Grade Distribution */}
          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
              Grade Distribution
            </h3>
            
            {Object.keys(statistics.grade_distribution).length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  <ChartBarIcon className="w-12 h-12 text-gray-400" />
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  No grade distribution data available
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(statistics.grade_distribution)
                  .sort(([a], [b]) => {
                    // Sort grades in order: A+, A, B+, B, C+, C, D+, D, E, F
                    const gradeOrder = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'E', 'F'];
                    return gradeOrder.indexOf(a) - gradeOrder.indexOf(b);
                  })
                  .map(([grade, count]) => {
                  const totalGrades = calculateTotalGrades();
                  const percentage = totalGrades > 0 ? (count / totalGrades) * 100 : 0;
                  
                  return (
                    <div key={grade} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded-full ${getGradeDistributionColor(grade)}`}></div>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            Grade {grade}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {count}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                            ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all duration-500 ${getGradeDistributionColor(grade)}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Subject Performance */}
          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Subject Performance
            </h3>
            
            {statistics.subjects_performance.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                No subject performance data available
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Students
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Average Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Pass Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Performance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {statistics.subjects_performance.map((subject) => (
                      <tr key={subject.subject_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {subject.subject_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {subject.total_students}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {subject.average_score.toFixed(1)}%
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {subject.pass_rate.toFixed(1)}%
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                            <div
                              className="bg-primary-600 h-2 rounded-full"
                              style={{ width: `${subject.pass_rate}%` }}
                            ></div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getPerformanceTrend(subject.average_score)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default GradeStatistics;
