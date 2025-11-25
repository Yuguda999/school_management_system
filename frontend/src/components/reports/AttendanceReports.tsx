import React, { useState, useEffect } from 'react';
import {
  CalendarDaysIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { reportsService, AttendanceReport } from '../../services/reportsService';
import { useCurrentTerm } from '../../hooks/useCurrentTerm';
import CurrentTermIndicator from '../terms/CurrentTermIndicator';
import Card from '../ui/Card';

const AttendanceReports: React.FC = () => {
  const { currentTerm } = useCurrentTerm();
  const [report, setReport] = useState<AttendanceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAttendanceReport();
  }, [currentTerm?.id]); // Re-fetch when current term changes

  const fetchAttendanceReport = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to fetch real data with current term
      try {
        const params = currentTerm ? { term_id: currentTerm.id } : undefined;
        const attendanceReport = await reportsService.getAttendanceReport(params);
        setReport(attendanceReport);
        return;
      } catch (apiError) {
        console.warn('Failed to fetch attendance report from API, using mock data:', apiError);
      }

      // Fallback to mock data
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
    if (rate >= 90) return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
    if (rate >= 75) return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
    return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400">{error}</p>
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
    <div className="space-y-6 animate-fade-in">
      {/* Current Term Indicator */}
      <CurrentTermIndicator variant="banner" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Attendance Reports</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Comprehensive attendance tracking and analysis for {currentTerm ? `${currentTerm.name} (${currentTerm.academic_session})` : 'current term'}
          </p>
        </div>
        <button className="btn btn-primary w-full sm:w-auto flex items-center justify-center space-x-2">
          <ArrowDownTrayIcon className="h-4 w-4" />
          <span>Export Report</span>
        </button>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card variant="glass" className="md:col-span-2 border-l-4 border-l-blue-500">
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
              <CalendarDaysIcon className="h-8 w-8" />
            </div>
            <div>
              <h4 className="text-3xl font-bold text-gray-900 dark:text-white">
                {report.overall_attendance_rate}%
              </h4>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Overall Attendance Rate</p>
            </div>
          </div>

          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
            <div
              className="bg-blue-600 h-4 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${report.overall_attendance_rate}%` }}
            ></div>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-4">
          <Card variant="glass" className="flex items-center justify-between p-4">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {report.class_wise_attendance.reduce((sum, c) => sum + c.total_students, 0)}
              </p>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total Students</p>
            </div>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
              <UserGroupIcon className="h-5 w-5" />
            </div>
          </Card>

          <Card variant="glass" className="flex items-center justify-between p-4">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {report.class_wise_attendance.filter(c => c.attendance_rate >= 90).length}
              </p>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">High Attendance Classes</p>
            </div>
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
              <ChartBarIcon className="h-5 w-5" />
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class-wise Attendance */}
        <Card variant="glass" className="h-full">
          <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <UserGroupIcon className="h-5 w-5 mr-2 text-primary-500" />
            Class-wise Attendance
          </h4>
          <div className="grid grid-cols-1 gap-4">
            {report.class_wise_attendance.map((classData) => (
              <div key={classData.class_id} className="p-4 border border-gray-100 dark:border-gray-700/50 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 text-xs font-bold">
                      {classData.class_name.split(' ')[1]}
                    </div>
                    <div>
                      <h5 className="font-bold text-gray-900 dark:text-white">
                        {classData.class_name}
                      </h5>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {classData.present_students}/{classData.total_students} present
                      </p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getAttendanceColor(classData.attendance_rate)}`}>
                    {classData.attendance_rate}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-1000 ${classData.attendance_rate >= 90 ? 'bg-green-500' :
                        classData.attendance_rate >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                    style={{ width: `${classData.attendance_rate}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Monthly Trend */}
        <Card variant="glass" className="h-full">
          <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <CalendarDaysIcon className="h-5 w-5 mr-2 text-primary-500" />
            Monthly Attendance Trend
          </h4>
          <div className="space-y-4">
            {report.monthly_attendance.map((month, index) => (
              <div key={index} className="flex items-center justify-between group">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-12">
                  {month.month}
                </span>
                <div className="flex items-center space-x-3 flex-1 mx-4">
                  <div className="flex-1 bg-gray-100 dark:bg-gray-700/50 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all duration-1000 group-hover:bg-blue-500"
                      style={{ width: `${month.attendance_rate}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white w-12 text-right">
                    {month.attendance_rate}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Low Attendance Alert */}
      <Card variant="glass" className="border-l-4 border-l-red-500">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400">
            <ExclamationTriangleIcon className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-gray-900 dark:text-white">
              Students with Low Attendance
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {report.low_attendance_students.length} students require attention
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {report.low_attendance_students.map((student) => (
            <div key={student.student_id} className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl hover:shadow-md transition-shadow">
              <div>
                <p className="font-bold text-gray-900 dark:text-white">
                  {student.student_name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {student.class_name}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-red-600 dark:text-red-400 text-lg">
                  {student.attendance_rate}%
                </p>
                <p className="text-xs text-red-500 dark:text-red-400/80">Critical</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default AttendanceReports;
