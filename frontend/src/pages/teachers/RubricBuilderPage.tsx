import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  TableCellsIcon,
  AcademicCapIcon,
  BookOpenIcon,
  ArrowPathIcon,
  DocumentDuplicateIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  PaperClipIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FolderPlusIcon
} from '@heroicons/react/24/outline';
import PageHeader from '../../components/Layout/PageHeader';
import { useToast } from '../../hooks/useToast';
import rubricBuilderService, { RubricRequest } from '../../services/rubricBuilderService';
import { exportAsPDF, exportAsDOCX, exportAsTXT } from '../../utils/exportUtils';


interface RubricFormData {
  assignment_title: string;
  subject: string;
  grade_level: string;
  rubric_type: string;
  criteria_count: number;
  performance_levels: number;
  learning_objectives: string;
  additional_context?: string;
}

const RubricBuilderPage: React.FC = () => {
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<RubricFormData>({
    defaultValues: {
      criteria_count: 5,
      performance_levels: 4,
      rubric_type: 'analytic'
    }
  });
  const { showSuccess, showError } = useToast();
  const [generating, setGenerating] = useState(false);
  const [generatedRubric, setGeneratedRubric] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [formCollapsed, setFormCollapsed] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  const [lastFormData, setLastFormData] = useState<RubricFormData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  const criteriaCount = watch('criteria_count');
  const performanceLevels = watch('performance_levels');

  // Auto-scroll to bottom when streaming
  useEffect(() => {
    if (generating && outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [streamingText, generating]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showDownloadMenu) {
        const target = event.target as HTMLElement;
        if (!target.closest('.download-dropdown')) {
          setShowDownloadMenu(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDownloadMenu]);





  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: RubricFormData) => {
    setGenerating(true);
    setGeneratedRubric('');
    setStreamingText('');
    setFormCollapsed(true);
    setLastFormData(data);
    let finalText = '';

    await rubricBuilderService.generateRubricStream(
      { ...data, files: uploadedFiles } as RubricRequest,
      (text: string) => {
        finalText = text;
        setStreamingText(text);
      },
      () => {
        setGeneratedRubric(finalText);
        setStreamingText('');
        setGenerating(false);
        showSuccess('Rubric generated successfully!');
      },
      (error: Error) => {
        setGenerating(false);
        showError(`Failed to generate rubric: ${error.message}`);
      }
    );
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedRubric || streamingText);
    showSuccess('Rubric copied to clipboard!');
  };

  const handleDownload = async (format: 'pdf' | 'docx' | 'txt') => {
    const text = generatedRubric || streamingText;
    if (!text) return;

    try {
      switch (format) {
        case 'pdf':
          await exportAsPDF(text, 'rubric.pdf');
          showSuccess('Rubric downloaded as PDF!');
          break;
        case 'docx':
          await exportAsDOCX(text, 'rubric.docx');
          showSuccess('Rubric downloaded as DOCX!');
          break;
        case 'txt':
          exportAsTXT(text, 'rubric.txt');
          showSuccess('Rubric downloaded as TXT!');
          break;
      }
      setShowDownloadMenu(false);
    } catch (error) {
      console.error('Error downloading:', error);
      showError('Failed to download rubric');
    }
  };

  const handleReset = () => {
    reset();
    setGeneratedRubric('');
    setStreamingText('');
    setUploadedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Rubric Builder"
        description="Create comprehensive grading rubrics powered by AI"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Area */}
        <div className={`card p-6 transition-all duration-300 ${formCollapsed ? 'lg:col-span-3' : 'lg:col-span-6'}`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <TableCellsIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Rubric Details
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Fill in the details below
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setFormCollapsed(!formCollapsed)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors hidden lg:block"
              title={formCollapsed ? 'Expand form' : 'Collapse form'}
            >
              {formCollapsed ? (
                <ChevronRightIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <ChevronLeftIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              )}
            </button>
          </div>

          {!formCollapsed && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Assignment Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Assignment Title *
                </label>
                <input
                  {...register('assignment_title', { required: 'Assignment title is required' })}
                  type="text"
                  className="input"
                  placeholder="e.g., Research Paper on Climate Change"
                />
                {errors.assignment_title && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.assignment_title.message}</p>
                )}
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subject *
                </label>
                <div className="relative">
                  <BookOpenIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    {...register('subject', { required: 'Subject is required' })}
                    type="text"
                    className="input pl-10"
                    placeholder="e.g., Mathematics, Science, English"
                  />
                </div>
                {errors.subject && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.subject.message}</p>
                )}
              </div>

              {/* Grade Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Grade Level *
                </label>
                <div className="relative">
                  <AcademicCapIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    {...register('grade_level', { required: 'Grade level is required' })}
                    type="text"
                    className="input pl-10"
                    placeholder="e.g., Primary 4, Grade 10, JSS 2"
                  />
                </div>
                {errors.grade_level && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.grade_level.message}</p>
                )}
              </div>

              {/* Rubric Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rubric Type *
                </label>
                <select
                  {...register('rubric_type', { required: 'Rubric type is required' })}
                  className="input"
                >
                  <option value="analytic">Analytic (Detailed criteria table)</option>
                  <option value="holistic">Holistic (Overall performance levels)</option>
                  <option value="single-point">Single-Point (Focus on feedback)</option>
                </select>
                {errors.rubric_type && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.rubric_type.message}</p>
                )}
              </div>

              {/* Criteria Count */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Number of Criteria: {criteriaCount}
                </label>
                <input
                  {...register('criteria_count', {
                    required: 'Criteria count is required',
                    min: { value: 3, message: 'Minimum 3 criteria' },
                    max: { value: 10, message: 'Maximum 10 criteria' }
                  })}
                  type="range"
                  min="3"
                  max="10"
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>3</span>
                  <span>10</span>
                </div>
                {errors.criteria_count && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.criteria_count.message}</p>
                )}
              </div>

              {/* Performance Levels */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Performance Levels: {performanceLevels}
                </label>
                <input
                  {...register('performance_levels', {
                    required: 'Performance levels is required',
                    min: { value: 3, message: 'Minimum 3 levels' },
                    max: { value: 5, message: 'Maximum 5 levels' }
                  })}
                  type="range"
                  min="3"
                  max="5"
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>3</span>
                  <span>5</span>
                </div>
                {errors.performance_levels && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.performance_levels.message}</p>
                )}
              </div>

              {/* Learning Objectives */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Learning Objectives *
                </label>
                <textarea
                  {...register('learning_objectives', { required: 'Learning objectives are required', minLength: { value: 10, message: 'Please provide detailed objectives' } })}
                  rows={4}
                  className="input"
                  placeholder="What should students demonstrate in this assignment?"
                />
                {errors.learning_objectives && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.learning_objectives.message}</p>
                )}
              </div>

              {/* Additional Context */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Additional Context (Optional)
                </label>
                <textarea
                  {...register('additional_context')}
                  rows={3}
                  className="input"
                  placeholder="Any specific requirements, focus areas, or additional information..."
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Assignment Description (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    multiple
                    accept=".pdf,.doc,.docx,.txt"
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex flex-col items-center cursor-pointer"
                  >
                    <PaperClipIcon className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Click to upload assignment files
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      PDF, DOC, TXT
                    </span>
                  </label>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded">
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">
                          {file.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="ml-2 text-red-600 hover:text-red-700 dark:text-red-400"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={generating}
                  className="btn btn-primary flex-1"
                >
                  {generating ? (
                    <>
                      <ArrowPathIcon className="h-5 w-5 animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <TableCellsIcon className="h-5 w-5 mr-2" />
                      Generate Rubric
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={generating}
                  className="btn btn-outline"
                >
                  Reset
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Output Area */}
        <div className={`card p-6 transition-all duration-300 ${formCollapsed ? 'lg:col-span-9' : 'lg:col-span-6'}`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Generated Rubric
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {generating ? 'AI is creating your rubric...' : 'Your rubric will appear here'}
                </p>
              </div>
            </div>

            {(generatedRubric || streamingText) && !generating && (
              <div className="flex space-x-2">
                <button
                  onClick={handleCopy}
                  className="btn btn-sm btn-outline"
                  title="Copy to clipboard"
                >
                  <DocumentDuplicateIcon className="h-4 w-4" />
                </button>



                <div className="relative download-dropdown">
                  <button
                    onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                    className="btn btn-sm btn-outline flex items-center space-x-1"
                    title="Download rubric"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                    <span className="text-xs">Download</span>
                  </button>

                  {showDownloadMenu && (
                    <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                      <button
                        onClick={() => handleDownload('pdf')}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
                      >
                        Download as PDF
                      </button>
                      <button
                        onClick={() => handleDownload('docx')}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Download as DOCX
                      </button>
                      <button
                        onClick={() => handleDownload('txt')}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg"
                      >
                        Download as TXT
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            {generating || streamingText || generatedRubric ? (
              <div
                ref={outputRef}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 min-h-[600px] max-h-[600px] overflow-y-auto scroll-smooth"
              >
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {streamingText || generatedRubric}
                  </ReactMarkdown>
                  {generating && (
                    <span className="inline-block w-0.5 h-5 bg-purple-600 dark:bg-purple-400 animate-pulse ml-0.5 align-middle"></span>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12 min-h-[600px] flex flex-col items-center justify-center text-center">
                <TableCellsIcon className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
                  No Rubric Yet
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-500 max-w-md">
                  Fill in the rubric details on the left and click "Generate Rubric" to create a comprehensive, AI-powered grading rubric.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>


    </div>
  );
};

export default RubricBuilderPage;
