import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import TermForm from '../../../components/terms/TermForm';
import { academicService } from '../../../services/academicService';
import { useToast } from '../../../hooks/useToast';
import { Term, TermType } from '../../../types';

// Mock dependencies
vi.mock('../../../services/academicService');
vi.mock('../../../hooks/useToast');

const mockAcademicService = vi.mocked(academicService);
const mockUseToast = vi.mocked(useToast);

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn()
};

const mockTerm: Term = {
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

describe('TermForm', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseToast.mockReturnValue(mockToast);
    mockAcademicService.createTerm.mockResolvedValue(mockTerm);
    mockAcademicService.updateTerm.mockResolvedValue(mockTerm);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderTermForm = (props = {}) => {
    const defaultProps = {
      isOpen: true,
      onClose: mockOnClose,
      onSuccess: mockOnSuccess,
      mode: 'create' as const,
      term: null,
      ...props
    };

    return render(<TermForm {...defaultProps} />);
  };

  it('renders create form correctly', () => {
    renderTermForm();

    expect(screen.getByText('Create New Term')).toBeInTheDocument();
    expect(screen.getByLabelText(/term name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/term type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/academic session/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
  });

  it('renders edit form with pre-filled data', () => {
    renderTermForm({
      mode: 'edit',
      term: mockTerm
    });

    expect(screen.getByText('Edit Term')).toBeInTheDocument();
    expect(screen.getByDisplayValue('First Term')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2024/2025')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2024-01-01')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2024-03-31')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    renderTermForm();

    const submitButton = screen.getByText('Create Term');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Term name is required')).toBeInTheDocument();
      expect(screen.getByText('Academic session is required')).toBeInTheDocument();
      expect(screen.getByText('Start date is required')).toBeInTheDocument();
      expect(screen.getByText('End date is required')).toBeInTheDocument();
    });
  });

  it('validates term name length', async () => {
    renderTermForm();

    const nameInput = screen.getByLabelText(/term name/i);
    fireEvent.change(nameInput, { target: { value: 'A' } });

    const submitButton = screen.getByText('Create Term');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Term name must be at least 2 characters long')).toBeInTheDocument();
    });

    // Test max length
    fireEvent.change(nameInput, { target: { value: 'A'.repeat(51) } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Term name cannot exceed 50 characters')).toBeInTheDocument();
    });
  });

  it('validates academic session format', async () => {
    renderTermForm();

    const sessionInput = screen.getByLabelText(/academic session/i);
    fireEvent.change(sessionInput, { target: { value: '2024' } });

    const submitButton = screen.getByText('Create Term');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Academic session must be in format YYYY/YYYY')).toBeInTheDocument();
    });
  });

  it('validates date range', async () => {
    renderTermForm();

    // Fill required fields
    fireEvent.change(screen.getByLabelText(/term name/i), { target: { value: 'Test Term' } });
    fireEvent.change(screen.getByLabelText(/academic session/i), { target: { value: '2024/2025' } });
    fireEvent.change(screen.getByLabelText(/start date/i), { target: { value: '2024-03-31' } });
    fireEvent.change(screen.getByLabelText(/end date/i), { target: { value: '2024-01-01' } });

    const submitButton = screen.getByText('Create Term');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('End date must be after start date')).toBeInTheDocument();
    });
  });

  it('creates new term successfully', async () => {
    renderTermForm();

    // Fill form
    fireEvent.change(screen.getByLabelText(/term name/i), { target: { value: 'Test Term' } });
    fireEvent.change(screen.getByLabelText(/academic session/i), { target: { value: '2024/2025' } });
    fireEvent.change(screen.getByLabelText(/start date/i), { target: { value: '2024-01-01' } });
    fireEvent.change(screen.getByLabelText(/end date/i), { target: { value: '2024-03-31' } });

    const submitButton = screen.getByText('Create Term');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockAcademicService.createTerm).toHaveBeenCalledWith({
        name: 'Test Term',
        type: TermType.FIRST_TERM,
        academic_session: '2024/2025',
        start_date: '2024-01-01',
        end_date: '2024-03-31',
        is_active: true
      });
    });

    expect(mockToast.success).toHaveBeenCalledWith('Term created successfully');
    expect(mockOnSuccess).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('updates existing term successfully', async () => {
    renderTermForm({
      mode: 'edit',
      term: mockTerm
    });

    // Update term name
    const nameInput = screen.getByDisplayValue('First Term');
    fireEvent.change(nameInput, { target: { value: 'Updated First Term' } });

    const submitButton = screen.getByText('Update Term');
    fireEvent.click(submitButton);

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

    expect(mockToast.success).toHaveBeenCalledWith('Term updated successfully');
    expect(mockOnSuccess).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('handles create error gracefully', async () => {
    const errorMessage = 'Term already exists for this period';
    mockAcademicService.createTerm.mockRejectedValue(new Error(errorMessage));

    renderTermForm();

    // Fill form
    fireEvent.change(screen.getByLabelText(/term name/i), { target: { value: 'Test Term' } });
    fireEvent.change(screen.getByLabelText(/academic session/i), { target: { value: '2024/2025' } });
    fireEvent.change(screen.getByLabelText(/start date/i), { target: { value: '2024-01-01' } });
    fireEvent.change(screen.getByLabelText(/end date/i), { target: { value: '2024-03-31' } });

    const submitButton = screen.getByText('Create Term');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(errorMessage);
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('handles update error gracefully', async () => {
    const errorMessage = 'Cannot update term with existing data';
    mockAcademicService.updateTerm.mockRejectedValue(new Error(errorMessage));

    renderTermForm({
      mode: 'edit',
      term: mockTerm
    });

    const submitButton = screen.getByText('Update Term');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(errorMessage);
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('closes form when cancel is clicked', () => {
    renderTermForm();

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows loading state during submission', async () => {
    // Mock a delayed response
    mockAcademicService.createTerm.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(mockTerm), 100))
    );

    renderTermForm();

    // Fill form
    fireEvent.change(screen.getByLabelText(/term name/i), { target: { value: 'Test Term' } });
    fireEvent.change(screen.getByLabelText(/academic session/i), { target: { value: '2024/2025' } });
    fireEvent.change(screen.getByLabelText(/start date/i), { target: { value: '2024-01-01' } });
    fireEvent.change(screen.getByLabelText(/end date/i), { target: { value: '2024-03-31' } });

    const submitButton = screen.getByText('Create Term');
    fireEvent.click(submitButton);

    // Should show loading state
    expect(screen.getByText('Creating...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('does not render when isOpen is false', () => {
    renderTermForm({ isOpen: false });

    expect(screen.queryByText('Create New Term')).not.toBeInTheDocument();
  });
});
