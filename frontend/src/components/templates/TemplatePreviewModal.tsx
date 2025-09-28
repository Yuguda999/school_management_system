import React, { useState } from 'react';
import {
  XMarkIcon,
  EyeIcon,
  PencilIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  DocumentTextIcon,
  StarIcon,
  SwatchIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { ReportCardTemplate } from '../../services/templateService';

interface TemplatePreviewModalProps {
  template: ReportCardTemplate;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
}

const TemplatePreviewModal: React.FC<TemplatePreviewModalProps> = ({
  template,
  isOpen,
  onClose,
  onEdit,
}) => {
  const [previewScale, setPreviewScale] = useState(0.8);
  const [previewData, setPreviewData] = useState({
    studentName: 'John Doe Smith',
    className: 'Grade 10 - A',
    rollNumber: 'STU001',
    academicYear: '2024-2025',
    term: 'First Term',
    subjects: [
      { name: 'Mathematics', score: 85, grade: 'A', remark: 'Excellent' },
      { name: 'English Language', score: 78, grade: 'B+', remark: 'Good' },
      { name: 'Physics', score: 92, grade: 'A+', remark: 'Outstanding' },
      { name: 'Chemistry', score: 88, grade: 'A', remark: 'Very Good' },
      { name: 'Biology', score: 82, grade: 'A-', remark: 'Good' },
      { name: 'History', score: 75, grade: 'B', remark: 'Satisfactory' },
      { name: 'Geography', score: 89, grade: 'A', remark: 'Excellent' },
      { name: 'Computer Science', score: 95, grade: 'A+', remark: 'Outstanding' },
    ],
    teacherComment: 'John has shown excellent academic performance throughout the term. He demonstrates strong analytical skills and maintains consistent effort in all subjects. Recommended to continue with current study patterns.',
    principalComment: 'An exemplary student who sets a positive example for his peers. John\'s dedication to learning and respectful behavior make him a valued member of our school community.',
    totalScore: 684,
    averageScore: 85.5,
    position: 3,
    totalStudents: 45,
    nextTermBegins: 'January 15, 2025',
  });

  if (!isOpen) return null;

  const handleZoomIn = () => {
    setPreviewScale(prev => Math.min(prev + 0.1, 1.5));
  };

  const handleZoomOut = () => {
    setPreviewScale(prev => Math.max(prev - 0.1, 0.3));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // This would typically generate a PDF
    console.log('Download template as PDF');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-7xl w-full h-full max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-lg flex items-center justify-center">
              <SwatchIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{template.name}</h3>
                {template.isDefault && <StarIconSolid className="h-5 w-5 text-yellow-500" />}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{template.description}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Zoom Controls */}
            <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={handleZoomOut}
                className="p-2 hover:bg-white dark:hover:bg-gray-600 rounded-md transition-colors"
                title="Zoom Out"
              >
                <MagnifyingGlassMinusIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400 px-2 min-w-[60px] text-center">
                {Math.round(previewScale * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-2 hover:bg-white dark:hover:bg-gray-600 rounded-md transition-colors"
                title="Zoom In"
              >
                <MagnifyingGlassPlusIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrint}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Print"
              >
                <PrinterIcon className="h-5 w-5" />
              </button>
              <button
                onClick={handleDownload}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Download PDF"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
              </button>
              <button
                onClick={onEdit}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PencilIcon className="h-4 w-4 mr-2 inline" />
                Edit Template
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 p-8">
          <div className="flex justify-center">
            <div className="bg-white shadow-2xl relative">
              <div
                className="print:shadow-none"
                style={{
                  width: 794 * previewScale,
                  minHeight: 1123 * previewScale,
                  transform: `scale(${previewScale})`,
                  transformOrigin: 'top left',
                }}
              >
                <div className="w-[794px] min-h-[1123px] p-12 print:p-8">
                  {/* School Header */}
                  <div className="text-center mb-8 border-b-2 border-blue-600 pb-6">
                    <div className="flex items-center justify-center space-x-4 mb-4">
                      <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                        <DocumentTextIcon className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h1 className="text-3xl font-bold text-gray-900">EXCELLENCE ACADEMY</h1>
                        <p className="text-lg text-gray-600">Nurturing Future Leaders</p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>123 Education Street, Learning City, State 12345</p>
                      <p>Phone: (555) 123-4567 | Email: info@excellenceacademy.edu</p>
                    </div>
                  </div>

                  {/* Report Card Title */}
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">ACADEMIC REPORT CARD</h2>
                    <p className="text-lg text-gray-600">Academic Year: {previewData.academicYear} • {previewData.term}</p>
                  </div>

                  {/* Student Information */}
                  <div className="bg-blue-50 rounded-lg p-6 mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Information</h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-600">Student Name</label>
                          <p className="text-lg font-semibold text-gray-900">{previewData.studentName}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600">Class</label>
                          <p className="text-lg font-semibold text-gray-900">{previewData.className}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-600">Roll Number</label>
                          <p className="text-lg font-semibold text-gray-900">{previewData.rollNumber}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600">Academic Year</label>
                          <p className="text-lg font-semibold text-gray-900">{previewData.academicYear}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Academic Performance */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Academic Performance</h3>
                    <div className="overflow-hidden rounded-lg border border-gray-200">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Subject
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Score
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Grade
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Remark
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {previewData.subjects.map((subject, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {subject.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold text-gray-900">
                                {subject.score}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  subject.grade.includes('A') ? 'bg-green-100 text-green-800' :
                                  subject.grade.includes('B') ? 'bg-blue-100 text-blue-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {subject.grade}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                                {subject.remark}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Performance Summary */}
                  <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Performance Summary</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Total Score:</span>
                          <span className="font-semibold text-gray-900">{previewData.totalScore}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Average Score:</span>
                          <span className="font-semibold text-gray-900">{previewData.averageScore}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Class Position:</span>
                          <span className="font-semibold text-gray-900">{previewData.position} of {previewData.totalStudents}</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Grade Analysis</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">A+ Grades:</span>
                          <span className="font-semibold text-green-700">2</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">A Grades:</span>
                          <span className="font-semibold text-green-700">4</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">B+ Grades:</span>
                          <span className="font-semibold text-blue-700">2</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Comments Section */}
                  <div className="space-y-6 mb-8">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Teacher's Comment</h4>
                      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                        <p className="text-sm text-gray-700 leading-relaxed">{previewData.teacherComment}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Principal's Comment</h4>
                      <div className="bg-purple-50 border-l-4 border-purple-400 p-4">
                        <p className="text-sm text-gray-700 leading-relaxed">{previewData.principalComment}</p>
                      </div>
                    </div>
                  </div>

                  {/* Signatures and Footer */}
                  <div className="border-t pt-8">
                    <div className="grid grid-cols-3 gap-8 mb-6">
                      <div className="text-center">
                        <div className="h-16 border-b border-gray-400 mb-2"></div>
                        <p className="text-sm font-medium text-gray-700">Class Teacher</p>
                        <p className="text-xs text-gray-500">Signature & Date</p>
                      </div>
                      <div className="text-center">
                        <div className="h-16 border-b border-gray-400 mb-2"></div>
                        <p className="text-sm font-medium text-gray-700">Parent/Guardian</p>
                        <p className="text-xs text-gray-500">Signature & Date</p>
                      </div>
                      <div className="text-center">
                        <div className="h-16 border-b border-gray-400 mb-2"></div>
                        <p className="text-sm font-medium text-gray-700">Principal</p>
                        <p className="text-xs text-gray-500">Signature & Date</p>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-2">Next Term Begins: {previewData.nextTermBegins}</p>
                      <p className="text-xs text-gray-500">This is a computer-generated report card. For any queries, please contact the school administration.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center space-x-4">
              <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${
                template.isPublished 
                  ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              }`}>
                {template.isPublished ? 'Published' : 'Draft'}
              </span>
              <span>Paper Size: {template.paperSize}</span>
              <span>Orientation: {template.orientation}</span>
            </div>
            <div className="flex items-center space-x-4">
              <span>Used {template.usageCount} times</span>
              <span>Created: {new Date(template.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplatePreviewModal;
