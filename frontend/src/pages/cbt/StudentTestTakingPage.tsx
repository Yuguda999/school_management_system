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
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [isMobilePaletteOpen, setIsMobilePaletteOpen] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Initialize test and restore state
  useEffect(() => {
    if (submissionId) {
      startTest();
    }
  }, [submissionId]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (submissionId && test && !submitting && !loading) {
      const stateToSave = {
        answers,
        timeRemaining,
        visitedQuestions: Array.from(visitedQuestions),
        markedForReview: Array.from(markedForReview),
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(`cbt_state_${submissionId}`, JSON.stringify(stateToSave));
      setLastSaved(new Date());
    }
  }, [answers, timeRemaining, visitedQuestions, markedForReview, submissionId, test, submitting, loading]);

  // Navigation guard - prevent accidental tab close/refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!submitting && test) {
        e.preventDefault();
        e.returnValue = ''; // Chrome requires returnValue to be set
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [submitting, test]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining <= 0 || submitting || !test) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, submitting, test]);

  // Warning when time is running out
  useEffect(() => {
    if (timeRemaining === 300) showWarning('5 minutes remaining!');
    if (timeRemaining === 60) showWarning('1 minute remaining!');
  }, [timeRemaining]);

  const startTest = async () => {
    try {
      setLoading(true);
      const testData = await cbtService.startTest(submissionId!);
      setTest(testData);

      // Restore state from localStorage
      const savedState = localStorage.getItem(`cbt_state_${submissionId}`);
      if (savedState) {
        try {
          const parsed = JSON.parse(savedState);
          setAnswers(parsed.answers || {});
          // Only restore time if it's valid and less than duration
          if (parsed.timeRemaining && parsed.timeRemaining > 0) {
            setTimeRemaining(parsed.timeRemaining);
          } else {
            setTimeRemaining(testData.duration_minutes * 60);
          }
          setVisitedQuestions(new Set(parsed.visitedQuestions || [0]));
          setMarkedForReview(new Set(parsed.markedForReview || []));
          showSuccess('Resumed previous session');
        } catch (e) {
          console.error('Failed to parse saved state:', e);
          setTimeRemaining(testData.duration_minutes * 60);
        }
      } else {
        setTimeRemaining(testData.duration_minutes * 60);
      }
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to start test');
      navigate(`/${schoolCode}/cbt/student`);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
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
    setIsMobilePaletteOpen(false); // Close mobile palette on selection
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
      localStorage.removeItem(`cbt_state_${submissionId}`); // Clear saved state
      showSuccess('Test submitted successfully!');
      navigate(`/${schoolCode}/cbt/student/results/${submissionId}`);
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to submit test');
      setSubmitting(false);
    } finally {
      setShowSubmitDialog(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeRemaining <= 60) return 'text-red-600 dark:text-red-400';
    if (timeRemaining <= 300) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  if (loading) return <LoadingSpinner />;
  if (!test) return null;

  const currentQuestion = test.questions[currentQuestionIndex];
  const answeredCount = Object.keys(answers).length;
  const notAnsweredCount = visitedQuestions.size - answeredCount;
  const markedCount = markedForReview.size;
  const currentQuestionId = currentQuestion.id!;
  const isCurrentMarked = markedForReview.has(currentQuestionId);
  const isCurrentAnswered = !!answers[currentQuestionId];

  return (
    <div className="fixed inset-0 bg-gray-50 dark:bg-gray-900 flex flex-col overflow-hidden font-sans">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4 overflow-hidden">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-600/20">
                {test.title.charAt(0)}
              </div>
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">{test.title}</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate hidden sm:block">
                {test.description || 'Computer Based Test'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Timer */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${timeRemaining <= 60 ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' :
                timeRemaining <= 300 ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800' :
                  'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
              }`}>
              <ClockIcon className={`h-5 w-5 ${getTimeColor()}`} />
              <span className={`font-mono font-bold text-lg ${getTimeColor()}`}>
                {formatTime(timeRemaining)}
              </span>
            </div>

            {/* Mobile Palette Toggle */}
            <button
              onClick={() => setIsMobilePaletteOpen(true)}
              className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              <div className="grid grid-cols-3 gap-0.5 w-6 h-6">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className={`rounded-sm ${i < answeredCount ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`} />
                ))}
              </div>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1 w-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full bg-blue-600 transition-all duration-500 ease-out"
            style={{ width: `${(answeredCount / test.questions.length) * 100}%` }}
          />
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative">
        {/* Question Area */}
        <div className="flex-1 overflow-y-auto scroll-smooth">
          <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 pb-24">
            {/* Question Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-300">
              <div className="p-6 sm:p-8">
                <div className="flex justify-between items-start mb-6">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                    Question {currentQuestionIndex + 1} of {test.questions.length}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {currentQuestion.points} pts
                    </span>
                    {isCurrentMarked && (
                      <BookmarkSolidIcon className="h-5 w-5 text-purple-500" />
                    )}
                  </div>
                </div>

                <div className="prose dark:prose-invert max-w-none mb-8">
                  <h2 className="text-xl sm:text-2xl font-medium text-gray-900 dark:text-white leading-relaxed">
                    {currentQuestion.question_text}
                  </h2>
                  {currentQuestion.image_url && (
                    <img
                      src={currentQuestion.image_url}
                      alt="Question"
                      className="mt-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm max-h-96 object-contain bg-gray-50 dark:bg-gray-900"
                    />
                  )}
                </div>

                <div className="space-y-3">
                  {currentQuestion.options.map((option) => {
                    const isSelected = answers[currentQuestionId] === option.id;
                    return (
                      <button
                        key={option.id}
                        onClick={() => handleAnswerSelect(currentQuestionId, option.id!)}
                        className={`w-full group relative flex items-center p-4 rounded-xl border-2 text-left transition-all duration-200 ${isSelected
                            ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/20 shadow-md z-10'
                            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                      >
                        <div className={`flex-shrink-0 h-6 w-6 rounded-full border-2 mr-4 flex items-center justify-center transition-colors ${isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-400 dark:border-gray-500 group-hover:border-blue-400'
                          }`}>
                          {isSelected && <div className="h-2.5 w-2.5 rounded-full bg-white" />}
                        </div>
                        <div className="flex-1">
                          <span className={`text-lg font-medium mr-3 ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`}>
                            {option.option_label}.
                          </span>
                          <span className={`text-base ${isSelected ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-700 dark:text-gray-300'}`}>
                            {option.option_text}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <button
                  onClick={handleMarkForReview}
                  className={`flex items-center gap-2 text-sm font-medium transition-colors ${isCurrentMarked
                      ? 'text-purple-600 dark:text-purple-400'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                >
                  {isCurrentMarked ? <BookmarkSolidIcon className="h-5 w-5" /> : <BookmarkIcon className="h-5 w-5" />}
                  {isCurrentMarked ? 'Marked for Review' : 'Mark for Review'}
                </button>

                <button
                  onClick={handleClearResponse}
                  disabled={!isCurrentAnswered}
                  className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Palette Sidebar */}
        <div className="hidden lg:block w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
          <div className="p-6">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
              Question Palette
            </h3>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <div className="w-3 h-3 rounded-full bg-green-500" /> Answered
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <div className="w-3 h-3 rounded-full bg-gray-200 dark:bg-gray-700" /> Not Visited
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <div className="w-3 h-3 rounded-full bg-purple-500" /> Review
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <div className="w-3 h-3 rounded-full bg-blue-600 ring-2 ring-blue-200" /> Current
              </div>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {test.questions.map((_, index) => {
                const status = getQuestionStatus(index);
                const isCurrent = index === currentQuestionIndex;

                let baseClasses = "h-10 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center relative";
                let colorClasses = "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600";

                if (status === 'answered') colorClasses = "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800";
                if (status.includes('marked')) colorClasses = "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800";
                if (isCurrent) colorClasses = "bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-110 z-10";

                return (
                  <button
                    key={index}
                    onClick={() => navigateToQuestion(index)}
                    className={`${baseClasses} ${colorClasses}`}
                  >
                    {index + 1}
                    {status.includes('marked') && !isCurrent && (
                      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-purple-500 rounded-full border-2 border-white dark:border-gray-800" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile Palette Drawer/Modal */}
        {isMobilePaletteOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobilePaletteOpen(false)} />
            <div className="absolute right-0 top-0 bottom-0 w-80 bg-white dark:bg-gray-800 shadow-2xl p-6 overflow-y-auto animate-slide-in-right">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Question Palette</h3>
                <button onClick={() => setIsMobilePaletteOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                  <XMarkIcon className="h-6 w-6 text-gray-500" />
                </button>
              </div>
              {/* Same grid as desktop */}
              <div className="grid grid-cols-5 gap-3">
                {test.questions.map((_, index) => {
                  const status = getQuestionStatus(index);
                  const isCurrent = index === currentQuestionIndex;

                  let colorClasses = "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400";
                  if (status === 'answered') colorClasses = "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300";
                  if (status.includes('marked')) colorClasses = "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300";
                  if (isCurrent) colorClasses = "bg-blue-600 text-white";

                  return (
                    <button
                      key={index}
                      onClick={() => navigateToQuestion(index)}
                      className={`h-12 rounded-xl text-sm font-medium transition-all ${colorClasses}`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation Bar */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 z-20">
        <div className="max-w-4xl mx-auto flex justify-between items-center gap-4">
          <button
            onClick={() => navigateToQuestion(Math.max(0, currentQuestionIndex - 1))}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span className="hidden sm:inline">Previous</span>
          </button>

          <div className="flex gap-3">
            {currentQuestionIndex < test.questions.length - 1 ? (
              <button
                onClick={() => navigateToQuestion(currentQuestionIndex + 1)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-600/20"
              >
                <span>Next Question</span>
                <ArrowRightIcon className="h-5 w-5" />
              </button>
            ) : (
              <button
                onClick={() => setShowSubmitDialog(true)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold bg-green-600 text-white hover:bg-green-700 active:scale-95 transition-all shadow-lg shadow-green-600/20"
              >
                <span>Submit Test</span>
                <CheckCircleIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Submit Dialog */}
      {showSubmitDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all scale-100">
            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 dark:bg-yellow-900/30 mb-4">
                <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Submit Test?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                You are about to submit your test. This action cannot be undone.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Answered</span>
                <span className="font-bold text-green-600 dark:text-green-400">{answeredCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Unanswered</span>
                <span className="font-bold text-red-600 dark:text-red-400">{notAnsweredCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Marked for Review</span>
                <span className="font-bold text-purple-600 dark:text-purple-400">{markedCount}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowSubmitDialog(false)}
                className="px-4 py-2.5 rounded-xl font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Keep Working
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-4 py-2.5 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/20 transition-all"
              >
                {submitting ? 'Submitting...' : 'Yes, Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentTestTakingPage;

