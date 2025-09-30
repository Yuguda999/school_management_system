import React from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../ui/LoadingSpinner';

interface SchoolRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const SchoolRoute: React.FC<SchoolRouteProps> = ({ 
  children, 
  allowedRoles = ['school_owner', 'school_admin', 'teacher', 'student', 'parent'] 
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const { schoolCode } = useParams<{ schoolCode: string }>();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
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
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            School Mismatch
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            You don't have access to this school. Please use the correct school login page.
          </p>
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

  return <>{children}</>;
};

export default SchoolRoute;
