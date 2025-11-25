import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getSchoolCodeFromUrl } from '../../utils/schoolCode';
import {
  AcademicCapIcon,
  ChartBarIcon,
  CalendarIcon,
  BellIcon,
  CurrencyDollarIcon,
  ClipboardDocumentCheckIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { studentService } from '../../services/studentService';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import PageHeader from '../../components/Layout/PageHeader';
import StatsCard from '../../components/dashboard/StatsCard';
import Card from '../../components/ui/Card';
import CurrentTermIndicator from '../../components/terms/CurrentTermIndicator';

const StudentDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const schoolCode = getSchoolCodeFromUrl();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [trends, setTrends] = useState<any>(null);

  useEffect(() => {
    if (user && user.role !== 'student') {
      // Redirect non-students to the school dashboard with school code
      const userSchoolCode = user.school?.code || user.school_code || schoolCode;
      if (userSchoolCode) {
        navigate(`/${userSchoolCode}/dashboard`);
      } else {
        navigate('/dashboard');
      }
    } else {
      loadDashboardData();
    }
  }, [user, navigate, schoolCode]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [profileData, trendsData] = await Promise.all([
        studentService.getMyProfile(),
        studentService.getMyPerformanceTrends()
      ]);
      setProfile(profileData);
      setTrends(trendsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickLinks = [
    {
      name: 'My Tests',
      description: 'Take online tests and view results',
      icon: ClipboardDocumentCheckIcon,
      href: `/${schoolCode}/cbt/student`,
      color: 'bg-red-500',
      lightColor: 'bg-red-100 dark:bg-red-900/30',
      textColor: 'text-red-600 dark:text-red-400'
    },
    {
      name: 'My Grades',
      description: 'View your academic performance',
      icon: ChartBarIcon,
      href: `/${schoolCode}/student/grades`,
      color: 'bg-blue-500',
      lightColor: 'bg-blue-100 dark:bg-blue-900/30',
      textColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      name: 'Timetable',
      description: 'View your class schedule',
      icon: CalendarIcon,
      href: `/${schoolCode}/student/timetable`,
      color: 'bg-green-500',
      lightColor: 'bg-green-100 dark:bg-green-900/30',
      textColor: 'text-green-600 dark:text-green-400'
    },
    {
      name: 'Announcements',
      description: 'Read school announcements',
      icon: BellIcon,
      href: `/${schoolCode}/communication`,
      color: 'bg-yellow-500',
      lightColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      textColor: 'text-yellow-600 dark:text-yellow-400'
    },
    {
      name: 'Fees',
      description: 'Check fee payments',
      icon: CurrencyDollarIcon,
      href: `/${schoolCode}/student/fees`,
      color: 'bg-purple-500',
      lightColor: 'bg-purple-100 dark:bg-purple-900/30',
      textColor: 'text-purple-600 dark:text-purple-400'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title={`Welcome back, ${user?.first_name}!`}
          description={profile?.current_class_name ? `Class: ${profile.current_class_name}` : 'Student Dashboard'}
        />
        <div className="flex-shrink-0">
          <CurrentTermIndicator variant="compact" />
        </div>
      </div>

      {/* Performance Summary */}
      {trends && trends.overall_average > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 animate-fade-in-up delay-100">
          <StatsCard
            name="Overall Average"
            value={`${trends.overall_average?.toFixed(1)}%`}
            icon={AcademicCapIcon}
            change={trends.improvement_trend === 'improving' ? '+2.5%' : '-1.2%'}
            changeType={trends.improvement_trend === 'improving' ? 'increase' : 'decrease'}
            color="bg-blue-500"
          />
          <StatsCard
            name="Performance Trend"
            value={trends.improvement_trend}
            icon={ArrowTrendingUpIcon}
            changeType="neutral"
            color="bg-purple-500"
            valueClassName="capitalize"
          />
          <StatsCard
            name="Terms Completed"
            value={trends.terms?.length?.toString() || '0'}
            icon={CheckCircleIcon}
            changeType="neutral"
            color="bg-green-500"
          />
        </div>
      )}

      {/* Quick Links */}
      <div className="animate-fade-in-up delay-200">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <ClipboardDocumentCheckIcon className="h-5 w-5 mr-2 text-primary-500" />
          Quick Access
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {quickLinks.map((link) => (
            <Card
              key={link.name}
              variant="glass"
              className="group cursor-pointer hover:bg-white dark:hover:bg-gray-800"
              onClick={() => navigate(link.href)}
            >
              <div className="flex flex-col items-center text-center p-2">
                <div className={`${link.lightColor} ${link.textColor} w-14 h-14 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200 shadow-sm`}>
                  <link.icon className="h-7 w-7" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                  {link.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                  {link.description}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboardPage;
