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

// Mock data that should be filtered by term
const mockStudentData = [
  { id: 1, name: 'John Doe', term_id: 'term1', enrollment_date: '2024-01-15' },
  { id: 2, name: 'Jane Smith', term_id: 'term1', enrollment_date: '2024-01-20' },
  { id: 3, name: 'Bob Johnson', term_id: 'term2', enrollment_date: '2024-04-10' },
  { id: 4, name: 'Alice Brown', term_id: 'term2', enrollment_date: '2024-04-15' },
  { id: 5, name: 'Charlie Wilson', term_id: 'term3', enrollment_date: '2024-07-05' }
];

const mockGradeData = [
  { id: 1, student_id: 1, subject: 'Math', grade: 85, term_id: 'term1' },
  { id: 2, student_id: 2, subject: 'Science', grade: 92, term_id: 'term1' },
  { id: 3, student_id: 3, subject: 'Math', grade: 78, term_id: 'term2' },
  { id: 4, student_id: 4, subject: 'Science', grade: 88, term_id: 'term2' },
  { id: 5, student_id: 5, subject: 'Math', grade: 90, term_id: 'term3' }
];

const mockAttendanceData = [
  { id: 1, student_id: 1, date: '2024-01-15', present: true, term_id: 'term1' },
  { id: 2, student_id: 2, date: '2024-01-15', present: true, term_id: 'term1' },
  { id: 3, student_id: 3, date: '2024-04-10', present: false, term_id: 'term2' },
  { id: 4, student_id: 4, date: '2024-04-10', present: true, term_id: 'term2' },
  { id: 5, student_id: 5, date: '2024-07-05', present: true, term_id: 'term3' }
];

const mockFeeData = [
  { id: 1, student_id: 1, amount: 1000, paid: true, term_id: 'term1' },
  { id: 2, student_id: 2, amount: 1000, paid: false, term_id: 'term1' },
  { id: 3, student_id: 3, amount: 1200, paid: true, term_id: 'term2' },
  { id: 4, student_id: 4, amount: 1200, paid: true, term_id: 'term2' },
  { id: 5, student_id: 5, amount: 1100, paid: false, term_id: 'term3' }
];

// Component that validates data integrity across multiple modules
const DataIntegrityValidator: React.FC = () => {
  const { currentTerm, setCurrentTerm } = useCurrentTerm();
  const [dataState, setDataState] = React.useState({
    students: [] as any[],
    grades: [] as any[],
    attendance: [] as any[],
    fees: [] as any[],
    lastUpdate: Date.now()
  });

  React.useEffect(() => {
    if (currentTerm) {
      // Filter all data by current term
      const filteredStudents = mockStudentData.filter(s => s.term_id === currentTerm.id);
      const filteredGrades = mockGradeData.filter(g => g.term_id === currentTerm.id);
      const filteredAttendance = mockAttendanceData.filter(a => a.term_id === currentTerm.id);
      const filteredFees = mockFeeData.filter(f => f.term_id === currentTerm.id);

      setDataState({
        students: filteredStudents,
        grades: filteredGrades,
        attendance: filteredAttendance,
        fees: filteredFees,
        lastUpdate: Date.now()
      });
    }
  }, [currentTerm]);

  const switchTerm = async (termId: string) => {
    try {
      await setCurrentTerm(termId);
    } catch (error) {
      console.error('Failed to switch term:', error);
    }
  };

  // Validate data relationships
  const validateDataIntegrity = () => {
    const studentIds = dataState.students.map(s => s.id);
    const gradeStudentIds = dataState.grades.map(g => g.student_id);
    const attendanceStudentIds = dataState.attendance.map(a => a.student_id);
    const feeStudentIds = dataState.fees.map(f => f.student_id);

    // Check if all grades belong to students in current term
    const orphanedGrades = gradeStudentIds.filter(id => !studentIds.includes(id));
    
    // Check if all attendance records belong to students in current term
    const orphanedAttendance = attendanceStudentIds.filter(id => !studentIds.includes(id));
    
    // Check if all fee records belong to students in current term
    const orphanedFees = feeStudentIds.filter(id => !studentIds.includes(id));

    return {
      isValid: orphanedGrades.length === 0 && orphanedAttendance.length === 0 && orphanedFees.length === 0,
      orphanedGrades,
      orphanedAttendance,
      orphanedFees
    };
  };

  const integrity = validateDataIntegrity();

  return (
    <div data-testid="data-integrity-validator">
      <div data-testid="current-term">{currentTerm?.name || 'No term'}</div>
      <div data-testid="students-count">{dataState.students.length}</div>
      <div data-testid="grades-count">{dataState.grades.length}</div>
      <div data-testid="attendance-count">{dataState.attendance.length}</div>
      <div data-testid="fees-count">{dataState.fees.length}</div>
      <div data-testid="data-integrity">{integrity.isValid ? 'valid' : 'invalid'}</div>
      <div data-testid="orphaned-grades">{integrity.orphanedGrades.length}</div>
      <div data-testid="orphaned-attendance">{integrity.orphanedAttendance.length}</div>
      <div data-testid="orphaned-fees">{integrity.orphanedFees.length}</div>
      <div data-testid="last-update">{dataState.lastUpdate}</div>
      
      <button data-testid="switch-to-term1" onClick={() => switchTerm('term1')}>
        Switch to Term 1
      </button>
      <button data-testid="switch-to-term2" onClick={() => switchTerm('term2')}>
        Switch to Term 2
      </button>
      <button data-testid="switch-to-term3" onClick={() => switchTerm('term3')}>
        Switch to Term 3
      </button>
    </div>
  );
};

describe('Term Data Integrity Validation', () => {
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

  const renderValidator = () => {
    return render(
      <TermProvider>
        <DataIntegrityValidator />
      </TermProvider>
    );
  };

  it('maintains data integrity for initial term load', async () => {
    renderValidator();

    await waitFor(() => {
      expect(screen.getByTestId('current-term')).toHaveTextContent('First Term');
      expect(screen.getByTestId('data-integrity')).toHaveTextContent('valid');
    });

    // Verify correct data counts for term1
    expect(screen.getByTestId('students-count')).toHaveTextContent('2');
    expect(screen.getByTestId('grades-count')).toHaveTextContent('2');
    expect(screen.getByTestId('attendance-count')).toHaveTextContent('2');
    expect(screen.getByTestId('fees-count')).toHaveTextContent('2');

    // No orphaned records
    expect(screen.getByTestId('orphaned-grades')).toHaveTextContent('0');
    expect(screen.getByTestId('orphaned-attendance')).toHaveTextContent('0');
    expect(screen.getByTestId('orphaned-fees')).toHaveTextContent('0');
  });

  it('maintains data integrity when switching between terms', async () => {
    renderValidator();

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('current-term')).toHaveTextContent('First Term');
    });

    // Switch to term2
    const updatedTerm2 = { ...mockTerms[1], is_current: true };
    mockAcademicService.getCurrentTerm.mockResolvedValue(updatedTerm2);

    const switchButton = screen.getByTestId('switch-to-term2');
    await act(async () => {
      fireEvent.click(switchButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId('current-term')).toHaveTextContent('Second Term');
      expect(screen.getByTestId('data-integrity')).toHaveTextContent('valid');
    });

    // Verify correct data counts for term2
    expect(screen.getByTestId('students-count')).toHaveTextContent('2');
    expect(screen.getByTestId('grades-count')).toHaveTextContent('2');
    expect(screen.getByTestId('attendance-count')).toHaveTextContent('2');
    expect(screen.getByTestId('fees-count')).toHaveTextContent('2');

    // Switch to term3
    const updatedTerm3 = { ...mockTerms[2], is_current: true };
    mockAcademicService.getCurrentTerm.mockResolvedValue(updatedTerm3);

    const switchToTerm3Button = screen.getByTestId('switch-to-term3');
    await act(async () => {
      fireEvent.click(switchToTerm3Button);
    });

    await waitFor(() => {
      expect(screen.getByTestId('current-term')).toHaveTextContent('Third Term');
      expect(screen.getByTestId('data-integrity')).toHaveTextContent('valid');
    });

    // Verify correct data counts for term3
    expect(screen.getByTestId('students-count')).toHaveTextContent('1');
    expect(screen.getByTestId('grades-count')).toHaveTextContent('1');
    expect(screen.getByTestId('attendance-count')).toHaveTextContent('1');
    expect(screen.getByTestId('fees-count')).toHaveTextContent('1');
  });

  it('ensures no data leakage between terms', async () => {
    renderValidator();

    // Start with term1
    await waitFor(() => {
      expect(screen.getByTestId('current-term')).toHaveTextContent('First Term');
      expect(screen.getByTestId('students-count')).toHaveTextContent('2');
    });

    const initialUpdate = screen.getByTestId('last-update').textContent;

    // Switch to term2
    const updatedTerm2 = { ...mockTerms[1], is_current: true };
    mockAcademicService.getCurrentTerm.mockResolvedValue(updatedTerm2);

    const switchButton = screen.getByTestId('switch-to-term2');
    await act(async () => {
      fireEvent.click(switchButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId('current-term')).toHaveTextContent('Second Term');
    });

    // Verify data has been updated (different timestamp)
    const updatedTimestamp = screen.getByTestId('last-update').textContent;
    expect(updatedTimestamp).not.toBe(initialUpdate);

    // Verify no term1 data is visible in term2
    expect(screen.getByTestId('students-count')).toHaveTextContent('2');
    expect(screen.getByTestId('grades-count')).toHaveTextContent('2');
    
    // Switch back to term1
    const updatedTerm1 = { ...mockTerms[0], is_current: true };
    mockAcademicService.getCurrentTerm.mockResolvedValue(updatedTerm1);

    const switchBackButton = screen.getByTestId('switch-to-term1');
    await act(async () => {
      fireEvent.click(switchBackButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId('current-term')).toHaveTextContent('First Term');
      expect(screen.getByTestId('students-count')).toHaveTextContent('2');
    });

    // Data integrity should still be maintained
    expect(screen.getByTestId('data-integrity')).toHaveTextContent('valid');
  });

  it('handles rapid term switching without data corruption', async () => {
    renderValidator();

    await waitFor(() => {
      expect(screen.getByTestId('current-term')).toHaveTextContent('First Term');
    });

    // Mock rapid switching
    const term2Updated = { ...mockTerms[1], is_current: true };
    const term3Updated = { ...mockTerms[2], is_current: true };
    
    mockAcademicService.getCurrentTerm
      .mockResolvedValueOnce(term2Updated)
      .mockResolvedValueOnce(term3Updated)
      .mockResolvedValueOnce(mockTerms[0]);

    // Rapid clicks
    const switch2Button = screen.getByTestId('switch-to-term2');
    const switch3Button = screen.getByTestId('switch-to-term3');
    const switch1Button = screen.getByTestId('switch-to-term1');

    await act(async () => {
      fireEvent.click(switch2Button);
      fireEvent.click(switch3Button);
      fireEvent.click(switch1Button);
    });

    // Final state should be consistent and valid
    await waitFor(() => {
      expect(screen.getByTestId('data-integrity')).toHaveTextContent('valid');
      expect(screen.getByTestId('orphaned-grades')).toHaveTextContent('0');
      expect(screen.getByTestId('orphaned-attendance')).toHaveTextContent('0');
      expect(screen.getByTestId('orphaned-fees')).toHaveTextContent('0');
    });
  });

  it('validates data relationships remain consistent across term switches', async () => {
    renderValidator();

    await waitFor(() => {
      expect(screen.getByTestId('current-term')).toHaveTextContent('First Term');
    });

    // For each term, verify that all related data belongs to students in that term
    const terms = [
      { term: mockTerms[1], button: 'switch-to-term2', name: 'Second Term' },
      { term: mockTerms[2], button: 'switch-to-term3', name: 'Third Term' },
      { term: mockTerms[0], button: 'switch-to-term1', name: 'First Term' }
    ];

    for (const { term, button, name } of terms) {
      const updatedTerm = { ...term, is_current: true };
      mockAcademicService.getCurrentTerm.mockResolvedValue(updatedTerm);

      const switchButton = screen.getByTestId(button);
      await act(async () => {
        fireEvent.click(switchButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId('current-term')).toHaveTextContent(name);
        expect(screen.getByTestId('data-integrity')).toHaveTextContent('valid');
        expect(screen.getByTestId('orphaned-grades')).toHaveTextContent('0');
        expect(screen.getByTestId('orphaned-attendance')).toHaveTextContent('0');
        expect(screen.getByTestId('orphaned-fees')).toHaveTextContent('0');
      });
    }
  });

  it('maintains data integrity during error conditions', async () => {
    renderValidator();

    await waitFor(() => {
      expect(screen.getByTestId('current-term')).toHaveTextContent('First Term');
      expect(screen.getByTestId('data-integrity')).toHaveTextContent('valid');
    });

    // Mock a failed term switch
    mockAcademicService.setCurrentTerm.mockRejectedValue(new Error('Network error'));

    const switchButton = screen.getByTestId('switch-to-term2');
    await act(async () => {
      fireEvent.click(switchButton);
    });

    // Data should remain in valid state for original term
    await waitFor(() => {
      expect(screen.getByTestId('current-term')).toHaveTextContent('First Term');
      expect(screen.getByTestId('data-integrity')).toHaveTextContent('valid');
      expect(screen.getByTestId('students-count')).toHaveTextContent('2');
    });
  });
});
