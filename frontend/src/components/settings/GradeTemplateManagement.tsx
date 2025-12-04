import React, { useState, useEffect } from 'react';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { GradeTemplate } from '../../types';
import GradeTemplateService from '../../services/gradeTemplateService';
import { useToast } from '../../hooks/useToast';
import GradeTemplateFormModal from './GradeTemplateFormModal';
import ConfirmDialog from '../ui/ConfirmDialog';

const GradeTemplateManagement: React.FC = () => {
    const [templates, setTemplates] = useState<GradeTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<GradeTemplate | null>(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
    const { showSuccess, showError } = useToast();

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const data = await GradeTemplateService.getGradeTemplates();
            setTemplates(data);
        } catch (error: any) {
            showError(error.message || 'Failed to load templates');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNew = () => {
        setEditingTemplate(null);
        setShowFormModal(true);
    };

    const handleEdit = (template: GradeTemplate) => {
        setEditingTemplate(template);
        setShowFormModal(true);
    };

    const handleDelete = async (templateId: string) => {
        setTemplateToDelete(templateId);
        setShowConfirmDialog(true);
    };

    const confirmDelete = async () => {
        if (!templateToDelete) return;

        try {
            await GradeTemplateService.deleteGradeTemplate(templateToDelete);
            showSuccess('Template deleted successfully');
            fetchTemplates();
        } catch (error: any) {
            showError(error.message || 'Failed to delete template');
        } finally {
            setShowConfirmDialog(false);
            setTemplateToDelete(null);
        }
    };

    const handleSetDefault = async (templateId: string) => {
        try {
            await GradeTemplateService.setDefaultTemplate(templateId);
            showSuccess('Default template updated');
            fetchTemplates();
        } catch (error: any) {
            showError(error.message || 'Failed to set default template');
        }
    };

    const handleFormSuccess = () => {
        setShowFormModal(false);
        setEditingTemplate(null);
        fetchTemplates();
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Grade Templates
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Define grading structures with assessment components, grade scales, and remarks
                    </p>
                </div>
                <button
                    onClick={handleCreateNew}
                    className="btn btn-primary flex items-center"
                >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Create Template
                </button>
            </div>

            {templates.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                        No grade templates found. Create your first template to get started.
                    </p>
                    <button onClick={handleCreateNew} className="btn btn-primary">
                        <PlusIcon className="h-5 w-5 mr-2 inline" />
                        Create First Template
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map((template) => (
                        <div
                            key={template.id}
                            className={`bg-white dark:bg-gray-800 rounded-lg border-2 transition-all ${template.is_default
                                    ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-900'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                                }`}
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                                            {template.name}
                                            {template.is_default && (
                                                <CheckCircleIcon className="h-5 w-5 text-blue-600 ml-2" />
                                            )}
                                        </h4>
                                        {template.description && (
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                {template.description}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3 mb-4">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">Total Marks:</span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {template.total_marks}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">Components:</span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {template.assessment_components.length}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">Grade Scales:</span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {template.grade_scales.length}
                                        </span>
                                    </div>
                                </div>

                                {/* Component Preview */}
                                <div className="mb-4">
                                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Assessment Breakdown:
                                    </p>
                                    <div className="space-y-1">
                                        {template.assessment_components.slice(0, 3).map((comp) => (
                                            <div
                                                key={comp.id}
                                                className="flex justify-between text-xs text-gray-600 dark:text-gray-400"
                                            >
                                                <span>{comp.name}</span>
                                                <span className="font-medium">{comp.weight}%</span>
                                            </div>
                                        ))}
                                        {template.assessment_components.length > 3 && (
                                            <p className="text-xs text-gray-500 dark:text-gray-500 italic">
                                                +{template.assessment_components.length - 3} more...
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    {!template.is_default && (
                                        <button
                                            onClick={() => handleSetDefault(template.id)}
                                            className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition"
                                        >
                                            Set as Default
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleEdit(template)}
                                        className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition"
                                        title="Edit"
                                    >
                                        <PencilIcon className="h-4 w-4" />
                                    </button>
                                    {!template.is_default && (
                                        <button
                                            onClick={() => handleDelete(template.id)}
                                            className="px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                                            title="Delete"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {template.is_default && (
                                <div className="px-6 py-2 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-800 rounded-b-lg">
                                    <p className="text-xs text-blue-800 dark:text-blue-200 font-medium">
                                        ✓ Default Template
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Form Modal */}
            {showFormModal && (
                <GradeTemplateFormModal
                    template={editingTemplate}
                    onClose={() => {
                        setShowFormModal(false);
                        setEditingTemplate(null);
                    }}
                    onSuccess={handleFormSuccess}
                />
            )}

            {/* Confirm Delete Dialog */}
            <ConfirmDialog
                isOpen={showConfirmDialog}
                title="Delete Grade Template"
                message="Are you sure you want to delete this template? This action cannot be undone."
                confirmLabel="Delete"
                cancelLabel="Cancel"
                confirmVariant="danger"
                onConfirm={confirmDelete}
                onCancel={() => {
                    setShowConfirmDialog(false);
                    setTemplateToDelete(null);
                }}
            />
        </div>
    );
};

export default GradeTemplateManagement;
