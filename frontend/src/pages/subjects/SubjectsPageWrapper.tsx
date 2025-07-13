import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import SubjectsPage from '../../components/subjects/SubjectsPage';
import TeacherSubjectsPage from '../teachers/TeacherSubjectsPage';

const SubjectsPageWrapper: React.FC = () => {
  const { user } = useAuth();

  // Show teacher-specific subjects page for teachers
  if (user?.role === 'teacher') {
    return <TeacherSubjectsPage />;
  }

  // Show admin subjects page for admins
  return <SubjectsPage />;
};

export default SubjectsPageWrapper;
