import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { userService } from '../../services/userService';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';
import Card from '../../components/ui/Card';
import { UserIcon, KeyIcon } from '@heroicons/react/24/outline';

const ProfilePage: React.FC = () => {
    const { user, refreshUser } = useAuth();
    const [activeTab, setActiveTab] = useState<'details' | 'security'>('details');

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Manage your account settings and preferences
                </p>
            </div>

            <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setActiveTab('details')}
                    className={`pb-4 px-4 text-sm font-medium border-b-2 transition-colors flex items-center ${activeTab === 'details'
                            ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                >
                    <UserIcon className="h-5 w-5 mr-2" />
                    Profile Details
                </button>
                <button
                    onClick={() => setActiveTab('security')}
                    className={`pb-4 px-4 text-sm font-medium border-b-2 transition-colors flex items-center ${activeTab === 'security'
                            ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                >
                    <KeyIcon className="h-5 w-5 mr-2" />
                    Security
                </button>
            </div>

            {activeTab === 'details' ? (
                <ProfileDetailsForm user={user} onUpdate={refreshUser} />
            ) : (
                <SecurityForm />
            )}
        </div>
    );
};

const ProfileDetailsForm: React.FC<{ user: any; onUpdate: () => void }> = ({ user, onUpdate }) => {
    const [loading, setLoading] = useState(false);
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        defaultValues: {
            first_name: user?.first_name || '',
            last_name: user?.last_name || '',
            email: user?.email || '',
            phone: user?.phone || '',
        },
    });

    const onSubmit = async (data: any) => {
        try {
            setLoading(true);
            await userService.updateUser(user.id, data);
            toast.success('Profile updated successfully');
            onUpdate();
        } catch (error) {
            console.error('Failed to update profile:', error);
            toast.error('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="max-w-2xl">
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            First Name
                        </label>
                        <input
                            type="text"
                            disabled // Name usually managed by admin for consistency, or enable if desired
                            className="w-full rounded-md border-gray-300 bg-gray-100 dark:bg-gray-800 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm cursor-not-allowed text-gray-500"
                            {...register('first_name')}
                        />
                        <p className="mt-1 text-xs text-gray-500">Contact admin to change name</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Last Name
                        </label>
                        <input
                            type="text"
                            disabled
                            className="w-full rounded-md border-gray-300 bg-gray-100 dark:bg-gray-800 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm cursor-not-allowed text-gray-500"
                            {...register('last_name')}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email Address
                    </label>
                    <input
                        type="email"
                        disabled
                        className="w-full rounded-md border-gray-300 bg-gray-100 dark:bg-gray-800 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm cursor-not-allowed text-gray-500"
                        {...register('email')}
                    />
                    <p className="mt-1 text-xs text-gray-500">Contact admin to change email</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Phone Number
                    </label>
                    <input
                        type="tel"
                        className={`w-full rounded-md border-gray-300 dark:bg-gray-800 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${errors.phone ? 'border-red-500' : ''
                            }`}
                        {...register('phone', {
                            pattern: {
                                value: /^[\+]?[1-9][\d]{0,15}$/,
                                message: 'Invalid phone number',
                            },
                        })}
                    />
                    {errors.phone && (
                        <p className="mt-1 text-sm text-red-600">{errors.phone.message as string}</p>
                    )}
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex justify-center rounded-md border border-transparent bg-primary-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </Card>
    );
};

const SecurityForm: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors },
    } = useForm();

    const newPassword = watch('new_password');

    const onSubmit = async (data: any) => {
        try {
            setLoading(true);
            await authService.changePassword(data.current_password, data.new_password);
            toast.success('Password changed successfully');
            reset();
        } catch (error) {
            console.error('Failed to change password:', error);
            toast.error('Failed to change password. Please check your current password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="max-w-2xl">
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Current Password
                    </label>
                    <input
                        type="password"
                        className={`w-full rounded-md border-gray-300 dark:bg-gray-800 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${errors.current_password ? 'border-red-500' : ''
                            }`}
                        {...register('current_password', {
                            required: 'Current password is required',
                        })}
                    />
                    {errors.current_password && (
                        <p className="mt-1 text-sm text-red-600">{errors.current_password.message as string}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        New Password
                    </label>
                    <input
                        type="password"
                        className={`w-full rounded-md border-gray-300 dark:bg-gray-800 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${errors.new_password ? 'border-red-500' : ''
                            }`}
                        {...register('new_password', {
                            required: 'New password is required',
                            minLength: {
                                value: 8,
                                message: 'Password must be at least 8 characters',
                            },
                        })}
                    />
                    {errors.new_password && (
                        <p className="mt-1 text-sm text-red-600">{errors.new_password.message as string}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Confirm New Password
                    </label>
                    <input
                        type="password"
                        className={`w-full rounded-md border-gray-300 dark:bg-gray-800 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${errors.confirm_password ? 'border-red-500' : ''
                            }`}
                        {...register('confirm_password', {
                            required: 'Please confirm your new password',
                            validate: (value) => value === newPassword || 'Passwords do not match',
                        })}
                    />
                    {errors.confirm_password && (
                        <p className="mt-1 text-sm text-red-600">{errors.confirm_password.message as string}</p>
                    )}
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex justify-center rounded-md border border-transparent bg-primary-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Updating...' : 'Change Password'}
                    </button>
                </div>
            </form>
        </Card>
    );
};

export default ProfilePage;
