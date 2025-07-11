import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDownIcon,
  CalendarIcon,
  CheckIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useCurrentTerm } from '../../hooks/useCurrentTerm';
import { termUtils } from '../../utils/termUtils';
import { Term } from '../../types';
import LoadingSpinner from '../ui/LoadingSpinner';

interface TermSwitcherProps {
  className?: string;
  showLabel?: boolean;
  compact?: boolean;
}

const TermSwitcher: React.FC<TermSwitcherProps> = ({
  className = '',
  showLabel = true,
  compact = false
}) => {
  const {
    currentTerm,
    activeTerms,
    loading,
    error,
    setCurrentTerm,
    hasCurrentTerm
  } = useCurrentTerm();

  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);
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

  const handleTermSwitch = async (term: Term) => {
    if (term.id === currentTerm?.id) {
      setIsOpen(false);
      return;
    }

    try {
      setSwitching(term.id);
      await setCurrentTerm(term.id);
      setIsOpen(false);
    } catch (error) {
      console.error('Error switching term:', error);
    } finally {
      setSwitching(null);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <LoadingSpinner size="sm" />
        {showLabel && !compact && (
          <span className="text-sm text-gray-600 dark:text-gray-400">Loading terms...</span>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center space-x-2 text-red-600 ${className}`}>
        <ExclamationTriangleIcon className="h-4 w-4" />
        {showLabel && !compact && (
          <span className="text-sm">Term error</span>
        )}
      </div>
    );
  }

  if (!hasCurrentTerm) {
    return (
      <div className={`flex items-center space-x-2 text-amber-600 ${className}`}>
        <ExclamationTriangleIcon className="h-4 w-4" />
        {showLabel && !compact && (
          <span className="text-sm">No current term</span>
        )}
      </div>
    );
  }

  const sortedActiveTerms = termUtils.sortTerms(activeTerms);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300
          bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg
          hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500
          ${compact ? 'px-2 py-1' : 'px-3 py-2'}
        `}
      >
        <CalendarIcon className={`${compact ? 'h-4 w-4' : 'h-5 w-5'} text-gray-400`} />
        
        {currentTerm && (
          <div className="flex flex-col items-start">
            {showLabel && !compact && (
              <span className="text-xs text-gray-500 dark:text-gray-400">Current Term</span>
            )}
            <div className="flex items-center space-x-1">
              <span className={compact ? 'text-xs' : 'text-sm'}>
                {compact ? currentTerm.name : `${currentTerm.name} (${termUtils.formatAcademicSession(currentTerm.academic_session)})`}
              </span>
              {!compact && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${termUtils.getTermStatusColor(currentTerm)}`}>
                  {termUtils.getTermStatusText(currentTerm)}
                </span>
              )}
            </div>
          </div>
        )}
        
        <ChevronDownIcon
          className={`${compact ? 'h-3 w-3' : 'h-4 w-4'} text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          <div className="p-2">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide px-3 py-2">
              Switch Term
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              {sortedActiveTerms.length === 0 ? (
                <div className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  No active terms available
                </div>
              ) : (
                sortedActiveTerms.map((term) => (
                  <button
                    key={term.id}
                    onClick={() => handleTermSwitch(term)}
                    disabled={switching === term.id}
                    className={`
                      w-full flex items-center justify-between px-3 py-2 text-left text-sm rounded-lg
                      hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700
                      disabled:opacity-50 disabled:cursor-not-allowed
                      ${currentTerm?.id === term.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'}
                    `}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{term.name}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${termUtils.getTermStatusColor(term)}`}>
                          {termUtils.getTermStatusText(term)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {termUtils.formatTermType(term.type)} • {termUtils.formatAcademicSession(term.academic_session)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {termUtils.formatDateRange(term.start_date, term.end_date)}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {switching === term.id && (
                        <LoadingSpinner size="sm" />
                      )}
                      {currentTerm?.id === term.id && (
                        <CheckIcon className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
            
            {sortedActiveTerms.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                <div className="text-xs text-gray-500 dark:text-gray-400 px-3 py-1">
                  Tip: Only active terms are shown. Manage terms in Settings.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TermSwitcher;
