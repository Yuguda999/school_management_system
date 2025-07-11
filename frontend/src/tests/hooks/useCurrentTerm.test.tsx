import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useCurrentTerm } from '../../hooks/useCurrentTerm';
import { TermProvider } from '../../contexts/TermContext';
import { academicService } from '../../services/academicService';
import { Term, TermType } from '../../types';

// Mock the academic service
vi.mock('../../services/academicService');
vi.mock('../../hooks/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn()
  })
}));

const mockAcademicService = vi.mocked(academicService);

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

describe('useCurrentTerm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAcademicService.getCurrentTerm.mockResolvedValue(mockTerm);
    mockAcademicService.getTerms.mockResolvedValue(mockTerms);
    mockAcademicService.setCurrentTerm.mockResolvedValue({ message: 'Success' });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <TermProvider>{children}</TermProvider>
  );

  it('returns current term data', async () => {
    const { result } = renderHook(() => useCurrentTerm(), { wrapper });

    await waitFor(() => {
      expect(result.current.currentTerm).toEqual(mockTerm);
    });
  });

  it('returns all terms data', async () => {
    const { result } = renderHook(() => useCurrentTerm(), { wrapper });

    await waitFor(() => {
      expect(result.current.terms).toEqual(mockTerms);
    });
  });

  it('returns loading state initially', () => {
    mockAcademicService.getCurrentTerm.mockImplementation(() => new Promise(() => {}));
    
    const { result } = renderHook(() => useCurrentTerm(), { wrapper });

    expect(result.current.loading).toBe(true);
  });

  it('returns loading false after data loads', async () => {
    const { result } = renderHook(() => useCurrentTerm(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('handles error state when loading current term fails', async () => {
    mockAcademicService.getCurrentTerm.mockRejectedValue(new Error('Failed to load'));
    
    const { result } = renderHook(() => useCurrentTerm(), { wrapper });

    await waitFor(() => {
      expect(result.current.error).toBe('Failed to load current term');
      expect(result.current.loading).toBe(false);
    });
  });

  it('handles error state when loading terms fails', async () => {
    mockAcademicService.getTerms.mockRejectedValue(new Error('Failed to load terms'));
    
    const { result } = renderHook(() => useCurrentTerm(), { wrapper });

    await waitFor(() => {
      expect(result.current.error).toBe('Failed to load terms');
      expect(result.current.loading).toBe(false);
    });
  });

  it('switches current term successfully', async () => {
    const { result } = renderHook(() => useCurrentTerm(), { wrapper });

    await waitFor(() => {
      expect(result.current.currentTerm).toEqual(mockTerm);
    });

    // Mock the new current term after switching
    const newCurrentTerm = { ...mockTerms[1], is_current: true };
    mockAcademicService.getCurrentTerm.mockResolvedValue(newCurrentTerm);

    await act(async () => {
      await result.current.switchTerm('term2');
    });

    expect(mockAcademicService.setCurrentTerm).toHaveBeenCalledWith('term2');
  });

  it('handles term switching error', async () => {
    mockAcademicService.setCurrentTerm.mockRejectedValue(new Error('Switch failed'));
    
    const { result } = renderHook(() => useCurrentTerm(), { wrapper });

    await waitFor(() => {
      expect(result.current.currentTerm).toEqual(mockTerm);
    });

    await act(async () => {
      try {
        await result.current.switchTerm('term2');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    expect(mockAcademicService.setCurrentTerm).toHaveBeenCalledWith('term2');
  });

  it('refreshes data when refresh function is called', async () => {
    const { result } = renderHook(() => useCurrentTerm(), { wrapper });

    await waitFor(() => {
      expect(result.current.currentTerm).toEqual(mockTerm);
    });

    // Clear the mock calls
    mockAcademicService.getCurrentTerm.mockClear();
    mockAcademicService.getTerms.mockClear();

    await act(async () => {
      await result.current.refresh();
    });

    expect(mockAcademicService.getCurrentTerm).toHaveBeenCalled();
    expect(mockAcademicService.getTerms).toHaveBeenCalled();
  });

  it('returns null for current term when none exists', async () => {
    mockAcademicService.getCurrentTerm.mockResolvedValue(null);
    
    const { result } = renderHook(() => useCurrentTerm(), { wrapper });

    await waitFor(() => {
      expect(result.current.currentTerm).toBeNull();
      expect(result.current.loading).toBe(false);
    });
  });

  it('returns empty array for terms when none exist', async () => {
    mockAcademicService.getTerms.mockResolvedValue([]);
    
    const { result } = renderHook(() => useCurrentTerm(), { wrapper });

    await waitFor(() => {
      expect(result.current.terms).toEqual([]);
      expect(result.current.loading).toBe(false);
    });
  });

  it('provides switching state during term switch', async () => {
    const { result } = renderHook(() => useCurrentTerm(), { wrapper });

    await waitFor(() => {
      expect(result.current.currentTerm).toEqual(mockTerm);
    });

    // Make setCurrentTerm take some time
    mockAcademicService.setCurrentTerm.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ message: 'Success' }), 100))
    );

    act(() => {
      result.current.switchTerm('term2');
    });

    // Should show switching state
    expect(result.current.switching).toBe(true);

    await waitFor(() => {
      expect(result.current.switching).toBe(false);
    });
  });

  it('maintains term data consistency after operations', async () => {
    const { result } = renderHook(() => useCurrentTerm(), { wrapper });

    await waitFor(() => {
      expect(result.current.currentTerm).toEqual(mockTerm);
      expect(result.current.terms).toEqual(mockTerms);
    });

    // Verify data remains consistent
    expect(result.current.currentTerm?.id).toBe('term1');
    expect(result.current.terms.length).toBe(2);
    expect(result.current.terms.find(t => t.is_current)?.id).toBe('term1');
  });
});
