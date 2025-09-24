import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../ui/LoadingSpinner';

const RoleBasedRedirect: React.FC = () => {
  const { user, loading } = useAuth();

  useEffect(() => {
    // Log the redirect for debugging
    if (user) {
      console.log(`Redirecting user with role: ${user.role}`);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Platform admin goes to platform interface
  if (user.role === 'platform_super_admin') {
    return <Navigate to="/platform" replace />;
  }

  // School owners without a selected school need to select one
  if (user.role === 'school_owner' && !user.school_id) {
    return <Navigate to="/login" replace />;
  }

  // All school users go to school dashboard
  if (['school_owner', 'school_admin', 'teacher', 'student', 'parent'].includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Fallback for unknown roles
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Unknown Role
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Your role ({user.role}) is not recognized by the system.
        </p>
      </div>
    </div>
  );
};

export default RoleBasedRedirect;
