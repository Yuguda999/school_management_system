import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { academicService } from '../services/academicService';
import { teacherPermissionService } from '../services/teacherPermissionService';

interface TeacherPermissions {
  hasAssignedClasses: boolean;
  isClassTeacher: boolean;
  permissions: string[];
  canManageStudents: boolean;
  canManageFees: boolean;
  canManageAssets: boolean;
  canManageGrades: boolean;
  canManageClasses: boolean;
  canManageAttendance: boolean;
  canViewAnalytics: boolean;
  loading: boolean;
  error: string | null;
}

export const useTeacherPermissions = (): TeacherPermissions => {
  const { user } = useAuth();
  const [hasAssignedClasses, setHasAssignedClasses] = useState(false);
  const [isClassTeacher, setIsClassTeacher] = useState(false);
  const [permissions, setPermissions] = useState<string[]>([]);
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

        // Parallel fetch for better performance
        const [classes, delegatedPermissions] = await Promise.all([
          // Get teacher's assigned classes
          academicService.getTeacherClasses({
            is_active: true,
            size: 100 // Get all classes to check if teacher is class teacher
          }).catch(err => {
            console.error('Error fetching classes:', err);
            return [];
          }),

          // Get delegated permissions
          teacherPermissionService.getMyPermissions().catch(err => {
            console.error('Error fetching permissions:', err);
            return [];
          })
        ]);

        // Process class assignments
        setHasAssignedClasses(classes.length > 0);
        const isClassTeacherForAnyClass = classes.some(classItem =>
          classItem.teacher_id === user.id
        );
        setIsClassTeacher(isClassTeacherForAnyClass);

        // Process delegated permissions
        // Filter for active and non-expired permissions
        const activePermissions = delegatedPermissions
          .filter(p => {
            const isExpired = p.expires_at && new Date(p.expires_at) < new Date();
            return p.is_active && !isExpired;
          })
          .map(p => p.permission_type);

        setPermissions(activePermissions);

      } catch (err) {
        console.error('Error checking teacher permissions:', err);
        setError('Failed to check teacher permissions');
        // Set defaults on error
        setHasAssignedClasses(false);
        setIsClassTeacher(false);
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    };

    checkTeacherPermissions();
  }, [user]);

  return {
    hasAssignedClasses,
    isClassTeacher,
    permissions,
    canManageStudents: permissions.includes('manage_students'),
    canManageFees: permissions.includes('manage_fees'),
    canManageAssets: permissions.includes('manage_assets'),
    canManageGrades: permissions.includes('manage_grades'),
    canManageClasses: permissions.includes('manage_classes'),
    canManageAttendance: permissions.includes('manage_attendance'),
    canViewAnalytics: permissions.includes('view_analytics'),
    loading,
    error
  };
};
