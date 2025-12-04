import React, { useState, useEffect } from 'react';
import {
    XMarkIcon,
    PlusIcon,
    TrashIcon,
    ArrowsUpDownIcon,
} from '@heroicons/react/24/outline';
import {
    GradeTemplate,
    GradeTemplateCreate,
    AssessmentComponentCreate,
    GradeScaleCreate,
    RemarkTemplateCreate,
} from '../../types';
import GradeTemplateService from '../../services/gradeTemplateService';
import { useToast } from '../../hooks/useToast';
import Modal from '../ui/Modal';

interface Props {
    template?: GradeTemplate | null;
    onClose: () => void;
    onSuccess: () => void;
}

const GradeTemplateFormModal: React.FC<Props> = ({ template, onClose, onSuccess }) => {
    const { showSuccess, showError } = useToast();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'components' | 'scales' | 'remarks'>('components');

    // Form state
    const [name, setName] = useState(template?.name || '');
    const [description, setDescription] = useState(template?.description || '');
    const [totalMarks, setTotalMarks] = useState(template?.total_marks || 100);
    const [components, setComponents] = useState<AssessmentComponentCreate[]>(
        template?.assessment_components.map((c, idx) => ({
            name: c.name,
            weight: c.weight,
            is_required: c.is_required,
            order: idx,
        })) || []
    );
    const [scales, setScales] = useState<GradeScaleCreate[]>(
        template?.grade_scales.map((s, idx) => ({
            grade: s.grade,
            min_score: s.min_score,
            max_score: s.max_score,
            remark: s.remark || '',
            color: s.color || '',
            order: idx,
        })) || []
    );
    const [remarks, setRemarks] = useState<RemarkTemplateCreate[]>(
        template?.remark_templates.map((r, idx) => ({
            min_percentage: r.min_percentage,
            max_percentage: r.max_percentage,
            remark_text: r.remark_text,
            order: idx,
        })) || []
    );

    // Validation
    const totalWeight = components.reduce((sum, c) => sum + Number(c.weight), 0);
    const isWeightValid = Math.abs(totalWeight - 100) < 0.01;

    const handleAddComponent = () => {
        setComponents([...components, { name: '', weight: 0, is_required: true, order: components.length }]);
    };

    const handleRemoveComponent = (index: number) => {
        setComponents(components.filter((_, i) => i !== index));
    };

    const handleComponentChange = (index: number, field: keyof AssessmentComponentCreate, value: any) => {
        const updated = [...components];
        updated[index] = { ...updated[index], [field]: value };
        setComponents(updated);
    };

    const handleAddScale = () => {
        setScales([...scales, { grade: '', min_score: 0, max_score: 0, remark: '', color: '#6b7280', order: scales.length }]);
    };

    const handleRemoveScale = (index: number) => {
        setScales(scales.filter((_, i) => i !== index));
    };

    const handleScaleChange = (index: number, field: keyof GradeScaleCreate, value: any) => {
        const updated = [...scales];
        updated[index] = { ...updated[index], [field]: value };
        setScales(updated);
    };

    const handleAddRemark = () => {
        setRemarks([...remarks, { min_percentage: 0, max_percentage: 0, remark_text: '', order: remarks.length }]);
    };

    const handleRemoveRemark = (index: number) => {
        setRemarks(remarks.filter((_, i) => i !== index));
    };

    const handleRemarkChange = (index: number, field: keyof RemarkTemplateCreate, value: any) => {
        const updated = [...remarks];
        updated[index] = { ...updated[index], [field]: value };
        setRemarks(updated);
    };

    const loadPresetComponents = (presetName: string) => {
        const presets = GradeTemplateService.getPresetAssessmentComponents();
        if (presets[presetName]) {
            setComponents(presets[presetName].map((c, idx) => ({ ...c, order: idx })));
        }
    };

    const loadPresetScales = (presetName: string) => {
        const presets = GradeTemplateService.getPresetGradeScales();
        if (presets[presetName]) {
            setScales(presets[presetName].map((s, idx) => ({ ...s, order: idx })));
        }
    };

    const loadSuggestedRemarks = () => {
        setRemarks(GradeTemplateService.getSuggestedRemarks().map((r, idx) => ({ ...r, order: idx })));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            showError('Please enter a template name');
            return;
        }

        if (components.length === 0) {
            showError('Please add at least one assessment component');
            return;
        }

        if (!isWeightValid) {
            showError(`Total weight must equal 100%, current total: ${totalWeight.toFixed(2)}%`);
            return;
        }

        if (scales.length === 0) {
            showError('Please add at least one grade scale');
            return;
        }

        setLoading(true);
        try {
            const data: GradeTemplateCreate = {
                name,
                description,
                total_marks: totalMarks,
                assessment_components: components,
                grade_scales: scales,
                remark_templates: remarks,
            };

            if (template) {
                await GradeTemplateService.updateGradeTemplate(template.id, data);
                showSuccess('Template updated successfully');
            } else {
                await GradeTemplateService.createGradeTemplate(data);
                showSuccess('Template created successfully');
            }

            onSuccess();
        } catch (error: any) {
            showError(error.message || 'Failed to save template');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen onClose={onClose} title={template ? 'Edit Grade Template' : 'Create Grade Template'} size="2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Template Name *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="input"
                            placeholder="e.g., Standard Grading System"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="input"
                            rows={2}
                            placeholder="Optional description"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Total Marks
                        </label>
                        <input
                            type="number"
                            value={totalMarks}
                            onChange={(e) => setTotalMarks(Number(e.target.value))}
                            className="input"
                            min="1"
                            required
                        />
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="-mb-px flex space-x-8">
                        {[
                            { id: 'components', name: 'Assessment Components', count: components.length },
                            { id: 'scales', name: 'Grade Scales', count: scales.length },
                            { id: 'remarks', name: 'Remarks', count: remarks.length },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400'
                                    }`}
                            >
                                {tab.name} ({tab.count})
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="max-h-96 overflow-y-auto">
                    {/* Components Tab */}
                    {activeTab === 'components' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Total Weight: <span className={isWeightValid ? 'text-green-600' : 'text-red-600 font-semibold'}>{totalWeight.toFixed(2)}%</span>
                                    {!isWeightValid && <span className="text-red-600 ml-2">(Must equal 100%)</span>}
                                </p>
                                <select
                                    onChange={(e) => e.target.value && loadPresetComponents(e.target.value)}
                                    className="input text-sm w-auto"
                                    defaultValue=""
                                >
                                    <option value="">Load Preset...</option>
                                    {Object.keys(GradeTemplateService.getPresetAssessmentComponents()).map((key) => (
                                        <option key={key} value={key}>{key}</option>
                                    ))}
                                </select>
                            </div>

                            {components.map((comp, idx) => (
                                <div key={idx} className="flex gap-2 items-start p-3 bg-gray-50 dark:bg-gray-800 rounded">
                                    <div className="flex-1 grid grid-cols-2 gap-2">
                                        <input
                                            type="text"
                                            value={comp.name}
                                            onChange={(e) => handleComponentChange(idx, 'name', e.target.value)}
                                            placeholder="Component name"
                                            className="input text-sm"
                                            required
                                        />
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                value={comp.weight}
                                                onChange={(e) => handleComponentChange(idx, 'weight', Number(e.target.value))}
                                                placeholder="Weight %"
                                                className="input text-sm"
                                                min="0"
                                                max="100"
                                                step="0.01"
                                                required
                                            />
                                            <label className="flex items-center text-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={comp.is_required}
                                                    onChange={(e) => handleComponentChange(idx, 'is_required', e.target.checked)}
                                                    className="mr-1"
                                                />
                                                Required
                                            </label>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveComponent(idx)}
                                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}

                            <button
                                type="button"
                                onClick={handleAddComponent}
                                className="w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded text-sm text-gray-600 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 transition"
                            >
                                <PlusIcon className="h-4 w-4 inline mr-1" />
                                Add Component
                            </button>
                        </div>
                    )}

                    {/* Scales Tab */}
                    {activeTab === 'scales' && (
                        <div className="space-y-4">
                            <div className="flex justify-end">
                                <select
                                    onChange={(e) => e.target.value && loadPresetScales(e.target.value)}
                                    className="input text-sm w-auto"
                                    defaultValue=""
                                >
                                    <option value="">Load Preset...</option>
                                    {Object.keys(GradeTemplateService.getPresetGradeScales()).map((key) => (
                                        <option key={key} value={key}>{key}</option>
                                    ))}
                                </select>
                            </div>

                            {scales.map((scale, idx) => (
                                <div key={idx} className="flex gap-2 items-start p-3 bg-gray-50 dark:bg-gray-800 rounded">
                                    <div className="flex-1 grid grid-cols-5 gap-2">
                                        <input
                                            type="text"
                                            value={scale.grade}
                                            onChange={(e) => handleScaleChange(idx, 'grade', e.target.value)}
                                            placeholder="Grade"
                                            className="input text-sm"
                                            required
                                        />
                                        <input
                                            type="number"
                                            value={scale.min_score}
                                            onChange={(e) => handleScaleChange(idx, 'min_score', Number(e.target.value))}
                                            placeholder="Min"
                                            className="input text-sm"
                                            min="0"
                                            required
                                        />
                                        <input
                                            type="number"
                                            value={scale.max_score}
                                            onChange={(e) => handleScaleChange(idx, 'max_score', Number(e.target.value))}
                                            placeholder="Max"
                                            className="input text-sm"
                                            min="0"
                                            required
                                        />
                                        <input
                                            type="text"
                                            value={scale.remark || ''}
                                            onChange={(e) => handleScaleChange(idx, 'remark', e.target.value)}
                                            placeholder="Remark"
                                            className="input text-sm"
                                        />
                                        <input
                                            type="color"
                                            value={scale.color || '#6b7280'}
                                            onChange={(e) => handleScaleChange(idx, 'color', e.target.value)}
                                            className="input text-sm h-10"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveScale(idx)}
                                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}

                            <button
                                type="button"
                                onClick={handleAddScale}
                                className="w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded text-sm text-gray-600 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 transition"
                            >
                                <PlusIcon className="h-4 w-4 inline mr-1" />
                                Add Grade Scale
                            </button>
                        </div>
                    )}

                    {/* Remarks Tab */}
                    {activeTab === 'remarks' && (
                        <div className="space-y-4">
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={loadSuggestedRemarks}
                                    className="btn btn-secondary text-sm"
                                >
                                    Load Suggested Remarks
                                </button>
                            </div>

                            {remarks.map((remark, idx) => (
                                <div key={idx} className="flex gap-2 items-start p-3 bg-gray-50 dark:bg-gray-800 rounded">
                                    <div className="flex-1 space-y-2">
                                        <div className="grid grid-cols-2 gap-2">
                                            <input
                                                type="number"
                                                value={remark.min_percentage}
                                                onChange={(e) => handleRemarkChange(idx, 'min_percentage', Number(e.target.value))}
                                                placeholder="Min %"
                                                className="input text-sm"
                                                min="0"
                                                max="100"
                                                required
                                            />
                                            <input
                                                type="number"
                                                value={remark.max_percentage}
                                                onChange={(e) => handleRemarkChange(idx, 'max_percentage', Number(e.target.value))}
                                                placeholder="Max %"
                                                className="input text-sm"
                                                min="0"
                                                max="100"
                                                required
                                            />
                                        </div>
                                        <textarea
                                            value={remark.remark_text}
                                            onChange={(e) => handleRemarkChange(idx, 'remark_text', e.target.value)}
                                            placeholder="Remark text"
                                            className="input text-sm"
                                            rows={2}
                                            required
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveRemark(idx)}
                                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}

                            <button
                                type="button"
                                onClick={handleAddRemark}
                                className="w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded text-sm text-gray-600 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 transition"
                            >
                                <PlusIcon className="h-4 w-4 inline mr-1" />
                                Add Remark Template
                            </button>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>
                        Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Saving...' : template ? 'Update Template' : 'Create Template'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default GradeTemplateFormModal;
