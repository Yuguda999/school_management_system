import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AcademicCapIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  BookOpenIcon,
  PencilSquareIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  CheckCircleIcon,
  UserIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import { apiService } from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import PageHeader from '../../components/Layout/PageHeader';
import { getSchoolCodeFromUrl } from '../../utils/schoolCode';

interface TeacherStats {
  total_classes: number;
  total_students: number;
  total_subjects: number;
  pending_assignments: number;
  upcoming_classes: number;
  recent_activities: Activity[];
}

interface Activity {
  id: string;
  type: 'assignment' | 'attendance' | 'grade' | 'message';
  title: string;
  description: string;
  timestamp: string;
  class_name?: string;
  subject_name?: string;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  action: () => void;
}

const TeacherDashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { showError } = useToast();
  const navigate = useNavigate();

  const [stats, setStats] = useState<TeacherStats>({
    total_classes: 0,
    total_students: 0,
    total_subjects: 0,
    pending_assignments: 0,
    upcoming_classes: 0,
    recent_activities: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeacherStats();
  }, []);

  const fetchTeacherStats = async () => {
    try {
      setLoading(true);
      // For now, we'll use mock data since the backend endpoints might not exist yet
      // TODO: Replace with actual API calls when teacher-specific endpoints are available

      const mockStats: TeacherStats = {
        total_classes: 3,
        total_students: 85,
        total_subjects: 2,
        pending_assignments: 5,
        upcoming_classes: 2,
        recent_activities: [
          {
            id: '1',
            type: 'assignment',
            title: 'Math Assignment Graded',
            description: 'Completed grading for Class 10A Mathematics assignment',
            timestamp: new Date().toISOString(),
            class_name: 'Class 10A',
            subject_name: 'Mathematics'
          },
          {
            id: '2',
            type: 'attendance',
            title: 'Attendance Recorded',
            description: 'Recorded attendance for today\'s English class',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            class_name: 'Class 9B',
            subject_name: 'English'
          }
        ]
      };

      setStats(mockStats);
    } catch (error: any) {
      console.error('Error fetching teacher stats:', error);

      if (error.response?.status === 401) {
        logout();
        navigate('/login');
        return;
      }

      showError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const schoolCode = getSchoolCodeFromUrl();

  const quickActions: QuickAction[] = [
    {
      id: 'class-attendance',
      title: 'Class Attendance',
      description: 'Mark attendance for your assigned class',
      icon: ClipboardDocumentListIcon,
      color: 'bg-blue-500',
      action: () => navigate(`/${schoolCode}/teacher/attendance/class`)
    },
    {
      id: 'subject-attendance',
      title: 'Subject Attendance',
      description: 'Mark attendance for your subjects',
      icon: CheckCircleIcon,
      color: 'bg-teal-500',
      action: () => navigate(`/${schoolCode}/teacher/attendance/subject`)
    },
    {
      id: 'grade',
      title: 'Grade Assignments',
      description: 'Review and grade student submissions',
      icon: PencilSquareIcon,
      color: 'bg-green-500',
      action: () => navigate(`/${schoolCode}/grades`)
    },
    {
      id: 'classes',
      title: 'My Classes',
      description: 'View and manage your classes',
      icon: AcademicCapIcon,
      color: 'bg-purple-500',
      action: () => navigate(`/${schoolCode}/classes`)
    },
    {
      id: 'subjects',
      title: 'My Subjects',
      description: 'Manage your subject assignments',
      icon: BookOpenIcon,
      color: 'bg-indigo-500',
      action: () => navigate(`/${schoolCode}/teacher/subjects`)
    },
    {
      id: 'tools',
      title: 'Teacher Tools',
      description: 'Access teaching tools and utilities',
      icon: WrenchScrewdriverIcon,
      color: 'bg-cyan-500',
      action: () => navigate(`/${schoolCode}/teacher/tools`)
    },
    {
      id: 'communication',
      title: 'Send Message',
      description: 'Communicate with students and parents',
      icon: ChatBubbleLeftRightIcon,
      color: 'bg-pink-500',
      action: () => navigate(`/${schoolCode}/communication`)
    },
    {
      id: 'profile',
      title: 'My Profile',
      description: 'View and update your profile information',
      icon: UserIcon,
      color: 'bg-gray-500',
      action: () => navigate(`/${schoolCode}/teacher/profile`)
    }
  ];

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'assignment':
        return PencilSquareIcon;
      case 'attendance':
        return ClipboardDocumentListIcon;
      case 'grade':
        return ChartBarIcon;
      case 'message':
        return ChatBubbleLeftRightIcon;
      default:
        return CheckCircleIcon;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user?.first_name}!`}
        description="Here's what's happening in your classes today."
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AcademicCapIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  My Classes
                </dt>
                <dd className="text-lg font-medium text-gray-900 dark:text-white">
                  {stats.total_classes}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserGroupIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  Total Students
                </dt>
                <dd className="text-lg font-medium text-gray-900 dark:text-white">
                  {stats.total_students}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BookOpenIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  Subjects
                </dt>
                <dd className="text-lg font-medium text-gray-900 dark:text-white">
                  {stats.total_subjects}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  Pending Tasks
                </dt>
                <dd className="text-lg font-medium text-gray-900 dark:text-white">
                  {stats.pending_assignments}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CalendarDaysIcon className="h-8 w-8 text-indigo-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  Today's Classes
                </dt>
                <dd className="text-lg font-medium text-gray-900 dark:text-white">
                  {stats.upcoming_classes}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={action.action}
                className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className={`flex-shrink-0 p-2 rounded-lg ${action.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4 text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {action.title}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {action.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Activities */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          Recent Activities
        </h3>
        {stats.recent_activities.length > 0 ? (
          <div className="space-y-4">
            {stats.recent_activities.map((activity) => {
              const Icon = getActivityIcon(activity.type);
              return (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <Icon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.title}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {activity.description}
                    </p>
                    {(activity.class_name || activity.subject_name) && (
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {activity.class_name} {activity.subject_name && `• ${activity.subject_name}`}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-xs text-gray-400 dark:text-gray-500">
                    {formatTimeAgo(activity.timestamp)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No recent activities to show
          </p>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboardPage;
