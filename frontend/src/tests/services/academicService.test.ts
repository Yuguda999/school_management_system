import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { academicService } from '../../services/academicService';
import { apiService } from '../../services/apiService';
import { Term, TermType } from '../../types';

// Mock the API service
vi.mock('../../services/apiService');

const mockApiService = vi.mocked(apiService);

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

const mockTerms: Term[] = [
  mockTerm,
  {
    id: 'term2',
    name: 'Second Term',
    type: TermType.SECOND_TERM,
    academic_session: '2024/2025',
    start_date: '2024-04-01',
    end_date: '2024-06-30',
    is_current: false,
    is_active: true,
    school_id: 'school1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

describe('academicService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getTerms', () => {
    it('fetches all terms without parameters', async () => {
      mockApiService.get.mockResolvedValue(mockTerms);

      const result = await academicService.getTerms();

      expect(mockApiService.get).toHaveBeenCalledWith('/api/v1/terms');
      expect(result).toEqual(mockTerms);
    });

    it('fetches terms with query parameters', async () => {
      mockApiService.get.mockResolvedValue(mockTerms);

      const params = {
        academic_year: '2024/2025',
        is_current: true,
        page: 1,
        size: 10
      };

      const result = await academicService.getTerms(params);

      expect(mockApiService.get).toHaveBeenCalledWith(
        '/api/v1/terms?academic_year=2024%2F2025&is_current=true&page=1&size=10'
      );
      expect(result).toEqual(mockTerms);
    });

    it('handles empty parameters correctly', async () => {
      mockApiService.get.mockResolvedValue(mockTerms);

      const result = await academicService.getTerms({});

      expect(mockApiService.get).toHaveBeenCalledWith('/api/v1/terms');
      expect(result).toEqual(mockTerms);
    });
  });

  describe('getTerm', () => {
    it('fetches a single term by ID', async () => {
      mockApiService.get.mockResolvedValue(mockTerm);

      const result = await academicService.getTerm('term1');

      expect(mockApiService.get).toHaveBeenCalledWith('/api/v1/terms/term1');
      expect(result).toEqual(mockTerm);
    });
  });

  describe('createTerm', () => {
    it('creates a new term', async () => {
      const termData = {
        name: 'New Term',
        type: TermType.FIRST_TERM,
        academic_session: '2024/2025',
        start_date: '2024-01-01',
        end_date: '2024-03-31',
        is_active: true
      };

      mockApiService.post.mockResolvedValue(mockTerm);

      const result = await academicService.createTerm(termData);

      expect(mockApiService.post).toHaveBeenCalledWith('/api/v1/terms', termData);
      expect(result).toEqual(mockTerm);
    });
  });

  describe('updateTerm', () => {
    it('updates an existing term', async () => {
      const termData = {
        name: 'Updated Term',
        type: TermType.FIRST_TERM,
        academic_session: '2024/2025',
        start_date: '2024-01-01',
        end_date: '2024-03-31',
        is_active: true
      };

      mockApiService.put.mockResolvedValue(mockTerm);

      const result = await academicService.updateTerm('term1', termData);

      expect(mockApiService.put).toHaveBeenCalledWith('/api/v1/terms/term1', termData);
      expect(result).toEqual(mockTerm);
    });
  });

  describe('deleteTerm', () => {
    it('deletes a term', async () => {
      mockApiService.delete.mockResolvedValue(undefined);

      await academicService.deleteTerm('term1');

      expect(mockApiService.delete).toHaveBeenCalledWith('/api/v1/terms/term1');
    });
  });

  describe('getCurrentTerm', () => {
    it('fetches the current term', async () => {
      mockApiService.get.mockResolvedValue(mockTerm);

      const result = await academicService.getCurrentTerm();

      expect(mockApiService.get).toHaveBeenCalledWith('/api/v1/terms/current');
      expect(result).toEqual(mockTerm);
    });
  });

  describe('setCurrentTerm', () => {
    it('sets a term as current', async () => {
      const response = { message: 'Current term updated successfully' };
      mockApiService.post.mockResolvedValue(response);

      const result = await academicService.setCurrentTerm('term1');

      expect(mockApiService.post).toHaveBeenCalledWith('/api/v1/terms/term1/set-current');
      expect(result).toEqual(response);
    });
  });

  describe('createBulkTerms', () => {
    it('creates bulk terms for an academic session', async () => {
      const bulkData = {
        academic_session: '2024/2025',
        first_term_start: '2024-01-01',
        first_term_end: '2024-03-31',
        second_term_start: '2024-04-01',
        second_term_end: '2024-06-30',
        third_term_start: '2024-07-01',
        third_term_end: '2024-09-30'
      };

      const response = {
        academic_session: '2024/2025',
        terms_created: mockTerms,
        message: 'Terms created successfully'
      };

      mockApiService.post.mockResolvedValue(response);

      const result = await academicService.createBulkTerms(bulkData);

      expect(mockApiService.post).toHaveBeenCalledWith('/api/v1/terms/bulk', bulkData);
      expect(result).toEqual(response);
    });

    it('creates bulk terms without third term', async () => {
      const bulkData = {
        academic_session: '2024/2025',
        first_term_start: '2024-01-01',
        first_term_end: '2024-03-31',
        second_term_start: '2024-04-01',
        second_term_end: '2024-06-30'
      };

      const response = {
        academic_session: '2024/2025',
        terms_created: mockTerms,
        message: 'Terms created successfully'
      };

      mockApiService.post.mockResolvedValue(response);

      const result = await academicService.createBulkTerms(bulkData);

      expect(mockApiService.post).toHaveBeenCalledWith('/api/v1/terms/bulk', bulkData);
      expect(result).toEqual(response);
    });
  });

  describe('error handling', () => {
    it('propagates API errors for getTerms', async () => {
      const error = new Error('Network error');
      mockApiService.get.mockRejectedValue(error);

      await expect(academicService.getTerms()).rejects.toThrow('Network error');
    });

    it('propagates API errors for createTerm', async () => {
      const error = new Error('Validation error');
      mockApiService.post.mockRejectedValue(error);

      const termData = {
        name: 'New Term',
        type: TermType.FIRST_TERM,
        academic_session: '2024/2025',
        start_date: '2024-01-01',
        end_date: '2024-03-31',
        is_active: true
      };

      await expect(academicService.createTerm(termData)).rejects.toThrow('Validation error');
    });

    it('propagates API errors for updateTerm', async () => {
      const error = new Error('Not found');
      mockApiService.put.mockRejectedValue(error);

      const termData = {
        name: 'Updated Term',
        type: TermType.FIRST_TERM,
        academic_session: '2024/2025',
        start_date: '2024-01-01',
        end_date: '2024-03-31',
        is_active: true
      };

      await expect(academicService.updateTerm('term1', termData)).rejects.toThrow('Not found');
    });

    it('propagates API errors for deleteTerm', async () => {
      const error = new Error('Cannot delete');
      mockApiService.delete.mockRejectedValue(error);

      await expect(academicService.deleteTerm('term1')).rejects.toThrow('Cannot delete');
    });

    it('propagates API errors for setCurrentTerm', async () => {
      const error = new Error('Invalid term');
      mockApiService.post.mockRejectedValue(error);

      await expect(academicService.setCurrentTerm('term1')).rejects.toThrow('Invalid term');
    });
  });

  describe('URL encoding', () => {
    it('properly encodes academic year in query parameters', async () => {
      mockApiService.get.mockResolvedValue(mockTerms);

      await academicService.getTerms({ academic_year: '2024/2025' });

      expect(mockApiService.get).toHaveBeenCalledWith('/api/v1/terms?academic_year=2024%2F2025');
    });

    it('handles special characters in query parameters', async () => {
      mockApiService.get.mockResolvedValue(mockTerms);

      await academicService.getTerms({ academic_year: '2024/2025 Special' });

      expect(mockApiService.get).toHaveBeenCalledWith('/api/v1/terms?academic_year=2024%2F2025%20Special');
    });
  });
});
