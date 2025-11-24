import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
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
  FolderPlusIcon,
  HashtagIcon
} from '@heroicons/react/24/outline';
import PageHeader from '../../components/Layout/PageHeader';
import { useToast } from '../../hooks/useToast';
import assignmentGeneratorService, { AssignmentRequest } from '../../services/assignmentGeneratorService';
import { exportAsPDF, exportAsDOCX, exportAsTXT } from '../../utils/exportUtils';
import materialsService, { MaterialFolder } from '../../services/materialsService';

interface AssignmentFormData {
  subject: string;
  grade_level: string;
  topic: string;
  assignment_type: string;
  difficulty_level: string;
  duration: string;
  learning_objectives: string;
  number_of_questions?: number;
  additional_context?: string;
  standards?: string;
}

const AssignmentGeneratorPage: React.FC = () => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<AssignmentFormData>();
  const { showSuccess, showError } = useToast();
  const [generating, setGenerating] = useState(false);
  const [generatedAssignment, setGeneratedAssignment] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [formCollapsed, setFormCollapsed] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [folders, setFolders] = useState<MaterialFolder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [saveTitle, setSaveTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastFormData, setLastFormData] = useState<AssignmentFormData | null>(null);
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
      setFolders(foldersList || []);
    } catch (error) {
      console.error('Error loading folders:', error);
      showError('Failed to load folders');
      setFolders([]);
    }
  };

  const handleOpenSaveModal = () => {
    if (!generatedAssignment && !streamingText) {
      showError('No assignment to save');
      return;
    }
    
    if (lastFormData) {
      setSaveTitle(`${lastFormData.assignment_type} - ${lastFormData.subject}: ${lastFormData.topic}`);
    }
    
    setShowSaveModal(true);
  };

  const handleSaveAssignment = async () => {
    if (!saveTitle.trim()) {
      showError('Please enter a title');
      return;
    }

    if (!lastFormData) {
      showError('No assignment data available');
      return;
    }

    setSaving(true);
    try {
      const content = generatedAssignment || streamingText;
      await assignmentGeneratorService.saveAssignment({
        title: saveTitle,
        content: content,
        subject: lastFormData.subject,
        grade_level: lastFormData.grade_level,
        topic: lastFormData.topic,
        assignment_type: lastFormData.assignment_type,
        folder_id: selectedFolderId || undefined,
      });

      showSuccess('Assignment saved to materials!');
      setShowSaveModal(false);
      setSaveTitle('');
      setSelectedFolderId('');
    } catch (error) {
      console.error('Error saving assignment:', error);
      showError('Failed to save assignment');
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

  const onSubmit = async (data: AssignmentFormData) => {
    setGenerating(true);
    setGeneratedAssignment('');
    setStreamingText('');
    setFormCollapsed(true);
    setLastFormData(data);
    let finalText = '';

    await assignmentGeneratorService.generateAssignmentStream(
      { ...data, files: uploadedFiles } as AssignmentRequest,
      (text: string) => {
        finalText = text;
        setStreamingText(text);
      },
      () => {
        setGeneratedAssignment(finalText);
        setStreamingText('');
        setGenerating(false);
        showSuccess('Assignment generated successfully!');
      },
      (error: Error) => {
        setGenerating(false);
        showError(`Failed to generate assignment: ${error.message}`);
      }
    );
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedAssignment || streamingText);
    showSuccess('Assignment copied to clipboard!');
  };

  const handleDownload = async (format: 'pdf' | 'docx' | 'txt') => {
    const text = generatedAssignment || streamingText;
    if (!text) return;
    
    try {
      switch (format) {
        case 'pdf':
          await exportAsPDF(text, 'assignment.pdf');
          showSuccess('Assignment downloaded as PDF!');
          break;
        case 'docx':
          await exportAsDOCX(text, 'assignment.docx');
          showSuccess('Assignment downloaded as DOCX!');
          break;
        case 'txt':
          exportAsTXT(text, 'assignment.txt');
          showSuccess('Assignment downloaded as TXT!');
          break;
      }
      setShowDownloadMenu(false);
    } catch (error) {
      console.error('Error downloading:', error);
      showError('Failed to download assignment');
    }
  };

  const handleReset = () => {
    reset();
    setGeneratedAssignment('');
    setStreamingText('');
    setUploadedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Assignment Generator"
        description="Create comprehensive assignments powered by AI"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Area */}
        <div className={`card p-6 transition-all duration-300 ${formCollapsed ? 'lg:col-span-3' : 'lg:col-span-6'}`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <DocumentTextIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Assignment Details
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

              {/* Topic */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Topic *
                </label>
                <input
                  {...register('topic', { required: 'Topic is required' })}
                  type="text"
                  className="input"
                  placeholder="e.g., Fractions, Photosynthesis, Essay Writing"
                />
                {errors.topic && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.topic.message}</p>
                )}
              </div>

              {/* Assignment Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Assignment Type *
                </label>
                <select
                  {...register('assignment_type', { required: 'Assignment type is required' })}
                  className="input"
                >
                  <option value="">Select type...</option>
                  <option value="essay">Essay</option>
                  <option value="project">Project</option>
                  <option value="worksheet">Worksheet</option>
                  <option value="quiz">Quiz</option>
                  <option value="homework">Homework</option>
                </select>
                {errors.assignment_type && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.assignment_type.message}</p>
                )}
              </div>

              {/* Difficulty Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Difficulty Level *
                </label>
                <select
                  {...register('difficulty_level', { required: 'Difficulty level is required' })}
                  className="input"
                >
                  <option value="">Select difficulty...</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                  <option value="challenging">Challenging</option>
                </select>
                {errors.difficulty_level && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.difficulty_level.message}</p>
                )}
              </div>

              {/* Duration/Length */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Duration/Length *
                </label>
                <div className="relative">
                  <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    {...register('duration', { required: 'Duration/length is required' })}
                    type="text"
                    className="input pl-10"
                    placeholder="e.g., 1 week, 500 words, 2 pages"
                  />
                </div>
                {errors.duration && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.duration.message}</p>
                )}
              </div>

              {/* Number of Questions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Number of Questions (Optional)
                </label>
                <div className="relative">
                  <HashtagIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    {...register('number_of_questions', {
                      valueAsNumber: true,
                      min: { value: 1, message: 'Must be at least 1' },
                      max: { value: 100, message: 'Maximum 100 questions' }
                    })}
                    type="number"
                    className="input pl-10"
                    placeholder="e.g., 10, 15, 20"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Specify how many questions to generate (for quizzes, worksheets, etc.)
                </p>
                {errors.number_of_questions && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.number_of_questions.message}</p>
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
                  placeholder="What should students learn from this assignment?"
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
                  placeholder="Any specific requirements, constraints, or additional information..."
                />
              </div>

              {/* Standards */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Educational Standards (Optional)
                </label>
                <textarea
                  {...register('standards')}
                  rows={2}
                  className="input"
                  placeholder="e.g., Common Core, NGSS, state standards..."
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reference Materials (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    multiple
                    accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.jpg,.jpeg,.png"
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex flex-col items-center cursor-pointer"
                  >
                    <PaperClipIcon className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Click to upload files
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      PDF, DOC, TXT, PPT, Images
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
                      <DocumentTextIcon className="h-5 w-5 mr-2" />
                      Generate Assignment
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
                  Generated Assignment
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {generating ? 'AI is creating your assignment...' : 'Your assignment will appear here'}
                </p>
              </div>
            </div>

            {(generatedAssignment || streamingText) && !generating && (
              <div className="flex space-x-2">
                <button
                  onClick={handleCopy}
                  className="btn btn-sm btn-outline"
                  title="Copy to clipboard"
                >
                  <DocumentDuplicateIcon className="h-4 w-4" />
                </button>

                <button
                  onClick={handleOpenSaveModal}
                  className="btn btn-sm btn-primary flex items-center space-x-1"
                  title="Save to materials"
                >
                  <FolderPlusIcon className="h-4 w-4" />
                  <span className="text-xs">Save</span>
                </button>

                <div className="relative download-dropdown">
                  <button
                    onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                    className="btn btn-sm btn-outline flex items-center space-x-1"
                    title="Download assignment"
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
            {generating || streamingText || generatedAssignment ? (
              <div
                ref={outputRef}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 min-h-[600px] max-h-[600px] overflow-y-auto scroll-smooth"
              >
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {streamingText || generatedAssignment}
                  </ReactMarkdown>
                  {generating && (
                    <span className="inline-block w-0.5 h-5 bg-blue-600 dark:bg-blue-400 animate-pulse ml-0.5 align-middle"></span>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12 min-h-[600px] flex flex-col items-center justify-center text-center">
                <DocumentTextIcon className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
                  No Assignment Yet
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-500 max-w-md">
                  Fill in the assignment details on the left and click "Generate Assignment" to create a comprehensive, AI-powered assignment.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Save Assignment to Materials
                </h3>
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={saveTitle}
                    onChange={(e) => setSaveTitle(e.target.value)}
                    className="input w-full"
                    placeholder="Enter assignment title"
                  />
                </div>

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
                    {folders && folders.map((folder) => (
                      <option key={folder.id} value={folder.id}>
                        {folder.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    This assignment will be saved as a markdown document in your materials library.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="btn btn-outline"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAssignment}
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

export default AssignmentGeneratorPage;

