import React from 'react';
import { SubjectWithMapping } from '../../types';
import { BookOpenIcon, UserGroupIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface SubjectCardProps {
    subject: SubjectWithMapping;
    onClick: (subject: SubjectWithMapping) => void;
    isSelected?: boolean;
}

const SubjectCard: React.FC<SubjectCardProps> = ({ subject, onClick, isSelected }) => {
    return (
        <div
            onClick={() => onClick(subject)}
            className={`
        relative p-5 rounded-xl border cursor-pointer transition-all duration-200
        ${isSelected
                    ? 'border-brand-500 bg-brand-50/10 shadow-md ring-1 ring-brand-500'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-sm'
                }
      `}
        >
            <div className="flex justify-between items-start mb-3">
                <div className={`p-2 rounded-lg ${isSelected ? 'bg-brand-100 text-brand-600' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                    <BookOpenIcon className="w-6 h-6" />
                </div>
                {subject.has_mappings && (
                    <div className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full">
                        <CheckCircleIcon className="w-3.5 h-3.5 mr-1" />
                        Configured
                    </div>
                )}
            </div>

            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                {subject.subject_name}
            </h3>

            <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 mb-4">
                <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-xs font-medium mr-2">
                    {subject.class_name}
                </span>
                <span className="text-xs">{subject.term_name}</span>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
                <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                    <UserGroupIcon className="w-4 h-4 mr-1.5" />
                    {subject.student_count} Students
                </div>
                {subject.template_name && (
                    <div className="text-xs text-slate-400">
                        {subject.template_name}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SubjectCard;
