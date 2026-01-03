import React, { useState, useEffect } from 'react';
import {
    PlusIcon,
    MagnifyingGlassIcon,
    EyeIcon,
    PencilIcon,
    DocumentDuplicateIcon,
    TrashIcon,
    StarIcon,
    XMarkIcon,
    ChevronDownIcon,
    SparklesIcon,
    SwatchIcon,
    TagIcon,
    Squares2X2Icon,
    ListBulletIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { TemplateService, ReportCardTemplate } from '../../services/templateService';
import { alertSuccess, alertError } from '../../utils/notifications';
import ModernTemplateEditor from '../../components/templates/ModernTemplateEditor';
import TemplatePreviewModal from '../../components/templates/TemplatePreviewModal';
import TemplateGallery from '../../components/templates/TemplateGallery';
import Card from '../../components/ui/Card';

type ViewMode = 'grid' | 'list';
type SortBy = 'newest' | 'oldest' | 'name' | 'usage' | 'default';
type FilterBy = 'all' | 'published' | 'draft' | 'default';

const ReportCardTemplatesPanel: React.FC = () => {
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
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [renamingTemplate, setRenamingTemplate] = useState<ReportCardTemplate | null>(null);
    const [renameName, setRenameName] = useState('');
    const [renameDescription, setRenameDescription] = useState('');

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
                version: '1.0',
                isActive: true,
                isDefault: false,
                isPublished: false,
            });

            if (newTemplate) {
                setTemplates(prev => [newTemplate, ...prev]);
                setShowCreateModal(false);
                setNewTemplateName('');
                setNewTemplateDescription('');
                setEditingTemplate(newTemplate);
                setShowEditor(true);
            }
        } catch (error) {
            console.error('Error creating template:', error);
        }
    };

    const handleEditTemplate = async (template: ReportCardTemplate) => {
        try {
            const fullTemplate = await TemplateService.getTemplate(template.id);
            if (fullTemplate) {
                setEditingTemplate(fullTemplate);
                setShowEditor(true);
            }
        } catch (error) {
            console.error('Error loading template:', error);
        }
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
                name: `${template.name} (Copy)`,
                description: template.description,
                paperSize: template.paperSize,
                orientation: template.orientation,
                version: template.version,
                isActive: template.isActive,
                isDefault: false,
                isPublished: false,
                elements: template.elements,
            });

            if (duplicatedTemplate) {
                setTemplates(prev => [duplicatedTemplate, ...prev]);
            }
        } catch (error) {
            console.error('Error duplicating template:', error);
        }
    };

    const handleRenameClick = (template: ReportCardTemplate) => {
        setRenamingTemplate(template);
        setRenameName(template.name);
        setRenameDescription(template.description || '');
        setShowRenameModal(true);
    };

    const handleRenameSubmit = async () => {
        if (!renamingTemplate || !renameName.trim()) return;

        try {
            const updated = await TemplateService.updateTemplate(renamingTemplate.id, {
                name: renameName,
                description: renameDescription,
            });

            if (updated) {
                setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t));
                setShowRenameModal(false);
                setRenamingTemplate(null);
            }
        } catch (error) {
            console.error('Error renaming template:', error);
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
                case 'newest': return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
                case 'oldest': return new Date(a.updatedAt || a.createdAt).getTime() - new Date(b.updatedAt || b.createdAt).getTime();
                case 'name': return a.name.localeCompare(b.name);
                case 'usage': return b.usageCount - a.usageCount;
                case 'default': return (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0);
                default: return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
            }
        });
    }, [templates, searchTerm, filterBy, sortBy]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading templates...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <Card variant="glass">
                <div className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex items-center space-x-3">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/30">
                                <SwatchIcon className="h-6 w-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Report Card Templates</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Design and manage your report card layouts</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => setShowTemplateGallery(true)}
                                className="btn btn-secondary flex items-center space-x-2"
                            >
                                <SwatchIcon className="h-4 w-4" />
                                <span>Browse Gallery</span>
                            </button>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="btn btn-primary flex items-center space-x-2"
                            >
                                <SparklesIcon className="h-4 w-4" />
                                <span>Create Template</span>
                            </button>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Search and Filter Bar */}
            <Card variant="glass">
                <div className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1 max-w-md">
                            <div className="relative">
                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search templates..."
                                    className="input pl-10"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex items-center space-x-3 flex-wrap gap-2">
                            <div className="relative">
                                <select
                                    value={filterBy}
                                    onChange={(e) => setFilterBy(e.target.value as FilterBy)}
                                    className="input pr-8 appearance-none"
                                >
                                    <option value="all">All Templates</option>
                                    <option value="published">Published</option>
                                    <option value="draft">Drafts</option>
                                    <option value="default">Default</option>
                                </select>
                                <ChevronDownIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            </div>

                            <div className="relative">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as SortBy)}
                                    className="input pr-8 appearance-none"
                                >
                                    <option value="newest">Recently Updated</option>
                                    <option value="oldest">Oldest First</option>
                                    <option value="name">Name A-Z</option>
                                    <option value="usage">Most Used</option>
                                    <option value="default">Default First</option>
                                </select>
                                <ChevronDownIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            </div>

                            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-md transition-all ${viewMode === 'grid'
                                        ? 'bg-white dark:bg-gray-700 shadow-sm text-primary-600 dark:text-primary-400'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                        }`}
                                >
                                    <Squares2X2Icon className="h-5 w-5" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-md transition-all ${viewMode === 'list'
                                        ? 'bg-white dark:bg-gray-700 shadow-sm text-primary-600 dark:text-primary-400'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                        }`}
                                >
                                    <ListBulletIcon className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Templates Display */}
            {filteredAndSortedTemplates.length === 0 ? (
                <Card variant="glass" className="p-12 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <SwatchIcon className="h-10 w-10 text-purple-600 dark:text-purple-400" />
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
                    <div className="flex justify-center space-x-4">
                        <button
                            onClick={() => setShowTemplateGallery(true)}
                            className="btn btn-secondary"
                        >
                            <SwatchIcon className="h-4 w-4 mr-2" />
                            Browse Gallery
                        </button>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="btn btn-primary"
                        >
                            <SparklesIcon className="h-4 w-4 mr-2" />
                            Create Template
                        </button>
                    </div>
                </Card>
            ) : (
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
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
                            onRename={() => handleRenameClick(template)}
                        />
                    ))}
                </div>
            )}

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
                    onSave={async (templateData) => {
                        if (editingTemplate?.id) {
                            try {
                                const updated = await TemplateService.updateTemplate(editingTemplate.id, templateData);
                                if (updated) {
                                    setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t));
                                    setEditingTemplate(updated);
                                    alertSuccess('Template saved successfully');
                                }
                            } catch (error) {
                                console.error('Error saving template:', error);
                                alertError('Failed to save template');
                            }
                        }
                    }}
                />
            )}

            {/* Template Gallery */}
            {showTemplateGallery && (
                <TemplateGallery
                    isOpen={showTemplateGallery}
                    onClose={() => setShowTemplateGallery(false)}
                    onSelectTemplate={async (templateData) => {
                        try {
                            const newTemplate = await TemplateService.createTemplate({
                                name: templateData.name,
                                description: templateData.description,
                                paperSize: 'A4',
                                orientation: 'portrait',
                                version: '1.0',
                                isActive: true,
                                isDefault: false,
                                isPublished: false,
                                pageMarginTop: 0,
                                pageMarginBottom: 0,
                                pageMarginLeft: 0,
                                pageMarginRight: 0,
                                elements: templateData.elements
                            } as any);

                            if (newTemplate) {
                                setTemplates(prev => [newTemplate, ...prev]);
                                setEditingTemplate(newTemplate);
                                setShowEditor(true);
                                setShowTemplateGallery(false);
                            }
                        } catch (error) {
                            console.error('Error creating template from gallery:', error);
                        }
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

            {/* Rename Template Modal */}
            {showRenameModal && (
                <RenameTemplateModal
                    isOpen={showRenameModal}
                    onClose={() => setShowRenameModal(false)}
                    templateName={renameName}
                    setTemplateName={setRenameName}
                    templateDescription={renameDescription}
                    setTemplateDescription={setRenameDescription}
                    onSubmit={handleRenameSubmit}
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
    onRename: () => void;
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
    onRename,
}) => {
    if (viewMode === 'list') {
        return (
            <Card variant="glass" className="hover:shadow-md transition-all">
                <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={onSelect}
                            className="h-4 w-4 text-primary-600 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                        />
                        <div className="w-16 h-12 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg flex items-center justify-center">
                            <SwatchIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <div className="flex items-center space-x-2">
                                <h3 className="font-semibold text-gray-900 dark:text-white">{template.name}</h3>
                                {template.isDefault && <StarIconSolid className="h-4 w-4 text-yellow-500" />}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{template.description}</p>
                            <div className="flex items-center space-x-4 mt-1">
                                <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${template.isPublished
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                                    }`}>
                                    {template.isPublished ? 'Published' : 'Draft'}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">Used {template.usageCount} times</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button onClick={onPreview} className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all">
                            <EyeIcon className="h-4 w-4" />
                        </button>
                        <button onClick={onEdit} className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-all">
                            <PencilIcon className="h-4 w-4" />
                        </button>
                        <button onClick={onDuplicate} className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all">
                            <DocumentDuplicateIcon className="h-4 w-4" />
                        </button>
                        <button onClick={onRename} className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-all">
                            <TagIcon className="h-4 w-4" />
                        </button>
                        <button onClick={onDelete} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all">
                            <TrashIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </Card>
        );
    }

    return (
        <Card variant="glass" className="group overflow-hidden hover:shadow-lg hover:border-primary-200 dark:hover:border-primary-600 transition-all duration-200 transform hover:-translate-y-1">
            {/* Template Preview */}
            <div className="relative h-40 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-4">
                <div className="w-full h-full bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 relative overflow-hidden">
                    <div className="text-center mb-2">
                        <div className="h-2 bg-purple-200 dark:bg-purple-800 rounded w-3/4 mx-auto mb-1"></div>
                        <div className="h-1 bg-gray-200 dark:bg-gray-600 rounded w-1/2 mx-auto"></div>
                    </div>
                    <div className="space-y-1">
                        <div className="h-1 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
                        <div className="h-1 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                        <div className="grid grid-cols-3 gap-1 mt-2">
                            <div className="h-4 bg-purple-100 dark:bg-purple-900/50 rounded"></div>
                            <div className="h-4 bg-purple-100 dark:bg-purple-900/50 rounded"></div>
                            <div className="h-4 bg-purple-100 dark:bg-purple-900/50 rounded"></div>
                        </div>
                    </div>
                </div>

                {/* Hover Actions */}
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                    <button onClick={onPreview} className="p-2 bg-white/90 rounded-lg text-gray-700 hover:bg-white transition-all">
                        <EyeIcon className="h-5 w-5" />
                    </button>
                    <button onClick={onEdit} className="p-2 bg-white/90 rounded-lg text-gray-700 hover:bg-white transition-all">
                        <PencilIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Template Info */}
            <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white truncate">{template.name}</h3>
                            {template.isDefault && <StarIconSolid className="h-4 w-4 text-yellow-500 flex-shrink-0" />}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">{template.description}</p>
                    </div>
                </div>

                <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${template.isPublished
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                        }`}>
                        {template.isPublished ? 'Published' : 'Draft'}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{template.usageCount} uses</span>
                </div>

                <div className="flex space-x-2">
                    <button onClick={onEdit} className="flex-1 btn btn-primary btn-sm">
                        <PencilIcon className="h-3 w-3 mr-1" />
                        Edit
                    </button>
                    <button onClick={onDuplicate} className="p-2 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                        <DocumentDuplicateIcon className="h-4 w-4" />
                    </button>
                    {!template.isDefault && (
                        <button onClick={onSetDefault} className="p-2 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/20 hover:text-yellow-600">
                            <StarIcon className="h-4 w-4" />
                        </button>
                    )}
                    <button onClick={onDelete} className="p-2 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400" title="Delete">
                        <TrashIcon className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </Card>
    );
};

// Create Template Modal
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
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30">
                                <SparklesIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create Template</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Design a new report card template</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
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
                                className="input"
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
                                className="input resize-none"
                            />
                        </div>
                    </div>

                    <div className="flex space-x-3 mt-6">
                        <button onClick={onClose} className="flex-1 btn btn-secondary">
                            Cancel
                        </button>
                        <button
                            onClick={onSubmit}
                            disabled={!templateName.trim()}
                            className="flex-1 btn btn-primary"
                        >
                            Create Template
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Delete Confirmation Modal
interface DeleteConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete Template</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Are you sure you want to delete this template? This action cannot be undone.
                </p>
                <div className="flex space-x-3">
                    <button onClick={onClose} className="flex-1 btn btn-secondary">Cancel</button>
                    <button onClick={onConfirm} className="flex-1 btn btn-danger">Delete</button>
                </div>
            </div>
        </div>
    );
};

// Rename Template Modal
interface RenameTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    templateName: string;
    setTemplateName: (name: string) => void;
    templateDescription: string;
    setTemplateDescription: (description: string) => void;
    onSubmit: () => void;
}

const RenameTemplateModal: React.FC<RenameTemplateModalProps> = ({
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
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Rename Template</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
                        <input
                            type="text"
                            value={templateName}
                            onChange={(e) => setTemplateName(e.target.value)}
                            className="input"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                        <textarea
                            value={templateDescription}
                            onChange={(e) => setTemplateDescription(e.target.value)}
                            rows={3}
                            className="input resize-none"
                        />
                    </div>
                </div>
                <div className="flex space-x-3 mt-6">
                    <button onClick={onClose} className="flex-1 btn btn-secondary">Cancel</button>
                    <button onClick={onSubmit} disabled={!templateName.trim()} className="flex-1 btn btn-primary">Save</button>
                </div>
            </div>
        </div>
    );
};

export default ReportCardTemplatesPanel;
