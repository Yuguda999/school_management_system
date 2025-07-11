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
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardStats } from '../../types';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatsCard from '../../components/dashboard/StatsCard';
import RecentActivity from '../../components/dashboard/RecentActivity';
import EnrollmentChart from '../../components/dashboard/EnrollmentChart';
import RevenueChart from '../../components/dashboard/RevenueChart';
import PageHeader from '../../components/Layout/PageHeader';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Mock data for now - replace with actual API call
        const mockStats: DashboardStats = {
          total_students: 1250,
          total_teachers: 85,
          total_classes: 42,
          total_revenue: 125000,
          pending_fees: 15000,
          recent_enrollments: 23,
        };
        
        setTimeout(() => {
          setStats(mockStats);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <LoadingSpinner className="h-64" />;
  }

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    return `${greeting}, ${user?.first_name}!`;
  };

  const getStatsForRole = () => {
    if (!stats) return [];

    switch (user?.role) {
      case 'super_admin':
      case 'admin':
        return [
          {
            name: 'Total Students',
            value: stats.total_students.toLocaleString(),
            icon: AcademicCapIcon,
            change: '+12%',
            changeType: 'increase' as const,
          },
          {
            name: 'Total Teachers',
            value: stats.total_teachers.toString(),
            icon: UserGroupIcon,
            change: '+3%',
            changeType: 'increase' as const,
          },
          {
            name: 'Total Classes',
            value: stats.total_classes.toString(),
            icon: BuildingOfficeIcon,
            change: '+5%',
            changeType: 'increase' as const,
          },
          {
            name: 'Total Revenue',
            value: `$${stats.total_revenue.toLocaleString()}`,
            icon: CurrencyDollarIcon,
            change: '+8%',
            changeType: 'increase' as const,
          },
          {
            name: 'Pending Fees',
            value: `$${stats.pending_fees.toLocaleString()}`,
            icon: ExclamationTriangleIcon,
            change: '-5%',
            changeType: 'decrease' as const,
          },
          {
            name: 'Recent Enrollments',
            value: stats.recent_enrollments.toString(),
            icon: CheckCircleIcon,
            change: '+15%',
            changeType: 'increase' as const,
          },
        ];
      case 'teacher':
        return [
          {
            name: 'My Students',
            value: '156',
            icon: AcademicCapIcon,
            change: '+2%',
            changeType: 'increase' as const,
          },
          {
            name: 'My Classes',
            value: '6',
            icon: BuildingOfficeIcon,
            change: '0%',
            changeType: 'neutral' as const,
          },
          {
            name: 'Assignments Due',
            value: '12',
            icon: ClockIcon,
            change: '+3',
            changeType: 'increase' as const,
          },
          {
            name: 'Average Grade',
            value: '85%',
            icon: ChartBarIcon,
            change: '+2%',
            changeType: 'increase' as const,
          },
        ];
      case 'student':
        return [
          {
            name: 'My Subjects',
            value: '8',
            icon: AcademicCapIcon,
            change: '0%',
            changeType: 'neutral' as const,
          },
          {
            name: 'Current GPA',
            value: '3.7',
            icon: ChartBarIcon,
            change: '+0.2',
            changeType: 'increase' as const,
          },
          {
            name: 'Assignments Due',
            value: '5',
            icon: ClockIcon,
            change: '-2',
            changeType: 'decrease' as const,
          },
          {
            name: 'Pending Fees',
            value: '$500',
            icon: CurrencyDollarIcon,
            change: '-$100',
            changeType: 'decrease' as const,
          },
        ];
      case 'parent':
        return [
          {
            name: 'My Children',
            value: '2',
            icon: AcademicCapIcon,
            change: '0%',
            changeType: 'neutral' as const,
          },
          {
            name: 'Average GPA',
            value: '3.5',
            icon: ChartBarIcon,
            change: '+0.1',
            changeType: 'increase' as const,
          },
          {
            name: 'Upcoming Events',
            value: '4',
            icon: ClockIcon,
            change: '+1',
            changeType: 'increase' as const,
          },
          {
            name: 'Pending Fees',
            value: '$1,200',
            icon: CurrencyDollarIcon,
            change: '-$300',
            changeType: 'decrease' as const,
          },
        ];
      default:
        return [];
    }
  };

  const statsData = getStatsForRole();
  const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';
  const isStudent = user?.role === 'student';
  const isParent = user?.role === 'parent';

  return (
    <div className="space-y-6">
      <PageHeader
        title={getWelcomeMessage()}
        description="Here's what's happening at your school today."
      />

      {/* Stats Grid */}
      <div className={`grid grid-cols-1 gap-5 ${
        isAdmin ? 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6' :
        isTeacher ? 'sm:grid-cols-2 lg:grid-cols-4' :
        'sm:grid-cols-2 lg:grid-cols-4'
      }`}>
        {statsData.map((stat) => (
          <StatsCard key={stat.name} {...stat} />
        ))}
      </div>

      {/* Quick Actions for different roles */}
      {isAdmin && (
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="btn btn-primary">Add Student</button>
            <button className="btn btn-secondary">Add Teacher</button>
            <button className="btn btn-outline">Create Class</button>
            <button className="btn btn-outline">Send Announcement</button>
          </div>
        </div>
      )}

      {isTeacher && (
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button className="btn btn-primary">Take Attendance</button>
            <button className="btn btn-secondary">Grade Assignment</button>
            <button className="btn btn-outline">Send Message</button>
          </div>
        </div>
      )}

      {/* Charts Section - Only for admins and teachers */}
      {(isAdmin || isTeacher) && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <EnrollmentChart />
          <RevenueChart />
        </div>
      )}

      {/* Student/Parent specific sections */}
      {(isStudent || isParent) && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              {isStudent ? 'My Grades' : 'Children\'s Grades'}
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Mathematics</span>
                <span className="badge badge-success">A</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Science</span>
                <span className="badge badge-primary">B+</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">English</span>
                <span className="badge badge-success">A-</span>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Upcoming Events
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Parent-Teacher Meeting</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Tomorrow, 2:00 PM</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-secondary-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Science Fair</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Friday, 10:00 AM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <RecentActivity />
    </div>
  );
};

export default DashboardPage;
