import { useTermContext } from '../contexts/TermContext';
import { Term } from '../types';
import { termUtils } from '../utils/termUtils';
import { useMemo } from 'react';

/**
 * Custom hook for accessing and managing current term state
 */
export const useCurrentTerm = () => {
  const {
    currentTerm,
    allTerms,
    loading,
    error,
    setCurrentTerm,
    refreshTerms,
    refreshCurrentTerm,
  } = useTermContext();

  /**
   * Get current term with additional computed properties
   */
  const getCurrentTermInfo = useMemo(() => {
    if (!currentTerm) {
      return null;
    }

    return {
      ...currentTerm,
      status: termUtils.getTermStatus(currentTerm),
      statusText: termUtils.getTermStatusText(currentTerm),
      statusColor: termUtils.getTermStatusColor(currentTerm),
      formattedType: termUtils.formatTermType(currentTerm.type),
      formattedSession: termUtils.formatAcademicSession(currentTerm.academic_session),
      formattedDateRange: termUtils.formatDateRange(currentTerm.start_date, currentTerm.end_date),
      duration: termUtils.getTermDuration(currentTerm),
    };
  }, [currentTerm]);

  /**
   * Get all terms with additional computed properties
   */
  const getAllTermsInfo = useMemo(() => {
    return allTerms.map(term => ({
      ...term,
      status: termUtils.getTermStatus(term),
      statusText: termUtils.getTermStatusText(term),
      statusColor: termUtils.getTermStatusColor(term),
      formattedType: termUtils.formatTermType(term.type),
      formattedSession: termUtils.formatAcademicSession(term.academic_session),
      formattedDateRange: termUtils.formatDateRange(term.start_date, term.end_date),
      duration: termUtils.getTermDuration(term),
      canDelete: termUtils.canDeleteTerm(term),
      canSetAsCurrent: termUtils.canSetAsCurrent(term),
    }));
  }, [allTerms]);

  /**
   * Get terms grouped by academic session
   */
  const getTermsBySession = useMemo(() => {
    return termUtils.groupTermsBySession(allTerms);
  }, [allTerms]);

  /**
   * Get active terms only
   */
  const getActiveTerms = useMemo(() => {
    return termUtils.getActiveTerms(allTerms);
  }, [allTerms]);

  /**
   * Get sorted terms
   */
  const getSortedTerms = useMemo(() => {
    return termUtils.sortTerms([...allTerms]);
  }, [allTerms]);

  /**
   * Check if a specific term is current
   */
  const isCurrentTerm = (termId: string): boolean => {
    return currentTerm?.id === termId;
  };

  /**
   * Check if current term is set
   */
  const hasCurrentTerm = useMemo((): boolean => {
    return currentTerm !== null;
  }, [currentTerm]);

  /**
   * Get current academic session
   */
  const getCurrentAcademicSession = useMemo((): string | null => {
    return currentTerm?.academic_session || null;
  }, [currentTerm]);

  /**
   * Check if we're in a specific term type
   */
  const isInTermType = (termType: string): boolean => {
    return currentTerm?.type === termType;
  };

  /**
   * Get term by ID
   */
  const getTermById = (termId: string): Term | undefined => {
    return allTerms.find(term => term.id === termId);
  };

  /**
   * Get terms for a specific academic session
   */
  const getTermsForSession = (academicSession: string): Term[] => {
    return allTerms.filter(term => term.academic_session === academicSession);
  };

  /**
   * Switch to a different term
   */
  const switchTerm = async (termId: string): Promise<void> => {
    const term = getTermById(termId);
    if (!term) {
      throw new Error('Term not found');
    }

    const { canSet, reason } = termUtils.canSetAsCurrent(term);
    if (!canSet) {
      throw new Error(reason || 'Cannot set this term as current');
    }

    await setCurrentTerm(termId);
  };

  /**
   * Refresh all term data
   */
  const refresh = async (): Promise<void> => {
    await Promise.all([refreshCurrentTerm(), refreshTerms()]);
  };

  return {
    // Current term data
    currentTerm: getCurrentTermInfo,
    rawCurrentTerm: currentTerm,

    // All terms data
    allTerms: getAllTermsInfo,
    rawAllTerms: allTerms,

    // Computed data
    termsBySession: getTermsBySession,
    activeTerms: getActiveTerms,
    sortedTerms: getSortedTerms,

    // State
    loading,
    error,
    hasCurrentTerm: hasCurrentTerm,
    currentAcademicSession: getCurrentAcademicSession,

    // Actions
    setCurrentTerm: switchTerm,
    refreshTerms,
    refreshCurrentTerm,
    refresh,

    // Utilities
    isCurrentTerm,
    isInTermType,
    getTermById,
    getTermsForSession,
  };
};

export default useCurrentTerm;
