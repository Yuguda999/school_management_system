import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';

import { FeePayment, Class } from '../../types';
import { FeeService } from '../../services/feeService';
import { academicService } from '../../services/academicService';
import { useToast } from '../../hooks/useToast';
import PaymentDetailsModal from './PaymentDetailsModal';

const PaymentTracker: React.FC = () => {
  const { showError } = useToast();
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    class_id: '',
    search: '',
  });
  const [selectedPayment, setSelectedPayment] = useState<FeePayment | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPayments();
    }, 500);
    return () => clearTimeout(timer);
  }, [filters]);

  const fetchClasses = async () => {
    try {
      const allClasses = await academicService.getClasses({ is_active: true });
      setClasses(allClasses);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const allPayments = await FeeService.getPayments({
        status: filters.status || undefined,
        class_id: filters.class_id || undefined,
        search: filters.search || undefined,
        page: 1,
        size: 100
      });
      setPayments(allPayments);
    } catch (error) {
      console.error('Error fetching payments:', error);
      showError('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'overdue':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20';
      case 'overdue':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20';
    }
  };



  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="input pl-10"
                placeholder="Search students or fees..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="input"
            >
              <option value="">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Class
            </label>
            <select
              value={filters.class_id}
              onChange={(e) => setFilters({ ...filters, class_id: e.target.value })}
              className="input"
            >
              <option value="">All Classes</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ status: '', class_id: '', search: '' })}
              className="btn btn-secondary w-full flex items-center justify-center space-x-2"
            >
              <FunnelIcon className="h-4 w-4" />
              <span>Clear</span>
            </button>
          </div>
        </div>
      </div>

      {/* Payment Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/20">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Paid Payments
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {payments.filter(p => p.fee_assignment?.status === 'paid').length}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
              <ClockIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Pending Payments
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {payments.filter(p => p.fee_assignment?.status === 'pending' || p.fee_assignment?.status === 'partial').length}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/20">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Overdue Payments
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {payments.filter(p => p.fee_assignment?.status === 'overdue').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Payment Tracking</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Receipt No
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Student
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Fee Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Method
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No payments found matching your filters
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {payment.receipt_number || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {payment.student_name || (payment.student ? `${payment.student.first_name} ${payment.student.last_name}` : 'Unknown')}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {payment.student?.current_class_name || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <span className="capitalize">
                        {payment.fee_assignment?.fee_structure?.fee_type?.replace('_', ' ') || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {FeeService.formatCurrency(payment.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {payment.payment_date ? FeeService.formatDate(payment.payment_date) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white capitalize">
                      {payment.payment_method?.replace('_', ' ') || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(payment.fee_assignment?.status || 'pending')}
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.fee_assignment?.status || 'pending')}`}>
                          {payment.fee_assignment?.status || 'pending'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedPayment(payment);
                            setShowDetailsModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {payments.length === 0 && (
        <div className="card p-8 text-center">
          <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No payments found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            No payments match the current filters.
          </p>
        </div>
      )}

      <PaymentDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        payment={selectedPayment}
      />
    </div>
  );
};

export default PaymentTracker;
