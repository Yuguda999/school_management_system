import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TermProvider, useTermContext } from '../../contexts/TermContext';
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

const mockCurrentTerm: Term = {
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

const mockAllTerms: Term[] = [
  mockCurrentTerm,
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

// Test component that uses the context
const TestComponent: React.FC = () => {
  const {
    currentTerm,
    allTerms,
    loading,
    error,
    setCurrentTerm,
    refreshTerms,
    refreshCurrentTerm
  } = useTermContext();

  return (
    <div>
      <div data-testid="loading">{loading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="error">{error || 'No Error'}</div>
      <div data-testid="current-term">
        {currentTerm ? currentTerm.name : 'No Current Term'}
      </div>
      <div data-testid="all-terms-count">{allTerms.length}</div>
      <button 
        onClick={() => setCurrentTerm('term2')}
        data-testid="set-current-term"
      >
        Set Current Term
      </button>
      <button 
        onClick={refreshTerms}
        data-testid="refresh-terms"
      >
        Refresh Terms
      </button>
      <button 
        onClick={refreshCurrentTerm}
        data-testid="refresh-current-term"
      >
        Refresh Current Term
      </button>
    </div>
  );
};

describe('TermContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    
    mockAcademicService.getCurrentTerm.mockResolvedValue(mockCurrentTerm);
    mockAcademicService.getTerms.mockResolvedValue(mockAllTerms);
    mockAcademicService.setCurrentTerm.mockResolvedValue({ message: 'Success' });
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('loads initial data on mount', async () => {
    render(
      <TermProvider>
        <TestComponent />
      </TermProvider>
    );

    // Initially loading
    expect(screen.getByTestId('loading')).toHaveTextContent('Loading');

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });

    expect(screen.getByTestId('current-term')).toHaveTextContent('First Term');
    expect(screen.getByTestId('all-terms-count')).toHaveTextContent('2');
    expect(screen.getByTestId('error')).toHaveTextContent('No Error');
  });

  it('handles current term loading error', async () => {
    mockAcademicService.getCurrentTerm.mockRejectedValue(
      new Error('Failed to load current term')
    );

    render(
      <TermProvider>
        <TestComponent />
      </TermProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });

    expect(screen.getByTestId('error')).toHaveTextContent('Failed to load current term');
    expect(screen.getByTestId('current-term')).toHaveTextContent('No Current Term');
  });

  it('handles 404 error for current term gracefully', async () => {
    const error = new Error('Not found');
    (error as any).response = { status: 404 };
    mockAcademicService.getCurrentTerm.mockRejectedValue(error);

    render(
      <TermProvider>
        <TestComponent />
      </TermProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });

    expect(screen.getByTestId('error')).toHaveTextContent(
      'No current term is set. Please set a current term in settings.'
    );
  });

  it('sets current term successfully', async () => {
    render(
      <TermProvider>
        <TestComponent />
      </TermProvider>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });

    // Mock updated current term
    const updatedCurrentTerm = { ...mockCurrentTerm, id: 'term2', name: 'Second Term' };
    mockAcademicService.getCurrentTerm.mockResolvedValue(updatedCurrentTerm);

    // Set current term
    await act(async () => {
      screen.getByTestId('set-current-term').click();
    });

    expect(mockAcademicService.setCurrentTerm).toHaveBeenCalledWith('term2');
  });

  it('handles set current term error', async () => {
    mockAcademicService.setCurrentTerm.mockRejectedValue(
      new Error('Failed to set current term')
    );

    render(
      <TermProvider>
        <TestComponent />
      </TermProvider>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });

    // Try to set current term
    await act(async () => {
      screen.getByTestId('set-current-term').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Failed to set current term');
    });
  });

  it('refreshes terms successfully', async () => {
    render(
      <TermProvider>
        <TestComponent />
      </TermProvider>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });

    // Clear mock calls from initial load
    mockAcademicService.getTerms.mockClear();

    // Refresh terms
    await act(async () => {
      screen.getByTestId('refresh-terms').click();
    });

    expect(mockAcademicService.getTerms).toHaveBeenCalled();
  });

  it('refreshes current term successfully', async () => {
    render(
      <TermProvider>
        <TestComponent />
      </TermProvider>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });

    // Clear mock calls from initial load
    mockAcademicService.getCurrentTerm.mockClear();

    // Refresh current term
    await act(async () => {
      screen.getByTestId('refresh-current-term').click();
    });

    expect(mockAcademicService.getCurrentTerm).toHaveBeenCalled();
  });

  it('persists current term to localStorage', async () => {
    render(
      <TermProvider>
        <TestComponent />
      </TermProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });

    // Check that current term is saved to localStorage
    const savedTerm = localStorage.getItem('currentTerm');
    expect(savedTerm).toBeTruthy();
    
    const parsedTerm = JSON.parse(savedTerm!);
    expect(parsedTerm.id).toBe(mockCurrentTerm.id);
    expect(parsedTerm.name).toBe(mockCurrentTerm.name);
  });

  it('loads current term from localStorage on mount', async () => {
    // Pre-populate localStorage
    localStorage.setItem('currentTerm', JSON.stringify(mockCurrentTerm));

    render(
      <TermProvider>
        <TestComponent />
      </TermProvider>
    );

    // Should immediately show the term from localStorage
    expect(screen.getByTestId('current-term')).toHaveTextContent('First Term');
  });

  it('handles corrupted localStorage data gracefully', async () => {
    // Set corrupted data in localStorage
    localStorage.setItem('currentTerm', 'invalid json');

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <TermProvider>
        <TestComponent />
      </TermProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });

    // Should handle corrupted data gracefully
    expect(consoleSpy).toHaveBeenCalledWith(
      'Error parsing saved current term:',
      expect.any(Error)
    );

    // localStorage should be cleared
    expect(localStorage.getItem('currentTerm')).toBeNull();

    consoleSpy.mockRestore();
  });

  it('throws error when used outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useTermContext must be used within a TermProvider');

    consoleSpy.mockRestore();
  });
});
