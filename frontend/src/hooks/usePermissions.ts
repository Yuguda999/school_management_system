import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

export const usePermissions = () => {
  const { user } = useAuth();

  const hasRole = (role: UserRole): boolean => {
    return user?.role === role;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return user ? roles.includes(user.role) : false;
  };

  const canManageUsers = (): boolean => {
    return hasAnyRole(['super_admin', 'admin']);
  };

  const canManageTeachers = (): boolean => {
    return hasAnyRole(['super_admin', 'admin']);
  };

  const canManageStudents = (): boolean => {
    return hasAnyRole(['super_admin', 'admin', 'teacher']);
  };

  const canManageFees = (): boolean => {
    return hasAnyRole(['super_admin', 'admin', 'teacher']);
  };

  const canManageGrades = (): boolean => {
    return hasAnyRole(['super_admin', 'admin', 'teacher']);
  };

  const canViewReports = (): boolean => {
    return hasAnyRole(['super_admin', 'admin', 'teacher']);
  };

  const canManageSchoolSettings = (): boolean => {
    return hasRole('super_admin');
  };

  const canViewAllStudents = (): boolean => {
    return hasAnyRole(['super_admin', 'admin', 'teacher']);
  };

  const canViewOwnChildren = (): boolean => {
    return hasRole('parent');
  };

  const canViewOwnGrades = (): boolean => {
    return hasRole('student');
  };

  const isSuperAdmin = (): boolean => {
    return hasRole('super_admin');
  };

  const isAdmin = (): boolean => {
    return hasRole('admin');
  };

  const isTeacher = (): boolean => {
    return hasRole('teacher');
  };

  const isParent = (): boolean => {
    return hasRole('parent');
  };

  const isStudent = (): boolean => {
    return hasRole('student');
  };

  return {
    user,
    hasRole,
    hasAnyRole,
    canManageUsers,
    canManageTeachers,
    canManageStudents,
    canManageFees,
    canManageGrades,
    canViewReports,
    canManageSchoolSettings,
    canViewAllStudents,
    canViewOwnChildren,
    canViewOwnGrades,
    isSuperAdmin,
    isAdmin,
    isTeacher,
    isParent,
    isStudent,
  };
};
