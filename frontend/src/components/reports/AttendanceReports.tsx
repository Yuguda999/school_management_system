import React, { useState, useEffect } from 'react';
import { 
  CalendarDaysIcon, 
  UserGroupIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { reportsService, AttendanceReport } from '../../services/reportsService';

const AttendanceReports: React.FC = () => {
  const [report, setReport] = useState<AttendanceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAttendanceReport();
  }, []);

  const fetchAttendanceReport = async () => {
    try {
      setLoading(true);
      // Mock data since backend endpoint doesn't exist yet
      const mockReport: AttendanceReport = {
        overall_attendance_rate: 89.2,
        class_wise_attendance: [
          { class_id: '1', class_name: 'Class 10-A', attendance_rate: 92.5, total_students: 35, present_students: 32 },
          { class_id: '2', class_name: 'Class 10-B', attendance_rate: 87.8, total_students: 32, present_students: 28 },
          { class_id: '3', class_name: 'Class 9-A', attendance_rate: 94.1, total_students: 38, present_students: 36 },
          { class_id: '4', class_name: 'Class 9-B', attendance_rate: 85.3, total_students: 34, present_students: 29 },
        ],
        monthly_attendance: [
          { month: 'Jan', attendance_rate: 88.5 },
          { month: 'Feb', attendance_rate: 90.2 },
          { month: 'Mar', attendance_rate: 87.8 },
          { month: 'Apr', attendance_rate: 91.5 },
          { month: 'May', attendance_rate: 89.2 },
          { month: 'Jun', attendance_rate: 92.1 },
        ],
        low_attendance_students: [
          { student_id: '1', student_name: 'John Doe', class_name: 'Class 10-B', attendance_rate: 65.2 },
          { student_id: '2', student_name: 'Jane Smith', class_name: 'Class 9-B', attendance_rate: 68.7 },
          { student_id: '3', student_name: 'Mike Johnson', class_name: 'Class 10-A', attendance_rate: 72.1 },
        ],
      };
      
      setReport(mockReport);
    } catch (err) {
      setError('Failed to fetch attendance report');
      console.error('Error fetching attendance report:', err);
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600 bg-green-100 dark:bg-green-900/20';
    if (rate >= 75) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
    return 'text-red-600 bg-red-100 dark:bg-red-900/20';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchAttendanceReport}
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
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Attendance Reports</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Comprehensive attendance tracking and analysis
          </p>
        </div>
        <button className="btn btn-primary flex items-center space-x-2">
          <ArrowDownTrayIcon className="h-4 w-4" />
          <span>Export Report</span>
        </button>
      </div>

      {/* Overall Statistics */}
      <div className="card p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <CalendarDaysIcon className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h4 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {report.overall_attendance_rate}%
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">Overall Attendance Rate</p>
          </div>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${report.overall_attendance_rate}%` }}
          ></div>
        </div>
      </div>

      {/* Class-wise Attendance */}
      <div className="card p-6">
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Class-wise Attendance
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {report.class_wise_attendance.map((classData) => (
            <div key={classData.class_id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <UserGroupIcon className="h-5 w-5 text-gray-600" />
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-white">
                      {classData.class_name}
                    </h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {classData.present_students}/{classData.total_students} present
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAttendanceColor(classData.attendance_rate)}`}>
                  {classData.attendance_rate}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${classData.attendance_rate}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="card p-6">
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Monthly Attendance Trend
        </h4>
        <div className="space-y-3">
          {report.monthly_attendance.map((month, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-12">
                {month.month}
              </span>
              <div className="flex items-center space-x-3 flex-1 mx-4">
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${month.attendance_rate}%` }}
                  ></div>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white w-12">
                  {month.attendance_rate}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Low Attendance Alert */}
      <div className="card p-6 border-l-4 border-red-500">
        <div className="flex items-center space-x-3 mb-4">
          <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
          <h4 className="text-lg font-medium text-gray-900 dark:text-white">
            Students with Low Attendance
          </h4>
        </div>
        <div className="space-y-3">
          {report.low_attendance_students.map((student) => (
            <div key={student.student_id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {student.student_name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {student.class_name}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-red-600">
                  {student.attendance_rate}%
                </p>
                <p className="text-xs text-red-500">Below 75%</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 text-center">
          <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg inline-block mb-3">
            <CalendarDaysIcon className="h-6 w-6 text-green-600" />
          </div>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">
            {report.class_wise_attendance.filter(c => c.attendance_rate >= 90).length}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Classes with 90%+ Attendance</p>
        </div>
        
        <div className="card p-6 text-center">
          <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg inline-block mb-3">
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
          </div>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">
            {report.low_attendance_students.length}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Students Need Attention</p>
        </div>
        
        <div className="card p-6 text-center">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg inline-block mb-3">
            <UserGroupIcon className="h-6 w-6 text-blue-600" />
          </div>
          <p className="text-2xl font-semibold text-gray-900 dark:text-white">
            {report.class_wise_attendance.reduce((sum, c) => sum + c.total_students, 0)}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Students Tracked</p>
        </div>
      </div>
    </div>
  );
};

export default AttendanceReports;
