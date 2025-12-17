import React, { useState, useEffect } from 'react';
import { X, Shield, Check } from 'lucide-react';
import { teacherPermissionService } from '../../services/teacherPermissionService';
import { TeacherPermission, User, PermissionType } from '../../types';

interface Props {
    teachers: User[];
    existingPermissions: TeacherPermission[];
    preselectedTeacherId?: string | null;
    onClose: () => void;
    onSuccess: () => void;
}

const PERMISSION_OPTIONS: { value: PermissionType; label: string; description: string }[] = [
    { value: 'manage_students', label: 'Manage Students', description: 'Register, edit, and delete students' },
    { value: 'manage_fees', label: 'Manage Fees', description: 'Create and manage fee records and payments' },
    { value: 'manage_assets', label: 'Manage Assets', description: 'Manage school assets and inventory' },
    { value: 'manage_grades', label: 'Manage Grades', description: 'Enter and edit grades and report cards' },
    { value: 'manage_classes', label: 'Manage Classes', description: 'Create and manage classes and enrollments' },
    { value: 'manage_attendance', label: 'Manage Attendance', description: 'Record and manage attendance' },
    { value: 'view_analytics', label: 'View Analytics', description: 'Access school analytics and reports' }
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
    const existingPermissionTypes = existingPermissions
        .filter(p => p.teacher_id === selectedTeacherId && !p.is_deleted)
        .map(p => p.permission_type);

    // Filter out teachers who already have all permissions
    const availableTeachers = teachers.filter(t => {
        const teacherPerms = existingPermissions.filter(p => p.teacher_id === t.id);
        return teacherPerms.length < PERMISSION_OPTIONS.length;
    });

    const handlePermissionToggle = (permission: PermissionType) => {
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
                    className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
                    onClick={onClose}
                />

                {/* Modal */}
                <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-xl">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                        <div className="flex items-center">
                            <Shield className="h-6 w-6 text-indigo-600 mr-3" />
                            <h3 className="text-lg font-semibold text-gray-900">
                                Assign Permissions
                            </h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-500"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-4 space-y-6">
                        {/* Error Message */}
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        )}

                        {/* Teacher Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Select Teacher
                            </label>
                            <select
                                value={selectedTeacherId}
                                onChange={(e) => {
                                    setSelectedTeacherId(e.target.value);
                                    setSelectedPermissions([]);
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                disabled={!!preselectedTeacherId}
                            >
                                <option value="">Choose a teacher...</option>
                                {availableTeachers.map(teacher => (
                                    <option key={teacher.id} value={teacher.id}>
                                        {teacher.first_name} {teacher.last_name} ({teacher.email})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Permissions Selection */}
                        {selectedTeacherId && (
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Select Permissions
                                    </label>
                                    <div className="space-x-2">
                                        <button
                                            type="button"
                                            onClick={handleSelectAll}
                                            className="text-xs text-indigo-600 hover:text-indigo-800"
                                        >
                                            Select All
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleDeselectAll}
                                            className="text-xs text-gray-500 hover:text-gray-700"
                                        >
                                            Deselect All
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-md p-3">
                                    {PERMISSION_OPTIONS.map(({ value, label, description }) => {
                                        const isExisting = existingPermissionTypes.includes(value);
                                        const isSelected = selectedPermissions.includes(value);

                                        return (
                                            <label
                                                key={value}
                                                className={`flex items-start p-3 rounded-lg cursor-pointer transition-colors ${isExisting
                                                        ? 'bg-gray-100 cursor-not-allowed'
                                                        : isSelected
                                                            ? 'bg-indigo-50 border-indigo-200'
                                                            : 'bg-white hover:bg-gray-50'
                                                    } border`}
                                            >
                                                <div className="flex items-center h-5">
                                                    {isExisting ? (
                                                        <Check className="h-5 w-5 text-green-500" />
                                                    ) : (
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => handlePermissionToggle(value)}
                                                            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                                        />
                                                    )}
                                                </div>
                                                <div className="ml-3">
                                                    <span className={`text-sm font-medium ${isExisting ? 'text-gray-500' : 'text-gray-900'
                                                        }`}>
                                                        {label}
                                                        {isExisting && (
                                                            <span className="ml-2 text-xs text-green-600">(Already assigned)</span>
                                                        )}
                                                    </span>
                                                    <p className="text-xs text-gray-500">{description}</p>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Expiration Date (Optional) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Expiration Date (Optional)
                            </label>
                            <input
                                type="datetime-local"
                                value={expiresAt}
                                onChange={(e) => setExpiresAt(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                min={new Date().toISOString().slice(0, 16)}
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Leave empty for permanent permissions
                            </p>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !selectedTeacherId || selectedPermissions.length === 0}
                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
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
