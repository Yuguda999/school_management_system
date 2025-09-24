import React, { useState, useEffect } from 'react';
import {
  DocumentIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { Document, DocumentStatus, documentService } from '../../services/documentService';
import { useToast } from '../../hooks/useToast';
import LoadingSpinner from '../ui/LoadingSpinner';

interface DocumentListProps {
  studentId: string;
  onDocumentUpdate?: () => void;
  showActions?: boolean;
  isAdmin?: boolean;
}

const DocumentList: React.FC<DocumentListProps> = ({
  studentId,
  onDocumentUpdate,
  showActions = true,
  isAdmin = false
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    fetchDocuments();
  }, [studentId]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const docs = await documentService.getStudentDocuments(studentId);
      setDocuments(docs);
    } catch (error: any) {
      console.error('Failed to fetch documents:', error);
      showError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      setActionLoading(doc.id);
      const blob = await documentService.downloadDocument(doc.id);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.original_file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error: any) {
      console.error('Download failed:', error);
      showError('Failed to download document');
    } finally {
      setActionLoading(null);
    }
  };

  const handleView = async (doc: Document) => {
    try {
      setActionLoading(doc.id);
      const blob = await documentService.downloadDocument(doc.id);

      // Create blob URL for viewing
      const url = window.URL.createObjectURL(blob);

      // Open in new tab for viewing
      const newWindow = window.open();
      if (newWindow) {
        newWindow.location.href = url;
      } else {
        // Fallback if popup blocked
        window.open(url, '_blank');
      }

      // Clean up the URL after a delay to allow the browser to load it
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);

    } catch (error: any) {
      console.error('View failed:', error);
      showError('Failed to view document');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (doc: Document) => {
    if (!window.confirm(`Are you sure you want to delete "${doc.title}"?`)) {
      return;
    }

    try {
      setActionLoading(doc.id);
      await documentService.deleteDocument(doc.id);
      showSuccess('Document deleted successfully');
      fetchDocuments();
      if (onDocumentUpdate) onDocumentUpdate();
    } catch (error: any) {
      console.error('Delete failed:', error);
      showError('Failed to delete document');
    } finally {
      setActionLoading(null);
    }
  };

  const handleVerify = async (doc: Document, status: DocumentStatus) => {
    try {
      setActionLoading(doc.id);
      await documentService.verifyDocument(doc.id, { status });
      showSuccess(`Document ${status === 'approved' ? 'approved' : 'rejected'} successfully`);
      fetchDocuments();
      if (onDocumentUpdate) onDocumentUpdate();
    } catch (error: any) {
      console.error('Verification failed:', error);
      showError('Failed to update document status');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: DocumentStatus) => {
    const statusInfo = documentService.getStatusInfo(status);
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    
    const colorClasses = {
      yellow: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      green: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      red: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      gray: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    };

    const StatusIcon = {
      pending: ClockIcon,
      approved: CheckCircleIcon,
      rejected: XCircleIcon,
      expired: ExclamationTriangleIcon
    }[status];

    return (
      <span className={`${baseClasses} ${colorClasses[statusInfo.color as keyof typeof colorClasses]}`}>
        <StatusIcon className="w-3 h-3 mr-1" />
        {statusInfo.name}
      </span>
    );
  };

  const getFileIcon = (doc: Document) => {
    if (doc.is_image) {
      return (
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
          <DocumentIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
      );
    }
    
    if (doc.is_pdf) {
      return (
        <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
          <DocumentIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>
      );
    }
    
    return (
      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
        <DocumentIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="md" />
        <span className="ml-2 text-sm text-gray-500">Loading documents...</span>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-8">
        <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No documents</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          No documents have been uploaded for this student yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start space-x-4">
            {getFileIcon(doc)}

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {doc.title}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {documentService.getDocumentTypeDisplayName(doc.document_type)}
                  </p>
                  {doc.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {doc.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {getStatusBadge(doc.status)}
                </div>
              </div>
              
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                  <span>{doc.file_size_mb} MB</span>
                  <span>Uploaded {new Date(doc.created_at).toLocaleDateString()}</span>
                  {doc.uploader_name && (
                    <span>by {doc.uploader_name}</span>
                  )}
                </div>
                
                {showActions && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleView(doc)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      title="View document"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleDownload(doc)}
                      disabled={actionLoading === doc.id}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
                      title="Download document"
                    >
                      {actionLoading === doc.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                      ) : (
                        <ArrowDownTrayIcon className="w-4 h-4" />
                      )}
                    </button>
                    
                    {isAdmin && (
                      <>
                        {doc.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleVerify(doc, 'approved')}
                              disabled={actionLoading === doc.id}
                              className="text-green-400 hover:text-green-600 disabled:opacity-50"
                              title="Approve document"
                            >
                              <CheckCircleIcon className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => handleVerify(doc, 'rejected')}
                              disabled={actionLoading === doc.id}
                              className="text-red-400 hover:text-red-600 disabled:opacity-50"
                              title="Reject document"
                            >
                              <XCircleIcon className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        
                        <button
                          onClick={() => handleDelete(doc)}
                          disabled={actionLoading === doc.id}
                          className="text-red-400 hover:text-red-600 disabled:opacity-50"
                          title="Delete document"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DocumentList;
