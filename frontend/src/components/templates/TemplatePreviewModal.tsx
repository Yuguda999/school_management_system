import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  SwatchIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { ReportCardTemplate } from '../../services/templateService';
import { ReportCardRenderer } from './ReportCardRenderer';
import gradeTemplateService from '../../services/gradeTemplateService';
import schoolService from '../../services/schoolService';
import { GradeTemplate } from '../../types';

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
  const [gradeTemplate, setGradeTemplate] = useState<GradeTemplate | null>(null);
  const [schoolData, setSchoolData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [templates, school] = await Promise.all([
          gradeTemplateService.getGradeTemplates(),
          schoolService.getCurrentSchool()
        ]);

        const defaultTemplate = templates.find(t => t.is_default) || templates[0];
        setGradeTemplate(defaultTemplate || null);
        setSchoolData(school);
      } catch (error) {
        console.error('Error loading preview data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

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
    console.log('Download template as PDF');
  };

  // Mock data for preview
  const mockData = {
    schoolName: schoolData?.name || 'Greenwood High School',
    schoolAddress: schoolData?.address || '123 Education Avenue, Academic District',
    schoolMotto: schoolData?.motto || 'Excellence Through Knowledge',
    schoolLogo: schoolData?.logo_url,

    studentName: 'Amaka Johnson',
    className: 'JSS 3A',
    rollNumber: 'GFS/2024/0123',
    academicYear: '2024/2025',
    term: 'First Term',

    totalScore: '865',
    maxScore: '1300',
    percentage: '67',
    position: '5',
    result: 'Qualified',
    presentDays: '118',
    totalDays: '122',
    nextTermDate: '9/1/2025',
  };

  const PAPER_SIZES = {
    'A4': { width: 794, height: 1123 },
    'Letter': { width: 816, height: 1056 },
    'Legal': { width: 816, height: 1344 },
  };

  const paperSize = template.paperSize || 'A4';
  const orientation = template.orientation || 'portrait';
  const width = orientation === 'portrait' ? PAPER_SIZES[paperSize as keyof typeof PAPER_SIZES].width : PAPER_SIZES[paperSize as keyof typeof PAPER_SIZES].height;
  const height = orientation === 'portrait' ? PAPER_SIZES[paperSize as keyof typeof PAPER_SIZES].height : PAPER_SIZES[paperSize as keyof typeof PAPER_SIZES].width;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-7xl w-full h-full max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between shrink-0">
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
                onClick={onClose}
                className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 p-8 flex justify-center">
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div
              className="bg-white shadow-2xl relative transition-transform origin-top"
              style={{
                width: width,
                height: height,
                transform: `scale(${previewScale})`,
                backgroundColor: template.background_color || '#ffffff',
              }}
            >
              {template.elements.map((element) => (
                <ReportCardRenderer
                  key={element.id}
                  element={element}
                  isPreview={true}
                  data={mockData}
                  gradeTemplate={gradeTemplate || undefined}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-900 shrink-0">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center space-x-4">
              <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${template.isPublished
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
