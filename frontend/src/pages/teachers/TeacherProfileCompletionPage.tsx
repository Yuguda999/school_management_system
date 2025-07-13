import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import TeacherProfileCompletion from '../../components/teachers/TeacherProfileCompletion';

const TeacherProfileCompletionPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleProfileComplete = () => {
    // Redirect to teacher dashboard after profile completion
    navigate('/teacher/dashboard');
  };

  // If user is not a teacher, redirect to regular dashboard
  if (user && user.role !== 'teacher') {
    navigate('/dashboard');
    return null;
  }

  return (
    <TeacherProfileCompletion onComplete={handleProfileComplete} />
  );
};

export default TeacherProfileCompletionPage;
