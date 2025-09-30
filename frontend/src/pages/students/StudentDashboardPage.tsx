import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const StudentDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'student') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Welcome{user?.first_name ? `, ${user.first_name}` : ''}</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">This is your student dashboard.</p>
      {/* TODO: Add grades summary, timetable, announcements, and fees widgets */}
    </div>
  );
};

export default StudentDashboardPage;



