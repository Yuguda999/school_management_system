import React, { useState, useEffect } from 'react';
import { Plus, Shield, User, Trash2, ToggleLeft, ToggleRight, Clock, AlertCircle, Loader2 } from 'lucide-react';
import PageHeader from '../../components/Layout/PageHeader';
import { teacherPermissionService } from '../../services/teacherPermissionService';
import { userService } from '../../services/userService';
import { TeacherPermission, User as UserType, PermissionType } from '../../types';
import PermissionAssignmentModal from '../../components/permissions/PermissionAssignmentModal';
import { format } from 'date-fns';

const PERMISSION_LABELS: Record<PermissionType, { label: string; description: string; icon: string }> = {
    'manage_students': {
        label: 'Manage Students',
        description: 'Register, edit, and delete students',
        icon: '👨‍🎓'
    },
    'manage_fees': {
        label: 'Manage Fees',
        description: 'Create and manage fee records and payments',
        icon: '💰'
    },
    'manage_assets': {
        label: 'Manage Assets',
        description: 'Manage school assets and inventory',
        icon: '🏫'
    },
    'manage_grades': {
        label: 'Manage Grades',
        description: 'Enter and edit grades and report cards',
        icon: '📊'
    },
    'manage_classes': {
        label: 'Manage Classes',
        description: 'Create and manage classes and enrollments',
        icon: '🏛️'
    },
    'manage_attendance': {
        label: 'Manage Attendance',
        description: 'Record and manage attendance',
        icon: '📋'
    },
    'view_analytics': {
        label: 'View Analytics',
        description: 'Access school analytics and reports',
        icon: '📈'
    }
};

const TeacherPermissionsPage: React.FC = () => {
    const [permissions, setPermissions] = useState<TeacherPermission[]>([]);
    const [teachers, setTeachers] = useState<UserType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const [permsData, teachersData] = await Promise.all([
                teacherPermissionService.getAllPermissions(),
                userService.getTeachers()
            ]);
            console.log('Permissions:', permsData);
            console.log('Teachers:', teachersData);
            setPermissions(permsData || []);
            setTeachers(teachersData || []);
        } catch (err: any) {
            console.error('Failed to fetch data:', err);
            setError(err.response?.data?.detail || 'Failed to load permissions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleTogglePermission = async (permission: TeacherPermission) => {
        try {
            await teacherPermissionService.updatePermission(permission.id, {
                is_active: !permission.is_active
            });
            fetchData();
        } catch (error) {
            console.error('Failed to toggle permission:', error);
        }
    };

    const handleRevokePermission = async (permissionId: string) => {
        if (!confirm('Are you sure you want to revoke this permission?')) return;

        try {
            await teacherPermissionService.revokePermission(permissionId);
            fetchData();
        } catch (error) {
            console.error('Failed to revoke permission:', error);
        }
    };

    const handleModalSuccess = () => {
        setShowModal(false);
        setSelectedTeacherId(null);
        fetchData();
    };

    // Group permissions by teacher
    const permissionsByTeacher = permissions.reduce((acc, perm) => {
        const teacherId = perm.teacher_id;
        if (!acc[teacherId]) {
            acc[teacherId] = {
                teacher: perm.teacher,
                permissions: []
            };
        }
        acc[teacherId].permissions.push(perm);
        return acc;
    }, {} as Record<string, { teacher: TeacherPermission['teacher']; permissions: TeacherPermission[] }>);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Teacher Permissions"
                description="Delegate administrative permissions to teachers. All delegated actions are logged."
            />

            <div className="flex justify-end">
                <button
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Assign Permissions
                </button>
            </div>

            {/* Error State */}
            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
                </div>
            ) : Object.keys(permissionsByTeacher).length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                    <Shield className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Permissions Assigned</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                        Start by assigning permissions to teachers to allow them to perform administrative tasks.
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
                        {teachers.length} teacher{teachers.length !== 1 ? 's' : ''} available
                    </p>
                    <button
                        onClick={() => setShowModal(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Assign First Permission
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(permissionsByTeacher).map(([teacherId, { teacher, permissions: teacherPerms }]) => (
                        <div key={teacherId} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                            {/* Teacher Header */}
                            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                                        <User className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                                    </div>
                                    <div className="ml-4">
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                            {teacher?.first_name} {teacher?.last_name}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{teacher?.email}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setSelectedTeacherId(teacherId);
                                        setShowModal(true);
                                    }}
                                    className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 font-medium"
                                >
                                    + Add More
                                </button>
                            </div>

                            {/* Permissions Grid */}
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {teacherPerms.map((perm) => {
                                        const permInfo = PERMISSION_LABELS[perm.permission_type];
                                        const isExpired = perm.expires_at && new Date(perm.expires_at) < new Date();

                                        return (
                                            <div
                                                key={perm.id}
                                                className={`relative p-4 rounded-lg border ${!perm.is_active || isExpired
                                                        ? 'bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-700'
                                                        : 'bg-white dark:bg-gray-800 border-primary-200 dark:border-primary-800'
                                                    }`}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center">
                                                        <span className="text-2xl mr-3">{permInfo?.icon}</span>
                                                        <div>
                                                            <h4 className={`font-medium ${!perm.is_active || isExpired
                                                                    ? 'text-gray-500 dark:text-gray-400'
                                                                    : 'text-gray-900 dark:text-white'
                                                                }`}>
                                                                {permInfo?.label}
                                                            </h4>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                                {permInfo?.description}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Status & Expiry */}
                                                <div className="mt-3 flex items-center justify-between text-xs">
                                                    {perm.expires_at && (
                                                        <div className={`flex items-center ${isExpired ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                                                            <Clock className="h-3 w-3 mr-1" />
                                                            {isExpired ? 'Expired' : `Expires ${format(new Date(perm.expires_at), 'MMM d, yyyy')}`}
                                                        </div>
                                                    )}
                                                    {!perm.expires_at && <div />}

                                                    <div className="flex items-center space-x-2">
                                                        <button
                                                            onClick={() => handleTogglePermission(perm)}
                                                            className={`p-1 rounded ${perm.is_active
                                                                    ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                                                                    : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                                }`}
                                                            title={perm.is_active ? 'Disable' : 'Enable'}
                                                        >
                                                            {perm.is_active ? (
                                                                <ToggleRight className="h-5 w-5" />
                                                            ) : (
                                                                <ToggleLeft className="h-5 w-5" />
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={() => handleRevokePermission(perm.id)}
                                                            className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                            title="Revoke"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Inactive/Expired Badge */}
                                                {(!perm.is_active || isExpired) && (
                                                    <div className="absolute top-2 right-2">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${isExpired
                                                                ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                                                            }`}>
                                                            {isExpired ? 'Expired' : 'Inactive'}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex">
                    <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">About Delegated Permissions</h3>
                        <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                            When you grant permissions to teachers, they can perform administrative tasks on your behalf.
                            All actions performed by teachers with delegated permissions are automatically logged and
                            marked in the Activity Log for your review.
                        </p>
                    </div>
                </div>
            </div>

            {/* Permission Assignment Modal */}
            {showModal && (
                <PermissionAssignmentModal
                    teachers={teachers}
                    existingPermissions={permissions}
                    preselectedTeacherId={selectedTeacherId}
                    onClose={() => {
                        setShowModal(false);
                        setSelectedTeacherId(null);
                    }}
                    onSuccess={handleModalSuccess}
                />
            )}
        </div>
    );
};

export default TeacherPermissionsPage;
