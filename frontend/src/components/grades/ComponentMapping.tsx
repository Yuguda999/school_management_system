import React, { useState, useEffect } from 'react';
import {
    AdjustmentsHorizontalIcon,
    ArrowPathIcon,
    MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import GradeService from '../../services/gradeService';
import { academicService } from '../../services/academicService';
import {
    SubjectWithMapping,
    SubjectConsolidatedGradesResponse,
    Term
} from '../../types';
import SubjectCard from './SubjectCard';
import ConsolidatedGradesTable from './ConsolidatedGradesTable';
import MappingConfigurator from './MappingConfigurator';

const ComponentMapping: React.FC = () => { // Grade Setup Dashboard
    const { user } = useAuth();
    const { showSuccess, showError } = useToast();

    // State
    const [viewMode, setViewMode] = useState<'dashboard' | 'configurator'>('dashboard');
    const [loading, setLoading] = useState(false);
    const [terms, setTerms] = useState<Term[]>([]);
    const [selectedTermId, setSelectedTermId] = useState<string>('');

    // Dashboard Data
    const [subjects, setSubjects] = useState<SubjectWithMapping[]>([]);
    const [selectedSubject, setSelectedSubject] = useState<SubjectWithMapping | null>(null);
    const [gradesData, setGradesData] = useState<SubjectConsolidatedGradesResponse | null>(null);
    const [loadingGrades, setLoadingGrades] = useState(false);

    // Initial Load
    useEffect(() => {
        fetchTerms();
    }, []);

    // Fetch subjects when term changes
    useEffect(() => {
        if (selectedTermId) {
            fetchSubjectsWithMappings();
            // Reset selection when term changes
            setSelectedSubject(null);
            setGradesData(null);
        }
    }, [selectedTermId]);

    // Fetch grades when subject selected
    useEffect(() => {
        if (selectedSubject && selectedTermId) {
            fetchConsolidatedGrades(selectedSubject.subject_id);
        }
    }, [selectedSubject]);

    const fetchTerms = async () => {
        try {
            const data = await academicService.getTerms();
            setTerms(data);

            // Select current term by default
            const currentTerm = data.find(t => t.is_current);
            if (currentTerm) {
                setSelectedTermId(currentTerm.id);
            } else if (data.length > 0) {
                setSelectedTermId(data[0].id);
            }
        } catch (error: any) {
            showError('Failed to load terms');
        }
    };

    const fetchSubjectsWithMappings = async () => {
        setLoading(true);
        try {
            const response = await GradeService.getSubjectsWithMappings(selectedTermId);
            setSubjects(response.subjects);
        } catch (error: any) {
            showError('Failed to load subjects');
        } finally {
            setLoading(false);
        }
    };

    const fetchConsolidatedGrades = async (subjectId: string) => {
        setLoadingGrades(true);
        try {
            const data = await GradeService.getSubjectConsolidatedGrades(
                subjectId,
                selectedTermId
            );
            setGradesData(data);
        } catch (error: any) {
            showError('Failed to load grades');
            setGradesData(null);
        } finally {
            setLoadingGrades(false);
        }
    };

    const handleExportCSV = () => {
        if (!gradesData) return;

        // Create CSV content
        const headers = ['Student Name', ...gradesData.template_components, 'Total', 'Grade'];
        const rows = gradesData.students.map(student => [
            student.student_name,
            ...gradesData.template_components.map(comp =>
                student.component_scores[comp] !== undefined
                    ? student.component_scores[comp].toFixed(1)
                    : '-'
            ),
            student.total.toFixed(1),
            student.grade || '-'
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        // Download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${gradesData.subject_name}_grades.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (viewMode === 'configurator') {
        return (
            <MappingConfigurator
                initialSubjectId={selectedSubject?.subject_id}
                initialTermId={selectedTermId}
                onBack={() => {
                    setViewMode('dashboard');
                    fetchSubjectsWithMappings(); // Refresh data
                }}
            />
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Grade Setup
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Manage component mappings and view consolidated grades
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={selectedTermId}
                        onChange={(e) => setSelectedTermId(e.target.value)}
                        className="px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                    >
                        {terms.map(term => (
                            <option key={term.id} value={term.id}>
                                {term.name}
                            </option>
                        ))}
                    </select>

                    <button
                        onClick={() => setViewMode('configurator')}
                        className="flex items-center px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        <AdjustmentsHorizontalIcon className="w-5 h-5 mr-2" />
                        Configure Mappings
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Subject List (Left Sidebar) */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                            Subjects
                        </h2>
                        <button
                            onClick={fetchSubjectsWithMappings}
                            className="p-1.5 text-slate-400 hover:text-brand-600 rounded-full hover:bg-brand-50 dark:hover:bg-slate-700 transition-colors"
                            title="Refresh subjects"
                        >
                            <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : subjects.length > 0 ? (
                        <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
                            {subjects.map(subject => (
                                <SubjectCard
                                    key={`${subject.subject_id}-${subject.class_id}`}
                                    subject={subject}
                                    onClick={setSelectedSubject}
                                    isSelected={selectedSubject?.subject_id === subject.subject_id && selectedSubject?.class_id === subject.class_id}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                            <MagnifyingGlassIcon className="w-12 h-12 mx-auto text-slate-400 mb-3" />
                            <p className="text-slate-500 dark:text-slate-400 font-medium">No subjects found</p>
                            <p className="text-xs text-slate-400 mt-1">Try changing the term or configure mappings</p>
                        </div>
                    )}
                </div>

                {/* Grade Table (Right Content) */}
                <div className="lg:col-span-8">
                    {selectedSubject ? (
                        loadingGrades ? (
                            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-12 flex flex-col items-center justify-center min-h-[400px]">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mb-4"></div>
                                <p className="text-slate-500 dark:text-slate-400">Loading grades...</p>
                            </div>
                        ) : gradesData ? (
                            <ConsolidatedGradesTable
                                data={gradesData}
                                onExport={handleExportCSV}
                            />
                        ) : (
                            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center min-h-[400px] flex flex-col items-center justify-center">
                                <p className="text-slate-500 dark:text-slate-400">Failed to load grade data</p>
                                <button
                                    onClick={() => fetchConsolidatedGrades(selectedSubject.subject_id)}
                                    className="mt-4 text-brand-600 hover:text-brand-700 font-medium"
                                >
                                    Try Again
                                </button>
                            </div>
                        )
                    ) : (
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center min-h-[400px] flex flex-col items-center justify-center">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4 mx-auto">
                                <AdjustmentsHorizontalIcon className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                                Select a Subject
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                                Choose a subject from the list to view consolidated grades and component breakdowns.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ComponentMapping;
