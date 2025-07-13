import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProfileCompletionCheckProps {
  children: React.ReactNode;
}

const ProfileCompletionCheck: React.FC<ProfileCompletionCheckProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only check for authenticated teachers
    if (!isAuthenticated || !user || user.role !== 'teacher') {
      return;
    }

    // Skip check if already on profile completion page
    if (location.pathname === '/teacher/complete-profile') {
      return;
    }

    // Skip check if on teacher invitation acceptance page
    if (location.pathname === '/teacher/accept-invitation') {
      return;
    }

    // Check if teacher profile is incomplete
    // We now rely on the backend's profile_completed field which is automatically maintained
    const isProfileIncomplete = !user.profile_completed;

    if (isProfileIncomplete) {
      navigate('/teacher/complete-profile', { replace: true });
    }
  }, [user, isAuthenticated, navigate, location.pathname]);



  return <>{children}</>;
};

export default ProfileCompletionCheck;
