import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  XMarkIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { Student, Parent, User } from '../../types';
import Modal from '../ui/Modal';
import ConfirmationModal from '../ui/ConfirmationModal';

interface ParentStudentManagerProps {
  student: Student;
  onUpdate: () => void;
}

const ParentStudentManager: React.FC<ParentStudentManagerProps> = ({
  student,
  onUpdate
}) => {
  const [parents, setParents] = useState<Parent[]>([]);
  const [availableParents, setAvailableParents] = useState<User[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [parentToRemove, setParentToRemove] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStudentParents();
  }, [student.id]);

  const fetchStudentParents = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      const mockParents: Parent[] = [
        {
          id: '1',
          user_id: 'parent1',
          phone: '+1234567890',
          address: '123 Main St, City, State',
          occupation: 'Engineer',
          user: {
            id: 'parent1',
            email: 'john.parent@example.com',
            first_name: 'John',
            last_name: 'Parent',
            full_name: 'John Parent',
            role: 'parent',
            is_active: true,
            is_verified: true,
            school_id: student.user.school_id,
            phone: '+1234567890',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
          children: [student],
        },
      ];
      setParents(mockParents);
    } catch (error) {
      console.error('Failed to fetch student parents:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableParents = async () => {
    try {
      // Mock data - replace with actual API call
      const mockAvailableParents: User[] = [
        {
          id: 'parent2',
          email: 'jane.parent@example.com',
          first_name: 'Jane',
          last_name: 'Parent',
          full_name: 'Jane Parent',
          role: 'parent',
          is_active: true,
          is_verified: true,
          school_id: student.user.school_id,
          phone: '+1234567891',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'parent3',
          email: 'bob.guardian@example.com',
          first_name: 'Bob',
          last_name: 'Guardian',
          full_name: 'Bob Guardian',
          role: 'parent',
          is_active: true,
          is_verified: true,
          school_id: student.user.school_id,
          phone: '+1234567892',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];
      setAvailableParents(mockAvailableParents);
    } catch (error) {
      console.error('Failed to fetch available parents:', error);
    }
  };

  const handleAddParent = async (parentId: string) => {
    try {
      // Mock API call - replace with actual implementation
      console.log('Adding parent to student:', { studentId: student.id, parentId });
      setShowAddModal(false);
      fetchStudentParents();
      onUpdate();
    } catch (error) {
      console.error('Failed to add parent:', error);
    }
  };

  const handleRemoveParent = (parentId: string) => {
    setParentToRemove(parentId);
    setShowRemoveModal(true);
  };

  const confirmRemoveParent = async () => {
    if (!parentToRemove) return;

    try {
      // Mock API call - replace with actual implementation
      console.log('Removing parent from student:', { studentId: student.id, parentId: parentToRemove });
      fetchStudentParents();
      onUpdate();
    } catch (error) {
      console.error('Failed to remove parent:', error);
    } finally {
      setShowRemoveModal(false);
      setParentToRemove(null);
    }
  };

  const filteredParents = availableParents.filter(parent =>
    parent.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    parent.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Parent/Guardian Relationships
        </h3>
        <button
          onClick={() => {
            fetchAvailableParents();
            setShowAddModal(true);
          }}
          className="btn btn-primary btn-sm"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Parent
        </button>
      </div>

      {/* Current Parents */}
      <div className="space-y-4">
        {parents.length > 0 ? (
          parents.map((parent) => (
            <div
              key={parent.id}
              className="card p-4 flex items-center justify-between"
            >
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                  <UserIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {parent.user.full_name}
                  </h4>
                  <div className="flex items-center space-x-4 mt-1">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <EnvelopeIcon className="h-4 w-4 mr-1" />
                      {parent.user.email}
                    </div>
                    {parent.phone && (
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <PhoneIcon className="h-4 w-4 mr-1" />
                        {parent.phone}
                      </div>
                    )}
                  </div>
                  {parent.occupation && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Occupation: {parent.occupation}
                    </p>
                  )}
                  {parent.address && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Address: {parent.address}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleRemoveParent(parent.id)}
                className="btn btn-ghost btn-sm text-red-600 hover:text-red-700"
                title="Remove relationship"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          ))
        ) : (
          <div className="card p-8 text-center">
            <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              No parents assigned
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              This student doesn't have any parent/guardian relationships set up yet.
            </p>
            <button
              onClick={() => {
                fetchAvailableParents();
                setShowAddModal(true);
              }}
              className="btn btn-primary btn-sm"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Parent
            </button>
          </div>
        )}
      </div>

      {/* Add Parent Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Parent/Guardian"
        size="lg"
      >
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="input pl-10"
              placeholder="Search parents by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Available Parents List */}
          <div className="max-h-96 overflow-y-auto space-y-2">
            {filteredParents.length > 0 ? (
              filteredParents.map((parent) => (
                <div
                  key={parent.id}
                  className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {parent.full_name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {parent.email}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddParent(parent.id)}
                    className="btn btn-primary btn-sm"
                  >
                    Add
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {searchTerm ? 'No parents found matching your search.' : 'No available parents found.'}
                </p>
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowAddModal(false)}
              className="btn btn-outline"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Remove Parent Confirmation Modal */}
      <ConfirmationModal
        isOpen={showRemoveModal}
        onClose={() => {
          setShowRemoveModal(false);
          setParentToRemove(null);
        }}
        onConfirm={confirmRemoveParent}
        title="Remove Parent"
        message="Are you sure you want to remove this parent relationship?\n\nThis action cannot be undone."
        confirmText="Remove Parent"
        type="danger"
      />
    </div>
  );
};

export default ParentStudentManager;
