import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import { useToast } from '../../hooks/useToast';
import { cbtService } from '../../services/cbtService';
import { CBTTest } from '../../types';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { getSchoolCodeFromUrl } from '../../utils/schoolCode';
import ScheduleTestModal from '../../components/cbt/ScheduleTestModal';

const CBTTestDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { testId } = useParams<{ testId: string }>();
  const { showSuccess, showError } = useToast();
  const schoolCode = getSchoolCodeFromUrl();
  const [test, setTest] = useState<CBTTest | null>(null);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  useEffect(() => {
    if (testId) {
      loadTest();
    }
  }, [testId]);

  const loadTest = async () => {
    try {
      setLoading(true);
      const data = await cbtService.getTest(testId!);
      setTest(data);
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to load test');
      navigate(`/${schoolCode}/cbt/tests`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this test?')) return;

    try {
      await cbtService.deleteTest(testId!);
      showSuccess('Test deleted successfully');
      navigate(`/${schoolCode}/cbt/tests`);
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to delete test');
    }
  };

  const handlePublish = async () => {
    try {
      await cbtService.publishTest(testId!);
      showSuccess('Test published successfully');
      loadTest();
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to publish test');
    }
  };

  const handleUnpublish = async () => {
    try {
      await cbtService.unpublishTest(testId!);
      showSuccess('Test unpublished successfully');
      loadTest();
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to unpublish test');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!test) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Test not found</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      published: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      archived: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    };
    return badges[status as keyof typeof badges] || badges.draft;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/${schoolCode}/cbt/tests`)}
            className="btn btn-secondary"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{test.title}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {test.description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadge(test.status!)}`}>
            {test.status}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="card p-4">
        <div className="flex gap-2">
          {test.status === 'draft' && (
            <button
              onClick={handlePublish}
              className="btn btn-primary"
            >
              <CheckCircleIcon className="h-5 w-5 mr-2" />
              Publish Test
            </button>
          )}
          {test.status === 'published' && (
            <>
              <button
                onClick={() => setShowScheduleModal(true)}
                className="btn btn-primary"
              >
                <CalendarDaysIcon className="h-5 w-5 mr-2" />
                Schedule Test
              </button>
              <button
                onClick={handleUnpublish}
                className="btn btn-secondary"
              >
                <XCircleIcon className="h-5 w-5 mr-2" />
                Unpublish Test
              </button>
            </>
          )}
          <button
            onClick={() => navigate(`/${schoolCode}/cbt/tests/${testId}/edit`)}
            className="btn btn-secondary"
          >
            <PencilIcon className="h-5 w-5 mr-2" />
            Edit
          </button>
          {test.status === 'published' && (
            <button
              onClick={() => navigate(`/${schoolCode}/cbt/tests/${testId}/submissions`)}
              className="btn btn-secondary"
            >
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              View Submissions
            </button>
          )}
          <button
            onClick={handleDelete}
            className="btn btn-danger ml-auto"
          >
            <TrashIcon className="h-5 w-5 mr-2" />
            Delete
          </button>
        </div>
      </div>

      {/* Test Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Info */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Test Information</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <ClockIcon className="h-5 w-5 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">Duration:</span>
              <span className="font-medium">{test.duration_minutes} minutes</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <DocumentTextIcon className="h-5 w-5 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">Questions:</span>
              <span className="font-medium">{test.question_count || 0}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircleIcon className="h-5 w-5 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">Total Points:</span>
              <span className="font-medium">{test.total_points || 0}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircleIcon className="h-5 w-5 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">Pass Percentage:</span>
              <span className="font-medium">{test.pass_percentage}%</span>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Test Settings</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Randomize Questions</span>
              <span className={test.randomize_questions ? 'text-green-600' : 'text-gray-400'}>
                {test.randomize_questions ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Randomize Options</span>
              <span className={test.randomize_options ? 'text-green-600' : 'text-gray-400'}>
                {test.randomize_options ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Multiple Attempts</span>
              <span className={test.allow_multiple_attempts ? 'text-green-600' : 'text-gray-400'}>
                {test.allow_multiple_attempts ? `Yes (${test.max_attempts})` : 'No'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Show Results Immediately</span>
              <span className={test.show_results_immediately ? 'text-green-600' : 'text-gray-400'}>
                {test.show_results_immediately ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Show Correct Answers</span>
              <span className={test.show_correct_answers ? 'text-green-600' : 'text-gray-400'}>
                {test.show_correct_answers ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Questions ({test.questions?.length || 0})</h2>
        {test.questions && test.questions.length > 0 ? (
          <div className="space-y-6">
            {test.questions.map((question, index) => (
              <div key={question.id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center font-semibold text-sm">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white mb-3">
                      {question.question_text}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {question.options?.map((option) => (
                        <div
                          key={option.id}
                          className={`p-3 rounded-lg border ${
                            option.is_correct
                              ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                              : 'border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          <span className="font-medium mr-2">{option.option_label}.</span>
                          <span>{option.option_text}</span>
                          {option.is_correct && (
                            <CheckCircleIcon className="inline-block h-4 w-4 text-green-600 ml-2" />
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Points: {question.points}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No questions added yet
          </p>
        )}
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <ScheduleTestModal
          testId={testId!}
          testTitle={test.title}
          onClose={() => setShowScheduleModal(false)}
          onSuccess={() => {
            showSuccess('Test scheduled successfully! Students can now see it.');
            setShowScheduleModal(false);
          }}
        />
      )}
    </div>
  );
};

export default CBTTestDetailPage;


