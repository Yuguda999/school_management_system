import React, { useEffect, useState } from 'react';
import {
  AcademicCapIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ChartBarIcon,
  PlusIcon,
  MegaphoneIcon,
  ClipboardDocumentCheckIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCurrentTerm } from '../../hooks/useCurrentTerm';
import { DashboardStats } from '../../types';
import { reportsService } from '../../services/reportsService';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatsCard from '../../components/dashboard/StatsCard';
import RecentActivity from '../../components/dashboard/RecentActivity';
import EnrollmentChart from '../../components/dashboard/EnrollmentChart';
import RevenueChart from '../../components/dashboard/RevenueChart';
import CurrentTermIndicator from '../../components/terms/CurrentTermIndicator';
import PageHeader from '../../components/Layout/PageHeader';
import Card from '../../components/ui/Card';
import { buildSchoolRouteUrl, getSchoolCodeFromUrl } from '../../utils/schoolCode';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { currentTerm } = useCurrentTerm();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Get currency from school settings or default to USD
  const currency = user?.school?.settings?.currency || '$';

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const data = await reportsService.getDashboardData(currentTerm?.id);
        setDashboardData(data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentTerm?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    return `${greeting}, ${user?.first_name}!`;
  };

  const getStatsForRole = () => {
    if (!dashboardData?.stats) return [];
    const stats = dashboardData.stats;

    switch (user?.role) {
      case 'platform_super_admin':
      case 'school_owner':
      case 'school_admin':
        return [
          {
            name: 'Total Students',
            value: stats.total_students.toLocaleString(),
            icon: AcademicCapIcon,
            color: 'bg-blue-500'
          },
          {
            name: 'Total Teachers',
            value: stats.total_teachers.toString(),
            icon: UserGroupIcon,
            color: 'bg-purple-500'
          },
          {
            name: 'Total Classes',
            value: stats.total_classes.toString(),
            icon: BuildingOfficeIcon,
            color: 'bg-indigo-500'
          },
          {
            name: 'Total Revenue',
            value: `${currency}${stats.total_revenue?.toLocaleString() || '0'}`,
            icon: CurrencyDollarIcon,
            color: 'bg-green-500'
          },
          {
            name: 'Pending Fees',
            value: `${currency}${stats.pending_fees.toLocaleString()}`,
            icon: ExclamationTriangleIcon,
            color: 'bg-red-500'
          },
          {
            name: 'Recent Enrollments',
            value: stats.recent_enrollments.toString(),
            icon: CheckCircleIcon,
            color: 'bg-teal-500'
          },
        ];
      case 'teacher':
        return [
          {
            name: 'My Students',
            value: stats.my_students_count?.toString() || '0',
            icon: AcademicCapIcon,
            color: 'bg-blue-500'
          },
          {
            name: 'My Classes',
            value: stats.my_classes_count?.toString() || '0',
            icon: BuildingOfficeIcon,
            color: 'bg-purple-500'
          },
          {
            name: 'Assignments Due',
            value: stats.assignments_due?.toString() || '0',
            icon: ClockIcon,
            color: 'bg-orange-500'
          },
          {
            name: 'Average Grade',
            value: stats.average_grade ? `${stats.average_grade}%` : '0%',
            icon: ChartBarIcon,
            color: 'bg-green-500'
          },
        ];
      default:
        return [];
    }
  };

  const statsData = getStatsForRole();
  const isAdmin = ['platform_super_admin', 'school_owner', 'school_admin'].includes(user?.role || '');
  const isTeacher = user?.role === 'teacher';

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title={getWelcomeMessage()}
          description={currentTerm ? `Here's what's happening in ${currentTerm.name} (${currentTerm.academic_session}).` : "Here's what's happening at your school today."}
        />
        <div className="flex-shrink-0">
          <CurrentTermIndicator variant="compact" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className={`grid grid-cols-1 gap-6 ${isAdmin ? 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6' :
        isTeacher ? 'sm:grid-cols-2 lg:grid-cols-4' :
          'sm:grid-cols-2 lg:grid-cols-4'
        }`}>
        {statsData.map((stat, index) => (
          <div key={stat.name} className={`animate-fade-in-up delay-${(index + 1) * 100}`}>
            <StatsCard {...stat} />
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      {isAdmin && (() => {
        const schoolCode = getSchoolCodeFromUrl();
        if (!schoolCode) return null;

        return (
          <div className="animate-fade-in-up delay-300">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <ClipboardDocumentCheckIcon className="h-5 w-5 mr-2 text-primary-500" />
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card
                variant="glass"
                className="group hover:bg-primary-50 dark:hover:bg-primary-900/20 border-l-4 border-l-primary-500 cursor-pointer"
                onClick={() => navigate(buildSchoolRouteUrl(schoolCode, 'students'))}
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-xl bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform duration-200">
                    <PlusIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Add Student</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Register new student</p>
                  </div>
                </div>
              </Card>

              <Card
                variant="glass"
                className="group hover:bg-purple-50 dark:hover:bg-purple-900/20 border-l-4 border-l-purple-500 cursor-pointer"
                onClick={() => navigate(buildSchoolRouteUrl(schoolCode, 'teachers'))}
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform duration-200">
                    <UserGroupIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Add Teacher</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Onboard new staff</p>
                  </div>
                </div>
              </Card>

              <Card
                variant="glass"
                className="group hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border-l-4 border-l-indigo-500 cursor-pointer"
                onClick={() => navigate(buildSchoolRouteUrl(schoolCode, 'classes'))}
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-200">
                    <BuildingOfficeIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Create Class</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Set up new classroom</p>
                  </div>
                </div>
              </Card>

              <Card
                variant="glass"
                className="group hover:bg-orange-50 dark:hover:bg-orange-900/20 border-l-4 border-l-orange-500 cursor-pointer"
                onClick={() => navigate(buildSchoolRouteUrl(schoolCode, 'communication'))}
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform duration-200">
                    <MegaphoneIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Announcement</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Broadcast message</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        );
      })()}

      {isTeacher && (() => {
        const schoolCode = getSchoolCodeFromUrl();
        if (!schoolCode) return null;

        return (
          <div className="animate-fade-in-up delay-300">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <ClipboardDocumentCheckIcon className="h-5 w-5 mr-2 text-primary-500" />
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card
                variant="glass"
                className="group hover:bg-primary-50 dark:hover:bg-primary-900/20 cursor-pointer"
                onClick={() => navigate(buildSchoolRouteUrl(schoolCode, 'attendance'))}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/50 text-primary-600">
                    <CheckCircleIcon className="h-6 w-6" />
                  </div>
                  <span className="font-medium">Take Attendance</span>
                </div>
              </Card>
              <Card
                variant="glass"
                className="group hover:bg-green-50 dark:hover:bg-green-900/20 cursor-pointer"
                onClick={() => navigate(buildSchoolRouteUrl(schoolCode, 'grades'))}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/50 text-green-600">
                    <AcademicCapIcon className="h-6 w-6" />
                  </div>
                  <span className="font-medium">Grade Assignment</span>
                </div>
              </Card>
              <Card
                variant="glass"
                className="group hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer"
                onClick={() => navigate(buildSchoolRouteUrl(schoolCode, 'communication'))}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600">
                    <EnvelopeIcon className="h-6 w-6" />
                  </div>
                  <span className="font-medium">Send Message</span>
                </div>
              </Card>
            </div>
          </div>
        );
      })()}

      {/* Charts Section - Admin Only */}
      {isAdmin && dashboardData && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 animate-fade-in-up delay-500">
          <EnrollmentChart data={dashboardData.enrollment_trend} />
          <RevenueChart data={dashboardData.revenue_data} currency={currency} />
        </div>
      )}

      {/* Recent Activity - Admin Only */}
      {isAdmin && dashboardData && (
        <div className="animate-fade-in-up delay-700">
          <RecentActivity activities={dashboardData.recent_activities} />
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
