import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  UserIcon,
  BuildingOfficeIcon,
  TrashIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { useToast } from '../../hooks/useToast';
import { usePermissions } from '../../hooks/usePermissions';
import platformAdminService, { SchoolOwner } from '../../services/platformAdminService';

interface SchoolOwnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  owner?: SchoolOwner;
}

const SchoolOwnerModal: React.FC<SchoolOwnerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  owner
}) => {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    if (owner) {
      setFormData({
        first_name: owner.first_name,
        last_name: owner.last_name,
        email: owner.email,
        phone: owner.phone || ''
      });
    } else {
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: ''
      });
    }
  }, [owner]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (owner) {
        await platformAdminService.updateSchoolOwner(owner.id, formData);
        showSuccess('School owner updated successfully');
      } else {
        const newOwner = await platformAdminService.createSchoolOwner(formData);
        showSuccess(
          `School owner created successfully. Temporary password: ${newOwner.temp_password}`
        );
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to save school owner');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          {owner ? 'Edit School Owner' : 'Create School Owner'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              First Name
            </label>
            <input
              type="text"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              className="input"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Last Name
            </label>
            <input
              type="text"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              className="input"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input"
              required
              disabled={!!owner} // Can't change email for existing owners
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Phone (Optional)
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="input"
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : owner ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SchoolOwnersPage: React.FC = () => {
  const { canManagePlatform } = usePermissions();
  const { showSuccess, showError } = useToast();
  const [owners, setOwners] = useState<SchoolOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingOwner, setEditingOwner] = useState<SchoolOwner | undefined>();

  useEffect(() => {
    loadOwners();
  }, []);

  const loadOwners = async () => {
    try {
      setLoading(true);
      const data = await platformAdminService.getSchoolOwners();
      setOwners(data);
    } catch (error) {
      console.error('Failed to load school owners:', error);
      showError('Failed to load school owners');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (ownerId: string) => {
    if (!confirm('Are you sure you want to delete this school owner?')) {
      return;
    }

    try {
      await platformAdminService.deleteSchoolOwner(ownerId);
      showSuccess('School owner deleted successfully');
      loadOwners();
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to delete school owner');
    }
  };



  const filteredOwners = owners.filter(owner =>
    owner.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    owner.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    owner.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!canManagePlatform()) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Access Denied</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          You don't have permission to access this page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            School Owners
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Manage school owners and their registration status.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingOwner(undefined);
            setShowModal(true);
          }}
          className="btn btn-primary"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add School Owner
        </button>
      </div>

      {/* Search */}
      <div className="card p-6">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search school owners..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {/* School Owners Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    School
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredOwners.map((owner) => (
                  <tr key={owner.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                          <UserIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {owner.full_name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {owner.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          owner.is_active
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {owner.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          owner.is_verified
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}>
                          {owner.is_verified ? 'Verified' : 'Pending'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {owner.school_id ? (
                        <div className="flex items-center">
                          <BuildingOfficeIcon className="h-4 w-4 text-green-600 mr-2" />
                          <span className="text-sm text-gray-900 dark:text-white">Registered</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-400">No school</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(owner.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setEditingOwner(owner);
                            setShowModal(true);
                          }}
                          className="text-primary-600 hover:text-primary-900"
                          title="Edit"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => handleDelete(owner.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredOwners.length === 0 && (
          <div className="text-center py-12">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No school owners found
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm ? 'Try adjusting your search criteria.' : 'Get started by creating a new school owner.'}
            </p>
            {!searchTerm && (
              <div className="mt-6">
                <button
                  onClick={() => {
                    setEditingOwner(undefined);
                    setShowModal(true);
                  }}
                  className="btn btn-primary"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add School Owner
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      <SchoolOwnerModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={loadOwners}
        owner={editingOwner}
      />
    </div>
  );
};

export default SchoolOwnersPage;
