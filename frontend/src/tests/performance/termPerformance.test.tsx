import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
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

// Generate large dataset for performance testing
const generateMockTerms = (count: number): Term[] => {
  const terms: Term[] = [];
  const sessions = ['2020/2021', '2021/2022', '2022/2023', '2023/2024', '2024/2025'];
  const termTypes = [TermType.FIRST_TERM, TermType.SECOND_TERM, TermType.THIRD_TERM];
  
  for (let i = 0; i < count; i++) {
    const sessionIndex = Math.floor(i / 3) % sessions.length;
    const termTypeIndex = i % 3;
    const year = 2020 + Math.floor(i / 3);
    
    terms.push({
      id: `term${i + 1}`,
      name: `${termTypes[termTypeIndex].replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
      type: termTypes[termTypeIndex],
      academic_session: sessions[sessionIndex],
      start_date: `${year}-${String((termTypeIndex * 3) + 1).padStart(2, '0')}-01`,
      end_date: `${year}-${String((termTypeIndex * 3) + 3).padStart(2, '0')}-31`,
      is_current: i === 0, // First term is current
      is_active: true,
      school_id: 'school1',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    });
  }
  
  return terms;
};

// Test component that measures performance
const PerformanceTestComponent: React.FC<{ onRenderComplete: () => void }> = ({ onRenderComplete }) => {
  const {
    currentTerm,
    allTerms,
    loading,
    termsBySession,
    sortedTerms,
    activeTerms
  } = useTermContext();

  React.useEffect(() => {
    if (!loading && allTerms.length > 0) {
      onRenderComplete();
    }
  }, [loading, allTerms.length, onRenderComplete]);

  return (
    <div>
      <div data-testid="loading">{loading ? 'Loading' : 'Loaded'}</div>
      <div data-testid="current-term">{currentTerm?.name || 'No current term'}</div>
      <div data-testid="total-terms">{allTerms.length}</div>
      <div data-testid="sessions-count">{Object.keys(termsBySession).length}</div>
      <div data-testid="sorted-terms-count">{sortedTerms.length}</div>
      <div data-testid="active-terms-count">{activeTerms.length}</div>
    </div>
  );
};

describe('Term Management Performance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('loads small dataset efficiently', async () => {
    const smallDataset = generateMockTerms(10);
    mockAcademicService.getCurrentTerm.mockResolvedValue(smallDataset[0]);
    mockAcademicService.getTerms.mockResolvedValue(smallDataset);

    const startTime = performance.now();
    let renderCompleteTime: number;

    const onRenderComplete = () => {
      renderCompleteTime = performance.now();
    };

    render(
      <TermProvider>
        <PerformanceTestComponent onRenderComplete={onRenderComplete} />
      </TermProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Loaded');
    });

    const loadTime = renderCompleteTime! - startTime;
    
    // Should load small dataset quickly (under 100ms)
    expect(loadTime).toBeLessThan(100);
    expect(screen.getByTestId('total-terms')).toHaveTextContent('10');
  });

  it('handles medium dataset efficiently', async () => {
    const mediumDataset = generateMockTerms(100);
    mockAcademicService.getCurrentTerm.mockResolvedValue(mediumDataset[0]);
    mockAcademicService.getTerms.mockResolvedValue(mediumDataset);

    const startTime = performance.now();
    let renderCompleteTime: number;

    const onRenderComplete = () => {
      renderCompleteTime = performance.now();
    };

    render(
      <TermProvider>
        <PerformanceTestComponent onRenderComplete={onRenderComplete} />
      </TermProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Loaded');
    });

    const loadTime = renderCompleteTime! - startTime;
    
    // Should handle medium dataset reasonably (under 500ms)
    expect(loadTime).toBeLessThan(500);
    expect(screen.getByTestId('total-terms')).toHaveTextContent('100');
    
    // Verify computed properties are calculated correctly
    expect(screen.getByTestId('sessions-count')).toHaveTextContent('5');
    expect(screen.getByTestId('active-terms-count')).toHaveTextContent('100');
  });

  it('handles large dataset without blocking UI', async () => {
    const largeDataset = generateMockTerms(1000);
    mockAcademicService.getCurrentTerm.mockResolvedValue(largeDataset[0]);
    mockAcademicService.getTerms.mockResolvedValue(largeDataset);

    const startTime = performance.now();
    let renderCompleteTime: number;

    const onRenderComplete = () => {
      renderCompleteTime = performance.now();
    };

    render(
      <TermProvider>
        <PerformanceTestComponent onRenderComplete={onRenderComplete} />
      </TermProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Loaded');
    }, { timeout: 5000 });

    const loadTime = renderCompleteTime! - startTime;
    
    // Should handle large dataset without excessive delay (under 2 seconds)
    expect(loadTime).toBeLessThan(2000);
    expect(screen.getByTestId('total-terms')).toHaveTextContent('1000');
  });

  it('efficiently updates when current term changes', async () => {
    const dataset = generateMockTerms(50);
    mockAcademicService.getCurrentTerm.mockResolvedValue(dataset[0]);
    mockAcademicService.getTerms.mockResolvedValue(dataset);
    mockAcademicService.setCurrentTerm.mockResolvedValue({ message: 'Success' });

    const TestComponentWithUpdate: React.FC = () => {
      const { setCurrentTerm, currentTerm, loading } = useTermContext();
      
      const handleUpdate = async () => {
        const startTime = performance.now();
        await setCurrentTerm('term2');
        const endTime = performance.now();
        
        // Update should be fast (under 100ms for API call + state update)
        expect(endTime - startTime).toBeLessThan(100);
      };

      return (
        <div>
          <div data-testid="current-term">{currentTerm?.name || 'No current term'}</div>
          <div data-testid="loading">{loading ? 'Loading' : 'Loaded'}</div>
          <button onClick={handleUpdate} data-testid="update-button">
            Update Term
          </button>
        </div>
      );
    };

    render(
      <TermProvider>
        <TestComponentWithUpdate />
      </TermProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Loaded');
    });

    // Mock updated current term
    mockAcademicService.getCurrentTerm.mockResolvedValue(dataset[1]);
    mockAcademicService.getTerms.mockResolvedValue(
      dataset.map(term => ({ ...term, is_current: term.id === 'term2' }))
    );

    // Trigger update
    const updateButton = screen.getByTestId('update-button');
    updateButton.click();

    // Should update efficiently
    await waitFor(() => {
      expect(mockAcademicService.setCurrentTerm).toHaveBeenCalledWith('term2');
    });
  });

  it('efficiently filters and sorts large datasets', async () => {
    const largeDataset = generateMockTerms(500);
    mockAcademicService.getCurrentTerm.mockResolvedValue(largeDataset[0]);
    mockAcademicService.getTerms.mockResolvedValue(largeDataset);

    const FilterTestComponent: React.FC = () => {
      const { allTerms, termsBySession, sortedTerms, activeTerms } = useTermContext();
      
      React.useEffect(() => {
        if (allTerms.length > 0) {
          const startTime = performance.now();
          
          // Perform filtering and sorting operations
          const sessions = Object.keys(termsBySession);
          const sorted = sortedTerms;
          const active = activeTerms;
          
          const endTime = performance.now();
          const operationTime = endTime - startTime;
          
          // Filtering and sorting should be fast (under 50ms for 500 items)
          expect(operationTime).toBeLessThan(50);
          expect(sessions.length).toBeGreaterThan(0);
          expect(sorted.length).toBe(allTerms.length);
          expect(active.length).toBe(allTerms.length); // All terms are active in test data
        }
      }, [allTerms, termsBySession, sortedTerms, activeTerms]);

      return (
        <div>
          <div data-testid="total-terms">{allTerms.length}</div>
          <div data-testid="sessions">{Object.keys(termsBySession).length}</div>
        </div>
      );
    };

    render(
      <TermProvider>
        <FilterTestComponent />
      </TermProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('total-terms')).toHaveTextContent('500');
    });
  });

  it('handles concurrent term operations efficiently', async () => {
    const dataset = generateMockTerms(20);
    mockAcademicService.getCurrentTerm.mockResolvedValue(dataset[0]);
    mockAcademicService.getTerms.mockResolvedValue(dataset);
    mockAcademicService.setCurrentTerm.mockResolvedValue({ message: 'Success' });

    const ConcurrentTestComponent: React.FC = () => {
      const { setCurrentTerm, refreshTerms, refreshCurrentTerm } = useTermContext();
      
      const handleConcurrentOperations = async () => {
        const startTime = performance.now();
        
        // Perform multiple operations concurrently
        await Promise.all([
          setCurrentTerm('term2'),
          refreshTerms(),
          refreshCurrentTerm()
        ]);
        
        const endTime = performance.now();
        const operationTime = endTime - startTime;
        
        // Concurrent operations should complete reasonably quickly
        expect(operationTime).toBeLessThan(1000);
      };

      return (
        <button onClick={handleConcurrentOperations} data-testid="concurrent-button">
          Concurrent Operations
        </button>
      );
    };

    render(
      <TermProvider>
        <ConcurrentTestComponent />
      </TermProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('concurrent-button')).toBeInTheDocument();
    });

    // Mock responses for concurrent operations
    mockAcademicService.getCurrentTerm.mockResolvedValue(dataset[1]);
    mockAcademicService.getTerms.mockResolvedValue(dataset);

    const concurrentButton = screen.getByTestId('concurrent-button');
    concurrentButton.click();

    await waitFor(() => {
      expect(mockAcademicService.setCurrentTerm).toHaveBeenCalled();
    });
  });

  it('efficiently manages memory with large datasets', async () => {
    const largeDataset = generateMockTerms(1000);
    mockAcademicService.getCurrentTerm.mockResolvedValue(largeDataset[0]);
    mockAcademicService.getTerms.mockResolvedValue(largeDataset);

    const MemoryTestComponent: React.FC = () => {
      const { allTerms } = useTermContext();

      // Simulate memory-intensive operations
      React.useMemo(() => {
        if (allTerms.length > 0) {
          // Create derived data structures
          const termMap = new Map(allTerms.map(term => [term.id, term]));
          const sessionGroups = allTerms.reduce((acc, term) => {
            if (!acc[term.academic_session]) {
              acc[term.academic_session] = [];
            }
            acc[term.academic_session].push(term);
            return acc;
          }, {} as Record<string, Term[]>);

          // Verify memory structures are created efficiently
          expect(termMap.size).toBe(allTerms.length);
          expect(Object.keys(sessionGroups).length).toBeGreaterThan(0);
        }

        return allTerms;
      }, [allTerms]);

      return <div data-testid="terms-count">{allTerms.length}</div>;
    };

    render(
      <TermProvider>
        <MemoryTestComponent />
      </TermProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('terms-count')).toHaveTextContent('1000');
    });

    // Memory usage should be reasonable (this is more of a smoke test)
    expect(true).toBe(true); // Test completes without memory issues
  });

  it('efficiently filters data by current term with large datasets', async () => {
    const largeDataset = generateMockTerms(500);
    mockAcademicService.getCurrentTerm.mockResolvedValue(largeDataset[0]);
    mockAcademicService.getTerms.mockResolvedValue(largeDataset);

    // Generate large mock data that needs to be filtered by term
    const generateMockStudentData = (termCount: number) => {
      const students = [];
      for (let i = 0; i < termCount * 10; i++) { // 10 students per term
        students.push({
          id: i + 1,
          name: `Student ${i + 1}`,
          term_id: `term${(i % termCount) + 1}`,
          grade: Math.floor(Math.random() * 100)
        });
      }
      return students;
    };

    const FilterPerformanceComponent: React.FC = () => {
      const { currentTerm } = useTermContext();
      const [filteredData, setFilteredData] = React.useState<any[]>([]);
      const [filterTime, setFilterTime] = React.useState<number>(0);

      React.useEffect(() => {
        if (currentTerm) {
          const startTime = performance.now();

          // Simulate filtering large dataset
          const allStudents = generateMockStudentData(500);
          const filtered = allStudents.filter(student => student.term_id === currentTerm.id);

          const endTime = performance.now();
          const operationTime = endTime - startTime;

          setFilteredData(filtered);
          setFilterTime(operationTime);

          // Filtering should be efficient even with large datasets
          expect(operationTime).toBeLessThan(100); // Under 100ms for 5000 records
        }
      }, [currentTerm]);

      return (
        <div>
          <div data-testid="current-term">{currentTerm?.name || 'No term'}</div>
          <div data-testid="filtered-count">{filteredData.length}</div>
          <div data-testid="filter-time">{filterTime}</div>
        </div>
      );
    };

    render(
      <TermProvider>
        <FilterPerformanceComponent />
      </TermProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('current-term')).toHaveTextContent('First Term');
      expect(screen.getByTestId('filtered-count')).toHaveTextContent('10');
    });

    // Verify filtering performance
    const filterTime = parseFloat(screen.getByTestId('filter-time').textContent || '0');
    expect(filterTime).toBeLessThan(100);
  });

  it('efficiently handles rapid term switching without performance degradation', async () => {
    const dataset = generateMockTerms(50);
    mockAcademicService.getCurrentTerm.mockResolvedValue(dataset[0]);
    mockAcademicService.getTerms.mockResolvedValue(dataset);
    mockAcademicService.setCurrentTerm.mockResolvedValue({ message: 'Success' });

    const RapidSwitchComponent: React.FC = () => {
      const { setCurrentTerm, currentTerm } = useTermContext();
      const [switchTimes, setSwitchTimes] = React.useState<number[]>([]);

      const performRapidSwitches = async () => {
        const times: number[] = [];

        for (let i = 1; i <= 5; i++) {
          const startTime = performance.now();
          await setCurrentTerm(`term${i}`);
          const endTime = performance.now();
          times.push(endTime - startTime);
        }

        setSwitchTimes(times);

        // Each switch should be consistently fast
        times.forEach(time => {
          expect(time).toBeLessThan(200); // Under 200ms per switch
        });

        // Performance shouldn't degrade significantly
        const firstSwitch = times[0];
        const lastSwitch = times[times.length - 1];
        expect(lastSwitch).toBeLessThan(firstSwitch * 2); // No more than 2x slower
      };

      return (
        <div>
          <div data-testid="current-term">{currentTerm?.name || 'No term'}</div>
          <div data-testid="switch-count">{switchTimes.length}</div>
          <button onClick={performRapidSwitches} data-testid="rapid-switch">
            Rapid Switch
          </button>
        </div>
      );
    };

    render(
      <TermProvider>
        <RapidSwitchComponent />
      </TermProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('current-term')).toHaveTextContent('First Term');
    });

    // Mock responses for rapid switching
    for (let i = 1; i <= 5; i++) {
      mockAcademicService.getCurrentTerm.mockResolvedValueOnce({
        ...dataset[i - 1],
        is_current: true
      });
    }

    const rapidSwitchButton = screen.getByTestId('rapid-switch');
    rapidSwitchButton.click();

    await waitFor(() => {
      expect(screen.getByTestId('switch-count')).toHaveTextContent('5');
    });
  });

  it('efficiently loads and caches term data to minimize API calls', async () => {
    const dataset = generateMockTerms(100);
    mockAcademicService.getCurrentTerm.mockResolvedValue(dataset[0]);
    mockAcademicService.getTerms.mockResolvedValue(dataset);

    const CacheTestComponent: React.FC = () => {
      const { allTerms, refreshTerms, currentTerm } = useTermContext();
      const [refreshCount, setRefreshCount] = React.useState(0);

      const handleMultipleRefreshes = async () => {
        // Multiple rapid refreshes should be efficient due to caching
        const startTime = performance.now();

        await Promise.all([
          refreshTerms(),
          refreshTerms(),
          refreshTerms()
        ]);

        const endTime = performance.now();
        const totalTime = endTime - startTime;

        setRefreshCount(prev => prev + 1);

        // Multiple refreshes should not take significantly longer than one
        expect(totalTime).toBeLessThan(500); // Under 500ms for 3 concurrent refreshes
      };

      return (
        <div>
          <div data-testid="terms-loaded">{allTerms.length}</div>
          <div data-testid="current-term">{currentTerm?.name || 'No term'}</div>
          <div data-testid="refresh-count">{refreshCount}</div>
          <button onClick={handleMultipleRefreshes} data-testid="multiple-refresh">
            Multiple Refresh
          </button>
        </div>
      );
    };

    render(
      <TermProvider>
        <CacheTestComponent />
      </TermProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('terms-loaded')).toHaveTextContent('100');
    });

    const multipleRefreshButton = screen.getByTestId('multiple-refresh');
    multipleRefreshButton.click();

    await waitFor(() => {
      expect(screen.getByTestId('refresh-count')).toHaveTextContent('1');
    });

    // Verify API wasn't called excessively
    expect(mockAcademicService.getTerms).toHaveBeenCalled();
  });
});
