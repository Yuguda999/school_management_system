import React, { useState, useEffect } from 'react';
import { 
  UserGroupIcon, 
  ChartBarIcon,
  ArrowDownTrayIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { reportsService, ClassReport } from '../../services/reportsService';

const ClassReports: React.FC = () => {
  const [classes, setClasses] = useState<ClassReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClassReports();
  }, []);

  const fetchClassReports = async () => {
    try {
      setLoading(true);
      // Mock data since backend endpoint doesn't exist yet
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Class Performance Reports</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Overview of class-wise performance metrics
          </p>
        </div>
        <button className="btn btn-primary flex items-center space-x-2">
          <ArrowDownTrayIcon className="h-4 w-4" />
          <span>Export All</span>
        </button>
      </div>

      {/* Class Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {classes.map((classReport) => (
          <div key={classReport.class_id} className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <UserGroupIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                    {classReport.class_name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {classReport.total_students} students
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded">
                  <EyeIcon className="h-4 w-4" />
                </button>
                <button className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded">
                  <ChartBarIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {/* Attendance */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Average Attendance
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {classReport.average_attendance}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${classReport.average_attendance}%` }}
                  ></div>
                </div>
              </div>

              {/* Academic Performance */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Average Grade
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {classReport.average_grade}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${classReport.average_grade}%` }}
                  ></div>
                </div>
              </div>

              {/* Fee Collection */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Fee Collection
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {classReport.fee_collection_rate}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ width: `${classReport.fee_collection_rate}%` }}
                  ></div>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Collected:</span>
                  <span className="font-medium text-green-600">
                    ₹{classReport.total_fees_collected.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Pending:</span>
                  <span className="font-medium text-red-600">
                    ₹{classReport.pending_fees.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Statistics */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Overall Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-2xl font-semibold text-blue-600">
              {classes.reduce((sum, cls) => sum + cls.total_students, 0)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Students</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-semibold text-green-600">
              {(classes.reduce((sum, cls) => sum + cls.average_attendance, 0) / classes.length).toFixed(1)}%
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Avg Attendance</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-semibold text-purple-600">
              {(classes.reduce((sum, cls) => sum + cls.average_grade, 0) / classes.length).toFixed(1)}%
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Avg Grade</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-semibold text-emerald-600">
              ₹{classes.reduce((sum, cls) => sum + cls.total_fees_collected, 0).toLocaleString()}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Collected</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassReports;
