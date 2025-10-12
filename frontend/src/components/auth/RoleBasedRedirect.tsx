import React, { useEffect } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../ui/LoadingSpinner';

const RoleBasedRedirect: React.FC = () => {
  const { user, loading } = useAuth();
  const { schoolCode: urlSchoolCode } = useParams<{ schoolCode: string }>();

  // Get school code from URL, user's school object, or user's school_code field
  const schoolCode = urlSchoolCode || user?.school?.code || user?.school_code || localStorage.getItem('school_code');

  useEffect(() => {
    // Log the redirect for debugging
    if (user) {
      console.log('🔄 RoleBasedRedirect:', {
        role: user.role,
        urlSchoolCode,
        userSchoolCode: user.school_code,
        storedSchoolCode: localStorage.getItem('school_code'),
        finalSchoolCode: schoolCode,
        schoolId: user.school_id
      });
    }
  }, [user, urlSchoolCode, schoolCode]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    console.log('❌ RoleBasedRedirect: No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  console.log('✅ RoleBasedRedirect: User authenticated, role:', user.role);

  // Platform admin goes to platform interface
  if (user.role === 'platform_super_admin') {
    console.log('🔄 Redirecting platform admin to /platform');
    return <Navigate to="/platform" replace />;
  }

  // School owners without a selected school need to select one
  if (user.role === 'school_owner' && !user.school_id) {
    console.log('🔄 School owner without school, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // If we have a school code, use it for navigation
  if (schoolCode) {
    console.log('🔄 School code found:', schoolCode, 'Role:', user.role);

    // Redirect based on role with school code
    if (user.role === 'student') {
      const destination = `/${schoolCode}/student/dashboard`;
      console.log('🔄 Redirecting student to:', destination);
      return <Navigate to={destination} replace />;
    }

    if (['school_owner', 'school_admin', 'teacher', 'parent'].includes(user.role)) {
      const destination = `/${schoolCode}/dashboard`;
      console.log('🔄 Redirecting', user.role, 'to:', destination);
      return <Navigate to={destination} replace />;
    }
  }

  // If no school code but user has school_id, try to get school code
  if (!schoolCode && user.school_id) {
    console.warn('⚠️ User has school_id but no school_code available');
  }

  // Fallback for unknown roles or missing school code
  console.error('❌ RoleBasedRedirect: Unknown role or missing school code', {
    role: user.role,
    schoolCode,
    school_id: user.school_id
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Unknown Role
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Your role ({user.role}) is not recognized by the system.
        </p>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
          School Code: {schoolCode || 'Not found'}
        </p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
          School ID: {user.school_id || 'Not found'}
        </p>
      </div>
    </div>
  );
};

export default RoleBasedRedirect;
