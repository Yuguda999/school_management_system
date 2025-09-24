import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  AcademicCapIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { FeeStructure, CreateFeeStructureForm } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { useToast } from '../../hooks/useToast';
import { FeeService } from '../../services/feeService';
import DataTable, { Column } from '../ui/DataTable';
import Modal from '../ui/Modal';
import ConfirmationModal from '../ui/ConfirmationModal';
import FeeStructureForm from './FeeStructureForm';
import LoadingSpinner from '../ui/LoadingSpinner';

const FeeStructureManager: React.FC = () => {
  const { user } = useAuth();
  const { canManageFees } = usePermissions();
  const { showSuccess, showError } = useToast();
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedFeeStructure, setSelectedFeeStructure] = useState<FeeStructure | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [filters, setFilters] = useState({
    academic_session: '',
    fee_type: '',
    is_active: undefined as boolean | undefined,
  });

  useEffect(() => {
    fetchFeeStructures();
  }, [filters]);

  const fetchFeeStructures = async () => {
    try {
      setLoading(true);
      const feeStructures = await FeeService.getFeeStructures({
        academic_session: filters.academic_session || undefined,
        fee_type: filters.fee_type || undefined,
        is_active: filters.is_active,
        page: 1,
        size: 100,
      });
      setFeeStructures(feeStructures);
    } catch (error) {
      console.error('Failed to fetch fee structures:', error);
      showError('Failed to load fee structures');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFeeStructure = async (data: CreateFeeStructureForm) => {
    try {
      setFormLoading(true);
      const newFeeStructure = await FeeService.createFeeStructure(data);
      showSuccess('Fee structure created successfully');
      setShowCreateModal(false);
      fetchFeeStructures();
    } catch (error: any) {
      console.error('Failed to create fee structure:', error);
      const errorMessage = typeof error.response?.data?.detail === 'string'
        ? error.response.data.detail
        : error.message || 'Failed to create fee structure';
      showError(errorMessage);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditFeeStructure = async (data: CreateFeeStructureForm) => {
    if (!selectedFeeStructure) return;

    try {
      setFormLoading(true);
      await FeeService.updateFeeStructure(selectedFeeStructure.id, data);
      showSuccess('Fee structure updated successfully');
      setShowEditModal(false);
      setSelectedFeeStructure(null);
      fetchFeeStructures();
    } catch (error: any) {
      console.error('Failed to update fee structure:', error);
      const errorMessage = typeof error.response?.data?.detail === 'string'
        ? error.response.data.detail
        : error.message || 'Failed to update fee structure';
      showError(errorMessage);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteFeeStructure = async () => {
    if (!selectedFeeStructure) return;

    try {
      await FeeService.deleteFeeStructure(selectedFeeStructure.id);
      showSuccess('Fee structure deleted successfully');
      setShowDeleteModal(false);
      setSelectedFeeStructure(null);
      fetchFeeStructures();
    } catch (error: any) {
      console.error('Failed to delete fee structure:', error);
      showError(error.response?.data?.detail || 'Failed to delete fee structure');
    }
  };

  const handleViewFeeStructure = (feeStructure: FeeStructure) => {
    setSelectedFeeStructure(feeStructure);
    setShowViewModal(true);
  };

  const handleEditClick = (feeStructure: FeeStructure) => {
    setSelectedFeeStructure(feeStructure);
    setShowEditModal(true);
  };

  const handleDeleteClick = (feeStructure: FeeStructure) => {
    setSelectedFeeStructure(feeStructure);
    setShowDeleteModal(true);
  };

  const getApplicableClassesText = (feeStructure: FeeStructure): string => {
    if (feeStructure.applicable_to === 'all') {
      return 'All Classes';
    } else if (feeStructure.class_ids && feeStructure.class_ids.length > 0) {
      return `${feeStructure.class_ids.length} Classes`;
    }
    return 'No Classes';
  };

  const columns: Column<FeeStructure>[] = [
    {
      key: 'name',
      label: 'Fee Structure',
      render: (fee) => (
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0">
            <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <span className="text-lg">{FeeService.getFeeTypeIcon(fee.fee_type)}</span>
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {fee.name}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {fee.fee_type.charAt(0).toUpperCase() + fee.fee_type.slice(1)} • {fee.academic_session}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (fee) => (
        <div>
          <div className="text-lg font-semibold text-green-600 dark:text-green-400">
            {FeeService.formatCurrency(fee.amount)}
          </div>
          {fee.late_fee_amount && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              +{FeeService.formatCurrency(fee.late_fee_amount)} late fee
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'applicable_to',
      label: 'Applicable To',
      render: (fee) => (
        <div className="flex items-center">
          <UserGroupIcon className="h-4 w-4 text-gray-400 mr-2" />
          <span className="text-sm text-gray-900 dark:text-gray-100">
            {getApplicableClassesText(fee)}
          </span>
        </div>
      ),
    },
    {
      key: 'due_date',
      label: 'Due Date',
      render: (fee) => (
        <div className="flex items-center">
          <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
          <span className="text-sm text-gray-900 dark:text-gray-100">
            {fee.due_date ? FeeService.formatDate(fee.due_date) : 'No due date'}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (fee) => (
        <div className="flex flex-col space-y-1">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            fee.is_active
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
          }`}>
            {fee.is_active ? 'Active' : 'Inactive'}
          </span>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            fee.is_mandatory
              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
          }`}>
            {fee.is_mandatory ? 'Mandatory' : 'Optional'}
          </span>
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (fee) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleViewFeeStructure(fee)}
            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
            title="View Details"
          >
            <EyeIcon className="h-4 w-4" />
          </button>
          {canManageFees() && (
            <>
              <button
                onClick={() => handleEditClick(fee)}
                className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                title="Edit"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDeleteClick(fee)}
                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                title="Delete"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Fee Structures
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage fee structures for your school
          </p>
        </div>
        {canManageFees() && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Fee Structure
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="label">Academic Session</label>
            <input
              type="text"
              className="input"
              placeholder="e.g., 2024-2025"
              value={filters.academic_session}
              onChange={(e) => setFilters({ ...filters, academic_session: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Fee Type</label>
            <select
              className="input"
              value={filters.fee_type}
              onChange={(e) => setFilters({ ...filters, fee_type: e.target.value })}
            >
              <option value="">All Types</option>
              <option value="tuition">Tuition</option>
              <option value="transport">Transport</option>
              <option value="library">Library</option>
              <option value="lab">Laboratory</option>
              <option value="examination">Examination</option>
              <option value="sports">Sports</option>
              <option value="uniform">Uniform</option>
              <option value="books">Books</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select
              className="input"
              value={filters.is_active === undefined ? '' : filters.is_active.toString()}
              onChange={(e) => setFilters({
                ...filters,
                is_active: e.target.value === '' ? undefined : e.target.value === 'true'
              })}
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ academic_session: '', fee_type: '', is_active: undefined })}
              className="btn btn-secondary w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Fee Structures Table */}
      <div className="card">
        <DataTable
          data={feeStructures}
          columns={columns}
          loading={loading}
          emptyMessage="No fee structures found"
        />
      </div>

      {/* Create Fee Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Fee Structure"
        size="xl"
      >
        <FeeStructureForm
          onSubmit={handleCreateFeeStructure}
          onCancel={() => setShowCreateModal(false)}
          loading={formLoading}
        />
      </Modal>

      {/* Edit Fee Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedFeeStructure(null);
        }}
        title="Edit Fee Structure"
        size="xl"
      >
        {selectedFeeStructure && (
          <FeeStructureForm
            onSubmit={handleEditFeeStructure}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedFeeStructure(null);
            }}
            initialData={{
              name: selectedFeeStructure.name,
              description: selectedFeeStructure.description,
              fee_type: selectedFeeStructure.fee_type,
              amount: selectedFeeStructure.amount,
              academic_session: selectedFeeStructure.academic_session,
              applicable_to: selectedFeeStructure.applicable_to,
              class_ids: selectedFeeStructure.class_ids,
              due_date: selectedFeeStructure.due_date,
              late_fee_amount: selectedFeeStructure.late_fee_amount,
              late_fee_days: selectedFeeStructure.late_fee_days,
              allow_installments: selectedFeeStructure.allow_installments,
              installment_count: selectedFeeStructure.installment_count,
              is_mandatory: selectedFeeStructure.is_mandatory,
            }}
            loading={formLoading}
          />
        )}
      </Modal>

      {/* View Fee Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedFeeStructure(null);
        }}
        title="Fee Structure Details"
        size="lg"
      >
        {selectedFeeStructure && (
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <CurrencyDollarIcon className="h-5 w-5 mr-2" />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Fee Structure Name
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                    {selectedFeeStructure.name}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Fee Type
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-gray-100 capitalize">
                    {selectedFeeStructure.fee_type.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Academic Session
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                    {selectedFeeStructure.academic_session}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Status
                  </label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    selectedFeeStructure.is_active
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {selectedFeeStructure.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              {selectedFeeStructure.description && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                    {selectedFeeStructure.description}
                  </p>
                </div>
              )}
            </div>

            {/* Payment Configuration */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <CalendarIcon className="h-5 w-5 mr-2" />
                Payment Configuration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Amount
                  </label>
                  <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
                    ₦{selectedFeeStructure.amount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Payment Type
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-gray-100 capitalize">
                    {selectedFeeStructure.allow_installments ? 'Installment' : 'One-time Payment'}
                  </p>
                </div>
                {selectedFeeStructure.allow_installments && selectedFeeStructure.installment_count && selectedFeeStructure.installment_count > 1 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Installments
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {selectedFeeStructure.installment_count} payments
                    </p>
                  </div>
                )}
              </div>

              {selectedFeeStructure.due_date && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Due Date
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                    {new Date(selectedFeeStructure.due_date).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            {/* Applicable Classes */}
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <AcademicCapIcon className="h-5 w-5 mr-2" />
                Applicable Classes
              </h3>
              {selectedFeeStructure.applicable_classes && selectedFeeStructure.applicable_classes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {selectedFeeStructure.applicable_classes.map((classItem, index) => (
                    <div
                      key={index}
                      className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex items-center">
                        <UserGroupIcon className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {classItem.name}
                        </span>
                      </div>
                      {classItem.section && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Section: {classItem.section}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <UserGroupIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    This fee structure applies to all classes
                  </p>
                </div>
              )}
            </div>

            {/* Additional Information */}
            {selectedFeeStructure.additional_data && Object.keys(selectedFeeStructure.additional_data).length > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                  Additional Information
                </h3>
                <div className="space-y-2">
                  {Object.entries(selectedFeeStructure.additional_data).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                        {key.replace('_', ' ')}:
                      </span>
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                Record Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300">
                    Created At
                  </label>
                  <p className="text-gray-900 dark:text-gray-100">
                    {new Date(selectedFeeStructure.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300">
                    Last Updated
                  </label>
                  <p className="text-gray-900 dark:text-gray-100">
                    {new Date(selectedFeeStructure.updated_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedFeeStructure(null);
        }}
        onConfirm={handleDeleteFeeStructure}
        title="Delete Fee Structure"
        message={selectedFeeStructure ? `Are you sure you want to delete "${selectedFeeStructure.name}"?\n\nThis action cannot be undone and will affect all related fee assignments.` : ''}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default FeeStructureManager;
