import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClockIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';
import { useToast } from '../../hooks/useToast';
import { cbtService } from '../../services/cbtService';
import { AvailableTest } from '../../types';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { getSchoolCodeFromUrl } from '../../utils/schoolCode';

const StudentCBTPage: React.FC = () => {
  const navigate = useNavigate();
  const { showError } = useToast();
  const schoolCode = getSchoolCodeFromUrl();
  const [tests, setTests] = useState<AvailableTest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    try {
      setLoading(true);
      const data = await cbtService.getAvailableTests();
      setTests(data);
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to load tests');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = (test: AvailableTest) => {
    if (!test.can_attempt) {
      showError('You cannot attempt this test');
      return;
    }
    navigate(`/${schoolCode}/cbt/student/take/${test.submission_id}`);
  };

  const handleViewResults = (test: AvailableTest) => {
    navigate(`/${schoolCode}/cbt/student/results/${test.submission_id}`);
  };

  const getStatusBadge = (test: AvailableTest) => {
    if (test.status === 'submitted') {
      return (
        <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded-full text-sm font-medium">
          <CheckCircleIcon className="h-4 w-4" />
          Completed
        </span>
      );
    }
    if (test.status === 'in_progress') {
      return (
        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 rounded-full text-sm font-medium">
          In Progress
        </span>
      );
    }
    if (!test.is_available) {
      return (
        <span className="px-3 py-1 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 rounded-full text-sm font-medium">
          Not Available
        </span>
      );
    }
    return (
      <span className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded-full text-sm font-medium">
        Available
      </span>
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Tests</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          View and take your assigned tests
        </p>
      </div>

      {/* Tests List */}
      {tests.length === 0 ? (
        <div className="card p-12 text-center">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No tests available</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            You don't have any tests assigned at the moment.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {tests.map((test) => (
            <div key={test.submission_id} className="card p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {test.test_title}
                    </h3>
                    {getStatusBadge(test)}
                  </div>
                  {test.test_description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {test.test_description}
                    </p>
                  )}
                  {test.subject_name && (
                    <p className="text-sm text-gray-500">
                      Subject: <span className="font-medium">{test.subject_name}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Test Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <ClockIcon className="h-5 w-5" />
                  <span>{test.duration_minutes} min</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <DocumentTextIcon className="h-5 w-5" />
                  <span>{test.total_points} points</span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <div>Start: {new Date(test.start_datetime).toLocaleString()}</div>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <div>End: {new Date(test.end_datetime).toLocaleString()}</div>
                </div>
              </div>

              {/* Attempt Info */}
              {test.status === 'submitted' && test.score !== undefined && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {test.score}/{test.total_points}
                      </div>
                      <div className="text-sm text-gray-500">Score</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {test.percentage?.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-500">Percentage</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {test.passed ? (
                          <span className="text-green-600">PASS</span>
                        ) : (
                          <span className="text-red-600">FAIL</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">Result</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                {test.can_attempt && test.is_available && (
                  <button
                    onClick={() => handleStartTest(test)}
                    className="btn btn-primary flex items-center gap-2"
                  >
                    <PlayIcon className="h-5 w-5" />
                    {test.status === 'in_progress' ? 'Continue Test' : 'Start Test'}
                  </button>
                )}
                {test.status === 'submitted' && (
                  <button
                    onClick={() => handleViewResults(test)}
                    className="btn btn-secondary"
                  >
                    View Results
                  </button>
                )}
                {!test.is_available && test.status === 'not_started' && (
                  <div className="text-sm text-gray-500">
                    Test will be available from {new Date(test.start_datetime).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentCBTPage;

