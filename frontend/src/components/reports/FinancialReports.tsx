import React, { useState, useEffect } from 'react';
import {
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowDownTrayIcon,
  CalendarDaysIcon,
  ChartPieIcon,
  FunnelIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { reportsService, FinancialReport } from '../../services/reportsService';
import { academicService } from '../../services/academicService';
import { Class } from '../../types';
import { useCurrentTerm } from '../../hooks/useCurrentTerm';
import CurrentTermIndicator from '../terms/CurrentTermIndicator';
import Card from '../ui/Card';
import { CURRENCY_OPTIONS } from '../../utils/currency';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useToast } from '../../hooks/useToast';

const FEE_TYPES = [
  { value: 'tuition', label: 'Tuition' },
  { value: 'registration', label: 'Registration' },
  { value: 'examination', label: 'Examination' },
  { value: 'library', label: 'Library' },
  { value: 'laboratory', label: 'Laboratory' },
  { value: 'sports', label: 'Sports' },
  { value: 'transport', label: 'Transport' },
  { value: 'uniform', label: 'Uniform' },
  { value: 'books', label: 'Books' },
  { value: 'feeding', label: 'Feeding' },
  { value: 'development', label: 'Development' },
  { value: 'other', label: 'Other' },
];

const PAYMENT_STATUSES = [
  { value: 'paid', label: 'Paid' },
  { value: 'pending', label: 'Pending' },
  { value: 'overdue', label: 'Overdue' },
];

const FinancialReports: React.FC = () => {
  const { currentTerm } = useCurrentTerm();
  const { currency } = useCurrency();
  const { showError } = useToast();

  const [report, setReport] = useState<FinancialReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [dateRange, setDateRange] = useState({
    start_date: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
  });
  const [selectedFeeType, setSelectedFeeType] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  const [classes, setClasses] = useState<Class[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const currencySymbol = CURRENCY_OPTIONS.find(c => c.value === currency)?.symbol || '$';

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchFinancialReport();
  }, [dateRange, currentTerm?.id, selectedFeeType, selectedClass, selectedStatus]);

  const fetchClasses = async () => {
    try {
      const data = await academicService.getClasses({ is_active: true, size: 100 });
      setClasses(data);
    } catch (err) {
      console.error('Failed to fetch classes', err);
    }
  };

  const fetchFinancialReport = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        ...dateRange,
        term_id: currentTerm?.id,
        class_id: selectedClass || undefined,
        fee_type: selectedFeeType || undefined,
        payment_status: selectedStatus || undefined
      };

      const financialReport = await reportsService.getFinancialReport(params);
      setReport(financialReport);
    } catch (err) {
      setError('Failed to fetch financial report');
      console.error('Error fetching financial report:', err);
      showError('Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const options = {
        format: 'csv',
        date_range: dateRange,
        filters: {
          term_id: currentTerm?.id,
          class_id: selectedClass,
          fee_type: selectedFeeType,
          payment_status: selectedStatus
        }
      };

      // Use the reports service to trigger the download
      const blob = await reportsService.exportReport('financial', options as any);

      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `financial_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();

      // Cleanup
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Export failed:', error);
      showError('Failed to export report');
    }
  };

  const clearFilters = () => {
    setSelectedFeeType('');
    setSelectedClass('');
    setSelectedStatus('');
    setDateRange({
      start_date: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
    });
  };

  const hasActiveFilters = selectedFeeType || selectedClass || selectedStatus;

  if (loading && !report) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error && !report) {
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

      {/* Header with Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Financial Reports</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Revenue and fee collection analysis for {currentTerm ? `${currentTerm.name} (${currentTerm.academic_session})` : 'current term'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            {/* Date Range Filter */}
            <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm w-full sm:w-auto">
              <CalendarDaysIcon className="h-4 w-4 text-gray-500 ml-2" />
              <input
                type="date"
                value={dateRange.start_date}
                onChange={(e) => setDateRange({ ...dateRange, start_date: e.target.value })}
                className="border-none bg-transparent text-sm focus:ring-0 text-gray-900 dark:text-white p-1 w-32"
              />
              <span className="text-gray-400">-</span>
              <input
                type="date"
                value={dateRange.end_date}
                onChange={(e) => setDateRange({ ...dateRange, end_date: e.target.value })}
                className="border-none bg-transparent text-sm focus:ring-0 text-gray-900 dark:text-white p-1 w-32"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn ${showFilters || hasActiveFilters ? 'btn-primary' : 'btn-secondary'} flex items-center gap-2`}
            >
              <FunnelIcon className="h-4 w-4" />
              <span>Filters</span>
            </button>

            <button
              onClick={handleExport}
              className="btn btn-outline flex items-center justify-center space-x-2 whitespace-nowrap"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Expanded Filters */}
        {(showFilters || hasActiveFilters) && (
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-down">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Class</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="input-field w-full"
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
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Fee Type</label>
              <select
                value={selectedFeeType}
                onChange={(e) => setSelectedFeeType(e.target.value)}
                className="input-field w-full"
              >
                <option value="">All Fee Types</option>
                {FEE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="input-field w-full"
              >
                <option value="">All Statuses</option>
                {PAYMENT_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="btn btn-ghost text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full flex items-center justify-center gap-2"
                disabled={!hasActiveFilters}
              >
                <XMarkIcon className="h-4 w-4" />
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {report && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card variant="glass" className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Total Revenue
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {currencySymbol}{report.total_revenue.toLocaleString()}
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
                    {currencySymbol}{report.fees_collected.toLocaleString()}
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
                    {currencySymbol}{report.pending_fees.toLocaleString()}
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
                {report.monthly_revenue.length > 0 ? (
                  report.monthly_revenue.map((month, index) => (
                    <div key={index} className="flex items-center justify-between group">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-12">
                        {month.month}
                      </span>
                      <div className="flex items-center space-x-3 flex-1 mx-4">
                        <div className="flex-1 bg-gray-100 dark:bg-gray-700/50 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-blue-600 h-3 rounded-full transition-all duration-1000 group-hover:bg-blue-500"
                            style={{
                              width: `${(month.amount / Math.max(...report.monthly_revenue.map(m => m.amount), 1)) * 100}%`
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-bold text-gray-900 dark:text-white w-24 text-right">
                          {currencySymbol}{month.amount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No revenue data for this period
                  </div>
                )}
              </div>
            </Card>

            {/* Fee Type Breakdown */}
            <Card variant="glass" className="h-full">
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <ChartPieIcon className="h-5 w-5 mr-2 text-primary-500" />
                Fee Type Breakdown
              </h4>
              <div className="space-y-4">
                {report.fee_type_breakdown.length > 0 ? (
                  report.fee_type_breakdown.map((feeType, index) => (
                    <div key={index} className="flex items-center justify-between group">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-32 truncate" title={feeType.fee_type}>
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
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No fee data available
                  </div>
                )}
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
                  {currencySymbol}{report.fees_collected.toLocaleString()}
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
                  {currencySymbol}{report.pending_fees.toLocaleString()}
                </p>
                <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300 mt-1">Pending</p>
                <div className="mt-3 w-full bg-yellow-200 dark:bg-yellow-800/50 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-yellow-600 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${(report.pending_fees / (report.total_revenue || 1)) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="text-center p-6 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-800/30">
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {currencySymbol}{report.overdue_fees.toLocaleString()}
                </p>
                <p className="text-sm font-medium text-red-700 dark:text-red-300 mt-1">Overdue</p>
                <div className="mt-3 w-full bg-red-200 dark:bg-red-800/50 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-red-600 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${(report.overdue_fees / (report.total_revenue || 1)) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default FinancialReports;
