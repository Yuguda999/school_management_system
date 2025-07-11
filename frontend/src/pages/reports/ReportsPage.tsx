import React, { useState } from 'react';
import { 
  ChartBarIcon, 
  DocumentChartBarIcon, 
  AcademicCapIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useCurrentTerm } from '../../hooks/useCurrentTerm';
import CurrentTermIndicator from '../../components/terms/CurrentTermIndicator';
import DashboardOverview from '../../components/reports/DashboardOverview';
import StudentReports from '../../components/reports/StudentReports';
import ClassReports from '../../components/reports/ClassReports';
import FinancialReports from '../../components/reports/FinancialReports';
import AttendanceReports from '../../components/reports/AttendanceReports';
import AcademicReports from '../../components/reports/AcademicReports';

type ReportType = 'overview' | 'students' | 'classes' | 'financial' | 'attendance' | 'academic';

const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const { currentTerm } = useCurrentTerm();
  const [activeReport, setActiveReport] = useState<ReportType>('overview');

  const reportTypes = [
    {
      id: 'overview' as ReportType,
      name: 'Dashboard Overview',
      description: 'Key metrics and statistics',
      icon: ChartBarIcon,
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
      allowedRoles: ['ADMIN', 'TEACHER'],
    },
    {
      id: 'students' as ReportType,
      name: 'Student Reports',
      description: 'Individual student performance and attendance',
      icon: AcademicCapIcon,
      color: 'text-green-600 bg-green-100 dark:bg-green-900/20',
      allowedRoles: ['ADMIN', 'TEACHER'],
    },
    {
      id: 'classes' as ReportType,
      name: 'Class Reports',
      description: 'Class-wise performance and statistics',
      icon: UserGroupIcon,
      color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/20',
      allowedRoles: ['ADMIN', 'TEACHER'],
    },
    {
      id: 'financial' as ReportType,
      name: 'Financial Reports',
      description: 'Fee collection and revenue analysis',
      icon: CurrencyDollarIcon,
      color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20',
      allowedRoles: ['ADMIN'],
    },
    {
      id: 'attendance' as ReportType,
      name: 'Attendance Reports',
      description: 'Attendance tracking and analysis',
      icon: CalendarDaysIcon,
      color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/20',
      allowedRoles: ['ADMIN', 'TEACHER'],
    },
    {
      id: 'academic' as ReportType,
      name: 'Academic Reports',
      description: 'Grades and academic performance',
      icon: DocumentChartBarIcon,
      color: 'text-red-600 bg-red-100 dark:bg-red-900/20',
      allowedRoles: ['ADMIN', 'TEACHER'],
    },
  ];

  const availableReports = reportTypes.filter(report => 
    report.allowedRoles.includes(user?.role || '')
  );

  const renderReportContent = () => {
    switch (activeReport) {
      case 'overview':
        return <DashboardOverview />;
      case 'students':
        return <StudentReports />;
      case 'classes':
        return <ClassReports />;
      case 'financial':
        return <FinancialReports />;
      case 'attendance':
        return <AttendanceReports />;
      case 'academic':
        return <AcademicReports />;
      default:
        return <DashboardOverview />;
    }
  };

  const activeReportInfo = reportTypes.find(report => report.id === activeReport);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Comprehensive reporting and data analysis for {currentTerm ? `${currentTerm.name} (${currentTerm.academic_session})` : 'current term'}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="btn btn-secondary flex items-center space-x-2">
            <ArrowDownTrayIcon className="h-4 w-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Current Term Indicator */}
      <CurrentTermIndicator variant="banner" />

      {/* Report Type Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {availableReports.map((report) => (
          <button
            key={report.id}
            onClick={() => setActiveReport(report.id)}
            className={`card p-6 text-left transition-all duration-200 hover:shadow-lg ${
              activeReport === report.id
                ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/10'
                : 'hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <div className="flex items-start space-x-4">
              <div className={`p-3 rounded-lg ${report.color}`}>
                <report.icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {report.name}
                </h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {report.description}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Active Report Header */}
      {activeReportInfo && (
        <div className="card p-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${activeReportInfo.color}`}>
              <activeReportInfo.icon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {activeReportInfo.name}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {activeReportInfo.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Report Content */}
      <div className="space-y-6">
        {renderReportContent()}
      </div>
    </div>
  );
};

export default ReportsPage;
