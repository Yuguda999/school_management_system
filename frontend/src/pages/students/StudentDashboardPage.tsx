import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getSchoolCodeFromUrl } from '../../utils/schoolCode';
import {
  AcademicCapIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import { studentService } from '../../services/studentService';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatsCard from '../../components/dashboard/StatsCard';
import CurrentTermIndicator from '../../components/terms/CurrentTermIndicator';
import StudentGoalsPanel from '../../components/dashboard/StudentGoalsPanel';
import StudyRecommendationsPanel from '../../components/dashboard/StudyRecommendationsPanel';
import BenchmarkPanel from '../../components/dashboard/BenchmarkPanel';
import PerformanceChart from '../../components/dashboard/PerformanceChart';
import QuickActions from '../../components/dashboard/QuickActions';

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.first_name}! 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {profile?.current_class_name ? `Class: ${profile.current_class_name}` : 'Student Dashboard'}
          </p>
        </div>
        <div className="flex-shrink-0">
          <CurrentTermIndicator variant="compact" />
        </div>
      </div>

      {/* Stats Grid */}
      {trends && trends.overall_average > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up delay-100">
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

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-fade-in-up delay-200">
        {/* Left Column (Main Content) */}
        <div className="xl:col-span-8 space-y-8">
          {/* Performance Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Academic Performance</h2>
            </div>
            <div className="p-6">
              <PerformanceChart data={trends?.terms || []} />
            </div>
          </div>

          {/* Goals Panel */}
          <StudentGoalsPanel />
        </div>

        {/* Right Column (Sidebar) */}
        <div className="xl:col-span-4 space-y-8">
          {/* Quick Actions */}
          <QuickActions />

          {/* Study Recommendations */}
          <StudyRecommendationsPanel />
        </div>
      </div>

      {/* Benchmark Panel - Full Width Bottom Section */}
      <div className="animate-fade-in-up delay-300">
        <BenchmarkPanel />
      </div>
    </div>
  );
};

export default StudentDashboardPage;
