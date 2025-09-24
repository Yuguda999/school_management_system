import React, { useState, useRef } from 'react';
import { 
  CloudArrowUpIcon, 
  DocumentIcon, 
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { documentService, DocumentType, DocumentUploadData } from '../../services/documentService';
import { useToast } from '../../hooks/useToast';

interface DocumentUploadProps {
  studentId: string;
  onUploadComplete?: (documentId: string) => void;
  onClose?: () => void;
  allowedTypes?: DocumentType[];
  maxFiles?: number;
}

interface UploadFile {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  documentId?: string;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  studentId,
  onUploadComplete,
  onClose,
  allowedTypes,
  maxFiles = 5
}) => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showSuccess, showError } = useToast();

  const documentTypes: { value: DocumentType; label: string }[] = [
    { value: 'birth_certificate', label: 'Birth Certificate' },
    { value: 'passport', label: 'Passport' },
    { value: 'national_id', label: 'National ID' },
    { value: 'medical_record', label: 'Medical Record' },
    { value: 'academic_transcript', label: 'Academic Transcript' },
    { value: 'immunization_record', label: 'Immunization Record' },
    { value: 'photo', label: 'Photo' },
    { value: 'parent_id', label: 'Parent ID' },
    { value: 'proof_of_address', label: 'Proof of Address' },
    { value: 'other', label: 'Other' }
  ];

  const filteredDocumentTypes = allowedTypes 
    ? documentTypes.filter(type => allowedTypes.includes(type.value))
    : documentTypes;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (newFiles: File[]) => {
    if (files.length + newFiles.length > maxFiles) {
      showError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const validFiles: UploadFile[] = [];
    
    newFiles.forEach(file => {
      const validation = documentService.validateFile(file);
      if (validation.valid) {
        validFiles.push({
          file,
          id: Math.random().toString(36).substr(2, 9),
          progress: 0,
          status: 'pending'
        });
      } else {
        showError(`${file.name}: ${validation.error}`);
      }
    });

    setFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const updateFileMetadata = (fileId: string, field: string, value: any) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, [field]: value } : f
    ));
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setUploading(true);

    for (const uploadFile of files) {
      if (uploadFile.status !== 'pending') continue;

      try {
        // Update status to uploading
        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id ? { ...f, status: 'uploading' as const, progress: 0 } : f
        ));

        // Prepare upload data
        const uploadData: DocumentUploadData = {
          title: (uploadFile as any).title || uploadFile.file.name,
          student_id: studentId,
          document_type: (uploadFile as any).document_type || 'other',
          description: (uploadFile as any).description,
          is_public: (uploadFile as any).is_public || false
        };

        // Upload file
        const response = await documentService.uploadDocument(uploadFile.file, uploadData);

        // Update status to success
        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id ? { 
            ...f, 
            status: 'success' as const, 
            progress: 100,
            documentId: response.document_id
          } : f
        ));

        if (onUploadComplete) {
          onUploadComplete(response.document_id);
        }

      } catch (error: any) {
        console.error('Upload failed:', error);
        
        // Update status to error
        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id ? { 
            ...f, 
            status: 'error' as const, 
            error: error.response?.data?.detail || 'Upload failed'
          } : f
        ));
      }
    }

    setUploading(false);
    
    const successCount = files.filter(f => f.status === 'success').length;
    if (successCount > 0) {
      showSuccess(`${successCount} document(s) uploaded successfully`);
    }
  };

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'uploading':
        return <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>;
      default:
        return <DocumentIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragActive
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="text-center">
          <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-4">
            <label htmlFor="file-upload" className="cursor-pointer">
              <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
                Drop files here or click to upload
              </span>
              <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                PDF, DOC, DOCX, JPG, PNG, GIF, WEBP, TXT up to 10MB
              </span>
            </label>
            <input
              ref={fileInputRef}
              id="file-upload"
              name="file-upload"
              type="file"
              className="sr-only"
              multiple
              onChange={handleFileInput}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp,.txt"
            />
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Files to Upload ({files.length})
          </h4>
          
          <div className="space-y-3">
            {files.map((uploadFile) => (
              <div
                key={uploadFile.id}
                className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex-shrink-0 mt-1">
                  {getStatusIcon(uploadFile.status)}
                </div>
                
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {uploadFile.file.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    
                    {uploadFile.status === 'pending' && (
                      <button
                        onClick={() => removeFile(uploadFile.id)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {uploadFile.status === 'pending' && (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                          Title
                        </label>
                        <input
                          type="text"
                          className="mt-1 input text-xs"
                          placeholder="Document title"
                          defaultValue={uploadFile.file.name}
                          onChange={(e) => updateFileMetadata(uploadFile.id, 'title', e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                          Type
                        </label>
                        <select
                          className="mt-1 input text-xs"
                          onChange={(e) => updateFileMetadata(uploadFile.id, 'document_type', e.target.value)}
                        >
                          {filteredDocumentTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                          Description (Optional)
                        </label>
                        <input
                          type="text"
                          className="mt-1 input text-xs"
                          placeholder="Brief description"
                          onChange={(e) => updateFileMetadata(uploadFile.id, 'description', e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {uploadFile.status === 'uploading' && (
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadFile.progress}%` }}
                      ></div>
                    </div>
                  )}

                  {uploadFile.status === 'error' && uploadFile.error && (
                    <p className="text-xs text-red-600 dark:text-red-400">
                      {uploadFile.error}
                    </p>
                  )}

                  {uploadFile.status === 'success' && (
                    <p className="text-xs text-green-600 dark:text-green-400">
                      Upload completed successfully
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end space-x-3">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="btn btn-outline"
            disabled={uploading}
          >
            Cancel
          </button>
        )}
        
        <button
          type="button"
          onClick={uploadFiles}
          disabled={files.length === 0 || uploading || files.every(f => f.status !== 'pending')}
          className="btn btn-primary"
        >
          {uploading ? 'Uploading...' : `Upload ${files.filter(f => f.status === 'pending').length} File(s)`}
        </button>
      </div>
    </div>
  );
};

export default DocumentUpload;
