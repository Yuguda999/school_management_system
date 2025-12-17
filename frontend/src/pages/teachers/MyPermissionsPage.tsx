import React, { useState, useEffect } from 'react';
import { Shield, Clock, CheckCircle, AlertCircle, Info } from 'lucide-react';
import PageHeader from '../../components/Layout/PageHeader';
import { teacherPermissionService } from '../../services/teacherPermissionService';
import { TeacherPermission, PermissionType } from '../../types';
import { format } from 'date-fns';

const PERMISSION_INFO: Record<string, { label: string; description: string; icon: string; capabilities: string[] }> = {
    'manage_students': {
        label: 'Manage Students',
        description: 'You can register, edit, and delete student records.',
        icon: '👨‍🎓',
        capabilities: ['Add new students', 'Edit student profiles', 'Manage student documents', 'Delete students']
    },
    'manage_fees': {
        label: 'Manage Fees',
        description: 'You can create and manage fee records and payments.',
        icon: '💰',
        capabilities: ['Create fee structures', 'Record payments', 'Generate fee reports', 'Manage fee discounts']
    },
    'manage_assets': {
        label: 'Manage Assets',
        description: 'You can manage school assets and inventory.',
        icon: '🏫',
        capabilities: ['Add new assets', 'Track inventory', 'Record maintenance', 'Manage disposals']
    },
    'manage_grades': {
        label: 'Manage Grades',
        description: 'You can enter and edit grades and report cards.',
        icon: '📊',
        capabilities: ['Enter student grades', 'Edit existing grades', 'Generate report cards', 'View grade analytics']
    },
    'manage_classes': {
        label: 'Manage Classes',
        description: 'You can create and manage classes and enrollments.',
        icon: '🏛️',
        capabilities: ['Create classes', 'Manage enrollments', 'Assign teachers', 'Set class schedules']
    },
    'manage_attendance': {
        label: 'Manage Attendance',
        description: 'You can record and manage student attendance.',
        icon: '📋',
        capabilities: ['Mark attendance', 'View attendance reports', 'Manage late arrivals', 'Track absences']
    },
    'view_analytics': {
        label: 'View Analytics',
        description: 'You can access school analytics and reports.',
        icon: '📈',
        capabilities: ['View performance dashboards', 'Access statistical reports', 'Generate analytics charts']
    }
};

const MyPermissionsPage: React.FC = () => {
    const [permissions, setPermissions] = useState<TeacherPermission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPermissions = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await teacherPermissionService.getMyPermissions();
                setPermissions(data || []);
            } catch (err: any) {
                console.error('Failed to fetch permissions:', err);
                setError(err.response?.data?.detail || 'Failed to load your permissions');
            } finally {
                setLoading(false);
            }
        };

        fetchPermissions();
    }, []);

    const activePermissions = permissions.filter(p => {
        const isExpired = p.expires_at && new Date(p.expires_at) < new Date();
        return p.is_active && !isExpired;
    });

    return (
        <div className="space-y-6">
            <PageHeader
                title="My Delegated Permissions"
                description="View the administrative permissions that have been granted to you by the school owner."
            />

            {/* Info Banner */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start">
                    <Info className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                        <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                            About Delegated Permissions
                        </h3>
                        <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                            These permissions allow you to perform specific administrative tasks on behalf of the school owner.
                            All actions you take with these permissions are logged in the Activity Log.
                        </p>
                    </div>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
            )}

            {/* Loading State */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
            ) : activePermissions.length === 0 ? (
                /* Empty State */
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                    <Shield className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No Permissions Assigned
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                        You don't have any delegated permissions yet. Contact your school administrator
                        if you need access to administrative functions.
                    </p>
                </div>
            ) : (
                /* Permissions Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {activePermissions.map((perm) => {
                        const info = PERMISSION_INFO[perm.permission_type] || {
                            label: perm.permission_type,
                            description: 'Permission granted by school owner.',
                            icon: '🔑',
                            capabilities: []
                        };

                        return (
                            <div
                                key={perm.id}
                                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
                            >
                                {/* Header */}
                                <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-4">
                                    <div className="flex items-center">
                                        <span className="text-3xl mr-3">{info.icon}</span>
                                        <div>
                                            <h3 className="text-lg font-semibold text-white">
                                                {info.label}
                                            </h3>
                                            <p className="text-primary-100 text-sm">
                                                {info.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="p-4 space-y-4">
                                    {/* Capabilities */}
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            What you can do:
                                        </h4>
                                        <ul className="space-y-1">
                                            {info.capabilities.map((cap, idx) => (
                                                <li key={idx} className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                                                    {cap}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Metadata */}
                                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500 dark:text-gray-400">Granted by:</span>
                                            <span className="text-gray-900 dark:text-white font-medium">
                                                {perm.granter?.first_name} {perm.granter?.last_name}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500 dark:text-gray-400">Granted on:</span>
                                            <span className="text-gray-900 dark:text-white">
                                                {format(new Date(perm.created_at), 'MMM d, yyyy')}
                                            </span>
                                        </div>
                                        {perm.expires_at && (
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-500 dark:text-gray-400">
                                                    <Clock className="h-4 w-4 inline mr-1" />
                                                    Expires:
                                                </span>
                                                <span className="text-amber-600 dark:text-amber-400 font-medium">
                                                    {format(new Date(perm.expires_at), 'MMM d, yyyy')}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Active Badge */}
                                <div className="bg-green-50 dark:bg-green-900/20 px-4 py-2 flex items-center justify-center">
                                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                    <span className="text-sm font-medium text-green-700 dark:text-green-400">
                                        Active Permission
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MyPermissionsPage;
