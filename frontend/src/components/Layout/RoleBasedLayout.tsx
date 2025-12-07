import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import PlatformLayout from './PlatformLayout';
import SchoolLayout from './SchoolLayout';
import LoadingSpinner from '../ui/LoadingSpinner';
import AISupport from '../support/AISupport';

const RoleBasedLayout: React.FC = () => {
  const { user, loading } = useAuth();

  console.log('🎨 RoleBasedLayout rendering:', {
    loading,
    hasUser: !!user,
    role: user?.role,
    schoolId: user?.school_id
  });

  if (loading) {
    console.log('⏳ RoleBasedLayout: Loading...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    console.log('❌ RoleBasedLayout: No user');
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
    console.log('⚠️ RoleBasedLayout: User exists but role is undefined');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  console.log('✅ RoleBasedLayout: User role:', user.role);

  // Platform admin gets completely separate interface
  if (user.role === 'platform_super_admin') {
    console.log('🎨 Rendering PlatformLayout');
    return (
      <>
        <PlatformLayout />
        <AISupport />
      </>
    );
  }

  // All school-level users get school interface
  if (['school_owner', 'school_admin', 'teacher', 'student', 'parent'].includes(user.role)) {
    console.log('🎨 Rendering SchoolLayout for role:', user.role);
    // Use school ID as key to force re-render when school changes
    return (
      <>
        <SchoolLayout key={user.school?.id || user.school_id || 'no-school'} />
        <AISupport />
      </>
    );
  }

  // Fallback for unknown roles
  console.error('❌ RoleBasedLayout: Unknown role:', user.role);
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Access Denied
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Your role ({user.role}) does not have access to this system.
        </p>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-500">
          Debug Info: Role type: {typeof user.role}, Value: "{user.role}"
        </p>
      </div>
    </div>
  );
};

export default RoleBasedLayout;
