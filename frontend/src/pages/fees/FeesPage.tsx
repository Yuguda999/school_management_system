import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { FeeStructure, FeePayment } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import PageHeader from '../../components/Layout/PageHeader';
import FeeStructureManager from '../../components/fees/FeeStructureManager';
import FeeAssignmentManager from '../../components/fees/FeeAssignmentManager';
import PaymentTracker from '../../components/fees/PaymentTracker';
import FinancialReports from '../../components/fees/FinancialReports';

const FeesPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('structures');
  const [feeStats, setFeeStats] = useState({
    totalRevenue: 0,
    pendingFees: 0,
    paidFees: 0,
    overduePayments: 0,
  });

  useEffect(() => {
    fetchFeeStats();
  }, []);

  const fetchFeeStats = async () => {
    try {
      // TODO: Implement actual API call to fetch fee statistics
      const stats = {
        totalRevenue: 0,
        pendingFees: 0,
        paidFees: 0,
        overduePayments: 0,
      };
      setFeeStats(stats);
    } catch (error) {
      console.error('Failed to fetch fee stats:', error);
    }
  };

  const tabs = [
    { id: 'structures', name: 'Fee Structures', icon: DocumentTextIcon },
    { id: 'assignments', name: 'Fee Assignments', icon: UserGroupIcon },
    { id: 'payments', name: 'Payment Tracking', icon: CurrencyDollarIcon },
    { id: 'reports', name: 'Financial Reports', icon: ChartBarIcon },
  ];

  const statsCards = [
    {
      name: 'Total Revenue',
      value: `$${feeStats.totalRevenue.toLocaleString()}`,
      icon: CurrencyDollarIcon,
      change: '+8%',
      changeType: 'increase' as const,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900',
    },
    {
      name: 'Pending Fees',
      value: `$${feeStats.pendingFees.toLocaleString()}`,
      icon: ExclamationTriangleIcon,
      change: '-5%',
      changeType: 'decrease' as const,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900',
    },
    {
      name: 'Paid Fees',
      value: `$${feeStats.paidFees.toLocaleString()}`,
      icon: CheckCircleIcon,
      change: '+12%',
      changeType: 'increase' as const,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
    },
    {
      name: 'Overdue Payments',
      value: `$${feeStats.overduePayments.toLocaleString()}`,
      icon: CalendarIcon,
      change: '-15%',
      changeType: 'decrease' as const,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fee Management"
        description="Manage fee structures, track payments, and generate financial reports"
      />

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
            <div className="mt-4">
              <div className={`flex items-center text-sm ${
                stat.changeType === 'increase'
                  ? 'text-green-600 dark:text-green-400'
                  : stat.changeType === 'decrease'
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                <span className="font-medium">{stat.change}</span>
                <span className="ml-1">from last month</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon className="h-5 w-5 mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'structures' && <FeeStructureManager />}
        {activeTab === 'assignments' && <FeeAssignmentManager />}
        {activeTab === 'payments' && <PaymentTracker />}
        {activeTab === 'reports' && <FinancialReports />}
      </div>
    </div>
  );
};

export default FeesPage;
