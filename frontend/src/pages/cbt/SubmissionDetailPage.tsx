import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { useToast } from '../../hooks/useToast';
import { cbtService } from '../../services/cbtService';
import { CBTSubmission } from '../../types';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { getSchoolCodeFromUrl } from '../../utils/schoolCode';

const SubmissionDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { submissionId } = useParams<{ submissionId: string }>();
  const { showError } = useToast();
  const schoolCode = getSchoolCodeFromUrl();
  const [submission, setSubmission] = useState<CBTSubmission | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (submissionId) {
      loadSubmission();
    }
  }, [submissionId]);

  const loadSubmission = async () => {
    try {
      setLoading(true);
      const data = await cbtService.getSubmissionDetails(submissionId!);
      setSubmission(data);
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to load submission');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!submission) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Submission not found</p>
      </div>
    );
  }

  const percentage = submission.percentage ? Number(submission.percentage) : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="btn btn-secondary"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Submission Details</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {submission.student?.first_name} {submission.student?.last_name} - {submission.test?.title}
          </p>
        </div>
      </div>

      {/* Student & Score Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Student Info */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
              <UserIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold">Student Information</h2>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Name:</span>
              <span className="font-medium">
                {submission.student?.first_name} {submission.student?.last_name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Admission Number:</span>
              <span className="font-medium">{submission.student?.admission_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Submitted At:</span>
              <span className="font-medium">
                {submission.submitted_at ? new Date(submission.submitted_at).toLocaleString() : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Time Spent:</span>
              <span className="font-medium">
                {submission.time_spent_seconds ? `${Math.floor(submission.time_spent_seconds / 60)}m ${submission.time_spent_seconds % 60}s` : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Score Info */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-full ${submission.passed ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
              {submission.passed ? (
                <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              ) : (
                <XCircleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
              )}
            </div>
            <h2 className="text-lg font-semibold">Score Summary</h2>
          </div>
          <div className="space-y-3">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-4xl font-bold text-gray-900 dark:text-white">
                {percentage.toFixed(1)}%
              </p>
              <p className={`text-sm font-medium mt-1 ${submission.passed ? 'text-green-600' : 'text-red-600'}`}>
                {submission.passed ? 'Passed' : 'Failed'}
              </p>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Total Score:</span>
              <span className="font-medium">{submission.total_score}/{submission.total_possible}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Correct Answers:</span>
              <span className="font-medium text-green-600">
                {submission.answers?.filter(a => a.is_correct).length || 0}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Incorrect Answers:</span>
              <span className="font-medium text-red-600">
                {submission.answers?.filter(a => !a.is_correct).length || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Answers */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Answer Breakdown</h2>
        <div className="space-y-6">
          {submission.answers?.map((answer, index) => (
            <div
              key={answer.id}
              className={`border-l-4 pl-4 ${
                answer.is_correct
                  ? 'border-green-500'
                  : 'border-red-500'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="flex-shrink-0 w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center font-semibold text-sm">
                    {index + 1}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    Question {index + 1}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {answer.is_correct ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircleIcon className="h-5 w-5 text-red-600" />
                  )}
                  <span className="text-sm font-medium">
                    {answer.points_earned}/{answer.question?.points || 0} pts
                  </span>
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                {answer.question?.question_text}
              </p>
              <div className="space-y-2">
                {answer.question?.options?.map((option) => {
                  const isSelected = option.id === answer.selected_option_id;
                  const isCorrect = option.is_correct;

                  return (
                    <div
                      key={option.id}
                      className={`p-3 rounded-lg border ${
                        isSelected && isCorrect
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : isSelected && !isCorrect
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                          : isCorrect
                          ? 'border-green-300 bg-green-50 dark:bg-green-900/10'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{option.option_label}.</span>
                          <span>{option.option_text}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {isSelected && (
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                              Student's answer
                            </span>
                          )}
                          {isCorrect && (
                            <span className="text-xs font-medium text-green-600">
                              Correct answer
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SubmissionDetailPage;

