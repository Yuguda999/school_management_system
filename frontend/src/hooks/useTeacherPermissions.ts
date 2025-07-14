import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { academicService } from '../services/academicService';

interface TeacherPermissions {
  hasAssignedClasses: boolean;
  isClassTeacher: boolean;
  loading: boolean;
  error: string | null;
}

export const useTeacherPermissions = (): TeacherPermissions => {
  const { user } = useAuth();
  const [hasAssignedClasses, setHasAssignedClasses] = useState(false);
  const [isClassTeacher, setIsClassTeacher] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkTeacherPermissions = async () => {
      if (!user || user.role !== 'teacher') {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Get teacher's assigned classes
        const classes = await academicService.getTeacherClasses({
          is_active: true,
          size: 100 // Get all classes to check if teacher is class teacher
        });

        setHasAssignedClasses(classes.length > 0);

        // Check if teacher is a class teacher (teacher_id matches current user)
        const isClassTeacherForAnyClass = classes.some(classItem =>
          classItem.teacher_id === user.id
        );
        setIsClassTeacher(isClassTeacherForAnyClass);

      } catch (err) {
        console.error('Error checking teacher permissions:', err);
        setError('Failed to check teacher permissions');
        setHasAssignedClasses(false);
        setIsClassTeacher(false);
      } finally {
        setLoading(false);
      }
    };

    checkTeacherPermissions();
  }, [user]);

  return {
    hasAssignedClasses,
    isClassTeacher,
    loading,
    error
  };
};
