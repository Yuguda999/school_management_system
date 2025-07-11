import React, { useState, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { 
  XMarkIcon, 
  DocumentArrowUpIcon, 
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { studentService } from '../../services/studentService';
import { useToast } from '../../hooks/useToast';
import LoadingSpinner from '../ui/LoadingSpinner';

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

interface ImportResult {
  total_rows: number;
  successful_imports: number;
  failed_imports: number;
  errors: Array<{
    row: number;
    field: string;
    value: string;
    error: string;
  }>;
  created_students: any[];
}

const CSVImportModal: React.FC<CSVImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showSuccess, showError } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        showError('Please select a CSV file', 'Invalid File Type');
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        showError('File size must be less than 10MB', 'File Too Large');
        return;
      }
      setSelectedFile(file);
      setImportResult(null);
      setShowResults(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      setDownloadingTemplate(true);
      const blob = await studentService.downloadTemplate();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'student_import_template.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showSuccess('Template downloaded successfully', 'Download Complete');
    } catch (error: any) {
      console.error('Failed to download template:', error);
      showError(
        error.response?.data?.detail || 'Failed to download template',
        'Download Failed'
      );
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      showError('Please select a CSV file first', 'No File Selected');
      return;
    }

    try {
      setImporting(true);
      const result = await studentService.importStudents(selectedFile);
      setImportResult(result);
      setShowResults(true);
      
      if (result.successful_imports > 0) {
        showSuccess(
          `Successfully imported ${result.successful_imports} students`,
          'Import Complete'
        );
        onImportComplete();
      }
      
      if (result.failed_imports > 0) {
        showError(
          `${result.failed_imports} students failed to import. Check the results below.`,
          'Import Warnings'
        );
      }
    } catch (error: any) {
      console.error('Failed to import students:', error);
      showError(
        error.response?.data?.detail || 'Failed to import students',
        'Import Failed'
      );
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setImportResult(null);
    setShowResults(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">
                    Import Students from CSV
                  </Dialog.Title>
                  <button
                    onClick={handleClose}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {!showResults ? (
                  <div className="space-y-6">
                    {/* Instructions */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                        Import Instructions
                      </h3>
                      <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                        <li>• Download the CSV template to see the required format</li>
                        <li>• Fill in the student data following the template structure</li>
                        <li>• Supports both comma-separated (CSV) and tab-separated files</li>
                        <li>• Required fields: admission_number, first_name, last_name, date_of_birth, gender, address_line1, city, state, postal_code, admission_date</li>
                        <li>• Optional fields: phone, email, middle_name, class assignment, guardian info, emergency contacts, medical info</li>
                        <li>• Date format should be YYYY-MM-DD (e.g., 2010-05-15)</li>
                        <li>• Gender should be: male, female, or other</li>
                        <li>• Class names must match existing classes in your school (leave empty if not assigning)</li>
                        <li>• Leave optional fields empty if not available</li>
                        <li>• Maximum file size: 10MB</li>
                      </ul>
                    </div>

                    {/* Download Template */}
                    <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          CSV Template
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Download the template with sample data and required headers
                        </p>
                      </div>
                      <button
                        onClick={handleDownloadTemplate}
                        disabled={downloadingTemplate}
                        className="btn btn-secondary flex items-center space-x-2"
                      >
                        {downloadingTemplate ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <DocumentArrowDownIcon className="h-4 w-4" />
                        )}
                        <span>Download Template</span>
                      </button>
                    </div>

                    {/* File Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Select CSV File
                      </label>
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                        <div className="space-y-1 text-center">
                          <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                          <div className="flex text-sm text-gray-600 dark:text-gray-400">
                            <label
                              htmlFor="file-upload"
                              className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                            >
                              <span>Upload a file</span>
                              <input
                                ref={fileInputRef}
                                id="file-upload"
                                name="file-upload"
                                type="file"
                                accept=".csv"
                                className="sr-only"
                                onChange={handleFileSelect}
                              />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            CSV files up to 10MB
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Selected File Info */}
                    {selectedFile && (
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <div className="flex items-center">
                          <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2" />
                          <div>
                            <p className="text-sm font-medium text-green-800 dark:text-green-200">
                              {selectedFile.name}
                            </p>
                            <p className="text-sm text-green-600 dark:text-green-300">
                              {formatFileSize(selectedFile.size)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        onClick={handleClose}
                        className="btn btn-secondary"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleImport}
                        disabled={!selectedFile || importing}
                        className="btn btn-primary flex items-center space-x-2"
                      >
                        {importing ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <DocumentArrowUpIcon className="h-4 w-4" />
                        )}
                        <span>Import Students</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Import Results */
                  <div className="space-y-6">
                    {/* Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {importResult?.total_rows || 0}
                        </div>
                        <div className="text-sm text-blue-800 dark:text-blue-200">
                          Total Rows
                        </div>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {importResult?.successful_imports || 0}
                        </div>
                        <div className="text-sm text-green-800 dark:text-green-200">
                          Successful
                        </div>
                      </div>
                      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                          {importResult?.failed_imports || 0}
                        </div>
                        <div className="text-sm text-red-800 dark:text-red-200">
                          Failed
                        </div>
                      </div>
                    </div>

                    {/* Errors */}
                    {importResult?.errors && importResult.errors.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                          Import Errors
                        </h3>
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 max-h-64 overflow-y-auto">
                          <div className="space-y-2">
                            {importResult.errors.map((error, index) => (
                              <div key={index} className="flex items-start space-x-2">
                                <ExclamationTriangleIcon className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                                <div className="text-sm">
                                  <span className="font-medium text-red-800 dark:text-red-200">
                                    Row {error.row}:
                                  </span>
                                  <span className="text-red-700 dark:text-red-300 ml-1">
                                    {error.error}
                                  </span>
                                  {error.field !== 'general' && (
                                    <span className="text-red-600 dark:text-red-400 ml-1">
                                      (Field: {error.field}, Value: "{error.value}")
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        onClick={() => setShowResults(false)}
                        className="btn btn-secondary"
                      >
                        Import Another File
                      </button>
                      <button
                        onClick={handleClose}
                        className="btn btn-primary"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default CSVImportModal;
