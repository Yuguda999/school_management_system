import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  SparklesIcon,
  DocumentTextIcon,
  ClockIcon,
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
import { LessonPlannerService, LessonPlanRequest } from '../../services/lessonPlannerService';
import { exportAsPDF, exportAsDOCX, exportAsTXT } from '../../utils/exportUtils';
import materialsService, { MaterialFolder } from '../../services/materialsService';

interface LessonPlanFormData {
  subject: string;
  grade_level: string;
  topic: string;
  duration: number;
  learning_objectives: string;
  additional_context?: string;
  standards?: string;
}

const TeacherLessonPlannerPage: React.FC = () => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<LessonPlanFormData>();
  const { showSuccess, showError } = useToast();
  const [generating, setGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [formCollapsed, setFormCollapsed] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [folders, setFolders] = useState<MaterialFolder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [saveTitle, setSaveTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastFormData, setLastFormData] = useState<LessonPlanFormData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

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

  // Load folders when save modal opens
  useEffect(() => {
    if (showSaveModal) {
      loadFolders();
    }
  }, [showSaveModal]);

  const loadFolders = async () => {
    try {
      const foldersList = await materialsService.getFolders();
      setFolders(foldersList);
    } catch (error) {
      console.error('Error loading folders:', error);
      showError('Failed to load folders');
    }
  };

  const handleOpenSaveModal = () => {
    if (!generatedPlan && !streamingText) {
      showError('No lesson plan to save');
      return;
    }

    // Set default title from form data
    if (lastFormData) {
      setSaveTitle(`${lastFormData.subject} - ${lastFormData.topic} (${lastFormData.grade_level})`);
    }

    setShowSaveModal(true);
  };

  const handleSaveLessonPlan = async () => {
    if (!saveTitle.trim()) {
      showError('Please enter a title');
      return;
    }

    if (!lastFormData) {
      showError('No lesson plan data available');
      return;
    }

    setSaving(true);
    try {
      const content = generatedPlan || streamingText;
      await materialsService.saveLessonPlan({
        title: saveTitle,
        content: content,
        subject: lastFormData.subject,
        grade_level: lastFormData.grade_level,
        topic: lastFormData.topic,
        folder_id: selectedFolderId || undefined,
      });

      showSuccess('Lesson plan saved to materials!');
      setShowSaveModal(false);
      setSaveTitle('');
      setSelectedFolderId('');
    } catch (error) {
      console.error('Error saving lesson plan:', error);
      showError('Failed to save lesson plan');
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: LessonPlanFormData) => {
    setGenerating(true);
    setGeneratedPlan('');
    setStreamingText('');
    setFormCollapsed(true); // Auto-collapse form when generation starts
    setLastFormData(data); // Save form data for later use
    let finalText = '';

    await LessonPlannerService.generateLessonPlanStream(
      { ...data, files: uploadedFiles } as LessonPlanRequest,
      // onChunk callback - called for each chunk of text
      (text: string) => {
        finalText = text;
        setStreamingText(text);
      },
      // onComplete callback - called when streaming is done
      () => {
        setGenerating(false);
        setGeneratedPlan(finalText);
        showSuccess('Lesson plan generated successfully!');
      },
      // onError callback - called if an error occurs
      (error: Error) => {
        setGenerating(false);
        console.error('Error generating lesson plan:', error);
        showError(error.message || 'Failed to generate lesson plan');
      }
    );
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPlan || streamingText);
    showSuccess('Lesson plan copied to clipboard!');
  };

  const handleDownload = async (format: 'pdf' | 'docx' | 'txt') => {
    const text = generatedPlan || streamingText;
    if (!text) return;

    try {
      switch (format) {
        case 'pdf':
          await exportAsPDF(text, 'lesson-plan.pdf');
          showSuccess('Lesson plan downloaded as PDF!');
          break;
        case 'docx':
          await exportAsDOCX(text, 'lesson-plan.docx');
          showSuccess('Lesson plan downloaded as DOCX!');
          break;
        case 'txt':
          exportAsTXT(text, 'lesson-plan.txt');
          showSuccess('Lesson plan downloaded as TXT!');
          break;
      }
      setShowDownloadMenu(false);
    } catch (error) {
      console.error('Error downloading:', error);
      showError('Failed to download lesson plan');
    }
  };

  const handleReset = () => {
    reset();
    setGeneratedPlan('');
    setStreamingText('');
    setUploadedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Lesson Plan Generator"
        description="Create comprehensive, engaging lesson plans powered by AI"
        icon={SparklesIcon}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Form */}
        <div className={`card p-6 transition-all duration-300 ${formCollapsed ? 'lg:col-span-3' : 'lg:col-span-6'}`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <DocumentTextIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Lesson Details
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Provide information about your lesson
                </p>
              </div>
            </div>
            {/* Collapse/Expand Button */}
            <button
              type="button"
              onClick={() => setFormCollapsed(!formCollapsed)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Subject */}
            <div>
              <label className="label">
                <BookOpenIcon className="h-4 w-4 inline mr-1" />
                Subject *
              </label>
              <input
                type="text"
                className={`input ${errors.subject ? 'input-error' : ''}`}
                placeholder="e.g., Mathematics, Science, English"
                {...register('subject', { required: 'Subject is required' })}
              />
              {errors.subject && <p className="error-text">{errors.subject.message}</p>}
            </div>

            {/* Grade Level */}
            <div>
              <label className="label">
                <AcademicCapIcon className="h-4 w-4 inline mr-1" />
                Grade Level *
              </label>
              <input
                type="text"
                className={`input ${errors.grade_level ? 'input-error' : ''}`}
                placeholder="e.g., Grade 5, 10th Grade"
                {...register('grade_level', { required: 'Grade level is required' })}
              />
              {errors.grade_level && <p className="error-text">{errors.grade_level.message}</p>}
            </div>

            {/* Topic */}
            <div>
              <label className="label">Topic *</label>
              <input
                type="text"
                className={`input ${errors.topic ? 'input-error' : ''}`}
                placeholder="e.g., Introduction to Fractions"
                {...register('topic', { required: 'Topic is required' })}
              />
              {errors.topic && <p className="error-text">{errors.topic.message}</p>}
            </div>

            {/* Duration */}
            <div>
              <label className="label">
                <ClockIcon className="h-4 w-4 inline mr-1" />
                Duration (minutes) *
              </label>
              <input
                type="number"
                className={`input ${errors.duration ? 'input-error' : ''}`}
                placeholder="45"
                min="15"
                max="240"
                {...register('duration', {
                  required: 'Duration is required',
                  min: { value: 15, message: 'Minimum 15 minutes' },
                  max: { value: 240, message: 'Maximum 240 minutes' }
                })}
              />
              {errors.duration && <p className="error-text">{errors.duration.message}</p>}
            </div>

            {/* Learning Objectives */}
            <div>
              <label className="label">Learning Objectives *</label>
              <textarea
                className={`input min-h-[100px] ${errors.learning_objectives ? 'input-error' : ''}`}
                placeholder="Students will be able to:&#10;- Understand what fractions represent&#10;- Identify numerator and denominator&#10;- Compare simple fractions"
                {...register('learning_objectives', {
                  required: 'Learning objectives are required',
                  minLength: { value: 10, message: 'Please provide detailed objectives' }
                })}
              />
              {errors.learning_objectives && <p className="error-text">{errors.learning_objectives.message}</p>}
            </div>

            {/* Standards */}
            <div>
              <label className="label">Educational Standards (Optional)</label>
              <input
                type="text"
                className="input"
                placeholder="e.g., CCSS.MATH.CONTENT.5.NF.A.1"
                {...register('standards')}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Any specific standards to align with
              </p>
            </div>

            {/* Additional Context */}
            <div>
              <label className="label">Additional Context (Optional)</label>
              <textarea
                className="input min-h-[80px]"
                placeholder="Any additional requirements, student background, or special considerations..."
                {...register('additional_context')}
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="label flex items-center space-x-2">
                <span>Reference Materials (Optional)</span>
              </label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="btn btn-outline cursor-pointer flex items-center space-x-2"
                  >
                    <PaperClipIcon className="h-5 w-5" />
                    <span>Add Files</span>
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Upload documents, PDFs, images, or presentations
                  </p>
                </div>

                {/* Uploaded Files List */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {(file.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                        >
                          <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                AI will analyze these materials and incorporate relevant information into the lesson plan
              </p>
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
                    <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="h-5 w-5 mr-2" />
                    Generate Lesson Plan
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="btn btn-outline"
                disabled={generating}
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
                  Generated Lesson Plan
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {generating ? 'AI is creating your lesson plan...' : 'Your lesson plan will appear here'}
                </p>
              </div>
            </div>

            {(generatedPlan || streamingText) && !generating && (
              <div className="flex space-x-2">
                <button
                  onClick={handleCopy}
                  className="btn btn-sm btn-outline"
                  title="Copy to clipboard"
                >
                  <DocumentDuplicateIcon className="h-4 w-4" />
                </button>

                {/* Save to Materials Button */}
                <button
                  onClick={handleOpenSaveModal}
                  className="btn btn-sm btn-primary flex items-center space-x-1"
                  title="Save to materials"
                >
                  <FolderPlusIcon className="h-4 w-4" />
                  <span className="text-xs">Save</span>
                </button>

                {/* Download Dropdown */}
                <div className="relative download-dropdown">
                  <button
                    onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                    className="btn btn-sm btn-outline flex items-center space-x-1"
                    title="Download lesson plan"
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
            {generating || streamingText || generatedPlan ? (
              <div
                ref={outputRef}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 min-h-[600px] max-h-[600px] overflow-y-auto scroll-smooth"
              >
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {streamingText || generatedPlan}
                  </ReactMarkdown>
                  {generating && (
                    <span className="inline-block w-0.5 h-5 bg-blue-600 dark:bg-blue-400 animate-pulse ml-0.5 align-middle"></span>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12 min-h-[600px] flex flex-col items-center justify-center text-center">
                <SparklesIcon className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
                  No Lesson Plan Yet
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-500 max-w-md">
                  Fill in the lesson details on the left and click "Generate Lesson Plan" to create a comprehensive, AI-powered lesson plan.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save to Materials Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Save Lesson Plan to Materials
                </h3>
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Title Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={saveTitle}
                    onChange={(e) => setSaveTitle(e.target.value)}
                    className="input w-full"
                    placeholder="Enter lesson plan title"
                  />
                </div>

                {/* Folder Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Folder (Optional)
                  </label>
                  <select
                    value={selectedFolderId}
                    onChange={(e) => setSelectedFolderId(e.target.value)}
                    className="input w-full"
                  >
                    <option value="">No folder (Root)</option>
                    {folders.map((folder) => (
                      <option key={folder.id} value={folder.id}>
                        {folder.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Info */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    This lesson plan will be saved as a markdown document in your materials library.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="btn btn-outline"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveLessonPlan}
                  className="btn btn-primary"
                  disabled={saving || !saveTitle.trim()}
                >
                  {saving ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FolderPlusIcon className="h-4 w-4 mr-2" />
                      Save to Materials
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherLessonPlannerPage;

