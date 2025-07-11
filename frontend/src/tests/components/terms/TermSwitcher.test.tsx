import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import TermSwitcher from '../../../components/terms/TermSwitcher';
import { useCurrentTerm } from '../../../hooks/useCurrentTerm';
import { Term, TermType } from '../../../types';

// Mock the useCurrentTerm hook
vi.mock('../../../hooks/useCurrentTerm');

const mockUseCurrentTerm = vi.mocked(useCurrentTerm);

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

const mockActiveTerms: Term[] = [
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

describe('TermSwitcher', () => {
  const mockSetCurrentTerm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCurrentTerm.mockReturnValue({
      currentTerm: mockCurrentTerm,
      activeTerms: mockActiveTerms,
      loading: false,
      error: null,
      hasCurrentTerm: true,
      setCurrentTerm: mockSetCurrentTerm,
      allTerms: mockActiveTerms,
      rawCurrentTerm: mockCurrentTerm,
      rawAllTerms: mockActiveTerms,
      termsBySession: { '2024/2025': mockActiveTerms },
      sortedTerms: mockActiveTerms,
      currentAcademicSession: '2024/2025',
      refreshTerms: vi.fn(),
      refreshCurrentTerm: vi.fn(),
      refresh: vi.fn(),
      isCurrentTerm: vi.fn(),
      isInTermType: vi.fn(),
      getTermById: vi.fn(),
      getTermsForSession: vi.fn()
    });
  });

  it('renders current term information', () => {
    render(<TermSwitcher />);
    
    expect(screen.getByText('First Term (2024/2025)')).toBeInTheDocument();
    expect(screen.getByText('Current Term')).toBeInTheDocument();
  });

  it('renders in compact mode', () => {
    render(<TermSwitcher compact={true} showLabel={false} />);
    
    expect(screen.getByText('First Term')).toBeInTheDocument();
    expect(screen.queryByText('Current Term')).not.toBeInTheDocument();
  });

  it('opens dropdown when clicked', async () => {
    render(<TermSwitcher />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Switch Term')).toBeInTheDocument();
      expect(screen.getByText('Second Term')).toBeInTheDocument();
    });
  });

  it('calls setCurrentTerm when different term is selected', async () => {
    render(<TermSwitcher />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    await waitFor(() => {
      const secondTermButton = screen.getByText('Second Term');
      fireEvent.click(secondTermButton);
    });
    
    expect(mockSetCurrentTerm).toHaveBeenCalledWith('term2');
  });

  it('shows loading state', () => {
    mockUseCurrentTerm.mockReturnValue({
      ...mockUseCurrentTerm(),
      loading: true
    });
    
    render(<TermSwitcher />);
    
    expect(screen.getByText('Loading terms...')).toBeInTheDocument();
  });

  it('shows error state', () => {
    mockUseCurrentTerm.mockReturnValue({
      ...mockUseCurrentTerm(),
      error: 'Failed to load terms',
      loading: false
    });
    
    render(<TermSwitcher />);
    
    expect(screen.getByText('Term error')).toBeInTheDocument();
  });

  it('shows no current term state', () => {
    mockUseCurrentTerm.mockReturnValue({
      ...mockUseCurrentTerm(),
      currentTerm: null,
      hasCurrentTerm: false,
      loading: false,
      error: null
    });
    
    render(<TermSwitcher />);
    
    expect(screen.getByText('No current term')).toBeInTheDocument();
  });

  it('closes dropdown when clicking outside', async () => {
    render(
      <div>
        <TermSwitcher />
        <div data-testid="outside">Outside element</div>
      </div>
    );
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Switch Term')).toBeInTheDocument();
    });
    
    const outsideElement = screen.getByTestId('outside');
    fireEvent.mouseDown(outsideElement);
    
    await waitFor(() => {
      expect(screen.queryByText('Switch Term')).not.toBeInTheDocument();
    });
  });

  it('shows current term indicator in dropdown', async () => {
    render(<TermSwitcher />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    await waitFor(() => {
      const currentTermInDropdown = screen.getAllByText('First Term')[1]; // Second occurrence in dropdown
      const parentElement = currentTermInDropdown.closest('button');
      expect(parentElement).toHaveClass('bg-blue-50');
    });
  });

  it('disables term switching when already switching', async () => {
    const mockSetCurrentTermWithDelay = vi.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );
    
    mockUseCurrentTerm.mockReturnValue({
      ...mockUseCurrentTerm(),
      setCurrentTerm: mockSetCurrentTermWithDelay
    });
    
    render(<TermSwitcher />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    await waitFor(() => {
      const secondTermButton = screen.getByText('Second Term');
      fireEvent.click(secondTermButton);
    });
    
    // The button should be disabled while switching
    await waitFor(() => {
      const secondTermButton = screen.getByText('Second Term').closest('button');
      expect(secondTermButton).toBeDisabled();
    });
  });
});
