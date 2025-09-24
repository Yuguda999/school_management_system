import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  EyeIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { FeeAssignment, FeeStructure, Class, Term, Student } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { useToast } from '../../hooks/useToast';
import { useCurrentTerm } from '../../hooks/useCurrentTerm';
import { FeeService } from '../../services/feeService';
import DataTable, { Column } from '../ui/DataTable';
import Modal from '../ui/Modal';
import FeeAssignmentForm from './FeeAssignmentForm';
import LoadingSpinner from '../ui/LoadingSpinner';

const FeeAssignmentManager: React.FC = () => {
  const { user } = useAuth();
  const { canManageFees } = usePermissions();
  const { showSuccess, showError } = useToast();
  const { currentTerm } = useCurrentTerm();
  const [assignments, setAssignments] = useState<FeeAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<FeeAssignment | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [filters, setFilters] = useState({
    term_id: currentTerm?.id || '',
    class_id: '',
    status: '',
  });

  // Update term filter when current term changes
  useEffect(() => {
    if (currentTerm?.id && filters.term_id !== currentTerm.id) {
      setFilters(prev => ({ ...prev, term_id: currentTerm.id }));
    }
  }, [currentTerm?.id]);

  // Stats
  const [stats, setStats] = useState({
    totalAssignments: 0,
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
    overdueCount: 0,
  });

  useEffect(() => {
    fetchAssignments();
  }, [filters]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      // TODO: Implement API endpoint for fetching all fee assignments
      // For now, return empty array until endpoint is implemented
      const allAssignments: FeeAssignment[] = [];

      setAssignments(allAssignments);
      calculateStats(allAssignments);
    } catch (error) {
      console.error('Failed to fetch fee assignments:', error);
      showError('Failed to load fee assignments');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (assignments: FeeAssignment[]) => {
    const stats = assignments.reduce(
      (acc, assignment) => {
        acc.totalAssignments += 1;
        acc.totalAmount += assignment.amount;
        
        if (assignment.status === 'paid') {
          acc.paidAmount += assignment.amount;
        } else {
          acc.pendingAmount += assignment.amount_outstanding;
        }
        
        if (assignment.status === 'overdue') {
          acc.overdueCount += 1;
        }
        
        return acc;
      },
      {
        totalAssignments: 0,
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
        overdueCount: 0,
      }
    );
    
    setStats(stats);
  };

  const handleBulkAssign = async (data: any) => {
    try {
      setFormLoading(true);
      const newAssignments = await FeeService.bulkCreateFeeAssignments(data);
      
      showSuccess(`Successfully assigned fees to ${newAssignments.length} students`);
      setShowAssignModal(false);
      fetchAssignments();
    } catch (error: any) {
      console.error('Failed to assign fees:', error);
      showError(error.response?.data?.detail || 'Failed to assign fees');
    } finally {
      setFormLoading(false);
    }
  };

  const handleViewAssignment = (assignment: FeeAssignment) => {
    setSelectedAssignment(assignment);
    setShowViewModal(true);
  };

  const columns: Column<FeeAssignment>[] = [
    {
      key: 'student_name',
      label: 'Student',
      render: (assignment) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">
            {assignment.student_name || `${assignment.student?.user.first_name} ${assignment.student?.user.last_name}`}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {assignment.student?.admission_number}
          </div>
        </div>
      ),
    },
    {
      key: 'fee_structure_name',
      label: 'Fee Structure',
      render: (assignment) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">
            {assignment.fee_structure_name || assignment.fee_structure?.name}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {FeeService.getFeeTypeIcon(assignment.fee_structure?.fee_type || '')} {assignment.fee_structure?.fee_type}
          </div>
        </div>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (assignment) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">
            {FeeService.formatCurrency(assignment.amount)}
          </div>
          {assignment.discount_amount > 0 && (
            <div className="text-sm text-green-600 dark:text-green-400">
              -{FeeService.formatCurrency(assignment.discount_amount)} discount
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'outstanding',
      label: 'Outstanding',
      render: (assignment) => (
        <div className="font-medium text-gray-900 dark:text-white">
          {FeeService.formatCurrency(assignment.amount_outstanding)}
        </div>
      ),
    },
    {
      key: 'due_date',
      label: 'Due Date',
      render: (assignment) => (
        <div className="text-sm text-gray-900 dark:text-white">
          {FeeService.formatDate(assignment.due_date)}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (assignment) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${FeeService.getPaymentStatusColor(assignment.status)}`}>
          {assignment.status}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (assignment) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleViewAssignment(assignment)}
            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
            title="View Details"
          >
            <EyeIcon className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const statsCards = [
    {
      name: 'Total Assignments',
      value: stats.totalAssignments.toString(),
      icon: UserGroupIcon,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
    },
    {
      name: 'Total Amount',
      value: FeeService.formatCurrency(stats.totalAmount),
      icon: CurrencyDollarIcon,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900',
    },
    {
      name: 'Pending Amount',
      value: FeeService.formatCurrency(stats.pendingAmount),
      icon: ExclamationTriangleIcon,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900',
    },
    {
      name: 'Overdue Count',
      value: stats.overdueCount.toString(),
      icon: CalendarIcon,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Fee Assignments
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage fee assignments for students
          </p>
        </div>
        {canManageFees() && (
          <button
            onClick={() => setShowAssignModal(true)}
            className="btn btn-primary"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Assign Fees
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => (
          <div key={stat.name} className="card p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`flex items-center justify-center h-12 w-12 rounded-md ${stat.bgColor} ${stat.color}`}>
                  <stat.icon className="h-6 w-6" aria-hidden="true" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    {stat.name}
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900 dark:text-white">
                      {stat.value}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="label">Term</label>
            <select
              className="input"
              value={filters.term_id}
              onChange={(e) => setFilters({ ...filters, term_id: e.target.value })}
            >
              <option value="">All Terms</option>
              {/* Add term options */}
            </select>
          </div>
          <div>
            <label className="label">Class</label>
            <select
              className="input"
              value={filters.class_id}
              onChange={(e) => setFilters({ ...filters, class_id: e.target.value })}
            >
              <option value="">All Classes</option>
              {/* Add class options */}
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select
              className="input"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ term_id: '', class_id: '', status: '' })}
              className="btn btn-secondary w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Assignments Table */}
      <div className="card">
        <DataTable
          data={assignments}
          columns={columns}
          loading={loading}
          emptyMessage="No fee assignments found"
        />
      </div>

      {/* Assign Fees Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="Assign Fees to Students"
        size="xl"
      >
        <FeeAssignmentForm
          onSubmit={handleBulkAssign}
          onCancel={() => setShowAssignModal(false)}
          loading={formLoading}
        />
      </Modal>

      {/* View Assignment Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedAssignment(null);
        }}
        title="Fee Assignment Details"
        size="lg"
      >
        {selectedAssignment && (
          <div className="space-y-6">
            {/* Assignment details would go here */}
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                Assignment details view will be implemented here
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FeeAssignmentManager;
