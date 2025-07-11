import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import TermManagementPage from '../../pages/terms/TermManagementPage';
import { useCurrentTerm } from '../../hooks/useCurrentTerm';
import { useAuth } from '../../contexts/AuthContext';
import { Term, TermType, UserRole } from '../../types';

// Mock dependencies
vi.mock('../../hooks/useCurrentTerm');
vi.mock('../../contexts/AuthContext');
vi.mock('../../components/terms/TermList', () => ({
  default: ({ onEdit, onRefresh }: any) => (
    <div data-testid="term-list">
      <button onClick={() => onEdit({ id: 'term1', name: 'Test Term' })}>
        Edit Term
      </button>
      <button onClick={onRefresh}>Refresh</button>
    </div>
  )
}));
vi.mock('../../components/terms/TermForm', () => ({
  default: ({ isOpen, onClose, onSuccess, mode }: any) => (
    isOpen ? (
      <div data-testid="term-form">
        <span>{mode === 'create' ? 'Create Form' : 'Edit Form'}</span>
        <button onClick={onClose}>Close</button>
        <button onClick={onSuccess}>Success</button>
      </div>
    ) : null
  )
}));
vi.mock('../../components/terms/CurrentTermIndicator', () => ({
  default: () => <div data-testid="current-term-indicator">Current Term</div>
}));

const mockUseCurrentTerm = vi.mocked(useCurrentTerm);
const mockUseAuth = vi.mocked(useAuth);

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
  }
];

const mockUser = {
  id: 'user1',
  email: 'admin@school.com',
  first_name: 'Admin',
  last_name: 'User',
  role: UserRole.SCHOOL_OWNER,
  school_id: 'school1',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

describe('TermManagementPage', () => {
  const mockRefresh = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseAuth.mockReturnValue({
      user: mockUser,
      login: vi.fn(),
      logout: vi.fn(),
      loading: false,
      isAuthenticated: true
    });

    mockUseCurrentTerm.mockReturnValue({
      currentTerm: mockTerms[0],
      allTerms: mockTerms,
      activeTerms: mockTerms,
      termsBySession: { '2024/2025': mockTerms },
      loading: false,
      error: null,
      hasCurrentTerm: true,
      refresh: mockRefresh,
      setCurrentTerm: vi.fn(),
      rawCurrentTerm: mockTerms[0],
      rawAllTerms: mockTerms,
      sortedTerms: mockTerms,
      currentAcademicSession: '2024/2025',
      refreshTerms: vi.fn(),
      refreshCurrentTerm: vi.fn(),
      isCurrentTerm: vi.fn(),
      isInTermType: vi.fn(),
      getTermById: vi.fn(),
      getTermsForSession: vi.fn()
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderPage = () => {
    return render(
      <BrowserRouter>
        <TermManagementPage />
      </BrowserRouter>
    );
  };

  it('renders page header and components', () => {
    renderPage();

    expect(screen.getByText('Term Management')).toBeInTheDocument();
    expect(screen.getByTestId('current-term-indicator')).toBeInTheDocument();
    expect(screen.getByTestId('term-list')).toBeInTheDocument();
  });

  it('displays term statistics', () => {
    renderPage();

    expect(screen.getByText('Total Terms')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // Total terms count
    expect(screen.getByText('Active Terms')).toBeInTheDocument();
    expect(screen.getByText('Academic Sessions')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // Sessions count
  });

  it('shows create term button', () => {
    renderPage();

    const createButton = screen.getByText('Create Term');
    expect(createButton).toBeInTheDocument();
  });

  it('opens create term modal when create button is clicked', () => {
    renderPage();

    const createButton = screen.getByText('Create Term');
    fireEvent.click(createButton);

    expect(screen.getByTestId('term-form')).toBeInTheDocument();
    expect(screen.getByText('Create Form')).toBeInTheDocument();
  });

  it('opens edit term modal when edit is triggered from term list', () => {
    renderPage();

    const editButton = screen.getByText('Edit Term');
    fireEvent.click(editButton);

    expect(screen.getByTestId('term-form')).toBeInTheDocument();
    expect(screen.getByText('Edit Form')).toBeInTheDocument();
  });

  it('closes modals when close is triggered', () => {
    renderPage();

    // Open create modal
    const createButton = screen.getByText('Create Term');
    fireEvent.click(createButton);

    expect(screen.getByTestId('term-form')).toBeInTheDocument();

    // Close modal
    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);

    expect(screen.queryByTestId('term-form')).not.toBeInTheDocument();
  });

  it('refreshes data when form success is triggered', () => {
    renderPage();

    // Open create modal
    const createButton = screen.getByText('Create Term');
    fireEvent.click(createButton);

    // Trigger success
    const successButton = screen.getByText('Success');
    fireEvent.click(successButton);

    expect(mockRefresh).toHaveBeenCalled();
  });

  it('refreshes data when refresh is triggered from term list', () => {
    renderPage();

    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    expect(mockRefresh).toHaveBeenCalled();
  });

  it('calls refresh on component mount', () => {
    renderPage();

    expect(mockRefresh).toHaveBeenCalled();
  });

  it('shows loading state when terms are loading', () => {
    mockUseCurrentTerm.mockReturnValue({
      ...mockUseCurrentTerm(),
      loading: true
    });

    renderPage();

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('shows error state when there is an error', () => {
    mockUseCurrentTerm.mockReturnValue({
      ...mockUseCurrentTerm(),
      error: 'Failed to load terms'
    });

    renderPage();

    expect(screen.getByText('Failed to load terms')).toBeInTheDocument();
  });

  it('shows empty state when no terms exist', () => {
    mockUseCurrentTerm.mockReturnValue({
      ...mockUseCurrentTerm(),
      allTerms: [],
      activeTerms: [],
      termsBySession: {}
    });

    renderPage();

    expect(screen.getByText('0')).toBeInTheDocument(); // Total terms count
  });

  it('displays correct academic session information', () => {
    renderPage();

    expect(screen.getByText('2024/2025')).toBeInTheDocument();
  });

  it('handles multiple academic sessions', () => {
    const multiSessionTerms = [
      ...mockTerms,
      {
        ...mockTerms[0],
        id: 'term3',
        academic_session: '2025/2026'
      }
    ];

    mockUseCurrentTerm.mockReturnValue({
      ...mockUseCurrentTerm(),
      allTerms: multiSessionTerms,
      termsBySession: {
        '2024/2025': mockTerms,
        '2025/2026': [multiSessionTerms[2]]
      }
    });

    renderPage();

    expect(screen.getByText('2')).toBeInTheDocument(); // Sessions count
  });

  it('shows current term information prominently', () => {
    renderPage();

    expect(screen.getByTestId('current-term-indicator')).toBeInTheDocument();
    expect(screen.getByText('Current Term')).toBeInTheDocument();
  });

  it('handles term switching from statistics', () => {
    renderPage();

    // The current term should be displayed in the statistics
    expect(screen.getByText('First Term')).toBeInTheDocument();
  });

  it('maintains modal state correctly', () => {
    renderPage();

    // Open create modal
    fireEvent.click(screen.getByText('Create Term'));
    expect(screen.getByText('Create Form')).toBeInTheDocument();

    // Close and open edit modal
    fireEvent.click(screen.getByText('Close'));
    fireEvent.click(screen.getByText('Edit Term'));
    expect(screen.getByText('Edit Form')).toBeInTheDocument();
  });
});
