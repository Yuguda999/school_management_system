import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { TermProvider } from '../../contexts/TermContext';
import { AuthProvider } from '../../contexts/AuthContext';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { ToastProvider } from '../../contexts/ToastContext';
import TermSwitcher from '../../components/terms/TermSwitcher';
import CurrentTermIndicator from '../../components/terms/CurrentTermIndicator';
import { academicService } from '../../services/academicService';
import { Term, TermType, User } from '../../types';

// Mock services
vi.mock('../../services/academicService');
vi.mock('../../services/apiService');

const mockAcademicService = vi.mocked(academicService);

const mockUser: User = {
  id: 'user1',
  email: 'admin@school.com',
  first_name: 'Admin',
  last_name: 'User',
  role: 'admin',
  school_id: 'school1',
  school_name: 'Test School',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
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
    is_active: true,
    school_id: 'school1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

// Mock auth context
vi.mock('../../contexts/AuthContext', async () => {
  const actual = await vi.importActual('../../contexts/AuthContext');
  return {
    ...actual,
    useAuth: () => ({
      user: mockUser,
      login: vi.fn(),
      logout: vi.fn(),
      loading: false,
      isAuthenticated: true
    })
  };
});

// Test component that uses both TermSwitcher and CurrentTermIndicator
const TestApp: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <TermProvider>
            <ToastProvider>
              <div>
                <h1>Term Switching Integration Test</h1>
                <div data-testid="term-switcher">
                  <TermSwitcher />
                </div>
                <div data-testid="current-term-indicator">
                  <CurrentTermIndicator variant="card" />
                </div>
              </div>
            </ToastProvider>
          </TermProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('Term Switching Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    
    // Setup default mocks
    mockAcademicService.getCurrentTerm.mockResolvedValue(mockTerms[0]); // First term is current
    mockAcademicService.getTerms.mockResolvedValue(mockTerms);
    mockAcademicService.setCurrentTerm.mockResolvedValue({ message: 'Success' });
  });

  it('displays current term in both components initially', async () => {
    render(<TestApp />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('First Term (2024/2025)')).toBeInTheDocument();
    });

    // Check that both components show the current term
    const termSwitcher = screen.getByTestId('term-switcher');
    const termIndicator = screen.getByTestId('current-term-indicator');

    expect(termSwitcher).toHaveTextContent('First Term');
    expect(termIndicator).toHaveTextContent('First Term');
  });

  it('switches term and updates both components', async () => {
    render(<TestApp />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('First Term (2024/2025)')).toBeInTheDocument();
    });

    // Mock the updated current term after switching
    const updatedTerms = mockTerms.map(term => ({
      ...term,
      is_current: term.id === 'term2'
    }));
    
    mockAcademicService.getCurrentTerm.mockResolvedValue(updatedTerms[1]); // Second term becomes current
    mockAcademicService.getTerms.mockResolvedValue(updatedTerms);

    // Open term switcher dropdown
    const termSwitcherButton = screen.getByRole('button');
    fireEvent.click(termSwitcherButton);

    // Wait for dropdown to appear
    await waitFor(() => {
      expect(screen.getByText('Switch Term')).toBeInTheDocument();
    });

    // Click on Second Term
    const secondTermButton = screen.getByText('Second Term');
    fireEvent.click(secondTermButton);

    // Verify API call was made
    expect(mockAcademicService.setCurrentTerm).toHaveBeenCalledWith('term2');

    // Wait for components to update
    await waitFor(() => {
      expect(screen.getByText('Second Term (2024/2025)')).toBeInTheDocument();
    });

    // Verify both components show the new current term
    const termSwitcher = screen.getByTestId('term-switcher');
    const termIndicator = screen.getByTestId('current-term-indicator');

    expect(termSwitcher).toHaveTextContent('Second Term');
    expect(termIndicator).toHaveTextContent('Second Term');
  });

  it('handles term switching error gracefully', async () => {
    render(<TestApp />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('First Term (2024/2025)')).toBeInTheDocument();
    });

    // Mock API error
    mockAcademicService.setCurrentTerm.mockRejectedValue(
      new Error('Failed to set current term')
    );

    // Open term switcher dropdown
    const termSwitcherButton = screen.getByRole('button');
    fireEvent.click(termSwitcherButton);

    // Wait for dropdown to appear
    await waitFor(() => {
      expect(screen.getByText('Switch Term')).toBeInTheDocument();
    });

    // Click on Second Term
    const secondTermButton = screen.getByText('Second Term');
    fireEvent.click(secondTermButton);

    // Verify API call was made
    expect(mockAcademicService.setCurrentTerm).toHaveBeenCalledWith('term2');

    // Components should still show the original term since switching failed
    await waitFor(() => {
      const termSwitcher = screen.getByTestId('term-switcher');
      const termIndicator = screen.getByTestId('current-term-indicator');

      expect(termSwitcher).toHaveTextContent('First Term');
      expect(termIndicator).toHaveTextContent('First Term');
    });
  });

  it('persists term selection across page reloads', async () => {
    // First render - switch to second term
    const { unmount } = render(<TestApp />);

    await waitFor(() => {
      expect(screen.getByText('First Term (2024/2025)')).toBeInTheDocument();
    });

    // Mock the updated current term
    const updatedTerms = mockTerms.map(term => ({
      ...term,
      is_current: term.id === 'term2'
    }));
    
    mockAcademicService.getCurrentTerm.mockResolvedValue(updatedTerms[1]);
    mockAcademicService.getTerms.mockResolvedValue(updatedTerms);

    // Switch term
    const termSwitcherButton = screen.getByRole('button');
    fireEvent.click(termSwitcherButton);

    await waitFor(() => {
      expect(screen.getByText('Switch Term')).toBeInTheDocument();
    });

    const secondTermButton = screen.getByText('Second Term');
    fireEvent.click(secondTermButton);

    await waitFor(() => {
      expect(screen.getByText('Second Term (2024/2025)')).toBeInTheDocument();
    });

    // Unmount component (simulate page reload)
    unmount();

    // Re-render component
    render(<TestApp />);

    // Should immediately show the persisted term from localStorage
    await waitFor(() => {
      expect(screen.getByText('Second Term (2024/2025)')).toBeInTheDocument();
    });
  });

  it('shows loading state during term switching', async () => {
    render(<TestApp />);

    await waitFor(() => {
      expect(screen.getByText('First Term (2024/2025)')).toBeInTheDocument();
    });

    // Mock slow API response
    let resolveSetCurrentTerm: (value: any) => void;
    const setCurrentTermPromise = new Promise(resolve => {
      resolveSetCurrentTerm = resolve;
    });
    mockAcademicService.setCurrentTerm.mockReturnValue(setCurrentTermPromise);

    // Open dropdown and click second term
    const termSwitcherButton = screen.getByRole('button');
    fireEvent.click(termSwitcherButton);

    await waitFor(() => {
      expect(screen.getByText('Switch Term')).toBeInTheDocument();
    });

    const secondTermButton = screen.getByText('Second Term');
    fireEvent.click(secondTermButton);

    // Should show loading state
    await waitFor(() => {
      const secondTermButtonElement = screen.getByText('Second Term').closest('button');
      expect(secondTermButtonElement).toBeDisabled();
    });

    // Resolve the promise
    resolveSetCurrentTerm!({ message: 'Success' });

    // Loading state should disappear
    await waitFor(() => {
      const secondTermButtonElement = screen.getByText('Second Term').closest('button');
      expect(secondTermButtonElement).not.toBeDisabled();
    });
  });

  it('updates term indicator status correctly', async () => {
    // Mock current date to be during first term
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-02-15'));

    render(<TestApp />);

    await waitFor(() => {
      expect(screen.getByText('First Term (2024/2025)')).toBeInTheDocument();
    });

    // Should show "Active" status for current term
    expect(screen.getByText('Active')).toBeInTheDocument();

    vi.useRealTimers();
  });
});
