import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BuildingOfficeIcon,
  PlusIcon,
  ClockIcon,
  EyeIcon,
  PencilIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import {
  StarIcon as CrownIcon
} from '@heroicons/react/24/solid';
import { useAuth } from '../../contexts/AuthContext';
import { schoolSelectionService } from '../../services/schoolSelectionService';
import { SchoolOption, OwnedSchoolsResponse } from '../../types';
import LoadingSpinner from '../ui/LoadingSpinner';
import { useToast } from '../../hooks/useToast';
import AddSchoolModal from './AddSchoolModal';
import EditSchoolModal from './EditSchoolModal';

const SchoolManagement: React.FC = () => {
  const { user, selectSchool, updateUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [switchingSchool, setSwitchingSchool] = useState<string | null>(null);
  const [showAddSchoolModal, setShowAddSchoolModal] = useState(false);
  const [showEditSchoolModal, setShowEditSchoolModal] = useState(false);

  useEffect(() => {
    loadOwnedSchools();
  }, []);

  const loadOwnedSchools = async () => {
    try {
      setLoading(true);
      const response: OwnedSchoolsResponse = await schoolSelectionService.getOwnedSchools();
      setSchools(response.schools);
    } catch (error) {
      console.error('Failed to load owned schools:', error);
      showError('Failed to load schools');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchSchool = async (schoolId: string) => {
    try {
      console.log('🔄 SchoolManagement: Starting school switch to:', schoolId);
      setSwitchingSchool(schoolId);

      // Find the school being switched to
      const targetSchool = schools.find(s => s.id === schoolId);
      if (!targetSchool) {
        throw new Error('School not found');
      }

      await selectSchool(schoolId);

      console.log('✅ SchoolManagement: School switch completed');
      showSuccess('School switched successfully');

      // Wait a moment for state to update, then navigate to the new school's dashboard
      setTimeout(() => {
        console.log('🔄 SchoolManagement: Navigating to new school dashboard...');
        // Use the school code from the selected school
        navigate(`/${targetSchool.code}/dashboard`);
      }, 200);

    } catch (error: any) {
      console.error('❌ SchoolManagement: Failed to switch school:', error);
      const message = error.response?.data?.detail || error.message || 'Failed to switch school';
      showError(message);
      setSwitchingSchool(null);
    }
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            School Management
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Manage your schools and switch between them.
          </p>
        </div>
        <div>
          <button
            onClick={() => setShowAddSchoolModal(true)}
            className="btn btn-primary flex items-center space-x-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Add School</span>
          </button>
        </div>
      </div>

      {/* Schools List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {schools.map((school) => (
          <div
            key={school.id}
            className="card p-6 hover:shadow-lg transition-shadow duration-200"
          >
            {/* School Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                {school.logo_url ? (
                  <img
                    src={school.logo_url}
                    alt={`${school.name} logo`}
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <BuildingOfficeIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                  </div>
                )}
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      {school.name}
                    </h4>
                    {school.is_primary && (
                      <CrownIcon className="h-4 w-4 text-yellow-500" title="Primary School" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {school.code}
                  </p>
                </div>
              </div>
              
              {/* Current School Indicator */}
              {user?.school_id === school.id && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Current
                </span>
              )}
            </div>

            {/* Subscription Info */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                  school.subscription_status === 'active'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : school.subscription_status === 'trial'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {school.subscription_plan === 'trial' ? 'Trial' : school.subscription_plan}
                </span>
              </div>
              
              {school.is_trial && school.trial_expires_at && (
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                  <ClockIcon className="h-3 w-3 mr-1" />
                  Expires {new Date(school.trial_expires_at).toLocaleDateString()}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
              {user?.school_id !== school.id && (
                <button
                  onClick={() => handleSwitchSchool(school.id)}
                  disabled={switchingSchool === school.id}
                  className="flex-1 btn btn-primary text-xs flex items-center justify-center space-x-1"
                >
                  {switchingSchool === school.id ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <ArrowRightOnRectangleIcon className="h-3 w-3" />
                      <span>Switch</span>
                    </>
                  )}
                </button>
              )}

              <button className="btn btn-secondary text-xs flex items-center space-x-1">
                <EyeIcon className="h-3 w-3" />
                <span>View</span>
              </button>

              {school.is_primary && (
                <button
                  onClick={() => setShowEditSchoolModal(true)}
                  className="btn btn-secondary text-xs flex items-center space-x-1"
                >
                  <PencilIcon className="h-3 w-3" />
                  <span>Edit</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>



      {/* Add School Modal */}
      <AddSchoolModal
        isOpen={showAddSchoolModal}
        onClose={() => setShowAddSchoolModal(false)}
        onSuccess={loadOwnedSchools}
      />

      {/* Edit School Modal */}
      <EditSchoolModal
        isOpen={showEditSchoolModal}
        onClose={() => setShowEditSchoolModal(false)}
        onSuccess={() => {
          setShowEditSchoolModal(false);
          loadOwnedSchools();
          // Update user data to refresh logo and school information
          updateUser();
        }}
      />


    </div>
  );
};

export default SchoolManagement;
