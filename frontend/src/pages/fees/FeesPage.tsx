import React, { useState, useEffect } from 'react';
import {
  CurrencyDollarIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import PageHeader from '../../components/Layout/PageHeader';
import FeeStructureManager from '../../components/fees/FeeStructureManager';
import FeeAssignmentManager from '../../components/fees/FeeAssignmentManager';
import PaymentTracker from '../../components/fees/PaymentTracker';
import FinancialReports from '../../components/fees/FinancialReports';
import Card from '../../components/ui/Card';
import { apiService } from '../../services/api';
import { useToast } from '../../hooks/useToast';

const FeesPage: React.FC = () => {
  const { user } = useAuth();
  const { formatAmount } = useCurrency();
  const [activeTab, setActiveTab] = useState('structures');
  const [feeStats, setFeeStats] = useState({
    totalRevenue: 0,
    pendingFees: 0,
    paidFees: 0,
    overduePayments: 0,
  });

  const { showError } = useToast();

  useEffect(() => {
    fetchFeeStats();
  }, []);

  const fetchFeeStats = async () => {
    try {
      const data = await apiService.get<any>('/api/v1/fees/stats');

      setFeeStats({
        totalRevenue: data.total_expected || 0,
        pendingFees: data.total_outstanding || 0,
        paidFees: data.total_collected || 0,
        overduePayments: data.overdue_amount || 0,
      });
    } catch (error) {
      console.error('Failed to fetch fee stats:', error);
      showError('Failed to load fee statistics');
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
      value: formatAmount(feeStats.totalRevenue),
      icon: CurrencyDollarIcon,
      change: '+8%',
      changeType: 'increase' as const,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      borderColor: 'border-l-green-500'
    },
    {
      name: 'Pending Fees',
      value: formatAmount(feeStats.pendingFees),
      icon: ExclamationTriangleIcon,
      change: '-5%',
      changeType: 'decrease' as const,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      borderColor: 'border-l-yellow-500'
    },
    {
      name: 'Paid Fees',
      value: formatAmount(feeStats.paidFees),
      icon: CheckCircleIcon,
      change: '+12%',
      changeType: 'increase' as const,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      borderColor: 'border-l-blue-500'
    },
    {
      name: 'Overdue Payments',
      value: formatAmount(feeStats.overduePayments),
      icon: CalendarIcon,
      change: '-15%',
      changeType: 'decrease' as const,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      borderColor: 'border-l-red-500'
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Fee Management"
        description="Manage fee structures, track payments, and generate financial reports"
      />

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
            <div className="mt-4 flex items-center text-sm">
              {stat.changeType === 'increase' ? (
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={`font-medium ${stat.changeType === 'increase' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                {stat.change}
              </span>
              <span className="ml-1 text-gray-500 dark:text-gray-400">from last month</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Card variant="glass" padding="none">
        <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors duration-200 ${activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
              >
                <tab.icon
                  className={`mr-2 h-5 w-5 ${activeTab === tab.id
                    ? 'text-primary-500 dark:text-primary-400'
                    : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                    }`}
                />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </Card>

      {/* Tab Content */}
      <div className="mt-6 animate-fade-in-up">
        {activeTab === 'structures' && <FeeStructureManager />}
        {activeTab === 'assignments' && <FeeAssignmentManager />}
        {activeTab === 'payments' && <PaymentTracker />}
        {activeTab === 'reports' && <FinancialReports />}
      </div>
    </div>
  );
};

export default FeesPage;
