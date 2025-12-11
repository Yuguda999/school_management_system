import React, { useState, useEffect } from 'react';
import { ArrowDownTrayIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import GradeService from '../../services/gradeService';
import { academicService } from '../../services/academicService';
import { ClassGradesSummarySheet, Class, Term } from '../../types';

interface ClassGradeSummarySheetProps {
    selectedTermId?: string;
}

const ClassGradeSummarySheet: React.FC<ClassGradeSummarySheetProps> = ({ selectedTermId }) => {
    const [classes, setClasses] = useState<Class[]>([]);
    const [terms, setTerms] = useState<Term[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [termId, setTermId] = useState<string>(selectedTermId || '');
    const [summaryData, setSummaryData] = useState<ClassGradesSummarySheet | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [exporting, setExporting] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);

    // Load classes and terms on mount
    useEffect(() => {
        const loadData = async () => {
            try {
                const [classesData, termsData] = await Promise.all([
                    academicService.getClasses(),
                    academicService.getTerms(),
                ]);
                setClasses(classesData);
                setTerms(termsData);

                // Set default term to current term if available
                if (!selectedTermId && termsData.length > 0) {
                    const currentTerm = termsData.find(t => t.is_current);
                    if (currentTerm) {
                        setTermId(currentTerm.id);
                    }
                }
            } catch (err) {
                console.error('Error loading data:', err);
            }
        };
        loadData();
    }, [selectedTermId]);

    // Update term when prop changes
    useEffect(() => {
        if (selectedTermId) {
            setTermId(selectedTermId);
        }
    }, [selectedTermId]);

    // Fetch summary when class and term are selected
    useEffect(() => {
        if (selectedClassId && termId) {
            fetchSummary();
        }
    }, [selectedClassId, termId]);

    const fetchSummary = async () => {
        if (!selectedClassId || !termId) return;

        setLoading(true);
        setError(null);
        try {
            const data = await GradeService.getClassSummarySheet(selectedClassId, termId);
            setSummaryData(data);
        } catch (err) {
            console.error('Error fetching summary:', err);
            setError('Failed to load summary sheet. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async (format: 'csv' | 'pdf') => {
        if (!selectedClassId || !termId) return;

        setExporting(true);
        setShowExportMenu(false);
        try {
            const blob = await GradeService.exportSummarySheet(selectedClassId, termId, format);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${summaryData?.class_name || 'Class'}_${summaryData?.term_name || 'Term'}_Summary.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error('Export failed:', err);
            setError('Export failed. Please try again.');
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header with Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Class Summary Sheet
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            View consolidated grades for all students in a class
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        {/* Class Filter */}
                        <select
                            value={selectedClassId}
                            onChange={(e) => setSelectedClassId(e.target.value)}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select Class</option>
                            {classes.map((cls) => (
                                <option key={cls.id} value={cls.id}>
                                    {cls.name}
                                </option>
                            ))}
                        </select>

                        {/* Term Filter */}
                        <select
                            value={termId}
                            onChange={(e) => setTermId(e.target.value)}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select Term</option>
                            {terms.map((term) => (
                                <option key={term.id} value={term.id}>
                                    {term.name} ({term.academic_session})
                                </option>
                            ))}
                        </select>

                        {/* Export Button */}
                        <div className="relative">
                            <button
                                onClick={() => setShowExportMenu(!showExportMenu)}
                                disabled={!summaryData || exporting}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                            >
                                <ArrowDownTrayIcon className="w-5 h-5" />
                                {exporting ? 'Exporting...' : 'Export'}
                            </button>

                            {showExportMenu && (
                                <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                                    <button
                                        onClick={() => handleExport('csv')}
                                        className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                    >
                                        <DocumentArrowDownIcon className="w-4 h-4" />
                                        Export to CSV
                                    </button>
                                    <button
                                        onClick={() => handleExport('pdf')}
                                        className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                    >
                                        <DocumentArrowDownIcon className="w-4 h-4" />
                                        Export to PDF
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
                    {error}
                </div>
            )}

            {/* Content */}
            {!selectedClassId || !termId ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center">
                    <div className="text-gray-400 dark:text-gray-500 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Select Class and Term
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                        Choose a class and term to view the grades summary sheet
                    </p>
                </div>
            ) : loading ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-500 dark:text-gray-400">Loading summary sheet...</p>
                </div>
            ) : summaryData && summaryData.students.length > 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                    {/* Summary Info */}
                    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex flex-wrap items-center gap-6 text-sm">
                            <div>
                                <span className="text-gray-500 dark:text-gray-400">Class:</span>
                                <span className="ml-2 font-medium text-gray-900 dark:text-white">{summaryData.class_name}</span>
                            </div>
                            <div>
                                <span className="text-gray-500 dark:text-gray-400">Term:</span>
                                <span className="ml-2 font-medium text-gray-900 dark:text-white">{summaryData.term_name}</span>
                            </div>
                            <div>
                                <span className="text-gray-500 dark:text-gray-400">Session:</span>
                                <span className="ml-2 font-medium text-gray-900 dark:text-white">{summaryData.academic_session}</span>
                            </div>
                            <div>
                                <span className="text-gray-500 dark:text-gray-400">Total Students:</span>
                                <span className="ml-2 font-medium text-gray-900 dark:text-white">{summaryData.total_students}</span>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-primary-600">
                                <tr>
                                    <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider sticky left-0 bg-primary-600 z-10">
                                        S/N
                                    </th>
                                    <th className="px-3 py-3 text-left text-xs font-bold text-white uppercase tracking-wider sticky left-12 bg-primary-600 z-10 min-w-[200px]">
                                        Student Name
                                    </th>
                                    {summaryData.subjects.map((subject) => (
                                        <th
                                            key={subject.id}
                                            className="px-3 py-3 text-center text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap"
                                            title={subject.name}
                                        >
                                            {subject.code || subject.name.substring(0, 6)}
                                        </th>
                                    ))}
                                    <th className="px-3 py-3 text-center text-xs font-bold text-white uppercase tracking-wider bg-primary-700">
                                        Total
                                    </th>
                                    <th className="px-3 py-3 text-center text-xs font-bold text-white uppercase tracking-wider bg-primary-700">
                                        Position
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {summaryData.students.map((student, index) => (
                                    <tr
                                        key={student.student_id}
                                        className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700/50'}
                                    >
                                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white sticky left-0 bg-inherit">
                                            {index + 1}
                                        </td>
                                        <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white sticky left-12 bg-inherit">
                                            <div className="truncate max-w-[200px]" title={student.student_name}>
                                                {student.student_name}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {student.admission_number}
                                            </div>
                                        </td>
                                        {summaryData.subjects.map((subject) => {
                                            const score = student.subject_scores[subject.id];
                                            return (
                                                <td
                                                    key={subject.id}
                                                    className="px-3 py-3 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white"
                                                >
                                                    {score !== null ? Math.round(score) : '-'}
                                                </td>
                                            );
                                        })}
                                        <td className="px-3 py-3 whitespace-nowrap text-sm text-center font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700">
                                            {Math.round(student.total_score)}
                                        </td>
                                        <td className="px-3 py-3 whitespace-nowrap text-sm text-center font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700">
                                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${student.position === 1 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                                student.position === 2 ? 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200' :
                                                    student.position === 3 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                                                        'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                                                }`}>
                                                {student.position}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center">
                    <div className="text-gray-400 dark:text-gray-500 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No Data Available
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                        No students or grades found for the selected class and term
                    </p>
                </div>
            )}
        </div>
    );
};

export default ClassGradeSummarySheet;
