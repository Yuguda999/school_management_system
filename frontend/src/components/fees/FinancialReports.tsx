import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
  ClockIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';

interface FinancialData {
  totalRevenue: number;
  monthlyRevenue: Array<{
    month: string;
    amount: number;
  }>;
  feeTypeBreakdown: Array<{
    type: string;
    amount: number;
    percentage: number;
  }>;
  collectionRate: number;
  pendingAmount: number;
  overdueAmount: number;
}

const FinancialReports: React.FC = () => {
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('current-month');

  useEffect(() => {
    fetchFinancialData();
  }, [selectedPeriod]);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      // TODO: Implement actual API call to fetch financial data
      const data: FinancialData = {
        totalRevenue: 0,
        monthlyRevenue: [],
        feeTypeBreakdown: [],
        collectionRate: 0,
        pendingAmount: 0,
        overdueAmount: 0,
      };
      setFinancialData(data);
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!financialData) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Failed to load financial data</p>
        <button
          onClick={fetchFinancialData}
          className="mt-2 btn btn-primary"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Financial Reports</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Revenue analysis and fee collection insights
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="input text-sm"
          >
            <option value="current-month">Current Month</option>
            <option value="last-3-months">Last 3 Months</option>
            <option value="current-year">Current Year</option>
            <option value="last-year">Last Year</option>
          </select>
          <button className="btn btn-primary flex items-center space-x-2">
            <ArrowDownTrayIcon className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Revenue
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                ₹{financialData.totalRevenue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <ArrowTrendingUpIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Collection Rate
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {financialData.collectionRate}%
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
              <ClockIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Pending Amount
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                ₹{financialData.pendingAmount.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <ArrowTrendingDownIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Overdue Amount
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                ₹{financialData.overdueAmount.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart */}
        <div className="card p-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Monthly Revenue Trend
          </h4>
          <div className="space-y-3">
            {financialData.monthlyRevenue.map((month, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {month.month}
                </span>
                <div className="flex items-center space-x-3 flex-1 mx-4">
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${(month.amount / Math.max(...financialData.monthlyRevenue.map(m => m.amount))) * 100}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    ₹{month.amount.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fee Type Breakdown */}
        <div className="card p-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Fee Type Breakdown
          </h4>
          <div className="space-y-3">
            {financialData.feeTypeBreakdown.map((feeType, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {feeType.type}
                </span>
                <div className="flex items-center space-x-3 flex-1 mx-4">
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${feeType.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {feeType.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Collection Status */}
      <div className="card p-6">
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Collection Status Overview
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-2xl font-semibold text-green-600">
              ₹{(financialData.totalRevenue - financialData.pendingAmount - financialData.overdueAmount).toLocaleString()}
            </p>
            <p className="text-sm text-green-700 dark:text-green-400">Collected</p>
            <div className="mt-2 w-full bg-green-200 dark:bg-green-800 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{ width: `${financialData.collectionRate}%` }}
              ></div>
            </div>
          </div>
          
          <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <p className="text-2xl font-semibold text-yellow-600">
              ₹{financialData.pendingAmount.toLocaleString()}
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-400">Pending</p>
            <div className="mt-2 w-full bg-yellow-200 dark:bg-yellow-800 rounded-full h-2">
              <div
                className="bg-yellow-600 h-2 rounded-full"
                style={{ width: `${(financialData.pendingAmount / financialData.totalRevenue) * 100}%` }}
              ></div>
            </div>
          </div>
          
          <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-2xl font-semibold text-red-600">
              ₹{financialData.overdueAmount.toLocaleString()}
            </p>
            <p className="text-sm text-red-700 dark:text-red-400">Overdue</p>
            <div className="mt-2 w-full bg-red-200 dark:bg-red-800 rounded-full h-2">
              <div
                className="bg-red-600 h-2 rounded-full"
                style={{ width: `${(financialData.overdueAmount / financialData.totalRevenue) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialReports;
