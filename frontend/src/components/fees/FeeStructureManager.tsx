import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';
import { FeeStructure, Class } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import DataTable, { Column } from '../ui/DataTable';
import Modal from '../ui/Modal';
import ConfirmationModal from '../ui/ConfirmationModal';
import { useForm } from 'react-hook-form';

interface FeeFormData {
  name: string;
  amount: number;
  due_date: string;
  fee_type: 'tuition' | 'transport' | 'library' | 'lab' | 'other';
  class_id?: string;
  academic_year: string;
  is_mandatory: boolean;
}

const FeeStructureManager: React.FC = () => {
  const { user } = useAuth();
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFee, setEditingFee] = useState<FeeStructure | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [feeToDelete, setFeeToDelete] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm<FeeFormData>();

  useEffect(() => {
    fetchFeeStructures();
    fetchClasses();
  }, []);

  const fetchFeeStructures = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      const mockFeeStructures: FeeStructure[] = [
        {
          id: '1',
          name: 'Tuition Fee - Grade 10',
          amount: 1500,
          due_date: '2024-03-01',
          fee_type: 'tuition',
          class_id: 'class1',
          school_id: user?.school_id || 'school1',
          academic_year: '2024',
          is_mandatory: true,
        },
        {
          id: '2',
          name: 'Transport Fee',
          amount: 200,
          due_date: '2024-03-01',
          fee_type: 'transport',
          school_id: user?.school_id || 'school1',
          academic_year: '2024',
          is_mandatory: false,
        },
        {
          id: '3',
          name: 'Library Fee',
          amount: 50,
          due_date: '2024-03-15',
          fee_type: 'library',
          school_id: user?.school_id || 'school1',
          academic_year: '2024',
          is_mandatory: true,
        },
      ];
      setFeeStructures(mockFeeStructures);
    } catch (error) {
      console.error('Failed to fetch fee structures:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      // Mock data - replace with actual API call
      const mockClasses: Class[] = [
        {
          id: 'class1',
          name: 'Grade 10-A',
          grade_level: 10,
          section: 'A',
          school_id: user?.school_id || 'school1',
          academic_year: '2024',
          max_students: 30,
          students: [],
          subjects: [],
        },
        {
          id: 'class2',
          name: 'Grade 9-B',
          grade_level: 9,
          section: 'B',
          school_id: user?.school_id || 'school1',
          academic_year: '2024',
          max_students: 25,
          students: [],
          subjects: [],
        },
      ];
      setClasses(mockClasses);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    }
  };

  const handleCreateFee = () => {
    setEditingFee(null);
    reset({
      name: '',
      amount: 0,
      due_date: '',
      fee_type: 'tuition',
      class_id: '',
      academic_year: new Date().getFullYear().toString(),
      is_mandatory: true,
    });
    setShowModal(true);
  };

  const handleEditFee = (fee: FeeStructure) => {
    setEditingFee(fee);
    setValue('name', fee.name);
    setValue('amount', fee.amount);
    setValue('due_date', fee.due_date);
    setValue('fee_type', fee.fee_type);
    setValue('class_id', fee.class_id || '');
    setValue('academic_year', fee.academic_year);
    setValue('is_mandatory', fee.is_mandatory);
    setShowModal(true);
  };

  const handleDeleteFee = (feeId: string) => {
    setFeeToDelete(feeId);
    setShowDeleteModal(true);
  };

  const confirmDeleteFee = async () => {
    if (!feeToDelete) return;

    try {
      // Mock API call - replace with actual implementation
      console.log('Deleting fee structure:', feeToDelete);
      fetchFeeStructures();
    } catch (error) {
      console.error('Failed to delete fee structure:', error);
    } finally {
      setShowDeleteModal(false);
      setFeeToDelete(null);
    }
  };

  const onSubmit = async (data: FeeFormData) => {
    try {
      setFormLoading(true);
      if (editingFee) {
        // Mock API call for updating fee structure
        console.log('Updating fee structure:', { ...data, id: editingFee.id });
      } else {
        // Mock API call for creating fee structure
        console.log('Creating fee structure:', data);
      }
      setShowModal(false);
      fetchFeeStructures();
    } catch (error) {
      console.error('Failed to save fee structure:', error);
    } finally {
      setFormLoading(false);
    }
  };

  const columns: Column<FeeStructure>[] = [
    {
      key: 'name',
      header: 'Fee Name',
      sortable: true,
      render: (fee) => (
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0">
            <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <CurrencyDollarIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {fee.name}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {fee.fee_type.charAt(0).toUpperCase() + fee.fee_type.slice(1)}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      render: (fee) => (
        <span className="text-lg font-semibold text-green-600 dark:text-green-400">
          ${fee.amount.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'due_date',
      header: 'Due Date',
      sortable: true,
      render: (fee) => (
        <div className="flex items-center">
          <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
          <span className="text-sm text-gray-900 dark:text-gray-100">
            {new Date(fee.due_date).toLocaleDateString()}
          </span>
        </div>
      ),
    },
    {
      key: 'class_id',
      header: 'Applicable To',
      render: (fee) => (
        <div className="flex items-center">
          <AcademicCapIcon className="h-4 w-4 text-gray-400 mr-2" />
          <span className="text-sm text-gray-900 dark:text-gray-100">
            {fee.class_id 
              ? classes.find(c => c.id === fee.class_id)?.name || 'Unknown Class'
              : 'All Classes'
            }
          </span>
        </div>
      ),
    },
    {
      key: 'is_mandatory',
      header: 'Type',
      render: (fee) => (
        <span className={`badge ${
          fee.is_mandatory ? 'badge-error' : 'badge-secondary'
        }`}>
          {fee.is_mandatory ? 'Mandatory' : 'Optional'}
        </span>
      ),
    },
    {
      key: 'academic_year',
      header: 'Academic Year',
      sortable: true,
      render: (fee) => (
        <span className="badge badge-primary">{fee.academic_year}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Fee Structures
        </h3>
        {(user?.role === 'super_admin' || user?.role === 'admin') && (
          <button
            onClick={handleCreateFee}
            className="btn btn-primary"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Fee Structure
          </button>
        )}
      </div>

      <DataTable
        data={feeStructures}
        columns={columns}
        loading={loading}
        searchable={true}
        searchPlaceholder="Search fee structures..."
        emptyMessage="No fee structures found"
        actions={(fee) => (
          <>
            {(user?.role === 'super_admin' || user?.role === 'admin') && (
              <>
                <button
                  onClick={() => handleEditFee(fee)}
                  className="btn btn-ghost btn-sm"
                  title="Edit Fee Structure"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteFee(fee.id)}
                  className="btn btn-ghost btn-sm text-red-600 hover:text-red-700"
                  title="Delete Fee Structure"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </>
            )}
          </>
        )}
      />

      {/* Create/Edit Fee Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingFee ? 'Edit Fee Structure' : 'Create Fee Structure'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Fee Name *</label>
            <input
              type="text"
              className={`input ${errors.name ? 'input-error' : ''}`}
              {...register('name', { required: 'Fee name is required' })}
            />
            {errors.name && (
              <p className="error-text">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Amount ($) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className={`input ${errors.amount ? 'input-error' : ''}`}
                {...register('amount', { 
                  required: 'Amount is required',
                  valueAsNumber: true,
                  min: { value: 0, message: 'Amount must be positive' }
                })}
              />
              {errors.amount && (
                <p className="error-text">{errors.amount.message}</p>
              )}
            </div>

            <div>
              <label className="label">Due Date *</label>
              <input
                type="date"
                className={`input ${errors.due_date ? 'input-error' : ''}`}
                {...register('due_date', { required: 'Due date is required' })}
              />
              {errors.due_date && (
                <p className="error-text">{errors.due_date.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Fee Type *</label>
              <select
                className={`input ${errors.fee_type ? 'input-error' : ''}`}
                {...register('fee_type', { required: 'Fee type is required' })}
              >
                <option value="tuition">Tuition</option>
                <option value="transport">Transport</option>
                <option value="library">Library</option>
                <option value="lab">Laboratory</option>
                <option value="other">Other</option>
              </select>
              {errors.fee_type && (
                <p className="error-text">{errors.fee_type.message}</p>
              )}
            </div>

            <div>
              <label className="label">Applicable To</label>
              <select
                className="input"
                {...register('class_id')}
              >
                <option value="">All Classes</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Academic Year *</label>
            <select
              className={`input ${errors.academic_year ? 'input-error' : ''}`}
              {...register('academic_year', { required: 'Academic year is required' })}
            >
              {[2023, 2024, 2025].map((year) => (
                <option key={year} value={year.toString()}>
                  {year}
                </option>
              ))}
            </select>
            {errors.academic_year && (
              <p className="error-text">{errors.academic_year.message}</p>
            )}
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              {...register('is_mandatory')}
            />
            <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Mandatory Fee
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="btn btn-outline"
              disabled={formLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={formLoading}
            >
              {formLoading ? 'Saving...' : editingFee ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Fee Structure Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setFeeToDelete(null);
        }}
        onConfirm={confirmDeleteFee}
        title="Delete Fee Structure"
        message="Are you sure you want to delete this fee structure?\n\nThis action cannot be undone."
        confirmText="Delete Fee Structure"
        type="danger"
      />
    </div>
  );
};

export default FeeStructureManager;
