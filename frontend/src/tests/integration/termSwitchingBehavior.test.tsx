import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TermProvider } from '../../contexts/TermContext';
import { useCurrentTerm } from '../../hooks/useCurrentTerm';
import { academicService } from '../../services/academicService';
import { useToast } from '../../hooks/useToast';
import { Term, TermType } from '../../types';

// Mock dependencies
vi.mock('../../services/academicService');
vi.mock('../../hooks/useToast');

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
  }
];

// Mock component that simulates data filtering based on current term
const MockDataComponent: React.FC = () => {
  const { currentTerm, setCurrentTerm } = useCurrentTerm();
  const [filteredData, setFilteredData] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (currentTerm) {
      // Simulate filtering data based on current term
      const mockData = [
        { id: 1, name: 'Student A', term_id: 'term1' },
        { id: 2, name: 'Student B', term_id: 'term2' },
        { id: 3, name: 'Student C', term_id: 'term1' }
      ];
      const filtered = mockData.filter(item => item.term_id === currentTerm.id);
      setFilteredData(filtered);
    }
  }, [currentTerm]);

  const handleTermSwitch = async (termId: string) => {
    try {
      await setCurrentTerm(termId);
    } catch (error) {
      console.error('Failed to switch term:', error);
    }
  };

  return (
    <div data-testid="mock-data-component">
      <div data-testid="current-term-display">
        {currentTerm ? currentTerm.name : 'No term'}
      </div>
      <div data-testid="filtered-data-count">
        {filteredData.length}
      </div>
      <div data-testid="filtered-data-list">
        {filteredData.map(item => (
          <div key={item.id} data-testid={`data-item-${item.id}`}>
            {item.name}
          </div>
        ))}
      </div>
      <button 
        data-testid="switch-to-term2" 
        onClick={() => handleTermSwitch('term2')}
      >
        Switch to Term 2
      </button>
    </div>
  );
};

// Mock dashboard component that shows term-specific statistics
const MockDashboardComponent: React.FC = () => {
  const { currentTerm } = useCurrentTerm();
  const [stats, setStats] = React.useState({ students: 0, revenue: 0 });

  React.useEffect(() => {
    if (currentTerm) {
      // Simulate term-specific statistics
      const termStats = {
        term1: { students: 150, revenue: 50000 },
        term2: { students: 145, revenue: 48000 }
      };
      setStats(termStats[currentTerm.id as keyof typeof termStats] || { students: 0, revenue: 0 });
    }
  }, [currentTerm]);

  return (
    <div data-testid="mock-dashboard">
      <div data-testid="dashboard-term">{currentTerm?.name || 'No term'}</div>
      <div data-testid="dashboard-students">{stats.students}</div>
      <div data-testid="dashboard-revenue">{stats.revenue}</div>
    </div>
  );
};

// Mock grades component that filters by current term
const MockGradesComponent: React.FC = () => {
  const { currentTerm } = useCurrentTerm();
  const [grades, setGrades] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (currentTerm) {
      // Simulate term-specific grades
      const allGrades = [
        { id: 1, student: 'John', subject: 'Math', grade: 85, term_id: 'term1' },
        { id: 2, student: 'Jane', subject: 'Science', grade: 92, term_id: 'term1' },
        { id: 3, student: 'Bob', subject: 'Math', grade: 78, term_id: 'term2' },
        { id: 4, student: 'Alice', subject: 'Science', grade: 88, term_id: 'term2' }
      ];
      const filtered = allGrades.filter(grade => grade.term_id === currentTerm.id);
      setGrades(filtered);
    }
  }, [currentTerm]);

  return (
    <div data-testid="mock-grades">
      <div data-testid="grades-term">{currentTerm?.name || 'No term'}</div>
      <div data-testid="grades-count">{grades.length}</div>
      <div data-testid="grades-list">
        {grades.map(grade => (
          <div key={grade.id} data-testid={`grade-${grade.id}`}>
            {grade.student}: {grade.grade}
          </div>
        ))}
      </div>
    </div>
  );
};

describe('Term Switching Behavior Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    
    mockUseToast.mockReturnValue(mockToast);
    mockAcademicService.getCurrentTerm.mockResolvedValue(mockTerms[0]);
    mockAcademicService.getTerms.mockResolvedValue(mockTerms);
    mockAcademicService.setCurrentTerm.mockResolvedValue({ message: 'Success' });
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const renderTestComponents = () => {
    return render(
      <TermProvider>
        <div>
          <MockDataComponent />
          <MockDashboardComponent />
          <MockGradesComponent />
        </div>
      </TermProvider>
    );
  };

  it('all components display data for current term initially', async () => {
    renderTestComponents();

    await waitFor(() => {
      // Data component shows current term
      expect(screen.getByTestId('current-term-display')).toHaveTextContent('First Term');
      expect(screen.getByTestId('filtered-data-count')).toHaveTextContent('2');
      
      // Dashboard shows current term stats
      expect(screen.getByTestId('dashboard-term')).toHaveTextContent('First Term');
      expect(screen.getByTestId('dashboard-students')).toHaveTextContent('150');
      expect(screen.getByTestId('dashboard-revenue')).toHaveTextContent('50000');
      
      // Grades show current term data
      expect(screen.getByTestId('grades-term')).toHaveTextContent('First Term');
      expect(screen.getByTestId('grades-count')).toHaveTextContent('2');
    });

    // Verify specific data items are visible
    expect(screen.getByTestId('data-item-1')).toBeInTheDocument();
    expect(screen.getByTestId('data-item-3')).toBeInTheDocument();
    expect(screen.getByTestId('grade-1')).toBeInTheDocument();
    expect(screen.getByTestId('grade-2')).toBeInTheDocument();
  });

  it('all components update when term is switched', async () => {
    renderTestComponents();

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('current-term-display')).toHaveTextContent('First Term');
    });

    // Mock the updated current term after switching
    const updatedCurrentTerm = { ...mockTerms[1], is_current: true };
    mockAcademicService.getCurrentTerm.mockResolvedValue(updatedCurrentTerm);

    // Switch term
    const switchButton = screen.getByTestId('switch-to-term2');
    await act(async () => {
      fireEvent.click(switchButton);
    });

    // Verify API call was made
    expect(mockAcademicService.setCurrentTerm).toHaveBeenCalledWith('term2');

    // Wait for all components to update
    await waitFor(() => {
      // Data component updates
      expect(screen.getByTestId('current-term-display')).toHaveTextContent('Second Term');
      expect(screen.getByTestId('filtered-data-count')).toHaveTextContent('1');
      
      // Dashboard updates
      expect(screen.getByTestId('dashboard-term')).toHaveTextContent('Second Term');
      expect(screen.getByTestId('dashboard-students')).toHaveTextContent('145');
      expect(screen.getByTestId('dashboard-revenue')).toHaveTextContent('48000');
      
      // Grades update
      expect(screen.getByTestId('grades-term')).toHaveTextContent('Second Term');
      expect(screen.getByTestId('grades-count')).toHaveTextContent('2');
    });

    // Verify new data items are visible and old ones are not
    expect(screen.getByTestId('data-item-2')).toBeInTheDocument();
    expect(screen.queryByTestId('data-item-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('data-item-3')).not.toBeInTheDocument();
    
    expect(screen.getByTestId('grade-3')).toBeInTheDocument();
    expect(screen.getByTestId('grade-4')).toBeInTheDocument();
    expect(screen.queryByTestId('grade-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('grade-2')).not.toBeInTheDocument();
  });

  it('components handle term switching errors gracefully', async () => {
    const errorMessage = 'Failed to switch term';
    mockAcademicService.setCurrentTerm.mockRejectedValue(new Error(errorMessage));

    renderTestComponents();

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('current-term-display')).toHaveTextContent('First Term');
    });

    // Attempt to switch term
    const switchButton = screen.getByTestId('switch-to-term2');
    await act(async () => {
      fireEvent.click(switchButton);
    });

    // Verify error was handled
    expect(mockAcademicService.setCurrentTerm).toHaveBeenCalledWith('term2');

    // All components should remain unchanged
    await waitFor(() => {
      expect(screen.getByTestId('current-term-display')).toHaveTextContent('First Term');
      expect(screen.getByTestId('filtered-data-count')).toHaveTextContent('2');
      expect(screen.getByTestId('dashboard-term')).toHaveTextContent('First Term');
      expect(screen.getByTestId('grades-term')).toHaveTextContent('First Term');
    });
  });

  it('data filtering is consistent across all components', async () => {
    renderTestComponents();

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('current-term-display')).toHaveTextContent('First Term');
    });

    // Verify initial data consistency
    expect(screen.getByTestId('filtered-data-count')).toHaveTextContent('2');
    expect(screen.getByTestId('grades-count')).toHaveTextContent('2');

    // Switch term
    const updatedCurrentTerm = { ...mockTerms[1], is_current: true };
    mockAcademicService.getCurrentTerm.mockResolvedValue(updatedCurrentTerm);

    const switchButton = screen.getByTestId('switch-to-term2');
    await act(async () => {
      fireEvent.click(switchButton);
    });

    // Verify data consistency after switch
    await waitFor(() => {
      expect(screen.getByTestId('filtered-data-count')).toHaveTextContent('1');
      expect(screen.getByTestId('grades-count')).toHaveTextContent('2');
      expect(screen.getByTestId('dashboard-students')).toHaveTextContent('145');
    });

    // All components should show data for the same term
    expect(screen.getByTestId('current-term-display')).toHaveTextContent('Second Term');
    expect(screen.getByTestId('dashboard-term')).toHaveTextContent('Second Term');
    expect(screen.getByTestId('grades-term')).toHaveTextContent('Second Term');
  });

  it('components maintain state during concurrent term operations', async () => {
    renderTestComponents();

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('current-term-display')).toHaveTextContent('First Term');
    });

    // Mock multiple concurrent operations
    const updatedCurrentTerm = { ...mockTerms[1], is_current: true };
    mockAcademicService.getCurrentTerm.mockResolvedValue(updatedCurrentTerm);
    
    // Simulate multiple rapid clicks
    const switchButton = screen.getByTestId('switch-to-term2');
    
    await act(async () => {
      fireEvent.click(switchButton);
      fireEvent.click(switchButton);
      fireEvent.click(switchButton);
    });

    // Should only make one API call (or handle concurrent calls properly)
    expect(mockAcademicService.setCurrentTerm).toHaveBeenCalled();

    // Final state should be consistent
    await waitFor(() => {
      expect(screen.getByTestId('current-term-display')).toHaveTextContent('Second Term');
      expect(screen.getByTestId('dashboard-term')).toHaveTextContent('Second Term');
      expect(screen.getByTestId('grades-term')).toHaveTextContent('Second Term');
    });
  });
});
