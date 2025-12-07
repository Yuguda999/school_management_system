/**
 * DataTermFilter Component
 * 
 * A reusable filter component that allows users to select which term/session 
 * to view data for on data-heavy pages (grades, attendance, fees).
 * 
 * Unlike TermSwitcher, this component does NOT change the global current term.
 * It's purely for filtering the data displayed on a specific page.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
    ChevronDownIcon,
    CalendarIcon,
    CheckIcon,
    FunnelIcon,
} from '@heroicons/react/24/outline';
import { useCurrentTerm } from '../../hooks/useCurrentTerm';
import { termUtils } from '../../utils/termUtils';
import { Term } from '../../types';

interface DataTermFilterProps {
    /** Currently selected term ID for filtering */
    selectedTermId: string | null;
    /** Callback when term selection changes */
    onTermChange: (termId: string | null, term: Term | null) => void;
    /** Whether to show "All Terms" option */
    showAllOption?: boolean;
    /** Label text to display */
    label?: string;
    /** Whether to show label */
    showLabel?: boolean;
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
    /** Additional CSS classes */
    className?: string;
    /** Whether to include archived/completed terms */
    includeHistorical?: boolean;
}

const DataTermFilter: React.FC<DataTermFilterProps> = ({
    selectedTermId,
    onTermChange,
    showAllOption = false,
    label = 'View Term',
    showLabel = true,
    size = 'md',
    className = '',
    includeHistorical = true,
}) => {
    const { rawAllTerms, currentTerm, loading } = useCurrentTerm();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Get available terms based on includeHistorical setting
    const availableTerms = includeHistorical
        ? rawAllTerms
        : rawAllTerms.filter(term => {
            const status = termUtils.getTermStatus(term);
            return status !== 'past';
        });

    // Sort terms by date (most recent first)
    const sortedTerms = termUtils.sortTerms([...availableTerms]).reverse();

    // Group terms by academic session
    const groupedTerms = termUtils.groupTermsBySession(sortedTerms);

    // Find the selected term
    const selectedTerm = selectedTermId
        ? availableTerms.find(t => t.id === selectedTermId)
        : null;

    // Size classes
    const sizeClasses = {
        sm: 'px-2 py-1 text-xs',
        md: 'px-3 py-2 text-sm',
        lg: 'px-4 py-2.5 text-base',
    };

    const handleSelect = (termId: string | null) => {
        const term = termId ? availableTerms.find(t => t.id === termId) || null : null;
        onTermChange(termId, term);
        setIsOpen(false);
    };

    if (loading) {
        return (
            <div className={`flex items-center gap-2 ${className} animate-pulse`}>
                <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            </div>
        );
    }

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            {/* Label */}
            {showLabel && (
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    {label}
                </label>
            )}

            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
          flex items-center gap-2 font-medium
          bg-white dark:bg-gray-800 
          border border-gray-300 dark:border-gray-600 rounded-lg
          hover:bg-gray-50 dark:hover:bg-gray-700 
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1
          transition-colors duration-150
          ${sizeClasses[size]}
        `}
            >
                <FunnelIcon className="h-4 w-4 text-gray-400" />

                <span className="text-gray-900 dark:text-white">
                    {selectedTerm ? (
                        <>
                            {selectedTerm.name}
                            <span className="text-gray-500 dark:text-gray-400 ml-1">
                                ({termUtils.formatAcademicSession(selectedTerm.academic_session)})
                            </span>
                        </>
                    ) : showAllOption ? (
                        'All Terms'
                    ) : currentTerm ? (
                        <>
                            {currentTerm.name}
                            <span className="text-gray-500 dark:text-gray-400 ml-1">(Current)</span>
                        </>
                    ) : (
                        'Select Term'
                    )}
                </span>

                <ChevronDownIcon
                    className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''
                        }`}
                />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute left-0 mt-2 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="max-h-80 overflow-y-auto">
                        {/* All Terms Option */}
                        {showAllOption && (
                            <>
                                <button
                                    onClick={() => handleSelect(null)}
                                    className={`
                    w-full flex items-center justify-between px-4 py-3 text-left text-sm
                    hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                    ${selectedTermId === null ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-white'}
                  `}
                                >
                                    <div className="flex items-center gap-2">
                                        <CalendarIcon className="h-4 w-4 text-gray-400" />
                                        <span className="font-medium">All Terms</span>
                                    </div>
                                    {selectedTermId === null && (
                                        <CheckIcon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                                    )}
                                </button>
                                <div className="border-b border-gray-200 dark:border-gray-700" />
                            </>
                        )}

                        {/* Grouped Terms by Session */}
                        {Object.entries(groupedTerms).map(([session, terms]) => (
                            <div key={session}>
                                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide sticky top-0">
                                    {termUtils.formatAcademicSession(session)}
                                </div>
                                {terms.map((term) => {
                                    const isCurrent = term.id === currentTerm?.id;
                                    const isSelected = term.id === selectedTermId;
                                    const status = termUtils.getTermStatus(term);

                                    return (
                                        <button
                                            key={term.id}
                                            onClick={() => handleSelect(term.id)}
                                            className={`
                        w-full flex items-center justify-between px-4 py-2.5 text-left text-sm
                        hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                        ${isSelected ? 'bg-primary-50 dark:bg-primary-900/20' : ''}
                      `}
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-medium ${isSelected ? 'text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-white'}`}>
                                                        {term.name}
                                                    </span>
                                                    {isCurrent && (
                                                        <span className="px-1.5 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded">
                                                            Current
                                                        </span>
                                                    )}
                                                    <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${termUtils.getTermStatusColor(term)}`}>
                                                        {status === 'current' ? 'Active' : status === 'upcoming' ? 'Upcoming' : 'Ended'}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                    {termUtils.formatDateRange(term.start_date, term.end_date)}
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <CheckIcon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        ))}

                        {sortedTerms.length === 0 && (
                            <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                                No terms available
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            💡 Select a term to filter the data displayed on this page.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataTermFilter;
