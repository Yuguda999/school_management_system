import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useToast } from '../../hooks/useToast';
import { cbtService } from '../../services/cbtService';
import { academicService } from '../../services/academicService';
import { CBTTestCreate, CBTQuestion, CBTQuestionOption, Subject } from '../../types';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { getSchoolCodeFromUrl } from '../../utils/schoolCode';

const CBTTestCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { testId } = useParams<{ testId: string }>();
  const { showSuccess, showError } = useToast();
  const schoolCode = getSchoolCodeFromUrl();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!testId);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [questions, setQuestions] = useState<CBTQuestion[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const isEditMode = !!testId;

  const { register, handleSubmit, formState: { errors }, watch, reset } = useForm<CBTTestCreate>({
    defaultValues: {
      duration_minutes: 60,
      pass_percentage: 50,
      randomize_questions: false,
      randomize_options: false,
      allow_multiple_attempts: false,
      max_attempts: 1,
      show_results_immediately: true,
      show_correct_answers: true,
    },
  });

  useEffect(() => {
    loadSubjects();
    if (testId) {
      loadTest();
    }
  }, [testId]);

  const loadSubjects = async () => {
    try {
      const data = await academicService.getSubjects({ is_active: true });
      setSubjects(data);
    } catch (error: any) {
      showError('Failed to load subjects');
    }
  };

  const loadTest = async () => {
    try {
      setInitialLoading(true);
      const test = await cbtService.getTest(testId!);

      // Reset form with test data
      reset({
        title: test.title,
        description: test.description,
        subject_id: test.subject_id,
        instructions: test.instructions,
        duration_minutes: test.duration_minutes,
        pass_percentage: test.pass_percentage,
        randomize_questions: test.randomize_questions,
        randomize_options: test.randomize_options,
        allow_multiple_attempts: test.allow_multiple_attempts,
        max_attempts: test.max_attempts,
        show_results_immediately: test.show_results_immediately,
        show_correct_answers: test.show_correct_answers,
      });

      // Set questions
      if (test.questions) {
        setQuestions(test.questions);
      }
    } catch (error: any) {
      showError(error.response?.data?.detail || 'Failed to load test');
      navigate(`/${schoolCode}/cbt/tests`);
    } finally {
      setInitialLoading(false);
    }
  };

  const addQuestion = () => {
    const newQuestion: CBTQuestion = {
      question_text: '',
      points: 1,
      order_number: questions.length + 1,
      options: [
        { option_label: 'A', option_text: '', is_correct: false, order_number: 1 },
        { option_label: 'B', option_text: '', is_correct: false, order_number: 2 },
        { option_label: 'C', option_text: '', is_correct: false, order_number: 3 },
        { option_label: 'D', option_text: '', is_correct: false, order_number: 4 },
      ],
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof CBTQuestion, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const updateOption = (qIndex: number, oIndex: number, field: keyof CBTQuestionOption, value: any) => {
    const updated = [...questions];
    const options = [...updated[qIndex].options];
    
    // If setting is_correct to true, set all others to false
    if (field === 'is_correct' && value === true) {
      options.forEach((opt, i) => {
        opt.is_correct = i === oIndex;
      });
    } else {
      options[oIndex] = { ...options[oIndex], [field]: value };
    }
    
    updated[qIndex] = { ...updated[qIndex], options };
    setQuestions(updated);
  };

  const onSubmit = async (data: CBTTestCreate) => {
    if (questions.length === 0) {
      showError('Please add at least one question');
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim()) {
        showError(`Question ${i + 1} is empty`);
        return;
      }
      
      const hasCorrect = q.options.some(opt => opt.is_correct);
      if (!hasCorrect) {
        showError(`Question ${i + 1} must have a correct answer`);
        return;
      }

      const emptyOptions = q.options.filter(opt => !opt.option_text.trim());
      if (emptyOptions.length > 0) {
        showError(`Question ${i + 1} has empty options`);
        return;
      }
    }

    try {
      setLoading(true);
      const testData: CBTTestCreate = {
        ...data,
        questions,
      };

      if (isEditMode) {
        await cbtService.updateTest(testId!, testData);
        showSuccess('Test updated successfully');
        navigate(`/${schoolCode}/cbt/tests/${testId}`);
      } else {
        const test = await cbtService.createTest(testData);
        showSuccess('Test created successfully');
        navigate(`/${schoolCode}/cbt/tests/${test.id}`);
      }
    } catch (error: any) {
      showError(error.response?.data?.detail || `Failed to ${isEditMode ? 'update' : 'create'} test`);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(`/${schoolCode}/cbt/tests`)}
          className="btn btn-secondary"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEditMode ? 'Edit CBT Test' : 'Create CBT Test'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isEditMode ? 'Update test details and questions' : 'Create a new computer-based test'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Test Details */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Test Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Title *</label>
              <input
                {...register('title', { required: 'Title is required' })}
                className="input w-full"
                placeholder="e.g., Mathematics Mid-Term Exam"
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="label">Description</label>
              <textarea
                {...register('description')}
                className="input w-full"
                rows={3}
                placeholder="Brief description of the test"
              />
            </div>

            <div>
              <label className="label">Subject *</label>
              <select
                {...register('subject_id', { required: 'Subject is required' })}
                className="input w-full"
              >
                <option value="">Select Subject</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
              {errors.subject_id && <p className="text-red-500 text-sm mt-1">{errors.subject_id.message}</p>}
            </div>

            <div>
              <label className="label">Duration (minutes) *</label>
              <input
                type="number"
                {...register('duration_minutes', { required: 'Duration is required', min: 1 })}
                className="input w-full"
              />
              {errors.duration_minutes && <p className="text-red-500 text-sm mt-1">{errors.duration_minutes.message}</p>}
            </div>

            <div>
              <label className="label">Pass Percentage</label>
              <input
                type="number"
                {...register('pass_percentage', { min: 0, max: 100 })}
                className="input w-full"
                placeholder="50"
              />
            </div>

            <div>
              <label className="label">Max Attempts</label>
              <input
                type="number"
                {...register('max_attempts', { min: 1 })}
                className="input w-full"
                placeholder="1"
              />
            </div>

            <div className="md:col-span-2">
              <label className="label">Instructions</label>
              <textarea
                {...register('instructions')}
                className="input w-full"
                rows={3}
                placeholder="Instructions for students taking the test"
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" {...register('randomize_questions')} className="checkbox" />
                <span>Randomize question order</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" {...register('randomize_options')} className="checkbox" />
                <span>Randomize answer options</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" {...register('allow_multiple_attempts')} className="checkbox" />
                <span>Allow multiple attempts</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" {...register('show_results_immediately')} className="checkbox" />
                <span>Show results immediately after submission</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" {...register('show_correct_answers')} className="checkbox" />
                <span>Show correct answers to students</span>
              </label>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Questions ({questions.length})</h2>
            <button
              type="button"
              onClick={addQuestion}
              className="btn btn-primary btn-sm flex items-center gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              Add Question
            </button>
          </div>

          {questions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No questions added yet. Click "Add Question" to get started.
            </div>
          ) : (
            <div className="space-y-6">
              {questions.map((question, qIndex) => (
                <div key={qIndex} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-medium">Question {qIndex + 1}</h3>
                    <button
                      type="button"
                      onClick={() => removeQuestion(qIndex)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="label">Question Text *</label>
                      <textarea
                        value={question.question_text}
                        onChange={(e) => updateQuestion(qIndex, 'question_text', e.target.value)}
                        className="input w-full"
                        rows={3}
                        placeholder="Enter your question here"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">Points</label>
                        <input
                          type="number"
                          value={question.points}
                          onChange={(e) => updateQuestion(qIndex, 'points', Number(e.target.value))}
                          className="input w-full"
                          min="1"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="label mb-2">Answer Options *</label>
                      <div className="space-y-2">
                        {question.options.map((option, oIndex) => (
                          <div key={oIndex} className="flex items-center gap-2">
                            <input
                              type="radio"
                              checked={option.is_correct}
                              onChange={() => updateOption(qIndex, oIndex, 'is_correct', true)}
                              className="radio"
                            />
                            <span className="font-medium w-8">{option.option_label}.</span>
                            <input
                              type="text"
                              value={option.option_text}
                              onChange={(e) => updateOption(qIndex, oIndex, 'option_text', e.target.value)}
                              className="input flex-1"
                              placeholder={`Option ${option.option_label}`}
                            />
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-gray-500 mt-2">Select the correct answer by clicking the radio button</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/cbt/tests')}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? 'Creating...' : 'Create Test'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CBTTestCreatePage;

