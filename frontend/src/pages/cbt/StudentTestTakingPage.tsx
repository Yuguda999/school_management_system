import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  BookmarkIcon,
  XMarkIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { useToast } from '../../hooks/useToast';
import { cbtService } from '../../services/cbtService';
import { CBTTestForStudent, CBTSubmissionSubmit } from '../../types';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { getSchoolCodeFromUrl } from '../../utils/schoolCode';

type QuestionStatus = 'not_visited' | 'not_answered' | 'answered' | 'marked_for_review' | 'answered_and_marked';

const StudentTestTakingPage: React.FC = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();
  const schoolCode = getSchoolCodeFromUrl();
  const { showSuccess, showError, showWarning } = useToast();
  const [test, setTest] = useState<CBTTestForStudent | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());
  const [visitedQuestions, setVisitedQuestions] = useState<Set<number>>(new Set([0]));
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showQuestionPalette, setShowQuestionPalette] = useState(true);

  useEffect(() => {
    if (submissionId) {
      startTest();
    }
  }, [submissionId]);

  // Auto-save answers every 30 seconds
  useEffect(() => {
    if (!test || Object.keys(answers).length === 0) return;

    // Clear existing timer
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }

    // Set new timer for 30 seconds
    const timer = setTimeout(() => {
      autoSaveAnswers();
    }, 30000);

    setAutoSaveTimer(timer);

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [answers]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  // Warning when time is running out
  useEffect(() => {
    if (timeRemaining === 300) { // 5 minutes
      showWarning('5 minutes remaining!');
    } else if (timeRemaining === 60) { // 1 minute
      showWarning('1 minute remaining!');
    }
  }, [timeRemaining]);

  const startTest = async () => {
    try {
      setLoading(true);
      const testData = await cbtService.startTest(submissionId!);
      setTest(testData);
      setTimeRemaining(testData.duration_minutes * 60);

      // Load saved answers from localStorage if available
      const savedAnswers = localStorage.getItem(`cbt_answers_${submissionId}`);
      if (savedAnswers) {
        try {
          const parsed = JSON.parse(savedAnswers);
          setAnswers(parsed);
          showSuccess('Previous answers restored');
        } catch (e) {
          console.error('Failed to parse saved answers:', e);
        }
      }
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to start test');
      navigate(`/${schoolCode}/cbt/student`);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleClearResponse = () => {
    if (!test) return;
    const currentQuestionId = test.questions[currentQuestionIndex].id!;
    setAnswers((prev) => {
      const newAnswers = { ...prev };
      delete newAnswers[currentQuestionId];
      return newAnswers;
    });
  };

  const handleMarkForReview = () => {
    if (!test) return;
    const currentQuestionId = test.questions[currentQuestionIndex].id!;
    setMarkedForReview((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(currentQuestionId)) {
        newSet.delete(currentQuestionId);
      } else {
        newSet.add(currentQuestionId);
      }
      return newSet;
    });
  };

  const navigateToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
    setVisitedQuestions((prev) => new Set(prev).add(index));
  };

  const getQuestionStatus = (questionIndex: number): QuestionStatus => {
    if (!test) return 'not_visited';
    const questionId = test.questions[questionIndex].id!;
    const isAnswered = !!answers[questionId];
    const isMarked = markedForReview.has(questionId);
    const isVisited = visitedQuestions.has(questionIndex);

    if (isAnswered && isMarked) return 'answered_and_marked';
    if (isMarked) return 'marked_for_review';
    if (isAnswered) return 'answered';
    if (isVisited) return 'not_answered';
    return 'not_visited';
  };

  const autoSaveAnswers = async () => {
    if (!test || !submissionId) return;

    try {
      // Save to localStorage as backup
      localStorage.setItem(`cbt_answers_${submissionId}`, JSON.stringify(answers));
      setLastSaved(new Date());

      // Note: Backend auto-save endpoint would be called here if implemented
      // await cbtService.autoSaveAnswers(submissionId, answers);
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  };

  const handleAutoSubmit = async () => {
    showWarning('Time is up! Submitting your test...');
    await handleSubmit();
  };

  const handleSubmit = async () => {
    if (!test || !submissionId) return;

    try {
      setSubmitting(true);
      const submissionData: CBTSubmissionSubmit = {
        answers: test.questions.map((q) => ({
          question_id: q.id!,
          selected_option_id: answers[q.id!] || undefined,
        })),
      };

      await cbtService.submitTest(submissionId, submissionData);

      // Clear saved answers from localStorage
      localStorage.removeItem(`cbt_answers_${submissionId}`);

      showSuccess('Test submitted successfully!');
      navigate(`/${schoolCode}/cbt/student/results/${submissionId}`);
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to submit test');
    } finally {
      setSubmitting(false);
      setShowSubmitDialog(false);
    }
  };

  const handleSubmitClick = () => {
    setShowSubmitDialog(true);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeRemaining <= 60) return 'text-red-600';
    if (timeRemaining <= 300) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!test) {
    return null;
  }

  const currentQuestion = test.questions[currentQuestionIndex];
  const answeredCount = Object.keys(answers).length;
  const notAnsweredCount = visitedQuestions.size - answeredCount;
  const notVisitedCount = test.questions.length - visitedQuestions.size;
  const markedCount = markedForReview.size;
  const currentQuestionId = currentQuestion.id!;
  const isCurrentMarked = markedForReview.has(currentQuestionId);
  const isCurrentAnswered = !!answers[currentQuestionId];

  return (
    <div className="fixed inset-0 bg-gray-100 dark:bg-gray-900 flex flex-col overflow-hidden">
      {/* Top Header - Fixed */}
      <div className="bg-white dark:bg-gray-800 border-b-2 border-gray-300 dark:border-gray-700 shadow-sm">
        <div className="px-6 py-3">
          <div className="flex justify-between items-center">
            {/* Test Title */}
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">{test.title}</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {test.description || 'Computer Based Test'}
              </p>
            </div>

            {/* Timer - Prominent */}
            <div className="flex items-center gap-6">
              {lastSaved && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Auto-saved at {lastSaved.toLocaleTimeString()}
                </div>
              )}
              <div className={`flex items-center gap-3 px-6 py-3 rounded-lg border-2 ${
                timeRemaining <= 60
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : timeRemaining <= 300
                  ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                  : 'border-green-500 bg-green-50 dark:bg-green-900/20'
              }`}>
                <ClockIcon className={`h-7 w-7 ${getTimeColor()}`} />
                <div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Time Remaining</div>
                  <div className={`text-2xl font-bold font-mono ${getTimeColor()}`}>
                    {formatTime(timeRemaining)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Question Area - Left Side */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-8">
            {/* Question Header */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Question {currentQuestionIndex + 1} of {test.questions.length}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                      {currentQuestion.points} {currentQuestion.points === 1 ? 'point' : 'points'}
                    </span>
                    {isCurrentMarked && (
                      <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded flex items-center gap-1">
                        <BookmarkSolidIcon className="h-3 w-3" />
                        Marked for Review
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Question Text */}
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-lg text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap">
                  {currentQuestion.question_text}
                </p>
              </div>

              {/* Question Image */}
              {currentQuestion.image_url && (
                <div className="mt-6">
                  <img
                    src={currentQuestion.image_url}
                    alt="Question illustration"
                    className="max-w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700"
                  />
                </div>
              )}
            </div>

            {/* Answer Options */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">
                Select your answer:
              </h3>
              <div className="space-y-3">
                {currentQuestion.options.map((option) => {
                  const isSelected = answers[currentQuestionId] === option.id;
                  return (
                    <button
                      key={option.id}
                      onClick={() => handleAnswerSelect(currentQuestionId, option.id!)}
                      className={`w-full text-left p-5 rounded-lg border-2 transition-all duration-200 ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 shadow-md'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Radio Button */}
                        <div className="flex-shrink-0 mt-0.5">
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                              isSelected
                                ? 'border-blue-600 bg-blue-600'
                                : 'border-gray-400 dark:border-gray-500'
                            }`}
                          >
                            {isSelected && (
                              <div className="w-3 h-3 bg-white rounded-full"></div>
                            )}
                          </div>
                        </div>
                        {/* Option Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className={`font-bold text-base ${
                              isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
                            }`}>
                              {option.option_label}.
                            </span>
                            <span className={`text-base ${
                              isSelected ? 'text-gray-900 dark:text-gray-100 font-medium' : 'text-gray-700 dark:text-gray-300'
                            }`}>
                              {option.option_text}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Question Palette - Right Sidebar */}
        {showQuestionPalette && (
          <div className="w-80 bg-white dark:bg-gray-800 border-l-2 border-gray-300 dark:border-gray-700 overflow-y-auto flex-shrink-0">
            <div className="p-4">
              {/* Palette Header */}
              <div className="mb-4">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide mb-3">
                  Question Palette
                </h3>

                {/* Legend */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-green-500"></div>
                    <span className="text-gray-600 dark:text-gray-400">Answered ({answeredCount})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-red-500"></div>
                    <span className="text-gray-600 dark:text-gray-400">Not Answered ({notAnsweredCount})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-gray-300 dark:bg-gray-600"></div>
                    <span className="text-gray-600 dark:text-gray-400">Not Visited ({notVisitedCount})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-purple-500 flex items-center justify-center">
                      <BookmarkSolidIcon className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-gray-600 dark:text-gray-400">Marked for Review ({markedCount})</span>
                  </div>
                </div>
              </div>

              {/* Question Grid */}
              <div className="grid grid-cols-5 gap-2">
                {test.questions.map((_, index) => {
                  const status = getQuestionStatus(index);
                  const isCurrent = index === currentQuestionIndex;

                  let bgColor = 'bg-gray-300 dark:bg-gray-600';
                  let textColor = 'text-gray-800 dark:text-gray-200';
                  let borderColor = 'border-transparent';

                  if (status === 'answered') {
                    bgColor = 'bg-green-500';
                    textColor = 'text-white';
                  } else if (status === 'not_answered') {
                    bgColor = 'bg-red-500';
                    textColor = 'text-white';
                  } else if (status === 'marked_for_review') {
                    bgColor = 'bg-purple-500';
                    textColor = 'text-white';
                  } else if (status === 'answered_and_marked') {
                    bgColor = 'bg-purple-500';
                    textColor = 'text-white';
                  }

                  if (isCurrent) {
                    borderColor = 'border-blue-600';
                  }

                  return (
                    <button
                      key={index}
                      onClick={() => navigateToQuestion(index)}
                      className={`relative h-10 rounded font-semibold text-sm transition-all border-2 ${bgColor} ${textColor} ${borderColor} hover:scale-105`}
                    >
                      {index + 1}
                      {status === 'marked_for_review' || status === 'answered_and_marked' ? (
                        <BookmarkSolidIcon className="absolute -top-1 -right-1 h-4 w-4 text-yellow-400" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation Bar - Fixed */}
      <div className="bg-white dark:bg-gray-800 border-t-2 border-gray-300 dark:border-gray-700 shadow-lg">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            {/* Left: Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleMarkForReview}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  isCurrentMarked
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {isCurrentMarked ? (
                  <BookmarkSolidIcon className="h-5 w-5" />
                ) : (
                  <BookmarkIcon className="h-5 w-5" />
                )}
                {isCurrentMarked ? 'Unmark' : 'Mark for Review'}
              </button>

              <button
                onClick={handleClearResponse}
                disabled={!isCurrentAnswered}
                className="px-4 py-2 rounded-lg font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <XMarkIcon className="h-5 w-5" />
                Clear Response
              </button>
            </div>

            {/* Center: Navigation */}
            <div className="flex gap-3">
              <button
                onClick={() => navigateToQuestion(Math.max(0, currentQuestionIndex - 1))}
                disabled={currentQuestionIndex === 0}
                className="px-6 py-2 rounded-lg font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <ArrowLeftIcon className="h-5 w-5" />
                Previous
              </button>

              <button
                onClick={() => {
                  if (currentQuestionIndex < test.questions.length - 1) {
                    navigateToQuestion(currentQuestionIndex + 1);
                  }
                }}
                disabled={currentQuestionIndex === test.questions.length - 1}
                className="px-6 py-2 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Save & Next
                <ArrowRightIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Right: Submit Button */}
            <div>
              <button
                onClick={handleSubmitClick}
                className="px-8 py-2 rounded-lg font-bold bg-green-600 text-white hover:bg-green-700 transition-all shadow-lg hover:shadow-xl"
              >
                Submit Test
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      {showSubmitDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0 w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  Submit Test?
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Are you sure you want to submit your test? You will not be able to change your answers after submission.
                </p>

                {/* Summary */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Total Questions:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{test.questions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-600 dark:text-green-400">Answered:</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">{answeredCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-600 dark:text-red-400">Not Answered:</span>
                    <span className="font-semibold text-red-600 dark:text-red-400">
                      {test.questions.length - answeredCount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-600 dark:text-purple-400">Marked for Review:</span>
                    <span className="font-semibold text-purple-600 dark:text-purple-400">{markedCount}</span>
                  </div>
                </div>

                {test.questions.length - answeredCount > 0 && (
                  <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-xs text-yellow-800 dark:text-yellow-200">
                      ⚠️ You have {test.questions.length - answeredCount} unanswered question(s). These will be marked as incorrect.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setShowSubmitDialog(false)}
                disabled={submitting}
                className="px-6 py-2 rounded-lg font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2 rounded-lg font-bold bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Yes, Submit Test'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentTestTakingPage;

