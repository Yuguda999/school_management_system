import React, { useState, useEffect } from 'react';
import { AcademicCapIcon, TrashIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import { academicService } from '../../services/academicService';
import gradeTemplateService from '../../services/gradeTemplateService';
import componentMappingService from '../../services/componentMappingService';
import {
    Subject,
    Term,
    GradeTemplate,
    ExamTypeInfo,
    ComponentMapping as ComponentMappingType,
    ComponentMappingCreate,
    MappingPreview
} from '../../types';

interface MappingConfiguratorProps {
    initialSubjectId?: string;
    initialTermId?: string;
    onBack?: () => void;
}

const MappingConfigurator: React.FC<MappingConfiguratorProps> = ({
    initialSubjectId,
    initialTermId,
    onBack
}) => {
    const { user } = useAuth();
    const { showSuccess, showError } = useToast();

    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [terms, setTerms] = useState<Term[]>([]);
    const [templates, setTemplates] = useState<GradeTemplate[]>([]);

    const [selectedSubject, setSelectedSubject] = useState<string>(initialSubjectId || '');
    const [selectedTerm, setSelectedTerm] = useState<string>(initialTermId || '');
    const [selectedTemplate, setSelectedTemplate] = useState<GradeTemplate | null>(null);

    const [examTypes, setExamTypes] = useState<ExamTypeInfo[]>([]);
    const [mappings, setMappings] = useState<ComponentMappingType[]>([]);
    const [preview, setPreview] = useState<MappingPreview[]>([]);

    const [loading, setLoading] = useState(false);

    // Fetch initial data
    useEffect(() => {
        fetchSubjects();
        fetchTerms();
        fetchTemplates();
    }, []);

    // Load mappings when subject/term changes
    useEffect(() => {
        if (selectedSubject && selectedTerm) {
            loadMappingData();
        }
    }, [selectedSubject, selectedTerm]);

    // Load preview when template or mappings change
    useEffect(() => {
        if (selectedSubject && selectedTerm && selectedTemplate) {
            loadPreview();
        }
    }, [selectedSubject, selectedTerm, selectedTemplate, mappings]);

    const fetchSubjects = async () => {
        try {
            const data = await academicService.getSubjects();
            setSubjects(data);
        } catch (error: any) {
            showError('Failed to load subjects');
        }
    };

    const fetchTerms = async () => {
        try {
            const data = await academicService.getTerms();
            setTerms(data);
        } catch (error: any) {
            showError('Failed to load terms');
        }
    };

    const fetchTemplates = async () => {
        try {
            const data = await gradeTemplateService.getGradeTemplates();
            // Set default template if available
            const defaultTemplate = data.find(t => t.is_default);
            if (defaultTemplate) {
                setSelectedTemplate(defaultTemplate);
            }
            setTemplates(data);
        } catch (error: any) {
            showError('Failed to load grade templates');
        }
    };

    const loadMappingData = async () => {
        setLoading(true);
        try {
            const [examTypesData, mappingsData] = await Promise.all([
                componentMappingService.getExamTypes(selectedSubject, selectedTerm),
                componentMappingService.getMappings(selectedSubject, selectedTerm)
            ]);
            setExamTypes(examTypesData);
            setMappings(mappingsData);
        } catch (error: any) {
            showError('Failed to load mapping data');
        } finally {
            setLoading(false);
        }
    };

    const loadPreview = async () => {
        if (!selectedTemplate) return;

        try {
            const previewData = await componentMappingService.getMappingPreview(
                selectedSubject,
                selectedTerm,
                selectedTemplate.id
            );
            setPreview(previewData);
        } catch (error: any) {
            showError('Failed to load preview');
        }
    };

    const handleCreateMapping = async (examType: string, componentId: string) => {
        if (!user) return;

        try {
            const data: ComponentMappingCreate = {
                teacher_id: user.id,
                subject_id: selectedSubject,
                term_id: selectedTerm,
                component_id: componentId,
                exam_type_name: examType,
                include_in_calculation: true
            };

            await componentMappingService.createMapping(data);
            showSuccess(`Mapped "${examType}" successfully`);
            loadMappingData();
        } catch (error: any) {
            showError(error.message || 'Failed to create mapping');
        }
    };

    const handleDeleteMapping = async (mappingId: string) => {
        try {
            await componentMappingService.deleteMapping(mappingId);
            showSuccess('Mapping removed');
            loadMappingData();
        } catch (error: any) {
            showError('Failed to delete mapping');
        }
    };

    const getUnmappedExamTypes = () => {
        return examTypes.filter(et => !et.mapped);
    };

    const getMappedExamTypesForComponent = (componentId: string) => {
        return mappings.filter(m => m.component_id === componentId);
    };

    if (!selectedSubject || !selectedTerm) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="text-center">
                        <AcademicCapIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            Get Started
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Select a subject and term to map your exam types to grade template components
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Subject
                                </label>
                                <select
                                    value={selectedSubject}
                                    onChange={(e) => setSelectedSubject(e.target.value)}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value="">Select Subject</option>
                                    {subjects.map(subject => (
                                        <option key={subject.id} value={subject.id}>
                                            {subject.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Term
                                </label>
                                <select
                                    value={selectedTerm}
                                    onChange={(e) => setSelectedTerm(e.target.value)}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value="">Select Term</option>
                                    {terms.map(term => (
                                        <option key={term.id} value={term.id}>
                                            {term.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const selectedSubjectName = subjects.find(s => s.id === selectedSubject)?.name || '';
    const selectedTermName = terms.find(t => t.id === selectedTerm)?.name || '';
    const unmappedExamTypes = getUnmappedExamTypes();

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Component Mapping
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Map your exam types to grade template components for automated grade calculation
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Subject
                        </label>
                        <select
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            {subjects.map(subject => (
                                <option key={subject.id} value={subject.id}>
                                    {subject.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Term
                        </label>
                        <select
                            value={selectedTerm}
                            onChange={(e) => setSelectedTerm(e.target.value)}
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            {terms.map(term => (
                                <option key={term.id} value={term.id}>
                                    {term.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Grade Template
                        </label>
                        <select
                            value={selectedTemplate?.id || ''}
                            onChange={(e) => {
                                const template = templates.find(t => t.id === e.target.value);
                                setSelectedTemplate(template || null);
                            }}
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            {templates.map(template => (
                                <option key={template.id} value={template.id}>
                                    {template.name} {template.is_default && '(Default)'}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                        <strong>Selected:</strong> {selectedSubjectName} • {selectedTermName} • {selectedTemplate?.name || 'No template'}
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <>
                    {/* Mapping Interface */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Grade Template Components
                        </h3>

                        {selectedTemplate ? (
                            <div className="space-y-4">
                                {selectedTemplate.assessment_components.map(component => {
                                    if (!component.id) return null;
                                    const componentMappings = getMappedExamTypesForComponent(component.id);

                                    return (
                                        <div
                                            key={component.id}
                                            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-gray-900 dark:text-white">
                                                        {component.name}
                                                    </h4>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        Weight: {component.weight}% {component.is_required && '(Required)'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Mapped Exam Types */}
                                            {componentMappings.length > 0 ? (
                                                <div className="mb-3">
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Mapped Exams:</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {componentMappings.map(mapping => (
                                                            <div
                                                                key={mapping.id}
                                                                className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-3 py-1 rounded-full text-sm"
                                                            >
                                                                <CheckCircleIcon className="h-4 w-4" />
                                                                {mapping.exam_type_name}
                                                                <button
                                                                    onClick={() => handleDeleteMapping(mapping.id)}
                                                                    className="ml-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                                                    title="Remove mapping"
                                                                >
                                                                    <TrashIcon className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-500 dark:text-gray-400 italic mb-3">
                                                    No exams mapped to this component
                                                </p>
                                            )}

                                            {/* Add Mapping Dropdown */}
                                            {unmappedExamTypes.length > 0 && (
                                                <div>
                                                    <select
                                                        onChange={(e) => {
                                                            if (e.target.value && component.id) {
                                                                handleCreateMapping(e.target.value, component.id);
                                                                e.target.value = '';
                                                            }
                                                        }}
                                                        className="w-full sm:w-auto border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                    >
                                                        <option value="">+ Map Exam Type</option>
                                                        {unmappedExamTypes.map(et => (
                                                            <option key={et.exam_type_name} value={et.exam_type_name}>
                                                                {et.exam_type_name} ({et.exam_count} exam{et.exam_count !== 1 ? 's' : ''})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400 italic">No template selected</p>
                        )}
                    </div>

                    {/* Preview */}
                    {preview.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Mapping Summary
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {preview.map(p => (
                                    <div
                                        key={p.component_id}
                                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                                    >
                                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">
                                            {p.component_name}
                                        </h4>
                                        <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                                            <p>Weight: {p.component_weight}%</p>
                                            <p>Mapped: {p.mapped_exam_types.length} type(s)</p>
                                            <p>Total Exams: {p.exam_count}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Unmapped Exam Types */}
                    {unmappedExamTypes.length > 0 && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                            <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                                Unmapped Exam Types ({unmappedExamTypes.length})
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {unmappedExamTypes.map(et => (
                                    <span
                                        key={et.exam_type_name}
                                        className="bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200 px-3 py-1 rounded-full text-sm"
                                    >
                                        {et.exam_type_name} ({et.exam_count})
                                    </span>
                                ))}
                            </div>
                            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
                                Map these exam types to components above to include them in grade calculations
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default MappingConfigurator;
