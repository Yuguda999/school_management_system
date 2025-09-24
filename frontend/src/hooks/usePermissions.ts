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
    return hasAnyRole(['platform_super_admin', 'school_owner', 'school_admin']);
  };

  const canManageTeachers = (): boolean => {
    return hasAnyRole(['platform_super_admin', 'school_owner', 'school_admin']);
  };

  const canManageStudents = (): boolean => {
    return hasAnyRole(['platform_super_admin', 'school_owner', 'school_admin', 'teacher']);
  };

  const canManageFees = (): boolean => {
    return hasAnyRole(['platform_super_admin', 'school_owner', 'school_admin', 'teacher']);
  };

  const canManageGrades = (): boolean => {
    return hasAnyRole(['platform_super_admin', 'school_owner', 'school_admin', 'teacher']);
  };

  const canManagePlatform = (): boolean => {
    return hasRole('platform_super_admin');
  };

  const canManageSchool = (): boolean => {
    return hasAnyRole(['platform_super_admin', 'school_owner']);
  };

  const canManageSchoolSettings = (): boolean => {
    return hasAnyRole(['platform_super_admin', 'school_owner']);
  };

  const canViewReports = (): boolean => {
    return hasAnyRole(['platform_super_admin', 'school_owner', 'school_admin', 'teacher']);
  };

  const canViewAllStudents = (): boolean => {
    return hasAnyRole(['platform_super_admin', 'school_owner', 'school_admin', 'teacher']);
  };

  const canViewOwnChildren = (): boolean => {
    return hasRole('parent');
  };

  const canViewOwnGrades = (): boolean => {
    return hasRole('student');
  };

  const canManageClasses = (): boolean => {
    return hasAnyRole(['platform_super_admin', 'school_owner', 'school_admin']);
  };

  const canManageSubjects = (): boolean => {
    return hasAnyRole(['platform_super_admin', 'school_owner', 'school_admin']);
  };

  const canManageTerms = (): boolean => {
    return hasAnyRole(['platform_super_admin', 'school_owner', 'school_admin']);
  };

  const isPlatformSuperAdmin = (): boolean => {
    return hasRole('platform_super_admin');
  };

  const isSchoolOwner = (): boolean => {
    return hasRole('school_owner');
  };

  const isSchoolAdmin = (): boolean => {
    return hasRole('school_admin');
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
    canManagePlatform,
    canManageSchool,
    canManageSchoolSettings,
    canViewAllStudents,
    canViewOwnChildren,
    canViewOwnGrades,
    canManageClasses,
    canManageSubjects,
    canManageTerms,
    isPlatformSuperAdmin,
    isSchoolOwner,
    isSchoolAdmin,
    isTeacher,
    isParent,
    isStudent,
  };
};
