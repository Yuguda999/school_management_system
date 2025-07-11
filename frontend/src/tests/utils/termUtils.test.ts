import { describe, it, expect, vi, beforeEach } from 'vitest';
import { termUtils } from '../../utils/termUtils';
import { Term, TermType } from '../../types';

const mockTerm: Term = {
  id: 'term1',
  name: 'First Term',
  type: TermType.FIRST_TERM,
  academic_session: '2024/2025',
  start_date: '2024-01-01',
  end_date: '2024-03-31',
  is_current: true,
  is_active: true,
  school_id: 'school1',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

describe('termUtils', () => {
  beforeEach(() => {
    // Mock current date to be consistent
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-02-15')); // Middle of first term
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('formatTermType', () => {
    it('formats term types correctly', () => {
      expect(termUtils.formatTermType(TermType.FIRST_TERM)).toBe('First Term');
      expect(termUtils.formatTermType(TermType.SECOND_TERM)).toBe('Second Term');
      expect(termUtils.formatTermType(TermType.THIRD_TERM)).toBe('Third Term');
    });
  });

  describe('formatAcademicSession', () => {
    it('formats academic session correctly', () => {
      expect(termUtils.formatAcademicSession('2024-2025')).toBe('2024/2025');
      expect(termUtils.formatAcademicSession('2024/2025')).toBe('2024/2025');
    });
  });

  describe('formatDate', () => {
    it('formats date correctly', () => {
      const result = termUtils.formatDate('2024-01-01');
      expect(result).toBe('January 1, 2024');
    });
  });

  describe('formatDateRange', () => {
    it('formats date range correctly', () => {
      const result = termUtils.formatDateRange('2024-01-01', '2024-03-31');
      expect(result).toBe('January 1, 2024 - March 31, 2024');
    });
  });

  describe('getTermStatus', () => {
    it('returns current for active term', () => {
      const result = termUtils.getTermStatus(mockTerm);
      expect(result).toBe('current');
    });

    it('returns upcoming for future term', () => {
      const futureTerm = {
        ...mockTerm,
        start_date: '2024-04-01',
        end_date: '2024-06-30'
      };
      const result = termUtils.getTermStatus(futureTerm);
      expect(result).toBe('upcoming');
    });

    it('returns past for completed term', () => {
      const pastTerm = {
        ...mockTerm,
        start_date: '2023-01-01',
        end_date: '2023-03-31'
      };
      const result = termUtils.getTermStatus(pastTerm);
      expect(result).toBe('past');
    });
  });

  describe('getTermStatusColor', () => {
    it('returns correct colors for different statuses', () => {
      expect(termUtils.getTermStatusColor(mockTerm)).toBe('text-green-600 bg-green-100');
      
      const futureTerm = { ...mockTerm, start_date: '2024-04-01', end_date: '2024-06-30' };
      expect(termUtils.getTermStatusColor(futureTerm)).toBe('text-blue-600 bg-blue-100');
      
      const pastTerm = { ...mockTerm, start_date: '2023-01-01', end_date: '2023-03-31' };
      expect(termUtils.getTermStatusColor(pastTerm)).toBe('text-gray-600 bg-gray-100');
    });
  });

  describe('getTermDuration', () => {
    it('calculates term duration correctly', () => {
      const result = termUtils.getTermDuration(mockTerm);
      expect(result).toBe(90); // Jan 1 to Mar 31 is 90 days
    });
  });

  describe('validateTermDates', () => {
    it('validates correct dates', () => {
      const errors = termUtils.validateTermDates('2024-01-01', '2024-03-31');
      expect(errors).toEqual([]);
    });

    it('returns error for end date before start date', () => {
      const errors = termUtils.validateTermDates('2024-03-31', '2024-01-01');
      expect(errors).toContain('End date must be after start date');
    });

    it('returns error for dates too far in past', () => {
      const errors = termUtils.validateTermDates('2019-01-01', '2019-03-31');
      expect(errors).toContain('Start date cannot be before 2020');
    });

    it('returns error for dates too far in future', () => {
      const errors = termUtils.validateTermDates('2031-01-01', '2031-03-31');
      expect(errors).toContain('End date cannot be after 2030');
    });

    it('returns error for term too short', () => {
      const errors = termUtils.validateTermDates('2024-01-01', '2024-01-15');
      expect(errors).toContain('Term duration must be at least 30 days');
    });

    it('returns error for term too long', () => {
      const errors = termUtils.validateTermDates('2024-01-01', '2024-07-01');
      expect(errors).toContain('Term duration cannot exceed 150 days');
    });
  });

  describe('validateAcademicSession', () => {
    it('validates correct academic session', () => {
      const errors = termUtils.validateAcademicSession('2024/2025');
      expect(errors).toEqual([]);
    });

    it('validates academic session with dash', () => {
      const errors = termUtils.validateAcademicSession('2024-2025');
      expect(errors).toEqual([]);
    });

    it('returns error for empty session', () => {
      const errors = termUtils.validateAcademicSession('');
      expect(errors).toContain('Academic session is required');
    });

    it('returns error for invalid format', () => {
      const errors = termUtils.validateAcademicSession('2024');
      expect(errors).toContain('Academic session must be in format YYYY/YYYY or YYYY-YYYY');
    });

    it('returns error for non-consecutive years', () => {
      const errors = termUtils.validateAcademicSession('2024/2026');
      expect(errors).toContain('Academic session must span consecutive years');
    });

    it('returns error for years out of range', () => {
      const errors = termUtils.validateAcademicSession('2019/2020');
      expect(errors).toContain('Academic session year must be between 2020 and 2030');
    });
  });

  describe('sortTerms', () => {
    it('sorts terms by academic session and type', () => {
      const terms: Term[] = [
        { ...mockTerm, type: TermType.SECOND_TERM, academic_session: '2023/2024' },
        { ...mockTerm, type: TermType.FIRST_TERM, academic_session: '2024/2025' },
        { ...mockTerm, type: TermType.THIRD_TERM, academic_session: '2023/2024' },
        { ...mockTerm, type: TermType.FIRST_TERM, academic_session: '2023/2024' }
      ];

      const sorted = termUtils.sortTerms(terms);

      // Should be sorted by academic session (descending) then by term type (ascending)
      expect(sorted[0].academic_session).toBe('2024/2025');
      expect(sorted[0].type).toBe(TermType.FIRST_TERM);
      expect(sorted[1].academic_session).toBe('2023/2024');
      expect(sorted[1].type).toBe(TermType.FIRST_TERM);
      expect(sorted[2].type).toBe(TermType.SECOND_TERM);
      expect(sorted[3].type).toBe(TermType.THIRD_TERM);
    });
  });

  describe('getCurrentTerm', () => {
    it('returns current term', () => {
      const terms = [
        { ...mockTerm, is_current: false },
        { ...mockTerm, id: 'term2', is_current: true },
        { ...mockTerm, id: 'term3', is_current: false }
      ];

      const current = termUtils.getCurrentTerm(terms);
      expect(current?.id).toBe('term2');
    });

    it('returns null when no current term', () => {
      const terms = [
        { ...mockTerm, is_current: false },
        { ...mockTerm, id: 'term2', is_current: false }
      ];

      const current = termUtils.getCurrentTerm(terms);
      expect(current).toBeNull();
    });
  });

  describe('getActiveTerms', () => {
    it('returns only active terms', () => {
      const terms = [
        { ...mockTerm, is_active: true },
        { ...mockTerm, id: 'term2', is_active: false },
        { ...mockTerm, id: 'term3', is_active: true }
      ];

      const active = termUtils.getActiveTerms(terms);
      expect(active).toHaveLength(2);
      expect(active.every(term => term.is_active)).toBe(true);
    });
  });

  describe('groupTermsBySession', () => {
    it('groups terms by academic session', () => {
      const terms = [
        { ...mockTerm, academic_session: '2023/2024' },
        { ...mockTerm, id: 'term2', academic_session: '2024/2025' },
        { ...mockTerm, id: 'term3', academic_session: '2023/2024' }
      ];

      const grouped = termUtils.groupTermsBySession(terms);
      expect(grouped['2023/2024']).toHaveLength(2);
      expect(grouped['2024/2025']).toHaveLength(1);
    });
  });

  describe('canDeleteTerm', () => {
    it('prevents deleting current term', () => {
      const result = termUtils.canDeleteTerm({ ...mockTerm, is_current: true });
      expect(result.canDelete).toBe(false);
      expect(result.reason).toBe('Cannot delete the current term');
    });

    it('prevents deleting active term', () => {
      vi.setSystemTime(new Date('2024-02-15')); // During term
      const result = termUtils.canDeleteTerm({ ...mockTerm, is_current: false });
      expect(result.canDelete).toBe(false);
      expect(result.reason).toBe('Cannot delete an active term');
    });

    it('allows deleting past term', () => {
      const pastTerm = {
        ...mockTerm,
        is_current: false,
        start_date: '2023-01-01',
        end_date: '2023-03-31'
      };
      const result = termUtils.canDeleteTerm(pastTerm);
      expect(result.canDelete).toBe(true);
    });
  });

  describe('canSetAsCurrent', () => {
    it('prevents setting already current term', () => {
      const result = termUtils.canSetAsCurrent({ ...mockTerm, is_current: true });
      expect(result.canSet).toBe(false);
      expect(result.reason).toBe('Term is already current');
    });

    it('prevents setting inactive term', () => {
      const result = termUtils.canSetAsCurrent({ ...mockTerm, is_current: false, is_active: false });
      expect(result.canSet).toBe(false);
      expect(result.reason).toBe('Cannot set inactive term as current');
    });

    it('allows setting active non-current term', () => {
      const result = termUtils.canSetAsCurrent({ ...mockTerm, is_current: false, is_active: true });
      expect(result.canSet).toBe(true);
    });
  });
});
