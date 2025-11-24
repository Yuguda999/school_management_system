import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';
import { useToast } from '../../hooks/useToast';
import { cbtService } from '../../services/cbtService';
import { CBTSubmission } from '../../types';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { getSchoolCodeFromUrl } from '../../utils/schoolCode';

const StudentResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const { submissionId } = useParams<{ submissionId: string }>();
  const { showError } = useToast();
  const schoolCode = getSchoolCodeFromUrl();
  const [submission, setSubmission] = useState<CBTSubmission | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (submissionId) {
      loadResults();
    }
  }, [submissionId]);

  const loadResults = async () => {
    try {
      setLoading(true);
      const data = await cbtService.getTestResults(submissionId!);
      setSubmission(data);
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to load results');
      navigate(`/${schoolCode}/cbt/student`);
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
        <p className="text-gray-500 dark:text-gray-400">Results not found</p>
      </div>
    );
  }

  const percentage = submission.percentage ? Number(submission.percentage) : 0;
  const passed = submission.passed;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(`/${schoolCode}/cbt/student`)}
          className="btn btn-secondary"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Test Results</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            View your performance and answers
          </p>
        </div>
      </div>

      {/* Score Summary */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-full ${passed ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
              {passed ? (
                <TrophyIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
              ) : (
                <XCircleIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {percentage.toFixed(1)}%
              </h2>
              <p className={`text-sm font-medium ${passed ? 'text-green-600' : 'text-red-600'}`}>
                {passed ? 'Passed' : 'Failed'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {submission.total_score}/{submission.total_possible}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Points</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {submission.answers?.filter(a => a.is_correct).length || 0}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Correct</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {submission.answers?.filter(a => !a.is_correct).length || 0}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Incorrect</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {submission.time_spent_seconds ? Math.floor(submission.time_spent_seconds / 60) : 0}m
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Time Spent</p>
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
                              Your answer
                            </span>
                          )}
                          {isCorrect && (
                            <CheckCircleIcon className="h-4 w-4 text-green-600" />
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

export default StudentResultsPage;

