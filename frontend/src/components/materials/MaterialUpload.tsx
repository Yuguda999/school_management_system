import React, { useState, useRef, useCallback } from 'react';
import {
  CloudArrowUpIcon,
  XMarkIcon,
  DocumentIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { MaterialCreate } from '../../types';
import { materialService } from '../../services/materialService';
import { useToast } from '../../hooks/useToast';
import LoadingSpinner from '../ui/LoadingSpinner';

interface MaterialUploadProps {
  onUploadComplete?: () => void;
  onClose?: () => void;
  defaultSubjectId?: string;
  defaultGradeLevel?: string;
  defaultTopic?: string;
  allowBulk?: boolean;
}

interface FileWithProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  materialId?: string;
}

const MaterialUpload: React.FC<MaterialUploadProps> = ({
  onUploadComplete,
  onClose,
  defaultSubjectId,
  defaultGradeLevel,
  defaultTopic,
  allowBulk = true,
}) => {
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<Partial<MaterialCreate>>({
    subject_id: defaultSubjectId,
    grade_level: defaultGradeLevel,
    topic: defaultTopic,
    tags: [],
    is_published: true,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showSuccess, showError } = useToast();

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      addFiles(selectedFiles);
    }
  };

  const addFiles = (newFiles: File[]) => {
    const filesWithProgress: FileWithProgress[] = newFiles.map((file) => ({
      file,
      progress: 0,
      status: 'pending',
    }));

    if (allowBulk) {
      setFiles((prev) => [...prev, ...filesWithProgress]);
    } else {
      setFiles(filesWithProgress.slice(0, 1));
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      showError('Please select at least one file');
      return;
    }

    setUploading(true);

    try {
      if (files.length === 1) {
        // Single file upload
        const fileWithProgress = files[0];
        setFiles((prev) =>
          prev.map((f, i) => (i === 0 ? { ...f, status: 'uploading', progress: 50 } : f))
        );

        const uploadData: MaterialCreate = {
          title: formData.title || fileWithProgress.file.name,
          description: formData.description,
          subject_id: formData.subject_id,
          grade_level: formData.grade_level,
          topic: formData.topic,
          tags: formData.tags,
          is_published: formData.is_published,
          scheduled_publish_at: formData.scheduled_publish_at,
        };

        const response = await materialService.uploadMaterial(fileWithProgress.file, uploadData);

        setFiles((prev) =>
          prev.map((f, i) =>
            i === 0
              ? { ...f, status: 'success', progress: 100, materialId: response.material_id }
              : f
          )
        );

        showSuccess('Material uploaded successfully');
      } else {
        // Bulk upload
        const filesToUpload = files.map((f) => f.file);

        const response = await materialService.bulkUploadMaterials(filesToUpload, {
          subject_id: formData.subject_id,
          grade_level: formData.grade_level,
          topic: formData.topic,
          tags: formData.tags,
          is_published: formData.is_published,
        });

        // Update file statuses based on response
        setFiles((prev) =>
          prev.map((fileWithProgress) => {
            const success = response.successful_uploads.find(
              (s) => s.material_id // Match by some criteria
            );
            const failure = response.failed_uploads.find(
              (f) => f.filename === fileWithProgress.file.name
            );

            if (success) {
              return { ...fileWithProgress, status: 'success', progress: 100 };
            } else if (failure) {
              return {
                ...fileWithProgress,
                status: 'error',
                progress: 0,
                error: failure.error,
              };
            }
            return fileWithProgress;
          })
        );

        showSuccess(
          `Uploaded ${response.success_count} of ${response.total_count} files successfully`
        );
      }

      if (onUploadComplete) {
        onUploadComplete();
      }

      // Reset after a delay
      setTimeout(() => {
        setFiles([]);
        setFormData({
          subject_id: defaultSubjectId,
          grade_level: defaultGradeLevel,
          topic: defaultTopic,
          tags: [],
          is_published: true,
        });
      }, 2000);
    } catch (error: any) {
      console.error('Upload failed:', error);
      showError(error.response?.data?.detail || 'Failed to upload materials');
      setFiles((prev) =>
        prev.map((f) => ({ ...f, status: 'error', error: 'Upload failed' }))
      );
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    return materialService.formatFileSize(bytes);
  };

  return (
    <div className="space-y-6">
      {/* Drag and Drop Area */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500'
        }`}
      >
        <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
        <div className="mt-4">
          <label htmlFor="file-upload" className="cursor-pointer">
            <span className="text-primary-600 dark:text-primary-400 hover:text-primary-500 font-medium">
              Click to upload
            </span>
            <span className="text-gray-600 dark:text-gray-400"> or drag and drop</span>
            <input
              id="file-upload"
              ref={fileInputRef}
              type="file"
              className="sr-only"
              multiple={allowBulk}
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp,.mp4,.mp3,.wav,.zip,.txt,.csv"
            />
          </label>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          PDF, DOC, PPT, XLS, Images, Videos, Audio up to 50MB
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Selected Files ({files.length})
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {files.map((fileWithProgress, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <DocumentIcon className="h-8 w-8 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {fileWithProgress.file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(fileWithProgress.file.size)}
                    </p>
                    {fileWithProgress.status === 'error' && fileWithProgress.error && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        {fileWithProgress.error}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  {fileWithProgress.status === 'success' && (
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  )}
                  {fileWithProgress.status === 'error' && (
                    <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
                  )}
                  {fileWithProgress.status === 'uploading' && (
                    <LoadingSpinner size="sm" />
                  )}
                  {fileWithProgress.status === 'pending' && (
                    <button
                      onClick={() => removeFile(index)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form Fields (for single upload) */}
      {files.length === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title
            </label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={files[0]?.file.name}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Grade Level
              </label>
              <input
                type="text"
                value={formData.grade_level || ''}
                onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })}
                placeholder="e.g., Grade 10"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Topic
              </label>
              <input
                type="text"
                value={formData.topic || ''}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                placeholder="e.g., Algebra"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t dark:border-gray-700">
        {onClose && (
          <button
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleUpload}
          disabled={uploading || files.length === 0}
          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {uploading ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Uploading...
            </>
          ) : (
            <>
              <CloudArrowUpIcon className="h-5 w-5 mr-2" />
              Upload {files.length > 1 ? `${files.length} Files` : 'File'}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default MaterialUpload;

