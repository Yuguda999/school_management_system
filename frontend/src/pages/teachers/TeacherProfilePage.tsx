import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  UserIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  CameraIcon
} from '@heroicons/react/24/outline';
import { User, Gender } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import { apiService } from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import PageHeader from '../../components/Layout/PageHeader';

interface ProfileFormData {
  first_name: string;
  last_name: string;
  middle_name?: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  gender?: Gender;
  qualification?: string;
  experience_years?: string;
  bio?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  department?: string;
  position?: string;
}

const TeacherProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(user);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<ProfileFormData>();

  useEffect(() => {
    if (user) {
      setCurrentUser(user);
      reset({
        first_name: user.first_name,
        last_name: user.last_name,
        middle_name: user.middle_name || '',
        email: user.email,
        phone: user.phone || '',
        date_of_birth: user.date_of_birth || '',
        gender: user.gender as Gender || 'male',
        qualification: user.qualification || '',
        experience_years: user.experience_years || '',
        bio: user.bio || '',
        address_line1: user.address_line1 || '',
        address_line2: user.address_line2 || '',
        city: user.city || '',
        state: user.state || '',
        postal_code: user.postal_code || '',
        country: user.country || '',
        department: user.department || '',
        position: user.position || ''
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const updatedUser = await apiService.put(`/api/v1/users/${currentUser.id}`, data);
      
      // Update the current user state
      setCurrentUser(updatedUser);
      setEditing(false);
      
      showSuccess('Profile updated successfully!');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      
      if (error.response?.status === 401) {
        logout();
        navigate('/login');
        return;
      }
      
      showError(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    if (currentUser) {
      reset({
        first_name: currentUser.first_name,
        last_name: currentUser.last_name,
        middle_name: currentUser.middle_name || '',
        email: currentUser.email,
        phone: currentUser.phone || '',
        date_of_birth: currentUser.date_of_birth || '',
        gender: currentUser.gender as Gender || 'male',
        qualification: currentUser.qualification || '',
        experience_years: currentUser.experience_years || '',
        bio: currentUser.bio || '',
        address_line1: currentUser.address_line1 || '',
        address_line2: currentUser.address_line2 || '',
        city: currentUser.city || '',
        state: currentUser.state || '',
        postal_code: currentUser.postal_code || '',
        country: currentUser.country || '',
        department: currentUser.department || '',
        position: currentUser.position || ''
      });
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Profile"
        description="Manage your personal and professional information"
        actions={
          !editing ? (
            <button
              onClick={() => setEditing(true)}
              className="btn btn-primary"
            >
              <PencilIcon className="h-5 w-5 mr-2" />
              Edit Profile
            </button>
          ) : (
            <div className="flex space-x-3">
              <button
                onClick={handleCancel}
                disabled={loading}
                className="btn btn-outline"
              >
                <XMarkIcon className="h-5 w-5 mr-2" />
                Cancel
              </button>
              <button
                onClick={handleSubmit(onSubmit)}
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? (
                  <LoadingSpinner />
                ) : (
                  <CheckIcon className="h-5 w-5 mr-2" />
                )}
                Save Changes
              </button>
            </div>
          )
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Picture Section */}
        <div className="lg:col-span-1">
          <div className="card p-6">
            <div className="text-center">
              <div className="relative inline-block">
                <div className="h-32 w-32 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center mx-auto">
                  {currentUser.profile_picture_url ? (
                    <img
                      src={currentUser.profile_picture_url}
                      alt={currentUser.full_name}
                      className="h-32 w-32 rounded-full object-cover"
                    />
                  ) : (
                    <UserIcon className="h-16 w-16 text-gray-500 dark:text-gray-400" />
                  )}
                </div>
                {editing && (
                  <button className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 transition-colors">
                    <CameraIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                {currentUser.full_name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {currentUser.role === 'teacher' ? 'Teacher' : currentUser.role}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {currentUser.department || 'No department assigned'}
              </p>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information */}
            <div className="card p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">First Name *</label>
                  {editing ? (
                    <input
                      type="text"
                      className={`input ${errors.first_name ? 'input-error' : ''}`}
                      {...register('first_name', { required: 'First name is required' })}
                    />
                  ) : (
                    <p className="text-sm text-gray-900 dark:text-gray-100 py-2">
                      {currentUser.first_name}
                    </p>
                  )}
                  {errors.first_name && <p className="error-text">{errors.first_name.message}</p>}
                </div>

                <div>
                  <label className="label">Last Name *</label>
                  {editing ? (
                    <input
                      type="text"
                      className={`input ${errors.last_name ? 'input-error' : ''}`}
                      {...register('last_name', { required: 'Last name is required' })}
                    />
                  ) : (
                    <p className="text-sm text-gray-900 dark:text-gray-100 py-2">
                      {currentUser.last_name}
                    </p>
                  )}
                  {errors.last_name && <p className="error-text">{errors.last_name.message}</p>}
                </div>

                <div>
                  <label className="label">Middle Name</label>
                  {editing ? (
                    <input
                      type="text"
                      className="input"
                      {...register('middle_name')}
                    />
                  ) : (
                    <p className="text-sm text-gray-900 dark:text-gray-100 py-2">
                      {currentUser.middle_name || 'Not provided'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="label">Email *</label>
                  {editing ? (
                    <input
                      type="email"
                      className={`input ${errors.email ? 'input-error' : ''}`}
                      {...register('email', { 
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address'
                        }
                      })}
                    />
                  ) : (
                    <p className="text-sm text-gray-900 dark:text-gray-100 py-2">
                      {currentUser.email}
                    </p>
                  )}
                  {errors.email && <p className="error-text">{errors.email.message}</p>}
                </div>

                <div>
                  <label className="label">Phone</label>
                  {editing ? (
                    <input
                      type="tel"
                      className="input"
                      {...register('phone')}
                    />
                  ) : (
                    <p className="text-sm text-gray-900 dark:text-gray-100 py-2">
                      {currentUser.phone || 'Not provided'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="label">Date of Birth</label>
                  {editing ? (
                    <input
                      type="date"
                      className="input"
                      {...register('date_of_birth')}
                    />
                  ) : (
                    <p className="text-sm text-gray-900 dark:text-gray-100 py-2">
                      {currentUser.date_of_birth ? new Date(currentUser.date_of_birth).toLocaleDateString() : 'Not provided'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="label">Gender</label>
                  {editing ? (
                    <select className="input" {...register('gender')}>
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  ) : (
                    <p className="text-sm text-gray-900 dark:text-gray-100 py-2">
                      {currentUser.gender ? currentUser.gender.charAt(0).toUpperCase() + currentUser.gender.slice(1) : 'Not provided'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div className="card p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Professional Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Department</label>
                  {editing ? (
                    <input
                      type="text"
                      className="input"
                      {...register('department')}
                    />
                  ) : (
                    <p className="text-sm text-gray-900 dark:text-gray-100 py-2">
                      {currentUser.department || 'Not assigned'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="label">Position</label>
                  {editing ? (
                    <input
                      type="text"
                      className="input"
                      {...register('position')}
                    />
                  ) : (
                    <p className="text-sm text-gray-900 dark:text-gray-100 py-2">
                      {currentUser.position || 'Not specified'}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="label">Qualification</label>
                  {editing ? (
                    <textarea
                      className="input"
                      rows={3}
                      {...register('qualification')}
                    />
                  ) : (
                    <p className="text-sm text-gray-900 dark:text-gray-100 py-2">
                      {currentUser.qualification || 'Not provided'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="label">Years of Experience</label>
                  {editing ? (
                    <input
                      type="text"
                      className="input"
                      {...register('experience_years')}
                    />
                  ) : (
                    <p className="text-sm text-gray-900 dark:text-gray-100 py-2">
                      {currentUser.experience_years || 'Not provided'}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="label">Bio</label>
                  {editing ? (
                    <textarea
                      className="input"
                      rows={4}
                      {...register('bio')}
                    />
                  ) : (
                    <p className="text-sm text-gray-900 dark:text-gray-100 py-2">
                      {currentUser.bio || 'No bio provided'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="card p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Address Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="label">Address Line 1</label>
                  {editing ? (
                    <input
                      type="text"
                      className="input"
                      {...register('address_line1')}
                    />
                  ) : (
                    <p className="text-sm text-gray-900 dark:text-gray-100 py-2">
                      {currentUser.address_line1 || 'Not provided'}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="label">Address Line 2</label>
                  {editing ? (
                    <input
                      type="text"
                      className="input"
                      {...register('address_line2')}
                    />
                  ) : (
                    <p className="text-sm text-gray-900 dark:text-gray-100 py-2">
                      {currentUser.address_line2 || 'Not provided'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="label">City</label>
                  {editing ? (
                    <input
                      type="text"
                      className="input"
                      {...register('city')}
                    />
                  ) : (
                    <p className="text-sm text-gray-900 dark:text-gray-100 py-2">
                      {currentUser.city || 'Not provided'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="label">State</label>
                  {editing ? (
                    <input
                      type="text"
                      className="input"
                      {...register('state')}
                    />
                  ) : (
                    <p className="text-sm text-gray-900 dark:text-gray-100 py-2">
                      {currentUser.state || 'Not provided'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="label">Postal Code</label>
                  {editing ? (
                    <input
                      type="text"
                      className="input"
                      {...register('postal_code')}
                    />
                  ) : (
                    <p className="text-sm text-gray-900 dark:text-gray-100 py-2">
                      {currentUser.postal_code || 'Not provided'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="label">Country</label>
                  {editing ? (
                    <input
                      type="text"
                      className="input"
                      {...register('country')}
                    />
                  ) : (
                    <p className="text-sm text-gray-900 dark:text-gray-100 py-2">
                      {currentUser.country || 'Not provided'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TeacherProfilePage;
