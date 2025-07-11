import { Term, TermType } from '../types';

/**
 * Utility functions for term management
 */

export const termUtils = {
  /**
   * Format term type for display
   */
  formatTermType(type: TermType): string {
    const typeMap = {
      [TermType.FIRST_TERM]: 'First Term',
      [TermType.SECOND_TERM]: 'Second Term',
      [TermType.THIRD_TERM]: 'Third Term'
    };
    return typeMap[type] || type;
  },

  /**
   * Format academic session for display
   */
  formatAcademicSession(session: string): string {
    return session.replace('-', '/');
  },

  /**
   * Format date for display
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },

  /**
   * Format date range for display
   */
  formatDateRange(startDate: string, endDate: string): string {
    return `${this.formatDate(startDate)} - ${this.formatDate(endDate)}`;
  },

  /**
   * Get term status based on dates
   */
  getTermStatus(term: Term): 'upcoming' | 'current' | 'past' {
    const now = new Date();
    const startDate = new Date(term.start_date);
    const endDate = new Date(term.end_date);

    if (now < startDate) {
      return 'upcoming';
    } else if (now > endDate) {
      return 'past';
    } else {
      return 'current';
    }
  },

  /**
   * Get term status color for UI
   */
  getTermStatusColor(term: Term): string {
    const status = this.getTermStatus(term);
    const colorMap = {
      upcoming: 'text-blue-600 bg-blue-100',
      current: 'text-green-600 bg-green-100',
      past: 'text-gray-600 bg-gray-100'
    };
    return colorMap[status];
  },

  /**
   * Get term status text
   */
  getTermStatusText(term: Term): string {
    const status = this.getTermStatus(term);
    const textMap = {
      upcoming: 'Upcoming',
      current: 'Active',
      past: 'Completed'
    };
    return textMap[status];
  },

  /**
   * Calculate term duration in days
   */
  getTermDuration(term: Term): number {
    const startDate = new Date(term.start_date);
    const endDate = new Date(term.end_date);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },

  /**
   * Validate term dates
   */
  validateTermDates(startDate: string, endDate: string): string[] {
    const errors: string[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (start >= end) {
      errors.push('End date must be after start date');
    }

    if (start < new Date('2020-01-01')) {
      errors.push('Start date cannot be before 2020');
    }

    if (end > new Date('2030-12-31')) {
      errors.push('End date cannot be after 2030');
    }

    const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (duration < 30) {
      errors.push('Term duration must be at least 30 days');
    }

    if (duration > 150) {
      errors.push('Term duration cannot exceed 150 days');
    }

    return errors;
  },

  /**
   * Validate academic session format
   */
  validateAcademicSession(session: string): string[] {
    const errors: string[] = [];
    
    if (!session || !session.trim()) {
      errors.push('Academic session is required');
      return errors;
    }

    const pattern = /^\d{4}[/-]\d{4}$/;
    if (!pattern.test(session.trim())) {
      errors.push('Academic session must be in format YYYY/YYYY or YYYY-YYYY (e.g., 2023/2024)');
      return errors;
    }

    const years = session.trim().split(/[/-]/);
    const firstYear = parseInt(years[0]);
    const secondYear = parseInt(years[1]);

    if (secondYear !== firstYear + 1) {
      errors.push('Academic session must span consecutive years (e.g., 2023/2024)');
    }

    if (firstYear < 2020 || firstYear > 2030) {
      errors.push('Academic session year must be between 2020 and 2030');
    }

    return errors;
  },

  /**
   * Sort terms by academic session and type
   */
  sortTerms(terms: Term[]): Term[] {
    return terms.sort((a, b) => {
      // First sort by academic session (descending)
      const sessionCompare = b.academic_session.localeCompare(a.academic_session);
      if (sessionCompare !== 0) {
        return sessionCompare;
      }

      // Then sort by term type order
      const typeOrder = {
        [TermType.FIRST_TERM]: 1,
        [TermType.SECOND_TERM]: 2,
        [TermType.THIRD_TERM]: 3
      };

      return typeOrder[a.type] - typeOrder[b.type];
    });
  },

  /**
   * Get current term from a list of terms
   */
  getCurrentTerm(terms: Term[]): Term | null {
    return terms.find(term => term.is_current) || null;
  },

  /**
   * Get active terms from a list of terms
   */
  getActiveTerms(terms: Term[]): Term[] {
    return terms.filter(term => term.is_active);
  },

  /**
   * Group terms by academic session
   */
  groupTermsBySession(terms: Term[]): Record<string, Term[]> {
    return terms.reduce((groups, term) => {
      const session = term.academic_session;
      if (!groups[session]) {
        groups[session] = [];
      }
      groups[session].push(term);
      return groups;
    }, {} as Record<string, Term[]>);
  },

  /**
   * Generate default term names based on type
   */
  getDefaultTermName(type: TermType): string {
    return this.formatTermType(type);
  },

  /**
   * Check if term can be deleted
   */
  canDeleteTerm(term: Term): { canDelete: boolean; reason?: string } {
    if (term.is_current) {
      return { canDelete: false, reason: 'Cannot delete the current term' };
    }

    const status = this.getTermStatus(term);
    if (status === 'current') {
      return { canDelete: false, reason: 'Cannot delete an active term' };
    }

    return { canDelete: true };
  },

  /**
   * Check if term can be set as current
   */
  canSetAsCurrent(term: Term): { canSet: boolean; reason?: string } {
    if (term.is_current) {
      return { canSet: false, reason: 'Term is already current' };
    }

    if (!term.is_active) {
      return { canSet: false, reason: 'Cannot set inactive term as current' };
    }

    return { canSet: true };
  }
};
