import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import CurrentTermIndicator from '../../../components/terms/CurrentTermIndicator';
import { TermProvider } from '../../../contexts/TermContext';
import { academicService } from '../../../services/academicService';
import { Term, TermType } from '../../../types';

// Mock the academic service
vi.mock('../../../services/academicService');

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

describe('CurrentTermIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAcademicService.getCurrentTerm.mockResolvedValue(mockCurrentTerm);
    mockAcademicService.getTerms.mockResolvedValue([mockCurrentTerm]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderWithProvider = (variant: 'badge' | 'banner' = 'badge') => {
    return render(
      <TermProvider>
        <CurrentTermIndicator variant={variant} />
      </TermProvider>
    );
  };

  it('renders current term information in badge variant', async () => {
    renderWithProvider('badge');

    await waitFor(() => {
      expect(screen.getByText('First Term')).toBeInTheDocument();
      expect(screen.getByText('2024/2025')).toBeInTheDocument();
    });
  });

  it('renders current term information in banner variant', async () => {
    renderWithProvider('banner');

    await waitFor(() => {
      expect(screen.getByText('First Term')).toBeInTheDocument();
      expect(screen.getByText('2024/2025')).toBeInTheDocument();
    });
  });

  it('applies correct CSS classes for badge variant', async () => {
    renderWithProvider('badge');

    await waitFor(() => {
      const container = screen.getByText('First Term').closest('div');
      expect(container).toHaveClass('inline-flex');
    });
  });

  it('applies correct CSS classes for banner variant', async () => {
    renderWithProvider('banner');

    await waitFor(() => {
      const container = screen.getByText('First Term').closest('div');
      expect(container).toHaveClass('bg-blue-50');
    });
  });

  it('shows loading state when term is not loaded', () => {
    mockAcademicService.getCurrentTerm.mockImplementation(() => new Promise(() => {}));
    
    renderWithProvider();

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows error state when term loading fails', async () => {
    mockAcademicService.getCurrentTerm.mockRejectedValue(new Error('Failed to load term'));
    
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByText(/no term selected/i)).toBeInTheDocument();
    });
  });

  it('shows no term message when no current term exists', async () => {
    mockAcademicService.getCurrentTerm.mockResolvedValue(null);
    
    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByText(/no term selected/i)).toBeInTheDocument();
    });
  });

  it('displays term dates when showDates prop is true', async () => {
    render(
      <TermProvider>
        <CurrentTermIndicator variant="banner" showDates={true} />
      </TermProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/jan 1, 2024/i)).toBeInTheDocument();
      expect(screen.getByText(/mar 31, 2024/i)).toBeInTheDocument();
    });
  });

  it('does not display term dates when showDates prop is false', async () => {
    render(
      <TermProvider>
        <CurrentTermIndicator variant="banner" showDates={false} />
      </TermProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText(/jan 1, 2024/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/mar 31, 2024/i)).not.toBeInTheDocument();
    });
  });

  it('updates when current term changes', async () => {
    const { rerender } = renderWithProvider();

    await waitFor(() => {
      expect(screen.getByText('First Term')).toBeInTheDocument();
    });

    // Mock a different current term
    const newTerm: Term = {
      ...mockCurrentTerm,
      id: 'term2',
      name: 'Second Term',
      type: TermType.SECOND_TERM
    };

    mockAcademicService.getCurrentTerm.mockResolvedValue(newTerm);

    rerender(
      <TermProvider>
        <CurrentTermIndicator variant="badge" />
      </TermProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Second Term')).toBeInTheDocument();
    });
  });

  it('handles term type display correctly', async () => {
    const termTypes = [
      { type: TermType.FIRST_TERM, name: 'First Term' },
      { type: TermType.SECOND_TERM, name: 'Second Term' },
      { type: TermType.THIRD_TERM, name: 'Third Term' }
    ];

    for (const termType of termTypes) {
      const term = { ...mockCurrentTerm, type: termType.type, name: termType.name };
      mockAcademicService.getCurrentTerm.mockResolvedValue(term);

      const { unmount } = renderWithProvider();

      await waitFor(() => {
        expect(screen.getByText(termType.name)).toBeInTheDocument();
      });

      unmount();
    }
  });

  it('displays academic session in correct format', async () => {
    renderWithProvider();

    await waitFor(() => {
      const sessionElement = screen.getByText('2024/2025');
      expect(sessionElement).toBeInTheDocument();
    });
  });

  it('handles custom className prop', async () => {
    render(
      <TermProvider>
        <CurrentTermIndicator variant="badge" className="custom-class" />
      </TermProvider>
    );

    await waitFor(() => {
      const container = screen.getByText('First Term').closest('div');
      expect(container).toHaveClass('custom-class');
    });
  });
});
