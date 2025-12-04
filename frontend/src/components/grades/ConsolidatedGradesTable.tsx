import React from 'react';
import { SubjectConsolidatedGradesResponse } from '../../types';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

interface ConsolidatedGradesTableProps {
    data: SubjectConsolidatedGradesResponse;
    onExport: () => void;
}

const ConsolidatedGradesTable: React.FC<ConsolidatedGradesTableProps> = ({ data, onExport }) => {
    const getGradeColor = (grade: string | undefined) => {
        if (!grade) return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300';

        const firstChar = grade.charAt(0).toUpperCase();
        switch (firstChar) {
            case 'A': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'B': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'C': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'D': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
            case 'E': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            case 'F': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            default: return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300';
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        {data.subject_name} - Grade Sheet
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {data.class_name} • {data.term_name}
                    </p>
                </div>
                <button
                    onClick={onExport}
                    className="flex items-center px-3 py-2 text-sm font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 dark:text-brand-400 dark:bg-brand-900/20 dark:hover:bg-brand-900/30 rounded-lg transition-colors"
                >
                    <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                    Export CSV
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Student
                            </th>
                            {data.template_components.map((component) => (
                                <th key={component} className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
                                    {component}
                                </th>
                            ))}
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center bg-slate-100/50 dark:bg-slate-800/50">
                                Total
                            </th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
                                Grade
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {data.students.length > 0 ? (
                            data.students.map((student) => (
                                <tr key={student.student_id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-slate-900 dark:text-white">
                                            {student.student_name}
                                        </div>
                                    </td>
                                    {data.template_components.map((component) => (
                                        <td key={component} className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="text-sm text-slate-600 dark:text-slate-300">
                                                {student.component_scores[component] !== undefined
                                                    ? student.component_scores[component].toFixed(1)
                                                    : '-'}
                                            </div>
                                        </td>
                                    ))}
                                    <td className="px-6 py-4 whitespace-nowrap text-center bg-slate-50/50 dark:bg-slate-800/50 font-medium">
                                        <div className="text-sm text-slate-900 dark:text-white">
                                            {student.total.toFixed(1)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${getGradeColor(student.grade)}`}>
                                            {student.grade || '-'}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={data.template_components.length + 3} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                    No grades found for this subject.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ConsolidatedGradesTable;
