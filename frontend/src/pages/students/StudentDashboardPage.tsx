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
  BookOpenIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';
import { studentService } from '../../services/studentService';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

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
      color: 'bg-red-500'
    },
    {
      name: 'My Grades',
      description: 'View your academic performance',
      icon: ChartBarIcon,
      href: `/${schoolCode}/student/grades`,
      color: 'bg-blue-500'
    },
    {
      name: 'Timetable',
      description: 'View your class schedule',
      icon: CalendarIcon,
      href: `/${schoolCode}/student/timetable`,
      color: 'bg-green-500'
    },
    {
      name: 'Announcements',
      description: 'Read school announcements',
      icon: BellIcon,
      href: `/${schoolCode}/communication`,
      color: 'bg-yellow-500'
    },
    {
      name: 'Fees',
      description: 'Check fee payments',
      icon: CurrencyDollarIcon,
      href: `/${schoolCode}/student/fees`,
      color: 'bg-purple-500'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Welcome{user?.first_name ? `, ${user.first_name}` : ''}!
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {profile?.current_class_name && `Class: ${profile.current_class_name}`}
        </p>
      </div>

      {/* Performance Summary */}
      {trends && trends.overall_average > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Academic Performance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Overall Average</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {trends.overall_average?.toFixed(1)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Trend</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white capitalize">
                {trends.improvement_trend}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Terms Completed</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {trends.terms?.length || 0}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Access
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickLinks.map((link) => (
            <button
              key={link.name}
              onClick={() => navigate(link.href)}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow text-left"
            >
              <div className={`${link.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                <link.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {link.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {link.description}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboardPage;






