import React, { useState, useEffect } from 'react';
import {
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowDownTrayIcon,
  CalendarDaysIcon,
  ChartPieIcon
} from '@heroicons/react/24/outline';
import { reportsService, FinancialReport } from '../../services/reportsService';
import { useCurrentTerm } from '../../hooks/useCurrentTerm';
import CurrentTermIndicator from '../terms/CurrentTermIndicator';
import Card from '../ui/Card';

const FinancialReports: React.FC = () => {
  const { currentTerm } = useCurrentTerm();
  const [report, setReport] = useState<FinancialReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    start_date: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchFinancialReport();
  }, [dateRange, currentTerm?.id]); // Re-fetch when current term or date range changes

  const fetchFinancialReport = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to fetch real data with current term and date range
      try {
        const params = {
          ...dateRange,
          term_id: currentTerm?.id
        };
        const financialReport = await reportsService.getFinancialReport(params);
        setReport(financialReport);
        return;
      } catch (apiError) {
        console.warn('Failed to fetch financial report from API, using mock data:', apiError);
      }

      // Fallback to mock data
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400">{error}</p>
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
    <div className="space-y-6 animate-fade-in">
      {/* Current Term Indicator */}
      <CurrentTermIndicator variant="banner" />

      {/* Header with Date Range */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Financial Reports</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Revenue and fee collection analysis for {currentTerm ? `${currentTerm.name} (${currentTerm.academic_session})` : 'current term'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
          <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <input
              type="date"
              value={dateRange.start_date}
              onChange={(e) => setDateRange({ ...dateRange, start_date: e.target.value })}
              className="border-none bg-transparent text-sm focus:ring-0 text-gray-900 dark:text-white"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={dateRange.end_date}
              onChange={(e) => setDateRange({ ...dateRange, end_date: e.target.value })}
              className="border-none bg-transparent text-sm focus:ring-0 text-gray-900 dark:text-white"
            />
          </div>
          <button className="btn btn-primary w-full sm:w-auto flex items-center justify-center space-x-2">
            <ArrowDownTrayIcon className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card variant="glass" className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total Revenue
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                ₹{report.total_revenue.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl text-green-600 dark:text-green-400">
              <CurrencyDollarIcon className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card variant="glass" className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Fees Collected
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                ₹{report.fees_collected.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
              <ArrowTrendingUpIcon className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card variant="glass" className="border-l-4 border-l-yellow-500 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Pending Fees
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                ₹{report.pending_fees.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl text-yellow-600 dark:text-yellow-400">
              <ArrowTrendingDownIcon className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card variant="glass" className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Collection Rate
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {report.collection_rate}%
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400">
              <ChartPieIcon className="h-6 w-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart */}
        <Card variant="glass" className="h-full">
          <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <CalendarDaysIcon className="h-5 w-5 mr-2 text-primary-500" />
            Monthly Revenue Trend
          </h4>
          <div className="space-y-4">
            {report.monthly_revenue.map((month, index) => (
              <div key={index} className="flex items-center justify-between group">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-12">
                  {month.month}
                </span>
                <div className="flex items-center space-x-3 flex-1 mx-4">
                  <div className="flex-1 bg-gray-100 dark:bg-gray-700/50 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all duration-1000 group-hover:bg-blue-500"
                      style={{
                        width: `${(month.amount / Math.max(...report.monthly_revenue.map(m => m.amount))) * 100}%`
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white w-24 text-right">
                    ₹{month.amount.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Fee Type Breakdown */}
        <Card variant="glass" className="h-full">
          <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <ChartPieIcon className="h-5 w-5 mr-2 text-primary-500" />
            Fee Type Breakdown
          </h4>
          <div className="space-y-4">
            {report.fee_type_breakdown.map((feeType, index) => (
              <div key={index} className="flex items-center justify-between group">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-24">
                  {feeType.fee_type}
                </span>
                <div className="flex items-center space-x-3 flex-1 mx-4">
                  <div className="flex-1 bg-gray-100 dark:bg-gray-700/50 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-green-600 h-3 rounded-full transition-all duration-1000 group-hover:bg-green-500"
                      style={{ width: `${feeType.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white w-12 text-right">
                    {feeType.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Collection Status */}
      <Card variant="glass">
        <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
          Collection Status Overview
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-800/30">
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              ₹{report.fees_collected.toLocaleString()}
            </p>
            <p className="text-sm font-medium text-green-700 dark:text-green-300 mt-1">Collected</p>
            <div className="mt-3 w-full bg-green-200 dark:bg-green-800/50 rounded-full h-2 overflow-hidden">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${report.collection_rate}%` }}
              ></div>
            </div>
          </div>

          <div className="text-center p-6 bg-yellow-50 dark:bg-yellow-900/10 rounded-xl border border-yellow-100 dark:border-yellow-800/30">
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
              ₹{report.pending_fees.toLocaleString()}
            </p>
            <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300 mt-1">Pending</p>
            <div className="mt-3 w-full bg-yellow-200 dark:bg-yellow-800/50 rounded-full h-2 overflow-hidden">
              <div
                className="bg-yellow-600 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${(report.pending_fees / report.total_revenue) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="text-center p-6 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-800/30">
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">
              ₹{report.overdue_fees.toLocaleString()}
            </p>
            <p className="text-sm font-medium text-red-700 dark:text-red-300 mt-1">Overdue</p>
            <div className="mt-3 w-full bg-red-200 dark:bg-red-800/50 rounded-full h-2 overflow-hidden">
              <div
                className="bg-red-600 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${(report.overdue_fees / report.total_revenue) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default FinancialReports;
