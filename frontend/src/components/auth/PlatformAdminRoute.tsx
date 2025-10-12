import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../ui/LoadingSpinner';

interface PlatformAdminRouteProps {
  children: React.ReactNode;
}

const PlatformAdminRoute: React.FC<PlatformAdminRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

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

  if (user.role !== 'platform_super_admin') {
    // Redirect school users to their school dashboard
    const schoolCode = user.school?.code || user.school_code || localStorage.getItem('school_code');
    if (schoolCode) {
      return <Navigate to={`/${schoolCode}/dashboard`} replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default PlatformAdminRoute;
