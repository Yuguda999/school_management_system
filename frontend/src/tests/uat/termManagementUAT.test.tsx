import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { TermProvider } from '../../contexts/TermContext';
import { AuthProvider } from '../../contexts/AuthContext';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { ToastProvider } from '../../contexts/ToastContext';
import TermManagementPage from '../../pages/terms/TermManagementPage';
import TermSwitcher from '../../components/terms/TermSwitcher';
import CurrentTermIndicator from '../../components/terms/CurrentTermIndicator';
import { academicService } from '../../services/academicService';
import { Term, TermType, User, UserRole } from '../../types';

// Mock dependencies
vi.mock('../../services/academicService');
vi.mock('../../services/apiService');

const mockAcademicService = vi.mocked(academicService);

const mockSchoolOwner: User = {
  id: 'owner1',
  email: 'owner@school.com',
  first_name: 'School',
  last_name: 'Owner',
  role: UserRole.SCHOOL_OWNER,
  school_id: 'school1',
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
      user: mockSchoolOwner,
      login: vi.fn(),
      logout: vi.fn(),
      loading: false,
      isAuthenticated: true
    })
  };
});

// Mock toast context
vi.mock('../../hooks/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn()
  })
}));

// Full application wrapper for UAT
const UATAppWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <TermProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </TermProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('Term Management User Acceptance Testing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    
    // Setup default mocks
    mockAcademicService.getCurrentTerm.mockResolvedValue(mockTerms[0]);
    mockAcademicService.getTerms.mockResolvedValue(mockTerms);
    mockAcademicService.setCurrentTerm.mockResolvedValue({ message: 'Success' });
    mockAcademicService.createTerm.mockResolvedValue(mockTerms[0]);
    mockAcademicService.updateTerm.mockResolvedValue(mockTerms[0]);
    mockAcademicService.deleteTerm.mockResolvedValue();
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('UAT-001: School Owner can view all terms for their school', () => {
    it('displays all terms with complete information', async () => {
      render(
        <UATAppWrapper>
          <TermManagementPage />
        </UATAppWrapper>
      );

      // Wait for terms to load
      await waitFor(() => {
        expect(screen.getByText('Term Management')).toBeInTheDocument();
      });

      // Verify all terms are displayed
      expect(screen.getByText('First Term')).toBeInTheDocument();
      expect(screen.getByText('Second Term')).toBeInTheDocument();
      expect(screen.getByText('Third Term')).toBeInTheDocument();

      // Verify term details are shown
      expect(screen.getByText('2024/2025')).toBeInTheDocument();
      expect(screen.getByText('January 1, 2024 - March 31, 2024')).toBeInTheDocument();

      // Verify current term is clearly indicated
      expect(screen.getByText('Current')).toBeInTheDocument();
    });

    it('shows term statistics and overview', async () => {
      render(
        <UATAppWrapper>
          <TermManagementPage />
        </UATAppWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Total Terms')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument(); // Total terms count
        expect(screen.getByText('Active Terms')).toBeInTheDocument();
        expect(screen.getByText('Academic Sessions')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument(); // Sessions count
      });
    });
  });

  describe('UAT-002: School Owner can create new academic terms', () => {
    it('allows creating a new term with all required information', async () => {
      render(
        <UATAppWrapper>
          <TermManagementPage />
        </UATAppWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Create Term')).toBeInTheDocument();
      });

      // Click create term button
      const createButton = screen.getByText('Create Term');
      fireEvent.click(createButton);

      // Verify form appears
      await waitFor(() => {
        expect(screen.getByText('Create New Term')).toBeInTheDocument();
      });

      // Fill in term details
      const nameInput = screen.getByLabelText(/term name/i);
      const sessionInput = screen.getByLabelText(/academic session/i);
      const startDateInput = screen.getByLabelText(/start date/i);
      const endDateInput = screen.getByLabelText(/end date/i);

      fireEvent.change(nameInput, { target: { value: 'Fourth Term' } });
      fireEvent.change(sessionInput, { target: { value: '2024/2025' } });
      fireEvent.change(startDateInput, { target: { value: '2024-10-01' } });
      fireEvent.change(endDateInput, { target: { value: '2024-12-31' } });

      // Submit form
      const submitButton = screen.getByText('Create Term');
      fireEvent.click(submitButton);

      // Verify API call
      await waitFor(() => {
        expect(mockAcademicService.createTerm).toHaveBeenCalledWith({
          name: 'Fourth Term',
          type: TermType.FIRST_TERM,
          academic_session: '2024/2025',
          start_date: '2024-10-01',
          end_date: '2024-12-31',
          is_active: true
        });
      });
    });

    it('validates term data before creation', async () => {
      render(
        <UATAppWrapper>
          <TermManagementPage />
        </UATAppWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Create Term')).toBeInTheDocument();
      });

      const createButton = screen.getByText('Create Term');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('Create New Term')).toBeInTheDocument();
      });

      // Try to submit without required fields
      const submitButton = screen.getByText('Create Term');
      fireEvent.click(submitButton);

      // Verify validation errors
      await waitFor(() => {
        expect(screen.getByText('Term name is required')).toBeInTheDocument();
        expect(screen.getByText('Academic session is required')).toBeInTheDocument();
        expect(screen.getByText('Start date is required')).toBeInTheDocument();
        expect(screen.getByText('End date is required')).toBeInTheDocument();
      });
    });
  });

  describe('UAT-003: School Owner can edit existing terms', () => {
    it('allows editing term details', async () => {
      render(
        <UATAppWrapper>
          <TermManagementPage />
        </UATAppWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('First Term')).toBeInTheDocument();
      });

      // Click edit button for first term
      const editButtons = screen.getAllByLabelText(/edit/i);
      fireEvent.click(editButtons[0]);

      // Verify edit form appears
      await waitFor(() => {
        expect(screen.getByText('Edit Term')).toBeInTheDocument();
        expect(screen.getByDisplayValue('First Term')).toBeInTheDocument();
      });

      // Update term name
      const nameInput = screen.getByDisplayValue('First Term');
      fireEvent.change(nameInput, { target: { value: 'Updated First Term' } });

      // Submit changes
      const updateButton = screen.getByText('Update Term');
      fireEvent.click(updateButton);

      // Verify API call
      await waitFor(() => {
        expect(mockAcademicService.updateTerm).toHaveBeenCalledWith('term1', {
          name: 'Updated First Term',
          type: TermType.FIRST_TERM,
          academic_session: '2024/2025',
          start_date: '2024-01-01',
          end_date: '2024-03-31',
          is_active: true
        });
      });
    });
  });

  describe('UAT-004: School Owner can switch between terms', () => {
    it('allows switching current term from term switcher', async () => {
      render(
        <UATAppWrapper>
          <div>
            <TermSwitcher />
            <CurrentTermIndicator variant="card" />
          </div>
        </UATAppWrapper>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('First Term (2024/2025)')).toBeInTheDocument();
      });

      // Open term switcher
      const switcherButton = screen.getByRole('button');
      fireEvent.click(switcherButton);

      // Wait for dropdown
      await waitFor(() => {
        expect(screen.getByText('Switch Term')).toBeInTheDocument();
      });

      // Click on second term
      const secondTermButton = screen.getByText('Second Term');
      fireEvent.click(secondTermButton);

      // Verify API call
      expect(mockAcademicService.setCurrentTerm).toHaveBeenCalledWith('term2');
    });

    it('shows current term indicator updates immediately', async () => {
      render(
        <UATAppWrapper>
          <CurrentTermIndicator variant="banner" />
        </UATAppWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('First Term')).toBeInTheDocument();
        expect(screen.getByText('2024/2025')).toBeInTheDocument();
      });

      // Verify current term status is shown
      expect(screen.getByText('Current')).toBeInTheDocument();
    });
  });

  describe('UAT-005: School Owner can delete terms safely', () => {
    it('prevents deletion of current term', async () => {
      render(
        <UATAppWrapper>
          <TermManagementPage />
        </UATAppWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('First Term')).toBeInTheDocument();
      });

      // Current term should not have delete button or it should be disabled
      const deleteButtons = screen.getAllByLabelText(/delete/i);
      
      // Try to delete current term (should be prevented)
      if (deleteButtons.length > 0) {
        fireEvent.click(deleteButtons[0]);
        
        // Should show warning or prevent deletion
        await waitFor(() => {
          // Either no confirmation dialog appears, or deletion is prevented
          expect(mockAcademicService.deleteTerm).not.toHaveBeenCalledWith('term1');
        });
      }
    });

    it('allows deletion of non-current terms with confirmation', async () => {
      render(
        <UATAppWrapper>
          <TermManagementPage />
        </UATAppWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Second Term')).toBeInTheDocument();
      });

      // Find delete button for non-current term
      const deleteButtons = screen.getAllByLabelText(/delete/i);
      fireEvent.click(deleteButtons[1]); // Delete second term

      // Confirm deletion
      await waitFor(() => {
        const confirmButton = screen.getByText(/delete/i);
        fireEvent.click(confirmButton);
      });

      // Verify API call
      await waitFor(() => {
        expect(mockAcademicService.deleteTerm).toHaveBeenCalledWith('term2');
      });
    });
  });

  describe('UAT-006: System provides clear feedback and error handling', () => {
    it('shows loading states during operations', async () => {
      // Mock delayed response
      mockAcademicService.getCurrentTerm.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockTerms[0]), 100))
      );

      render(
        <UATAppWrapper>
          <TermManagementPage />
        </UATAppWrapper>
      );

      // Should show loading state initially
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByText('First Term')).toBeInTheDocument();
      });
    });

    it('handles and displays errors gracefully', async () => {
      mockAcademicService.getCurrentTerm.mockRejectedValue(new Error('Failed to load terms'));

      render(
        <UATAppWrapper>
          <TermManagementPage />
        </UATAppWrapper>
      );

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText('Failed to load terms')).toBeInTheDocument();
      });
    });
  });

  describe('UAT-007: Term management integrates with school workflow', () => {
    it('maintains term context across different pages', async () => {
      render(
        <UATAppWrapper>
          <div>
            <TermSwitcher />
            <div data-testid="mock-grades-page">
              Mock Grades Page - Current Term: <CurrentTermIndicator variant="inline" />
            </div>
          </div>
        </UATAppWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('First Term (2024/2025)')).toBeInTheDocument();
      });

      // Verify term context is available across components
      expect(screen.getByTestId('mock-grades-page')).toHaveTextContent('First Term');
    });

    it('persists term selection across browser sessions', async () => {
      const { unmount } = render(
        <UATAppWrapper>
          <TermSwitcher />
        </UATAppWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('First Term (2024/2025)')).toBeInTheDocument();
      });

      // Switch term
      const switcherButton = screen.getByRole('button');
      fireEvent.click(switcherButton);

      await waitFor(() => {
        expect(screen.getByText('Switch Term')).toBeInTheDocument();
      });

      const secondTermButton = screen.getByText('Second Term');
      fireEvent.click(secondTermButton);

      // Unmount and remount to simulate page refresh
      unmount();

      // Mock the updated current term
      mockAcademicService.getCurrentTerm.mockResolvedValue({
        ...mockTerms[1],
        is_current: true
      });

      render(
        <UATAppWrapper>
          <TermSwitcher />
        </UATAppWrapper>
      );

      // Should remember the selected term
      await waitFor(() => {
        expect(screen.getByText('Second Term')).toBeInTheDocument();
      });
    });
  });
});
