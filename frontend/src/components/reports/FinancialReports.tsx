import React, { useState, useEffect } from 'react';
import {
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { reportsService, FinancialReport } from '../../services/reportsService';

const FinancialReports: React.FC = () => {
  const [report, setReport] = useState<FinancialReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    start_date: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchFinancialReport();
  }, [dateRange]);

  const fetchFinancialReport = async () => {
    try {
      setLoading(true);
      // Mock data since backend endpoint doesn't exist yet
      const mockReport: FinancialReport = {
        total_revenue: 2500000,
        fees_collected: 2100000,
        pending_fees: 300000,
        overdue_fees: 100000,
        collection_rate: 87.5,
        monthly_revenue: [
          { month: 'Jan', amount: 200000 },
          { month: 'Feb', amount: 220000 },
          { month: 'Mar', amount: 180000 },
          { month: 'Apr', amount: 250000 },
          { month: 'May', amount: 230000 },
          { month: 'Jun', amount: 210000 },
        ],
        fee_type_breakdown: [
          { fee_type: 'Tuition', amount: 1500000, percentage: 71.4 },
          { fee_type: 'Transport', amount: 300000, percentage: 14.3 },
          { fee_type: 'Library', amount: 150000, percentage: 7.1 },
          { fee_type: 'Sports', amount: 100000, percentage: 4.8 },
          { fee_type: 'Other', amount: 50000, percentage: 2.4 },
        ],
      };
      
      setReport(mockReport);
    } catch (err) {
      setError('Failed to fetch financial report');
      console.error('Error fetching financial report:', err);
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

  if (error || !report) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchFinancialReport}
          className="mt-2 btn btn-primary"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Date Range */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Financial Reports</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Revenue and fee collection analysis
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={dateRange.start_date}
              onChange={(e) => setDateRange({ ...dateRange, start_date: e.target.value })}
              className="input text-sm"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.end_date}
              onChange={(e) => setDateRange({ ...dateRange, end_date: e.target.value })}
              className="input text-sm"
            />
          </div>
          <button className="btn btn-primary flex items-center space-x-2">
            <ArrowDownTrayIcon className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Revenue
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                ₹{report.total_revenue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <ArrowTrendingUpIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Fees Collected
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                ₹{report.fees_collected.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
              <ArrowTrendingDownIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Pending Fees
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                ₹{report.pending_fees.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <CurrencyDollarIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Collection Rate
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {report.collection_rate}%
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
            {report.monthly_revenue.map((month, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {month.month}
                </span>
                <div className="flex items-center space-x-3 flex-1 mx-4">
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ 
                        width: `${(month.amount / Math.max(...report.monthly_revenue.map(m => m.amount))) * 100}%` 
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
            {report.fee_type_breakdown.map((feeType, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {feeType.fee_type}
                </span>
                <div className="flex items-center space-x-3 flex-1 mx-4">
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
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
              ₹{report.fees_collected.toLocaleString()}
            </p>
            <p className="text-sm text-green-700 dark:text-green-400">Collected</p>
            <div className="mt-2 w-full bg-green-200 dark:bg-green-800 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{ width: `${report.collection_rate}%` }}
              ></div>
            </div>
          </div>
          
          <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <p className="text-2xl font-semibold text-yellow-600">
              ₹{report.pending_fees.toLocaleString()}
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-400">Pending</p>
            <div className="mt-2 w-full bg-yellow-200 dark:bg-yellow-800 rounded-full h-2">
              <div
                className="bg-yellow-600 h-2 rounded-full"
                style={{ width: `${(report.pending_fees / report.total_revenue) * 100}%` }}
              ></div>
            </div>
          </div>
          
          <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-2xl font-semibold text-red-600">
              ₹{report.overdue_fees.toLocaleString()}
            </p>
            <p className="text-sm text-red-700 dark:text-red-400">Overdue</p>
            <div className="mt-2 w-full bg-red-200 dark:bg-red-800 rounded-full h-2">
              <div
                className="bg-red-600 h-2 rounded-full"
                style={{ width: `${(report.overdue_fees / report.total_revenue) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialReports;
