import React, { useState } from 'react';
import {
  XMarkIcon,
  SparklesIcon,
  EyeIcon,
  ArrowRightIcon,
  StarIcon,
  CheckIcon,
  SwatchIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  TrophyIcon,
  HeartIcon,
  BeakerIcon,
} from '@heroicons/react/24/outline';

interface TemplateGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: any) => void;
}

const TEMPLATE_GALLERY = [
  {
    id: 'classic-academic',
    name: 'Classic Academic',
    description: 'Traditional report card design with clean layout',
    category: 'Traditional',
    thumbnail: 'classic-academic',
    color: 'blue',
    featured: true,
    tags: ['Classic', 'Professional', 'Simple'],
    layout: 'classic',
    elements: [
      {
        id: '1',
        type: 'school_header',
        content: 'SCHOOL NAME\nAddress Line 1\nAddress Line 2',
        x: 50,
        y: 30,
        width: 694,
        height: 80,
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#1f2937',
        zIndex: 1,
        visible: true,
      },
      {
        id: '2',
        type: 'line',
        content: '',
        x: 50,
        y: 110,
        width: 694,
        height: 2,
        backgroundColor: '#1f2937',
        zIndex: 1,
        visible: true,
      },
      {
        id: '3',
        type: 'student_info',
        content: 'Student: [Student Name]\nClass: [Class Name]\nRoll No: [Roll Number]',
        x: 50,
        y: 130,
        width: 694,
        height: 60,
        fontSize: 14,
        textAlign: 'left',
        zIndex: 1,
        visible: true,
      },
      {
        id: '4',
        type: 'grade_table',
        content: 'Grades',
        x: 50,
        y: 200,
        width: 694,
        height: 400,
        borderWidth: 1,
        borderColor: '#d1d5db',
        zIndex: 1,
        visible: true,
        properties: {
          showRemarks: true,
          striped: true,
          headerBackgroundColor: '#f3f4f6',
          headerTextColor: '#374151',
        }
      },
      {
        id: '5',
        type: 'attendance_table',
        content: 'Attendance',
        x: 50,
        y: 620,
        width: 694,
        height: 200,
        borderWidth: 1,
        borderColor: '#d1d5db',
        zIndex: 1,
        visible: true,
        properties: {
          striped: true,
          headerBackgroundColor: '#f3f4f6',
          headerTextColor: '#374151',
        }
      },
      {
        id: '6',
        type: 'signature',
        content: 'Principal Signature: ___________________',
        x: 450,
        y: 850,
        width: 250,
        height: 50,
        fontSize: 12,
        zIndex: 1,
        visible: true,
      }
    ]
  },
  {
    id: 'premium-modern',
    name: 'Premium Modern',
    description: 'Professional sidebar layout with card-style sections',
    category: 'Modern',
    thumbnail: 'premium-modern',
    color: 'indigo',
    featured: true,
    tags: ['Premium', 'Sidebar', 'Professional'],
    layout: 'modern',
    elements: [
      // Sidebar Background
      {
        id: 'bg-sidebar',
        type: 'shape',
        content: '',
        x: 0,
        y: 0,
        width: 250,
        height: 1122,
        backgroundColor: '#1e1b4b', // Dark indigo
        borderWidth: 0,
        borderRadius: 0,
        zIndex: 0,
        visible: true,
      },
      // Sidebar Content
      {
        id: 'school-name-side',
        type: 'text',
        content: 'ACADEMIC\nEXCELLENCE',
        x: 25,
        y: 50,
        width: 200,
        height: 80,
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'left',
        zIndex: 1,
        visible: true,
      },
      {
        id: 'student-photo-placeholder',
        type: 'shape',
        content: '',
        x: 50,
        y: 150,
        width: 150,
        height: 150,
        backgroundColor: '#312e81',
        borderRadius: 75, // Circle
        borderWidth: 2,
        borderColor: '#ffffff',
        zIndex: 1,
        visible: true,
      },
      {
        id: 'student-info-side',
        type: 'student_info',
        content: '[Student Name]\n\nClass: [Class Name]\nRoll: [Roll Number]\nYear: [Academic Year]',
        x: 25,
        y: 330,
        width: 200,
        height: 200,
        fontSize: 14,
        color: '#e0e7ff',
        textAlign: 'left',
        zIndex: 1,
        visible: true,
      },
      // Main Content Area Background
      {
        id: 'header-card',
        type: 'shape',
        content: '',
        x: 280,
        y: 50,
        width: 480,
        height: 100,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        zIndex: 0,
        visible: true,
      },
      {
        id: 'report-title',
        type: 'text',
        content: 'STUDENT PROGRESS REPORT',
        x: 300,
        y: 70,
        width: 440,
        height: 60,
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1e1b4b',
        textAlign: 'left',
        zIndex: 1,
        visible: true,
      },
      // Grades Card
      {
        id: 'grades-card-bg',
        type: 'shape',
        content: '',
        x: 280,
        y: 180,
        width: 480,
        height: 400,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        zIndex: 0,
        visible: true,
      },
      {
        id: 'grades-title',
        type: 'text',
        content: 'Academic Performance',
        x: 300,
        y: 200,
        width: 440,
        height: 40,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#374151',
        textAlign: 'left',
        zIndex: 1,
        visible: true,
      },
      {
        id: 'grade-table',
        type: 'grade_table',
        content: 'Grades',
        x: 300,
        y: 250,
        width: 440,
        height: 300,
        borderWidth: 0,
        zIndex: 1,
        visible: true,
        properties: {
          showRemarks: true,
          striped: true,
          headerBackgroundColor: '#f3f4f6',
          headerTextColor: '#374151',
          compact: true,
        }
      },
      // Attendance Card
      {
        id: 'attendance-card-bg',
        type: 'shape',
        content: '',
        x: 280,
        y: 610,
        width: 480,
        height: 250,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        zIndex: 0,
        visible: true,
      },
      {
        id: 'attendance-title',
        type: 'text',
        content: 'Attendance Record',
        x: 300,
        y: 630,
        width: 440,
        height: 40,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#374151',
        textAlign: 'left',
        zIndex: 1,
        visible: true,
      },
      {
        id: 'attendance-table',
        type: 'attendance_table',
        content: 'Attendance',
        x: 300,
        y: 680,
        width: 440,
        height: 150,
        borderWidth: 0,
        zIndex: 1,
        visible: true,
        properties: {
          striped: true,
          headerBackgroundColor: '#f3f4f6',
          headerTextColor: '#374151',
          compact: true,
        }
      },
      // Signature
      {
        id: 'signature-line',
        type: 'line',
        content: '',
        x: 500,
        y: 950,
        width: 250,
        height: 2,
        backgroundColor: '#374151',
        zIndex: 1,
        visible: true,
      },
      {
        id: 'signature-text',
        type: 'text',
        content: 'Principal Signature',
        x: 500,
        y: 960,
        width: 250,
        height: 30,
        fontSize: 12,
        textAlign: 'center',
        zIndex: 1,
        visible: true,
      }
    ]
  },
  {
    id: 'creative-detailed',
    name: 'Creative Detailed',
    description: 'Comprehensive layout with detailed sections',
    category: 'Creative',
    thumbnail: 'creative-detailed',
    color: 'emerald',
    featured: false,
    tags: ['Detailed', 'Colorful', 'Comprehensive'],
    layout: 'creative',
    elements: [
      {
        id: '1',
        type: 'watermark',
        content: 'OFFICIAL',
        x: 100,
        y: 300,
        width: 600,
        height: 400,
        fontSize: 100,
        fontWeight: 'bold',
        color: '#10b981',
        opacity: 0.05,
        rotation: -30,
        zIndex: 0,
        visible: true,
      },
      {
        id: '2',
        type: 'school_header',
        content: 'ACADEMIC EXCELLENCE SCHOOL',
        x: 50,
        y: 40,
        width: 694,
        height: 60,
        fontSize: 26,
        elements: [
          {
            type: 'school_header',
            content: '🎨 RENAISSANCE ARTS ACADEMY 🎭\nWhere Creativity Flourishes',
            x: 50,
            y: 25,
            width: 694,
            height: 90,
            fontSize: 22,
            fontFamily: 'Trebuchet MS',
            fontWeight: 'bold',
            textAlign: 'center',
            color: '#ec4899',
          },
        ],
      },
      {
        id: '3',
        type: 'line',
        content: '',
        x: 200,
        y: 100,
        width: 394,
        height: 3,
        backgroundColor: '#10b981',
        zIndex: 1,
        visible: true,
      },
      {
        id: '4',
        type: 'student_info',
        content: 'Name: [Student Name]\nGrade: [Class Name]\nYear: [Academic Year]',
        x: 50,
        y: 130,
        width: 694,
        height: 60,
        fontSize: 14,
        textAlign: 'center',
        zIndex: 1,
        visible: true,
      },
      {
        id: '5',
        type: 'grade_table',
        content: 'Subject Grades',
        x: 50,
        y: 210,
        width: 694,
        height: 400,
        borderWidth: 2,
        borderColor: '#10b981',
        zIndex: 1,
        visible: true,
        properties: {
          showRemarks: true,
          striped: true,
          headerBackgroundColor: '#ecfdf5',
          headerTextColor: '#065f46',
        }
      },
      {
        id: '6',
        type: 'behavior_table',
        content: 'Personal Development',
        x: 50,
        y: 530,
        width: 694,
        height: 150,
        borderWidth: 1,
        borderColor: '#10b981',
        zIndex: 1,
        visible: true,
        properties: {
          striped: true,
          headerBackgroundColor: '#ecfdf5',
          headerTextColor: '#065f46',
        }
      },
      {
        id: '7',
        type: 'signature',
        content: 'Class Teacher: ___________________\nPrincipal: ___________________',
        x: 50,
        y: 750,
        width: 694,
        height: 80,
        fontSize: 12,
        textAlign: 'center',
        zIndex: 1,
        visible: true,
      }
    ]
  }
];

const CATEGORIES = [
  'All',
  'Traditional',
  'Modern',
  'Primary School',
  'Secondary School',
  'International',
  'Specialized',
];

const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);

  if (!isOpen) return null;

  const filteredTemplates = TEMPLATE_GALLERY.filter(template =>
    selectedCategory === 'All' || template.category === selectedCategory
  );

  const featuredTemplates = filteredTemplates.filter(template => template.featured);
  const regularTemplates = filteredTemplates.filter(template => !template.featured);

  const handleSelectTemplate = (template: any) => {
    onSelectTemplate({
      id: null,
      name: template.name,
      description: template.description,
      elements: template.elements,
      paperSize: 'A4',
      orientation: 'portrait',
    });
    onClose();
  };

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'from-blue-500 to-blue-600',
      purple: 'from-purple-500 to-purple-600',
      green: 'from-green-500 to-green-600',
      indigo: 'from-indigo-500 to-indigo-600',
      teal: 'from-teal-500 to-teal-600',
      orange: 'from-orange-500 to-orange-600',
      pink: 'from-pink-500 to-pink-600',
      cyan: 'from-cyan-500 to-cyan-600',
    };
    return colorMap[color] || 'from-gray-500 to-gray-600';
  };

  const getIconForCategory = (category: string) => {
    switch (category) {
      case 'Traditional': return AcademicCapIcon;
      case 'Modern': return SparklesIcon;
      case 'Primary School': return HeartIcon;
      case 'Secondary School': return DocumentTextIcon;
      case 'International': return SwatchIcon;
      case 'Specialized': return BeakerIcon;
      default: return DocumentTextIcon;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-6xl w-full h-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <SwatchIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Template Gallery</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Choose from professional pre-designed templates</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar - Categories */}
          <div className="w-64 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">Categories</h4>
            <div className="space-y-1">
              {CATEGORIES.map(category => {
                const IconComponent = getIconForCategory(category);
                const count = category === 'All'
                  ? TEMPLATE_GALLERY.length
                  : TEMPLATE_GALLERY.filter(t => t.category === category).length;

                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-all ${selectedCategory === category
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                      }`}
                  >
                    <div className="flex items-center space-x-2">
                      <IconComponent className="h-4 w-4" />
                      <span>{category}</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${selectedCategory === category
                      ? 'bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                      }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-auto p-6">
            {/* Featured Templates */}
            {featuredTemplates.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center space-x-2 mb-4">
                  <StarIcon className="h-5 w-5 text-yellow-500" />
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Featured Templates</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {featuredTemplates.map(template => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onSelect={() => handleSelectTemplate(template)}
                      onPreview={() => setPreviewTemplate(template)}
                      getColorClasses={getColorClasses}
                      featured
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Regular Templates */}
            {regularTemplates.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {selectedCategory === 'All' ? 'All Templates' : selectedCategory} Templates
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {regularTemplates.map(template => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onSelect={() => handleSelectTemplate(template)}
                      onPreview={() => setPreviewTemplate(template)}
                      getColorClasses={getColorClasses}
                    />
                  ))}
                </div>
              </div>
            )}

            {filteredTemplates.length === 0 && (
              <div className="text-center py-16">
                <DocumentTextIcon className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No templates found</h3>
                <p className="text-gray-500 dark:text-gray-400">Try selecting a different category</p>
              </div>
            )}
          </div>
        </div>

        {/* Template Preview Modal */}
        {previewTemplate && (
          <TemplatePreviewOverlay
            template={previewTemplate}
            onClose={() => setPreviewTemplate(null)}
            onSelect={() => handleSelectTemplate(previewTemplate)}
            getColorClasses={getColorClasses}
          />
        )}
      </div>
    </div>
  );
};

// Template Card Component
interface TemplateCardProps {
  template: any;
  onSelect: () => void;
  onPreview: () => void;
  getColorClasses: (color: string) => string;
  featured?: boolean;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onSelect,
  onPreview,
  getColorClasses,
  featured = false,
}) => {
  return (
    <div className={`group relative bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-200 overflow-hidden ${featured ? 'ring-2 ring-yellow-400 ring-opacity-50' : ''}`}>
      {featured && (
        <div className="absolute top-3 right-3 z-10">
          <div className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
            <StarIcon className="h-3 w-3" />
            <span>Featured</span>
          </div>
        </div>
      )}

      {/* Template Preview */}
      <div className="relative h-48 overflow-hidden">
        <div className={`w-full h-full bg-gradient-to-br ${getColorClasses(template.color)} p-6`}>
          {/* Mock template preview - Unique designs based on template type */}
          <div className="bg-white rounded-lg p-4 h-full shadow-lg transform scale-75 origin-top-left overflow-hidden">
            {template.layout === 'classic' && <ClassicPreview />}
            {template.layout === 'modern' && <ModernPreview />}
            {template.layout === 'playful' && <PlayfulPreview />}
            {template.layout === 'elegant' && <ElegantPreview />}
            {template.layout === 'international' && <InternationalPreview />}
            {template.layout === 'athletic' && <AthleticPreview />}
            {template.layout === 'artistic' && <ArtisticPreview />}
            {template.layout === 'tech' && <TechPreview />}
            {!template.layout && <DefaultPreview />}
          </div>
        </div>

        {/* Hover Actions */}
        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3">
          <button
            onClick={onPreview}
            className="p-3 bg-white bg-opacity-90 rounded-lg text-gray-700 hover:bg-white transition-all"
            title="Preview"
          >
            <EyeIcon className="h-5 w-5" />
          </button>
          <button
            onClick={onSelect}
            className="p-3 bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition-all"
            title="Use Template"
          >
            <CheckIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Template Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{template.name}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{template.description}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {template.tags.slice(0, 3).map((tag: string) => (
            <span
              key={tag}
              className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Action Button */}
        <button
          onClick={onSelect}
          className="w-full flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
        >
          Use This Template
          <ArrowRightIcon className="h-4 w-4 ml-2" />
        </button>
      </div>
    </div>
  );
};

// Template Preview Overlay Component
interface TemplatePreviewOverlayProps {
  template: any;
  onClose: () => void;
  onSelect: () => void;
  getColorClasses: (color: string) => string;
}

const TemplatePreviewOverlay: React.FC<TemplatePreviewOverlayProps> = ({
  template,
  onClose,
  onSelect,
  getColorClasses,
}) => {
  return (
    <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-8">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-full overflow-auto">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
            <p className="text-sm text-gray-500">{template.description}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Preview Content */}
        <div className="p-8">
          <div className="bg-gray-100 rounded-lg p-8 mb-6">
            <div className={`w-full max-w-2xl mx-auto bg-gradient-to-br ${getColorClasses(template.color)} rounded-lg p-8`}>
              <div className="bg-white rounded-lg p-6 shadow-lg">
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">REPORT CARD</h1>
                  <p className="text-gray-600">Academic Year 2024-2025</p>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Student Name</label>
                    <p className="text-lg font-semibold text-gray-900">John Doe Smith</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Class</label>
                    <p className="text-lg font-semibold text-gray-900">Grade 10 - A</p>
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden mb-6">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Subject</th>
                        <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">Score</th>
                        <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t">
                        <td className="px-4 py-2">Mathematics</td>
                        <td className="px-4 py-2 text-center font-semibold">85</td>
                        <td className="px-4 py-2 text-center">
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">A</span>
                        </td>
                      </tr>
                      <tr className="border-t">
                        <td className="px-4 py-2">English</td>
                        <td className="px-4 py-2 text-center font-semibold">78</td>
                        <td className="px-4 py-2 text-center">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">B+</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-600">This is a preview of the {template.name} template</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tags and Category */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="inline-flex items-center px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full mr-2">
                {template.category}
              </span>
              {template.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full mr-1"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
            >
              Close Preview
            </button>
            <button
              onClick={onSelect}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              Use This Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Template Preview Components
const ClassicPreview: React.FC = () => (
  <div className="h-full">
    <div className="text-center mb-3 border-b-2 border-gray-800 pb-2">
      <div className="text-xs font-bold text-gray-800">ST. MARY'S ACADEMY</div>
      <div className="text-xs text-gray-600 italic">Excellentia et Virtus</div>
    </div>
    <div className="space-y-2">
      <div className="flex justify-between text-xs">
        <span className="font-medium">Student:</span>
        <span>________________</span>
      </div>
      <div className="flex justify-between text-xs">
        <span className="font-medium">Class:</span>
        <span>________________</span>
      </div>
      <div className="border border-gray-300 mt-3">
        <table className="w-full text-xs">
          <thead className="bg-gray-100">
            <tr>
              <th className="border-r border-gray-300 p-1 text-left">Subject</th>
              <th className="border-r border-gray-300 p-1">Score</th>
              <th className="p-1">Grade</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-gray-300">
              <td className="border-r border-gray-300 p-1">Mathematics</td>
              <td className="border-r border-gray-300 p-1 text-center">85</td>
              <td className="p-1 text-center">A</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const ModernPreview: React.FC = () => (
  <div className="h-full bg-gray-50">
    <div className="bg-indigo-600 text-white p-2 mb-3">
      <div className="text-xs font-light">FUTURE ACADEMY</div>
      <div className="text-xs opacity-80">Innovation • Excellence • Growth</div>
    </div>
    <div className="px-2 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white p-1 rounded">
          <div className="text-xs text-gray-500">Student</div>
          <div className="h-2 bg-gray-200 rounded mt-1"></div>
        </div>
        <div className="bg-white p-1 rounded">
          <div className="text-xs text-gray-500">Class</div>
          <div className="h-2 bg-gray-200 rounded mt-1"></div>
        </div>
      </div>
      <div className="bg-white p-2 rounded">
        <div className="grid grid-cols-4 gap-1 text-xs">
          <div className="bg-indigo-100 p-1 rounded text-center">Math</div>
          <div className="bg-indigo-100 p-1 rounded text-center">Eng</div>
          <div className="bg-indigo-100 p-1 rounded text-center">Sci</div>
          <div className="bg-indigo-100 p-1 rounded text-center">Art</div>
        </div>
      </div>
    </div>
  </div>
);

const PlayfulPreview: React.FC = () => (
  <div className="h-full bg-gradient-to-br from-yellow-100 to-green-100">
    <div className="text-center mb-2">
      <div className="text-xs font-bold text-green-600">🌟 SUNSHINE ELEMENTARY 🌟</div>
      <div className="text-xs text-green-500">Where Learning is Fun!</div>
    </div>
    <div className="space-y-2 px-1">
      <div className="bg-white rounded-lg p-2 border-2 border-yellow-300">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
          <div className="text-xs">Student Name</div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1">
        <div className="bg-red-200 rounded p-1 text-center">
          <div className="text-xs">🎨</div>
          <div className="text-xs">Art</div>
        </div>
        <div className="bg-blue-200 rounded p-1 text-center">
          <div className="text-xs">📚</div>
          <div className="text-xs">Math</div>
        </div>
        <div className="bg-green-200 rounded p-1 text-center">
          <div className="text-xs">🔬</div>
          <div className="text-xs">Sci</div>
        </div>
      </div>
      <div className="bg-white rounded-lg p-1 border border-rainbow">
        <div className="text-xs text-center text-gray-600">Great Job! 🌟</div>
      </div>
    </div>
  </div>
);

const ElegantPreview: React.FC = () => (
  <div className="h-full bg-gradient-to-b from-gray-50 to-white">
    <div className="border-b border-indigo-200 pb-2 mb-3">
      <div className="text-xs font-bold text-indigo-800 text-center">WESTFIELD HIGH SCHOOL</div>
      <div className="text-xs text-indigo-600 text-center italic">Preparing Leaders of Tomorrow</div>
    </div>
    <div className="space-y-2 px-2">
      <div className="bg-indigo-50 border-l-4 border-indigo-400 p-2">
        <div className="text-xs font-medium text-indigo-800">Academic Performance</div>
        <div className="grid grid-cols-2 gap-2 mt-1">
          <div className="text-xs">GPA: 3.8</div>
          <div className="text-xs">Rank: 15/120</div>
        </div>
      </div>
      <div className="border border-gray-200 rounded">
        <table className="w-full text-xs">
          <tr className="bg-indigo-100">
            <td className="p-1 font-medium">Advanced Mathematics</td>
            <td className="p-1 text-center">A-</td>
          </tr>
          <tr>
            <td className="p-1">English Literature</td>
            <td className="p-1 text-center">A</td>
          </tr>
        </table>
      </div>
    </div>
  </div>
);

const InternationalPreview: React.FC = () => (
  <div className="h-full bg-gradient-to-r from-blue-50 to-teal-50">
    <div className="text-center mb-2 border-b border-teal-200 pb-2">
      <div className="text-xs font-bold text-teal-800">GLOBAL INTERNATIONAL SCHOOL</div>
      <div className="text-xs text-teal-600">🌍 Multiple Languages • Cultures 🌍</div>
    </div>
    <div className="space-y-2 px-1">
      <div className="grid grid-cols-2 gap-1">
        <div className="bg-white p-1 rounded border">
          <div className="text-xs text-gray-500">Student 学生</div>
          <div className="h-2 bg-teal-200 rounded"></div>
        </div>
        <div className="bg-white p-1 rounded border">
          <div className="text-xs text-gray-500">Class 班级</div>
          <div className="h-2 bg-teal-200 rounded"></div>
        </div>
      </div>
      <div className="bg-white rounded border p-1">
        <div className="grid grid-cols-4 gap-1 text-xs">
          <div className="bg-teal-100 p-1 text-center rounded">Math 数学</div>
          <div className="bg-blue-100 p-1 text-center rounded">English</div>
          <div className="bg-green-100 p-1 text-center rounded">中文</div>
          <div className="bg-yellow-100 p-1 text-center rounded">العربية</div>
        </div>
      </div>
    </div>
  </div>
);

const AthleticPreview: React.FC = () => (
  <div className="h-full bg-gradient-to-br from-orange-100 to-red-100">
    <div className="text-center mb-2 bg-orange-600 text-white p-2 rounded">
      <div className="text-xs font-bold">🏆 CHAMPIONS SPORTS ACADEMY 🏆</div>
      <div className="text-xs">Excellence in Sports & Academics</div>
    </div>
    <div className="space-y-2 px-1">
      <div className="grid grid-cols-2 gap-1">
        <div className="bg-white p-1 rounded border-2 border-orange-300">
          <div className="text-xs font-bold">Academic</div>
          <div className="text-xs">GPA: 3.7</div>
        </div>
        <div className="bg-white p-1 rounded border-2 border-red-300">
          <div className="text-xs font-bold">Athletic</div>
          <div className="text-xs">MVP ⭐</div>
        </div>
      </div>
      <div className="bg-white rounded p-1 border">
        <div className="grid grid-cols-3 gap-1 text-xs">
          <div className="bg-orange-200 p-1 text-center rounded">🏀 Basketball</div>
          <div className="bg-red-200 p-1 text-center rounded">📚 Math</div>
          <div className="bg-yellow-200 p-1 text-center rounded">🏃 Track</div>
        </div>
      </div>
    </div>
  </div>
);

const ArtisticPreview: React.FC = () => (
  <div className="h-full bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100">
    <div className="text-center mb-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white p-2 rounded">
      <div className="text-xs font-bold">🎨 RENAISSANCE ARTS ACADEMY 🎭</div>
      <div className="text-xs">Where Creativity Flourishes</div>
    </div>
    <div className="space-y-2 px-1">
      <div className="bg-white p-2 rounded-lg border-2 border-pink-300">
        <div className="grid grid-cols-4 gap-1">
          <div className="bg-pink-200 p-1 rounded text-center text-xs">🎨 Art</div>
          <div className="bg-purple-200 p-1 rounded text-center text-xs">🎵 Music</div>
          <div className="bg-blue-200 p-1 rounded text-center text-xs">🎭 Drama</div>
          <div className="bg-green-200 p-1 rounded text-center text-xs">📝 English</div>
        </div>
      </div>
      <div className="bg-white rounded-lg p-1 border-l-4 border-pink-500">
        <div className="text-xs text-pink-600 font-medium">Creative Portfolio</div>
        <div className="flex space-x-1 mt-1">
          <div className="w-3 h-3 bg-pink-300 rounded"></div>
          <div className="w-3 h-3 bg-purple-300 rounded"></div>
          <div className="w-3 h-3 bg-blue-300 rounded"></div>
        </div>
      </div>
    </div>
  </div>
);

const TechPreview: React.FC = () => (
  <div className="h-full bg-gradient-to-br from-gray-900 to-blue-900 text-white p-2">
    <div className="text-center mb-2 border border-cyan-400 p-1 rounded">
      <div className="text-xs font-bold text-cyan-400">⚡ TESLA TECH INSTITUTE ⚡</div>
      <div className="text-xs text-cyan-300">Innovating the Future Through STEM</div>
    </div>
    <div className="space-y-2">
      <div className="bg-gray-800 rounded p-1 border border-cyan-500">
        <div className="text-xs text-cyan-400">Student ID: #2024-ST-001</div>
        <div className="text-xs text-gray-300">Name: [STUDENT_NAME]</div>
      </div>
      <div className="grid grid-cols-2 gap-1">
        <div className="bg-blue-800 p-1 rounded text-center">
          <div className="text-xs">💻 CS</div>
          <div className="text-xs">A+</div>
        </div>
        <div className="bg-green-800 p-1 rounded text-center">
          <div className="text-xs">🔬 Physics</div>
          <div className="text-xs">A</div>
        </div>
      </div>
      <div className="bg-gray-800 rounded p-1 border border-green-500">
        <div className="text-xs text-green-400">&gt;&gt;&gt; STEM_EXCELLENCE_ACHIEVED</div>
      </div>
    </div>
  </div>
);

const DefaultPreview: React.FC = () => (
  <div className="h-full">
    <div className="text-center mb-3">
      <div className="h-3 bg-gray-800 rounded mb-1"></div>
      <div className="h-2 bg-gray-400 rounded w-3/4 mx-auto"></div>
    </div>
    <div className="space-y-2">
      <div className="flex space-x-2">
        <div className="h-2 bg-gray-300 rounded flex-1"></div>
        <div className="h-2 bg-gray-300 rounded flex-1"></div>
      </div>
      <div className="grid grid-cols-3 gap-1">
        <div className="h-8 bg-blue-100 rounded"></div>
        <div className="h-8 bg-blue-100 rounded"></div>
        <div className="h-8 bg-blue-100 rounded"></div>
      </div>
      <div className="space-y-1">
        <div className="h-1 bg-gray-200 rounded"></div>
        <div className="h-1 bg-gray-200 rounded w-3/4"></div>
      </div>
    </div>
  </div>
);

export default TemplateGallery;
