import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ViewColumnsIcon,
  Squares2X2Icon,
  ListBulletIcon,
  EyeIcon,
  PencilIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  StarIcon,
  XMarkIcon,
  ChevronDownIcon,
  SparklesIcon,
  SwatchIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import PageHeader from '../../components/Layout/PageHeader';
import { TemplateService, ReportCardTemplate } from '../../services/templateService';
import ModernTemplateEditor from '../../components/templates/ModernTemplateEditor';
import TemplatePreviewModal from '../../components/templates/TemplatePreviewModal';
import TemplateGallery from '../../components/templates/TemplateGallery';

type ViewMode = 'grid' | 'list';
type SortBy = 'newest' | 'oldest' | 'name' | 'usage' | 'default';
type FilterBy = 'all' | 'published' | 'draft' | 'default';

const ReportCardTemplatesPage: React.FC = () => {
  const [templates, setTemplates] = useState<ReportCardTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [filterBy, setFilterBy] = useState<FilterBy>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<ReportCardTemplate | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ReportCardTemplate | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set());
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await TemplateService.getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!newTemplateName.trim()) return;

    try {
      const newTemplate = await TemplateService.createTemplate({
        name: newTemplateName,
        description: newTemplateDescription,
        paperSize: 'A4',
        orientation: 'portrait',
        isActive: true,
        isDefault: false,
        isPublished: false,
        usageCount: 0,
        lastUsed: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        creatorName: 'Current User',
        assignmentsCount: 0,
      });

      if (newTemplate) {
        setTemplates(prev => [newTemplate, ...prev]);
        setShowCreateModal(false);
        setNewTemplateName('');
        setNewTemplateDescription('');
        // Auto-open editor for new template
        setEditingTemplate(newTemplate);
        setShowEditor(true);
      }
    } catch (error) {
      console.error('Error creating template:', error);
    }
  };

  const handleEditTemplate = (template: ReportCardTemplate) => {
    setEditingTemplate(template);
    setShowEditor(true);
  };

  const handlePreviewTemplate = (template: ReportCardTemplate) => {
    setPreviewTemplate(template);
    setShowPreview(true);
  };

  const handleDeleteTemplate = (templateId: string) => {
    setTemplateToDelete(templateId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!templateToDelete) return;
    
    try {
      const success = await TemplateService.deleteTemplate(templateToDelete);
      if (success) {
        setTemplates(prev => prev.filter(t => t.id !== templateToDelete));
      }
    } catch (error) {
      console.error('Error deleting template:', error);
    } finally {
      setShowDeleteConfirm(false);
      setTemplateToDelete(null);
    }
  };

  const handleSetDefault = async (templateId: string) => {
    try {
      const updatedTemplates = templates.map(t => ({
        ...t,
        isDefault: t.id === templateId
      }));
      
      setTemplates(updatedTemplates);
      await TemplateService.updateTemplate(templateId, { isDefault: true });
    } catch (error) {
      console.error('Error setting default template:', error);
    }
  };

  const handleDuplicateTemplate = async (template: ReportCardTemplate) => {
    try {
      const duplicatedTemplate = await TemplateService.createTemplate({
        ...template,
        name: `${template.name} (Copy)`,
        isDefault: false,
        isPublished: false,
        usageCount: 0,
        createdAt: new Date().toISOString(),
      });

      if (duplicatedTemplate) {
        setTemplates(prev => [duplicatedTemplate, ...prev]);
      }
    } catch (error) {
      console.error('Error duplicating template:', error);
    }
  };

  const toggleTemplateSelection = (templateId: string) => {
    const newSelection = new Set(selectedTemplates);
    if (newSelection.has(templateId)) {
      newSelection.delete(templateId);
    } else {
      newSelection.add(templateId);
    }
    setSelectedTemplates(newSelection);
  };

  const filteredAndSortedTemplates = React.useMemo(() => {
    let filtered = templates.filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           template.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = (() => {
        switch (filterBy) {
          case 'published': return template.isPublished;
          case 'draft': return !template.isPublished;
          case 'default': return template.isDefault;
          default: return true;
        }
      })();

      return matchesSearch && matchesFilter;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'oldest': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'name': return a.name.localeCompare(b.name);
        case 'usage': return b.usageCount - a.usageCount;
        case 'default': return (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0);
        default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [templates, searchTerm, filterBy, sortBy]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Modern Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <SwatchIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Template Studio</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Design beautiful report cards</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowTemplateGallery(true)}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transform transition-all duration-200 hover:scale-105 shadow-lg"
              >
                <SwatchIcon className="h-5 w-5 mr-2" />
                Browse Gallery
              </button>
          <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transform transition-all duration-200 hover:scale-105 shadow-lg"
          >
                <SparklesIcon className="h-5 w-5 mr-2" />
            Create Template
          </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex-1 max-w-lg">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Filter Dropdown */}
              <div className="relative">
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value as FilterBy)}
                  className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                >
                  <option value="all">All Templates</option>
                  <option value="published">Published</option>
                  <option value="draft">Drafts</option>
                  <option value="default">Default</option>
                </select>
                <ChevronDownIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortBy)}
                  className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name">Name A-Z</option>
                  <option value="usage">Most Used</option>
                  <option value="default">Default First</option>
                </select>
                <ChevronDownIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              </div>

              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-all ${
                    viewMode === 'grid' 
                      ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400' 
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Squares2X2Icon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-all ${
                    viewMode === 'list' 
                      ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400' 
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <ListBulletIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Templates Display */}
        {filteredAndSortedTemplates.length === 0 ? (
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-full flex items-center justify-center mb-6">
              <SwatchIcon className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {searchTerm || filterBy !== 'all' ? 'No templates found' : 'No templates yet'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto">
              {searchTerm || filterBy !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Create your first report card template to get started with beautiful, customized reports.'
              }
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowTemplateGallery(true)}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transform transition-all duration-200 hover:scale-105 shadow-lg"
              >
                <SwatchIcon className="h-5 w-5 mr-2" />
                Browse Gallery
              </button>
            <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transform transition-all duration-200 hover:scale-105 shadow-lg"
              >
                <SparklesIcon className="h-5 w-5 mr-2" />
                Create Your First Template
              </button>
            </div>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}>
            {filteredAndSortedTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                viewMode={viewMode}
                isSelected={selectedTemplates.has(template.id)}
                onSelect={() => toggleTemplateSelection(template.id)}
                onPreview={() => handlePreviewTemplate(template)}
                onEdit={() => handleEditTemplate(template)}
                onDuplicate={() => handleDuplicateTemplate(template)}
                onDelete={() => handleDeleteTemplate(template.id)}
                onSetDefault={() => handleSetDefault(template.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Template Modal */}
      {showCreateModal && (
        <CreateTemplateModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          templateName={newTemplateName}
          setTemplateName={setNewTemplateName}
          templateDescription={newTemplateDescription}
          setTemplateDescription={setNewTemplateDescription}
          onSubmit={handleCreateTemplate}
        />
      )}

      {/* Template Preview Modal */}
      {showPreview && previewTemplate && (
        <TemplatePreviewModal
          template={previewTemplate}
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          onEdit={() => {
            setShowPreview(false);
            handleEditTemplate(previewTemplate);
          }}
        />
      )}

      {/* Template Editor */}
      {showEditor && (
        <ModernTemplateEditor
          template={editingTemplate}
          isOpen={showEditor}
          onClose={() => {
            setShowEditor(false);
            setEditingTemplate(null);
          }}
          onSave={(template) => {
            setShowEditor(false);
            setEditingTemplate(null);
            loadTemplates();
          }}
        />
      )}

      {/* Template Gallery */}
      {showTemplateGallery && (
        <TemplateGallery
          isOpen={showTemplateGallery}
          onClose={() => setShowTemplateGallery(false)}
          onSelectTemplate={(templateData) => {
            // Create a new template from gallery selection
            setEditingTemplate({
              ...templateData,
              id: templateData.id || Date.now().toString(),
              isActive: true,
              isDefault: false,
              isPublished: false,
              usageCount: 0,
              lastUsed: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              creatorName: 'Current User',
              assignmentsCount: 0,
              version: '1.0',
            } as ReportCardTemplate);
            setShowEditor(true);
            setShowTemplateGallery(false);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <DeleteConfirmModal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
};

// Template Card Component
interface TemplateCardProps {
  template: ReportCardTemplate;
  viewMode: ViewMode;
  isSelected: boolean;
  onSelect: () => void;
  onPreview: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  viewMode,
  isSelected,
  onSelect,
  onPreview,
  onEdit,
  onDuplicate,
  onDelete,
  onSetDefault,
}) => {
  if (viewMode === 'list') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelect}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700"
            />
            <div className="w-16 h-12 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-lg flex items-center justify-center">
              <SwatchIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">{template.name}</h3>
                {template.isDefault && <StarIconSolid className="h-4 w-4 text-yellow-500" />}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{template.description}</p>
              <div className="flex items-center space-x-4 mt-1">
                <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                  template.isPublished 
                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}>
                  {template.isPublished ? 'Published' : 'Draft'}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Used {template.usageCount} times</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={onPreview} className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all">
              <EyeIcon className="h-4 w-4" />
            </button>
            <button onClick={onEdit} className="p-2 text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-all">
              <PencilIcon className="h-4 w-4" />
            </button>
            <button onClick={onDuplicate} className="p-2 text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all">
              <DocumentDuplicateIcon className="h-4 w-4" />
            </button>
            <button onClick={onDelete} className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all">
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-600 transition-all duration-200 transform hover:-translate-y-1">
      {/* Template Preview */}
      <div className="relative h-48 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 p-4">
        {/* Mock template preview */}
        <div className="w-full h-full bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 relative overflow-hidden">
          <div className="text-center mb-2">
            <div className="h-2 bg-blue-200 dark:bg-blue-800 rounded w-3/4 mx-auto mb-1"></div>
            <div className="h-1 bg-gray-200 dark:bg-gray-600 rounded w-1/2 mx-auto"></div>
          </div>
          <div className="space-y-1">
            <div className="h-1 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
            <div className="h-1 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
            <div className="grid grid-cols-3 gap-1 mt-2">
              <div className="h-6 bg-blue-100 dark:bg-blue-900 rounded"></div>
              <div className="h-6 bg-blue-100 dark:bg-blue-900 rounded"></div>
              <div className="h-6 bg-blue-100 dark:bg-blue-900 rounded"></div>
            </div>
          </div>
          <div className="absolute top-2 right-2">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelect}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700"
            />
          </div>
        </div>
        
        {/* Hover Actions */}
        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
          <button
            onClick={onPreview}
            className="p-2 bg-white bg-opacity-90 rounded-lg text-gray-700 hover:bg-white transition-all"
            title="Preview"
          >
            <EyeIcon className="h-5 w-5" />
          </button>
          <button
            onClick={onEdit}
            className="p-2 bg-white bg-opacity-90 rounded-lg text-gray-700 hover:bg-white transition-all"
            title="Edit"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Template Info */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate">{template.name}</h3>
              {template.isDefault && <StarIconSolid className="h-4 w-4 text-yellow-500 flex-shrink-0" />}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{template.description}</p>
          </div>
        </div>

        {/* Status and Metrics */}
        <div className="flex items-center justify-between mb-4">
          <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${
            template.isPublished 
              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
          }`}>
            {template.isPublished ? 'Published' : 'Draft'}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">{template.usageCount} uses</span>
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <button
            onClick={onEdit}
            className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            <PencilIcon className="h-4 w-4 mr-1" />
            Edit
          </button>
          <button
            onClick={onDuplicate}
            className="p-2 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            title="Duplicate"
          >
            <DocumentDuplicateIcon className="h-4 w-4" />
          </button>
          {!template.isDefault && (
            <button
              onClick={onSetDefault}
              className="p-2 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/20 hover:text-yellow-600 dark:hover:text-yellow-400 transition-all"
              title="Set as Default"
            >
              <StarIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Create Template Modal Component
interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateName: string;
  setTemplateName: (name: string) => void;
  templateDescription: string;
  setTemplateDescription: (description: string) => void;
  onSubmit: () => void;
}

const CreateTemplateModal: React.FC<CreateTemplateModalProps> = ({
  isOpen,
  onClose,
  templateName,
  setTemplateName,
  templateDescription,
  setTemplateDescription,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-lg flex items-center justify-center">
                <SparklesIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create Template</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Design a new report card template</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Template Name
              </label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., Primary School Report Card"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="Describe what this template is for..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all resize-none"
              />
            </div>
          </div>

          <div className="flex space-x-3 mt-8">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              disabled={!templateName.trim()}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Create & Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Delete Confirmation Modal Component
interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-sm w-full">
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrashIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete Template</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Are you sure you want to delete this template? This action cannot be undone.
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportCardTemplatesPage;