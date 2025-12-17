import React, { useState } from 'react';
import { X, Shield, Check, AlertCircle, Loader2 } from 'lucide-react';
import { teacherPermissionService } from '../../services/teacherPermissionService';
import { TeacherPermission, User, PermissionType } from '../../types';

interface Props {
    teachers: User[];
    existingPermissions: TeacherPermission[];
    preselectedTeacherId?: string | null;
    onClose: () => void;
    onSuccess: () => void;
}

const PERMISSION_OPTIONS: { value: PermissionType; label: string; description: string; icon: string }[] = [
    { value: 'manage_students', label: 'Manage Students', description: 'Register, edit, and delete students', icon: '👨‍🎓' },
    { value: 'manage_fees', label: 'Manage Fees', description: 'Create and manage fee records and payments', icon: '💰' },
    { value: 'manage_assets', label: 'Manage Assets', description: 'Manage school assets and inventory', icon: '🏫' },
    { value: 'manage_grades', label: 'Manage Grades', description: 'Enter and edit grades and report cards', icon: '📊' },
    { value: 'manage_classes', label: 'Manage Classes', description: 'Create and manage classes and enrollments', icon: '🏛️' },
    { value: 'manage_attendance', label: 'Manage Attendance', description: 'Record and manage attendance', icon: '📋' },
    { value: 'view_analytics', label: 'View Analytics', description: 'Access school analytics and reports', icon: '📈' }
];

const PermissionAssignmentModal: React.FC<Props> = ({
    teachers,
    existingPermissions,
    preselectedTeacherId,
    onClose,
    onSuccess
}) => {
    const [selectedTeacherId, setSelectedTeacherId] = useState<string>(preselectedTeacherId || '');
    const [selectedPermissions, setSelectedPermissions] = useState<PermissionType[]>([]);
    const [expiresAt, setExpiresAt] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Get existing permission types for the selected teacher
    const existingPermissionTypes = selectedTeacherId
        ? existingPermissions
            .filter(p => p.teacher_id === selectedTeacherId && p.is_active)
            .map(p => p.permission_type)
        : [];

    // Use all teachers
    const availableTeachers = teachers;

    const handlePermissionToggle = (permission: PermissionType) => {
        if (existingPermissionTypes.includes(permission)) return;
        setSelectedPermissions(prev =>
            prev.includes(permission)
                ? prev.filter(p => p !== permission)
                : [...prev, permission]
        );
    };

    const handleSelectAll = () => {
        const availablePerms = PERMISSION_OPTIONS
            .filter(p => !existingPermissionTypes.includes(p.value))
            .map(p => p.value);
        setSelectedPermissions(availablePerms);
    };

    const handleDeselectAll = () => {
        setSelectedPermissions([]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedTeacherId) {
            setError('Please select a teacher');
            return;
        }

        if (selectedPermissions.length === 0) {
            setError('Please select at least one permission');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            await teacherPermissionService.grantBulkPermissions({
                teacher_id: selectedTeacherId,
                permissions: selectedPermissions,
                expires_at: expiresAt || undefined
            });

            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to assign permissions');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                {/* Backdrop */}
                <div
                    className="fixed inset-0 transition-opacity bg-black/60 dark:bg-black/80"
                    onClick={onClose}
                />

                {/* Modal */}
                <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-xl relative z-10">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center">
                            <Shield className="h-6 w-6 text-primary-500 mr-3" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Assign Permissions
                            </h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-300"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-4 space-y-6">
                        {/* Error Message */}
                        {error && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md flex items-start">
                                <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                            </div>
                        )}

                        {/* Teacher Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Select Teacher
                            </label>
                            {teachers.length === 0 ? (
                                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                                    <p className="text-sm text-yellow-700 dark:text-yellow-400">
                                        No teachers available. Please add teachers to your school first.
                                    </p>
                                </div>
                            ) : (
                                <select
                                    value={selectedTeacherId}
                                    onChange={(e) => {
                                        setSelectedTeacherId(e.target.value);
                                        setSelectedPermissions([]);
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                                    disabled={!!preselectedTeacherId}
                                >
                                    <option value="">Choose a teacher...</option>
                                    {availableTeachers.map(teacher => (
                                        <option key={teacher.id} value={teacher.id}>
                                            {teacher.first_name} {teacher.last_name} ({teacher.email})
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* Permissions Selection - Always show */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Select Permissions
                                </label>
                                {selectedTeacherId && (
                                    <div className="space-x-2">
                                        <button
                                            type="button"
                                            onClick={handleSelectAll}
                                            className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300"
                                        >
                                            Select All
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleDeselectAll}
                                            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                        >
                                            Deselect All
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md p-3 bg-gray-50 dark:bg-gray-900/50">
                                {PERMISSION_OPTIONS.map(({ value, label, description, icon }) => {
                                    const isExisting = existingPermissionTypes.includes(value);
                                    const isSelected = selectedPermissions.includes(value);
                                    const isDisabled = !selectedTeacherId || isExisting;

                                    return (
                                        <label
                                            key={value}
                                            className={`flex items-start p-3 rounded-lg cursor-pointer transition-colors ${isDisabled
                                                    ? 'opacity-50 cursor-not-allowed'
                                                    : isSelected
                                                        ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-300 dark:border-primary-700'
                                                        : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                                                } border border-gray-200 dark:border-gray-700`}
                                        >
                                            <div className="flex items-center h-5 mt-0.5">
                                                {isExisting ? (
                                                    <Check className="h-5 w-5 text-green-500" />
                                                ) : (
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => handlePermissionToggle(value)}
                                                        disabled={isDisabled}
                                                        className="h-4 w-4 text-primary-600 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500 disabled:opacity-50"
                                                    />
                                                )}
                                            </div>
                                            <div className="ml-3 flex-1">
                                                <div className="flex items-center">
                                                    <span className="text-lg mr-2">{icon}</span>
                                                    <span className={`text-sm font-medium ${isDisabled ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'
                                                        }`}>
                                                        {label}
                                                    </span>
                                                </div>
                                                {isExisting && (
                                                    <span className="text-xs text-green-600 dark:text-green-400">(Already assigned)</span>
                                                )}
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Expiration Date (Optional) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Expiration Date (Optional)
                            </label>
                            <input
                                type="datetime-local"
                                value={expiresAt}
                                onChange={(e) => setExpiresAt(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                                min={new Date().toISOString().slice(0, 16)}
                            />
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Leave empty for permanent permissions
                            </p>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !selectedTeacherId || selectedPermissions.length === 0}
                                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                {loading ? 'Assigning...' : 'Assign Permissions'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PermissionAssignmentModal;
