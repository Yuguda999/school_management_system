import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { useToast } from '../../hooks/useToast';
import { cbtService } from '../../services/cbtService';
import { CBTSubmission } from '../../types';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { getSchoolCodeFromUrl } from '../../utils/schoolCode';

const TestSubmissionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { testId } = useParams<{ testId: string }>();
  const { showSuccess, showError } = useToast();
  const schoolCode = getSchoolCodeFromUrl();
  const [submissions, setSubmissions] = useState<CBTSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (testId) {
      loadSubmissions();
    }
  }, [testId, statusFilter]);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const data = await cbtService.getTestSubmissions(testId!, {
        status: statusFilter || undefined,
      });
      setSubmissions(data);
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await cbtService.exportResults(testId!);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `test-results-${testId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showSuccess('Results exported successfully');
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to export results');
    } finally {
      setExporting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      not_started: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      submitted: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    };
    return badges[status as keyof typeof badges] || badges.not_started;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/${schoolCode}/cbt/tests/${testId}`)}
            className="btn btn-secondary"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Test Submissions</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              View and analyze student submissions
            </p>
          </div>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting || submissions.length === 0}
          className="btn btn-primary flex items-center gap-2"
        >
          <DocumentArrowDownIcon className="h-5 w-5" />
          {exporting ? 'Exporting...' : 'Export to CSV'}
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center gap-4">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
          >
            <option value="">All Statuses</option>
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="submitted">Submitted</option>
          </select>
          <div className="ml-auto text-sm text-gray-500 dark:text-gray-400">
            {submissions.length} submission{submissions.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Submissions Table */}
      {submissions.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">No submissions yet</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Percentage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Submitted At
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {submissions.map((submission) => (
                  <tr key={submission.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {submission.student?.first_name} {submission.student?.last_name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {submission.student?.admission_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(submission.status)}`}>
                        {submission.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {submission.status === 'submitted' ? (
                        <span className="font-medium">
                          {submission.total_score}/{submission.total_possible}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {submission.status === 'submitted' ? (
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${submission.passed ? 'text-green-600' : 'text-red-600'}`}>
                            {Number(submission.percentage).toFixed(1)}%
                          </span>
                          {submission.passed && (
                            <span className="text-xs text-green-600">(Passed)</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {submission.submitted_at ? (
                        new Date(submission.submitted_at).toLocaleString()
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {submission.status === 'submitted' && (
                        <button
                          onClick={() => navigate(`/${schoolCode}/cbt/submissions/${submission.id}`)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 ml-auto"
                        >
                          <EyeIcon className="h-4 w-4" />
                          View Details
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Statistics */}
      {submissions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Submissions</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{submissions.length}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Submitted</p>
            <p className="text-2xl font-bold text-green-600">
              {submissions.filter(s => s.status === 'submitted').length}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">In Progress</p>
            <p className="text-2xl font-bold text-blue-600">
              {submissions.filter(s => s.status === 'in_progress').length}
            </p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Pass Rate</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {submissions.filter(s => s.status === 'submitted').length > 0
                ? ((submissions.filter(s => s.passed).length / submissions.filter(s => s.status === 'submitted').length) * 100).toFixed(1)
                : 0}%
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestSubmissionsPage;

