import React, { useState, useEffect } from 'react';
import {
  UserGroupIcon,
  ChartBarIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  AcademicCapIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import { reportsService, ClassReport } from '../../services/reportsService';
import { useCurrentTerm } from '../../hooks/useCurrentTerm';
import CurrentTermIndicator from '../terms/CurrentTermIndicator';
import Card from '../ui/Card';

const ClassReports: React.FC = () => {
  const { currentTerm } = useCurrentTerm();
  const [classes, setClasses] = useState<ClassReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClassReports();
  }, [currentTerm?.id]); // Re-fetch when current term changes

  const fetchClassReports = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to fetch real data with current term
      try {
        const termId = currentTerm?.id;
        // For now, we'll use mock data since the endpoint structure might be different
        // In a real implementation, you'd call something like:
        // const classReports = await reportsService.getClassReports({ term_id: termId });
        // setClasses(classReports);
        // return;
      } catch (apiError) {
        console.warn('Failed to fetch class reports from API, using mock data:', apiError);
      }

      // Fallback to mock data
      const mockClasses: ClassReport[] = [
        {
          class_id: '1',
          class_name: 'Class 10-A',
          total_students: 35,
          average_attendance: 92.5,
          average_grade: 85.2,
          fee_collection_rate: 88.5,
          total_fees_collected: 875000,
          pending_fees: 125000,
        },
        {
          class_id: '2',
          class_name: 'Class 10-B',
          total_students: 32,
          average_attendance: 89.3,
          average_grade: 82.7,
          fee_collection_rate: 75.0,
          total_fees_collected: 600000,
          pending_fees: 200000,
        },
        {
          class_id: '3',
          class_name: 'Class 9-A',
          total_students: 38,
          average_attendance: 94.1,
          average_grade: 88.9,
          fee_collection_rate: 92.1,
          total_fees_collected: 950000,
          pending_fees: 80000,
        },
      ];

      setClasses(mockClasses);
    } catch (err) {
      setError('Failed to fetch class reports');
      console.error('Error fetching class reports:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={fetchClassReports}
          className="mt-2 btn btn-primary"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Current Term Indicator */}
      <CurrentTermIndicator variant="banner" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Class Performance Reports</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Overview of class-wise performance metrics for {currentTerm ? `${currentTerm.name} (${currentTerm.academic_session})` : 'current term'}
          </p>
        </div>
        <button className="btn btn-primary w-full sm:w-auto flex items-center justify-center space-x-2">
          <ArrowDownTrayIcon className="h-4 w-4" />
          <span>Export All</span>
        </button>
      </div>

      {/* Summary Statistics */}
      <Card variant="glass" className="border-l-4 border-l-primary-500">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center">
          <ChartBarIcon className="h-5 w-5 mr-2 text-primary-500" />
          Overall Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-gray-700">
          <div className="text-center p-2">
            <div className="flex items-center justify-center mb-2 text-blue-600 dark:text-blue-400">
              <UserGroupIcon className="h-6 w-6" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {classes.reduce((sum, cls) => sum + cls.total_students, 0)}
            </p>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1">Total Students</p>
          </div>
          <div className="text-center p-2">
            <div className="flex items-center justify-center mb-2 text-green-600 dark:text-green-400">
              <CalendarDaysIcon className="h-6 w-6" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {(classes.reduce((sum, cls) => sum + cls.average_attendance, 0) / classes.length).toFixed(1)}%
            </p>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1">Avg Attendance</p>
          </div>
          <div className="text-center p-2">
            <div className="flex items-center justify-center mb-2 text-purple-600 dark:text-purple-400">
              <AcademicCapIcon className="h-6 w-6" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {(classes.reduce((sum, cls) => sum + cls.average_grade, 0) / classes.length).toFixed(1)}%
            </p>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1">Avg Grade</p>
          </div>
          <div className="text-center p-2">
            <div className="flex items-center justify-center mb-2 text-emerald-600 dark:text-emerald-400">
              <CurrencyDollarIcon className="h-6 w-6" />
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              ₹{(classes.reduce((sum, cls) => sum + cls.total_fees_collected, 0) / 100000).toFixed(1)}L
            </p>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1">Total Collected</p>
          </div>
        </div>
      </Card>

      {/* Class Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {classes.map((classReport) => (
          <Card key={classReport.class_id} variant="glass" className="hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                  <UserGroupIcon className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                    {classReport.class_name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {classReport.total_students} students
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors">
                  <EyeIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="space-y-5">
              {/* Attendance */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
                    <CalendarDaysIcon className="h-4 w-4 mr-1.5" />
                    Attendance
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {classReport.average_attendance}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${classReport.average_attendance}%` }}
                  ></div>
                </div>
              </div>

              {/* Academic Performance */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
                    <AcademicCapIcon className="h-4 w-4 mr-1.5" />
                    Avg Grade
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {classReport.average_grade}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-1000 delay-100"
                    style={{ width: `${classReport.average_grade}%` }}
                  ></div>
                </div>
              </div>

              {/* Fee Collection */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
                    <CurrencyDollarIcon className="h-4 w-4 mr-1.5" />
                    Fee Collection
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {classReport.fee_collection_rate}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all duration-1000 delay-200"
                    style={{ width: `${classReport.fee_collection_rate}%` }}
                  ></div>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-700/50 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Collected</span>
                  <span className="font-bold text-green-600 dark:text-green-400">
                    ₹{classReport.total_fees_collected.toLocaleString()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Pending</span>
                  <span className="font-bold text-red-600 dark:text-red-400">
                    ₹{classReport.pending_fees.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ClassReports;
