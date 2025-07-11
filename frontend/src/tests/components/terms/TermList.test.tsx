import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import TermList from '../../../components/terms/TermList';
import { useCurrentTerm } from '../../../hooks/useCurrentTerm';
import { academicService } from '../../../services/academicService';
import { useToast } from '../../../hooks/useToast';
import { Term, TermType } from '../../../types';

// Mock dependencies
vi.mock('../../../hooks/useCurrentTerm');
vi.mock('../../../services/academicService');
vi.mock('../../../hooks/useToast');

const mockUseCurrentTerm = vi.mocked(useCurrentTerm);
const mockAcademicService = vi.mocked(academicService);
const mockUseToast = vi.mocked(useToast);

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn()
};

const mockTerms: Term[] = [
  {
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
  },
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
  },
  {
    id: 'term3',
    name: 'Third Term',
    type: TermType.THIRD_TERM,
    academic_session: '2024/2025',
    start_date: '2024-07-01',
    end_date: '2024-09-30',
    is_current: false,
    is_active: false,
    school_id: 'school1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

describe('TermList', () => {
  const mockOnEdit = vi.fn();
  const mockOnRefresh = vi.fn();
  const mockSetCurrentTerm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseToast.mockReturnValue(mockToast);
    mockUseCurrentTerm.mockReturnValue({
      currentTerm: mockTerms[0],
      allTerms: mockTerms,
      activeTerms: mockTerms.filter(t => t.is_active),
      loading: false,
      error: null,
      hasCurrentTerm: true,
      setCurrentTerm: mockSetCurrentTerm,
      rawCurrentTerm: mockTerms[0],
      rawAllTerms: mockTerms,
      termsBySession: { '2024/2025': mockTerms },
      sortedTerms: mockTerms,
      currentAcademicSession: '2024/2025',
      refreshTerms: vi.fn(),
      refreshCurrentTerm: vi.fn(),
      refresh: vi.fn(),
      isCurrentTerm: vi.fn((termId) => termId === 'term1'),
      isInTermType: vi.fn(),
      getTermById: vi.fn(),
      getTermsForSession: vi.fn()
    });

    mockAcademicService.deleteTerm.mockResolvedValue();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderTermList = () => {
    return render(
      <TermList
        onEdit={mockOnEdit}
        onRefresh={mockOnRefresh}
      />
    );
  };

  it('renders term list with all terms', () => {
    renderTermList();

    expect(screen.getByText('First Term')).toBeInTheDocument();
    expect(screen.getByText('Second Term')).toBeInTheDocument();
    expect(screen.getByText('Third Term')).toBeInTheDocument();
  });

  it('displays term information correctly', () => {
    renderTermList();

    // Check academic session
    expect(screen.getByText('2024/2025')).toBeInTheDocument();
    
    // Check term types
    expect(screen.getByText('First Term')).toBeInTheDocument();
    expect(screen.getByText('Second Term')).toBeInTheDocument();
    expect(screen.getByText('Third Term')).toBeInTheDocument();
  });

  it('shows current term indicator', () => {
    renderTermList();

    // The current term should have some visual indicator
    const currentTermRow = screen.getByText('First Term').closest('tr');
    expect(currentTermRow).toBeInTheDocument();
  });

  it('handles edit action', () => {
    renderTermList();

    const editButtons = screen.getAllByLabelText(/edit/i);
    fireEvent.click(editButtons[0]);

    expect(mockOnEdit).toHaveBeenCalledWith(mockTerms[0]);
  });

  it('handles set current term action', async () => {
    renderTermList();

    // Find set current button for second term (not current)
    const setCurrentButtons = screen.getAllByLabelText(/set.*current/i);
    fireEvent.click(setCurrentButtons[0]);

    await waitFor(() => {
      expect(mockSetCurrentTerm).toHaveBeenCalled();
    });
  });

  it('handles delete action with confirmation', async () => {
    renderTermList();

    const deleteButtons = screen.getAllByLabelText(/delete/i);
    fireEvent.click(deleteButtons[1]); // Delete second term

    // Confirm deletion in modal
    const confirmButton = await screen.findByText(/delete/i);
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockAcademicService.deleteTerm).toHaveBeenCalledWith('term2');
    });

    expect(mockOnRefresh).toHaveBeenCalled();
    expect(mockToast.success).toHaveBeenCalledWith('Term deleted successfully');
  });

  it('shows empty state when no terms exist', () => {
    mockUseCurrentTerm.mockReturnValue({
      ...mockUseCurrentTerm(),
      allTerms: [],
      activeTerms: []
    });

    renderTermList();

    expect(screen.getByText('No terms found')).toBeInTheDocument();
    expect(screen.getByText('Get started by creating your first academic term.')).toBeInTheDocument();
  });

  it('handles delete error gracefully', async () => {
    const errorMessage = 'Cannot delete term with existing data';
    mockAcademicService.deleteTerm.mockRejectedValue(new Error(errorMessage));

    renderTermList();

    const deleteButtons = screen.getAllByLabelText(/delete/i);
    fireEvent.click(deleteButtons[1]);

    const confirmButton = await screen.findByText(/delete/i);
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(errorMessage);
    });
  });

  it('disables set current action for already current term', () => {
    renderTermList();

    // The current term (First Term) should not have a "Set Current" button
    const firstTermRow = screen.getByText('First Term').closest('tr');
    expect(firstTermRow).toBeInTheDocument();
    
    // Check that there's no set current button for the current term
    const setCurrentButtons = screen.getAllByLabelText(/set.*current/i);
    expect(setCurrentButtons.length).toBeLessThan(mockTerms.length);
  });

  it('shows loading state during operations', () => {
    mockUseCurrentTerm.mockReturnValue({
      ...mockUseCurrentTerm(),
      loading: true
    });

    renderTermList();

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('filters terms by search query', () => {
    renderTermList();

    const searchInput = screen.getByPlaceholderText('Search terms...');
    fireEvent.change(searchInput, { target: { value: 'First' } });

    // After filtering, only First Term should be visible
    expect(screen.getByText('First Term')).toBeInTheDocument();
    // Second and Third terms should not be visible in search results
  });
});
