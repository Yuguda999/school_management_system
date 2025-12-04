import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import TeacherProfileCompletion from '../../components/teachers/TeacherProfileCompletion';

const TeacherProfileCompletionPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleProfileComplete = () => {
    // Redirect to teacher dashboard after profile completion with school code
    const schoolCode = user?.school?.code || user?.school_code || localStorage.getItem('school_code');
    if (schoolCode) {
      navigate(`/${schoolCode}/dashboard`);
    } else {
      navigate('/dashboard');
    }
  };

  // If user is not a teacher, redirect to regular dashboard
  if (user && user.role !== 'teacher') {
    const schoolCode = user.school?.code || user.school_code || localStorage.getItem('school_code');
    if (schoolCode) {
      navigate(`/${schoolCode}/dashboard`);
    } else {
      navigate('/dashboard');
    }
    return null;
  }

  return (
    <TeacherProfileCompletion onComplete={handleProfileComplete} />
  );
};

export default TeacherProfileCompletionPage;
