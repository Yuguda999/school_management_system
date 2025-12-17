import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  EyeIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { FeeAssignment, Class, Term } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { usePermissions } from '../../hooks/usePermissions';
import { useToast } from '../../hooks/useToast';
import { useCurrentTerm } from '../../hooks/useCurrentTerm';
import { FeeService } from '../../services/feeService';
import { academicService } from '../../services/academicService';
import DataTable, { Column } from '../ui/DataTable';
import Modal from '../ui/Modal';
import FeeAssignmentForm from './FeeAssignmentForm';
import RecordPaymentModal from './RecordPaymentModal';
import Card from '../ui/Card';

const FeeAssignmentManager: React.FC = () => {
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();
  const { canManageFees } = usePermissions();
  const { showSuccess, showError } = useToast();
  const { currentTerm } = useCurrentTerm();
  const [assignments, setAssignments] = useState<FeeAssignment[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<FeeAssignment | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    term_id: currentTerm?.id || '',
    class_id: '',
    status: '',
    fee_type: '',
    search: '',
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
    fetchInitialData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAssignments();
    }, 500);
    return () => clearTimeout(timer);
  }, [filters]);

  const fetchInitialData = async () => {
    try {
      const [termsData, classesData] = await Promise.all([
        academicService.getTerms(),
        academicService.getClasses({ is_active: true })
      ]);
      setTerms(termsData);
      setClasses(classesData);
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
      showError('Failed to load filter options');
    }
  };

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const allAssignments = await FeeService.getFeeAssignments({
        term_id: filters.term_id || undefined,
        class_id: filters.class_id || undefined,
        status: filters.status || undefined,
        fee_type: filters.fee_type || undefined,
        search: filters.search || undefined,
        page: 1,
        size: 100
      });

      setAssignments(allAssignments);
      console.log('Assignments data:', allAssignments); // Debug log
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
        acc.totalAmount += Number(assignment.amount || 0);

        if (assignment.status === 'paid') {
          acc.paidAmount += Number(assignment.amount || 0);
        } else {
          acc.pendingAmount += Number(assignment.amount_outstanding || 0);
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

      // Extract validation error message
      let errorMessage = 'Failed to assign fees';
      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          // Pydantic validation errors are arrays
          errorMessage = error.response.data.detail
            .map((err: any) => `${err.loc?.join('.') || 'Field'}: ${err.msg}`)
            .join(', ');
        } else if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail;
        }
      }

      showError(errorMessage);
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
      header: 'Student',
      sortable: true,
      render: (assignment) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">
            {assignment.student_name || (assignment.student ? `${assignment.student.first_name} ${assignment.student.last_name}` : 'Unknown Student')}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {assignment.student?.admission_number || 'N/A'}
          </div>
        </div>
      ),
    },
    {
      key: 'fee_structure_name',
      header: 'Fee Structure',
      sortable: true,
      render: (assignment) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">
            {assignment.fee_structure_name || assignment.fee_structure?.name}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
            <span className="mr-1 text-lg">{FeeService.getFeeTypeIcon(assignment.fee_structure?.fee_type || '')}</span>
            <span className="capitalize">{assignment.fee_structure?.fee_type.replace('_', ' ')}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      render: (assignment) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">
            {formatCurrency(assignment.amount)}
          </div>
          {assignment.discount_amount > 0 && (
            <div className="text-xs text-green-600 dark:text-green-400">
              -{formatCurrency(assignment.discount_amount)} discount
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'outstanding',
      header: 'Outstanding',
      sortable: true,
      render: (assignment) => (
        <div className={`font-medium ${assignment.amount_outstanding > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
          {formatCurrency(assignment.amount_outstanding)}
        </div>
      ),
    },
    {
      key: 'due_date',
      header: 'Due Date',
      sortable: true,
      render: (assignment) => (
        <div className="flex items-center text-sm text-gray-900 dark:text-white">
          <CalendarIcon className="h-4 w-4 text-gray-400 mr-1" />
          {FeeService.formatDate(assignment.due_date)}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (assignment) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${FeeService.getPaymentStatusColor(assignment.status)}`}>
          {assignment.status === 'paid' && <CheckCircleIcon className="w-3 h-3 mr-1" />}
          {assignment.status === 'overdue' && <ExclamationTriangleIcon className="w-3 h-3 mr-1" />}
          {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
        </span>
      ),
    },
  ];

  const statsCards = [
    {
      name: 'Total Assignments',
      value: stats.totalAssignments.toString(),
      icon: UserGroupIcon,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      borderColor: 'border-l-blue-500'
    },
    {
      name: 'Total Amount',
      value: formatCurrency(stats.totalAmount),
      icon: CurrencyDollarIcon,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      borderColor: 'border-l-green-500'
    },
    {
      name: 'Pending Amount',
      value: formatCurrency(stats.pendingAmount),
      icon: ExclamationTriangleIcon,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      borderColor: 'border-l-yellow-500'
    },
    {
      name: 'Overdue Count',
      value: stats.overdueCount.toString(),
      icon: CalendarIcon,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      borderColor: 'border-l-red-500'
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex-1">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'} w-full sm:w-auto`}
          >
            <FunnelIcon className="w-4 h-4 mr-2" />
            Filters
          </button>
        </div>

        {canManageFees() && (
          <button
            onClick={() => setShowAssignModal(true)}
            className="btn btn-primary w-full sm:w-auto"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Assign Fees
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => (
          <Card key={stat.name} variant="glass" className={`border-l-4 ${stat.borderColor}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  {stat.name}
                </p>
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
              <div className={`flex items-center justify-center h-12 w-12 rounded-xl ${stat.bgColor} ${stat.color}`}>
                <stat.icon className="h-6 w-6" aria-hidden="true" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      {showFilters && (
        <Card variant="glass" className="animate-fade-in-up">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="label">Search</label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="input pl-10"
                  placeholder="Student name or admission no..."
                />
              </div>
            </div>
            <div>
              <label className="label">Term</label>
              <select
                className="input"
                value={filters.term_id}
                onChange={(e) => setFilters({ ...filters, term_id: e.target.value })}
              >
                <option value="">All Terms</option>
                {terms.map((term) => (
                  <option key={term.id} value={term.id}>
                    {term.name} ({new Date(term.start_date).getFullYear()})
                  </option>
                ))}
              </select>
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
                <option value="registration">Registration</option>
                <option value="examination">Examination</option>
                <option value="library">Library</option>
                <option value="laboratory">Laboratory</option>
                <option value="sports">Sports</option>
                <option value="transport">Transport</option>
                <option value="uniform">Uniform</option>
                <option value="books">Books</option>
                <option value="feeding">Feeding</option>
                <option value="development">Development</option>
                <option value="other">Other</option>
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
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
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
            <div className="md:col-span-4 flex justify-end">
              <button
                onClick={() => setFilters({ term_id: '', class_id: '', status: '', fee_type: '', search: '' })}
                className="btn btn-secondary"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Assignments Table */}
      <DataTable
        data={assignments}
        columns={columns}
        loading={loading}
        searchable={true}
        searchPlaceholder="Search fee assignments..."
        emptyMessage="No fee assignments found"
        actions={(assignment) => (
          <>
            <button
              onClick={() => handleViewAssignment(assignment)}
              className="p-1 rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              title="View Details"
            >
              <EyeIcon className="w-5 h-5" />
            </button>
            {assignment.status !== 'paid' && (
              <button
                onClick={() => {
                  setSelectedAssignment(assignment);
                  setShowPaymentModal(true);
                }}
                className="p-1 rounded-full text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors ml-2"
                title="Record Payment"
              >
                <CurrencyDollarIcon className="w-5 h-5" />
              </button>
            )}
          </>
        )}
      />

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
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {selectedAssignment.student_name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Admission No: {selectedAssignment.student?.admission_number}
                  </p>
                </div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${FeeService.getPaymentStatusColor(selectedAssignment.status)}`}>
                  {selectedAssignment.status.charAt(0).toUpperCase() + selectedAssignment.status.slice(1)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                  Fee Details
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Structure</span>
                    <span className="font-medium text-gray-900 dark:text-white">{selectedAssignment.fee_structure_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Total Amount</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(selectedAssignment.amount)}</span>
                  </div>
                  {selectedAssignment.discount_amount > 0 && (
                    <div className="flex justify-between text-green-600 dark:text-green-400">
                      <span>Discount</span>
                      <span>-{formatCurrency(selectedAssignment.discount_amount)}</span>
                    </div>
                  )}
                  <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between">
                    <span className="font-bold text-gray-900 dark:text-white">Outstanding</span>
                    <span className={`font-bold ${selectedAssignment.amount_outstanding > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                      {formatCurrency(selectedAssignment.amount_outstanding)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                  Payment Info
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Due Date</span>
                    <span className="font-medium text-gray-900 dark:text-white">{FeeService.formatDate(selectedAssignment.due_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Amount Paid</span>
                    <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(selectedAssignment.amount_paid)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </Modal>

      {/* Record Payment Modal */}
      {selectedAssignment && (
        <RecordPaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedAssignment(null);
          }}
          assignment={selectedAssignment}
          onSuccess={() => {
            fetchAssignments();
            setShowPaymentModal(false);
            setSelectedAssignment(null);
          }}
        />
      )}
    </div>
  );
};

export default FeeAssignmentManager;
