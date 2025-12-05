import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  ClockIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { useToast } from '../../hooks/useToast';
import { cbtService } from '../../services/cbtService';
import { CBTTest, TestStatus } from '../../types';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { getSchoolCodeFromUrl } from '../../utils/schoolCode';

const CBTTestsPage: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const schoolCode = getSchoolCodeFromUrl();
  const [tests, setTests] = useState<CBTTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TestStatus | ''>('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    loadTests();
  }, [page, statusFilter]);

  const loadTests = async () => {
    try {
      setLoading(true);
      const response = await cbtService.getTests({
        status: statusFilter || undefined,
        search: searchTerm || undefined,
        page,
        size: pageSize,
      });
      setTests(response.tests);
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to load tests');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadTests();
  };


  const handlePublish = async (testId: string) => {
    try {
      await cbtService.publishTest(testId);
      showSuccess('Test published successfully');
      loadTests();
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to publish test');
    }
  };

  const getStatusBadge = (status: TestStatus) => {
    const badges = {
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      published: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      archived: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    };
    return badges[status] || badges.draft;
  };

  if (loading && tests.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">CBT Tests</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Create and manage computer-based tests
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/${schoolCode}/cbt/tests/generate`)}
            className="btn btn-secondary flex items-center gap-2"
          >
            <SparklesIcon className="h-5 w-5" />
            Generate with AI
          </button>
          <button
            onClick={() => navigate(`/${schoolCode}/cbt/tests/new`)}
            className="btn btn-primary flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Create Test
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search tests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="input pl-10 w-full"
              />
            </div>
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TestStatus | '')}
              className="input w-full"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tests Grid */}
      {tests.length === 0 ? (
        <div className="card p-12 text-center">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No tests</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Get started by creating a new test.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tests.map((test) => (
            <div key={test.id} className="card p-6 hover:shadow-lg transition-shadow">
              {/* Test Header */}
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
                  {test.title}
                </h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(test.status!)}`}>
                  {test.status}
                </span>
              </div>

              {/* Test Details */}
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                <div className="flex items-center gap-2">
                  <DocumentTextIcon className="h-4 w-4" />
                  <span>{test.question_count || 0} questions</span>
                </div>
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-4 w-4" />
                  <span>{test.duration_minutes} minutes</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => navigate(`/${schoolCode}/cbt/tests/${test.id}`)}
                  className="btn btn-sm btn-secondary flex-1"
                >
                  View
                </button>
                {test.status === 'draft' && (
                  <button
                    onClick={() => handlePublish(test.id!)}
                    className="btn btn-sm btn-primary flex-1"
                  >
                    Publish
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CBTTestsPage;

