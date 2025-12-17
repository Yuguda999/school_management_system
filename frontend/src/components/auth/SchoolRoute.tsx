import React from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTeacherPermissions } from '../../hooks/useTeacherPermissions';
import LoadingSpinner from '../ui/LoadingSpinner';

interface SchoolRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requiredPermission?: string;
}

const SchoolRoute: React.FC<SchoolRouteProps> = ({
  children,
  allowedRoles = ['school_owner', 'school_admin', 'teacher', 'student', 'parent'],
  requiredPermission
}) => {
  const { user, loading: authLoading } = useAuth();
  const { permissions, loading: permissionsLoading } = useTeacherPermissions();
  const location = useLocation();
  const { schoolCode } = useParams<{ schoolCode: string }>();

  if (authLoading || (user?.role === 'teacher' && permissionsLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    // Redirect to school-specific login if schoolCode exists, otherwise platform login
    const loginPath = schoolCode ? `/${schoolCode}/login` : '/login';
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // Platform admin should not access school routes
  if (user.role === 'platform_super_admin') {
    return <Navigate to="/platform" replace />;
  }

  // Additional safety check: if user exists but role is undefined/null, show loading
  // This prevents the "Access Denied" flash during state transitions
  if (!user.role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Validate school code matches user's school, but allow school owners to access any owned school
  if (
    schoolCode &&
    user.role !== 'school_owner' &&
    user.school?.code &&
    schoolCode.toUpperCase() !== user.school.code.toUpperCase()
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md mx-auto text-center p-6">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            School Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You don't have access to this school portal. You are trying to access <strong>{schoolCode.toUpperCase()}</strong>, but you belong to <strong>{user.school.code}</strong>.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
            Please use the correct school login page or contact your school administrator if you believe this is an error.
          </p>
          <button
            onClick={() => window.location.href = `/${user.school.code}/dashboard`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Go to My School Portal
          </button>
        </div>
      </div>
    );
  }

  // Check if user role is allowed for this route
  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Access Denied
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  // Check for required permission (only for teachers)
  if (requiredPermission && user.role === 'teacher') {
    if (!permissions.includes(requiredPermission)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Permission Required
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              You need the <strong>{requiredPermission.replace('_', ' ')}</strong> permission to access this page.
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Contact your school administrator to request access.
            </p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default SchoolRoute;
