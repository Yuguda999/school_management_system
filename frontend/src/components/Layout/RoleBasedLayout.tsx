import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import PlatformLayout from './PlatformLayout';
import SchoolLayout from './SchoolLayout';
import LoadingSpinner from '../ui/LoadingSpinner';

const RoleBasedLayout: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Authentication Required
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Please log in to access the system.
          </p>
        </div>
      </div>
    );
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

  // Platform admin gets completely separate interface
  if (user.role === 'platform_super_admin') {
    return <PlatformLayout />;
  }

  // All school-level users get school interface
  if (['school_owner', 'school_admin', 'teacher', 'student', 'parent'].includes(user.role)) {
    // Use school ID as key to force re-render when school changes
    return <SchoolLayout key={user.school?.id || 'no-school'} />;
  }

  // Fallback for unknown roles
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Access Denied
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Your role ({user.role}) does not have access to this system.
        </p>
      </div>
    </div>
  );
};

export default RoleBasedLayout;
