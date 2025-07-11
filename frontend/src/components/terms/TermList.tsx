import React, { useState } from 'react';
import {
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  CalendarIcon,
  AcademicCapIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Term, TermType } from '../../types';
import { useCurrentTerm } from '../../hooks/useCurrentTerm';
import { useToast } from '../../hooks/useToast';
import { academicService } from '../../services/academicService';
import { termUtils } from '../../utils/termUtils';
import DataTable, { Column } from '../ui/DataTable';
import Modal from '../ui/Modal';
import LoadingSpinner from '../ui/LoadingSpinner';

interface TermListProps {
  onEdit: (term: Term) => void;
  onRefresh: () => void;
}

const TermList: React.FC<TermListProps> = ({ onEdit, onRefresh }) => {
  const { allTerms, loading, setCurrentTerm, isCurrentTerm } = useCurrentTerm();
  const { showSuccess, showError } = useToast();
  const [deletingTerm, setDeletingTerm] = useState<Term | null>(null);
  const [settingCurrent, setSettingCurrent] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleSetCurrent = async (term: Term) => {
    const { canSet, reason } = termUtils.canSetAsCurrent(term);
    if (!canSet) {
      showError(reason || 'Cannot set this term as current');
      return;
    }

    try {
      setSettingCurrent(term.id);
      await setCurrentTerm(term.id);
      onRefresh();
    } catch (error: any) {
      console.error('Error setting current term:', error);
    } finally {
      setSettingCurrent(null);
    }
  };

  const handleDeleteClick = (term: Term) => {
    const { canDelete, reason } = termUtils.canDeleteTerm(term);
    if (!canDelete) {
      showError(reason || 'Cannot delete this term');
      return;
    }

    setDeletingTerm(term);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTerm) return;

    try {
      await academicService.deleteTerm(deletingTerm.id);
      showSuccess('Term deleted successfully');
      onRefresh();
    } catch (error: any) {
      console.error('Error deleting term:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to delete term';
      showError(errorMessage);
    } finally {
      setShowDeleteModal(false);
      setDeletingTerm(null);
    }
  };

  const columns: Column<Term>[] = [
    {
      key: 'name',
      label: 'Term Name',
      render: (term) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <AcademicCapIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {term.name}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {termUtils.formatTermType(term.type)}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'academic_session',
      label: 'Academic Session',
      render: (term) => (
        <span className="text-sm text-gray-900 dark:text-white">
          {termUtils.formatAcademicSession(term.academic_session)}
        </span>
      ),
    },
    {
      key: 'dates',
      label: 'Duration',
      render: (term) => (
        <div className="text-sm">
          <div className="text-gray-900 dark:text-white">
            {termUtils.formatDateRange(term.start_date, term.end_date)}
          </div>
          <div className="text-gray-500 dark:text-gray-400">
            {termUtils.getTermDuration(term)} days
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (term) => (
        <div className="flex flex-col space-y-1">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${termUtils.getTermStatusColor(
              term
            )}`}
          >
            {termUtils.getTermStatusText(term)}
          </span>
          {isCurrentTerm(term.id) && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-green-800 bg-green-100">
              <CheckCircleIcon className="h-3 w-3 mr-1" />
              Current
            </span>
          )}
          {!term.is_active && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-red-800 bg-red-100">
              Inactive
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (term) => (
        <div className="flex items-center space-x-2">
          {!isCurrentTerm(term.id) && termUtils.canSetAsCurrent(term).canSet && (
            <button
              onClick={() => handleSetCurrent(term)}
              disabled={settingCurrent === term.id}
              className="text-green-600 hover:text-green-900 disabled:opacity-50"
              title="Set as current term"
            >
              {settingCurrent === term.id ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
              ) : (
                <CheckCircleIcon className="h-4 w-4" />
              )}
            </button>
          )}
          <button
            onClick={() => onEdit(term)}
            className="text-blue-600 hover:text-blue-900"
            title="Edit term"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          {termUtils.canDeleteTerm(term).canDelete && (
            <button
              onClick={() => handleDeleteClick(term)}
              className="text-red-600 hover:text-red-900"
              title="Delete term"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <div className="space-y-4">
        {allTerms.length === 0 ? (
          <div className="text-center py-12">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No terms found
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by creating your first academic term.
            </p>
          </div>
        ) : (
          <DataTable
            data={allTerms}
            columns={columns}
            searchable={true}
            searchPlaceholder="Search terms..."
          />
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Term"
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Are you sure you want to delete this term?
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This action cannot be undone. All data associated with this term will be permanently removed.
              </p>
            </div>
          </div>

          {deletingTerm && (
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <div className="text-sm">
                <div className="font-medium text-gray-900 dark:text-white">
                  {deletingTerm.name}
                </div>
                <div className="text-gray-500 dark:text-gray-400">
                  {termUtils.formatTermType(deletingTerm.type)} - {termUtils.formatAcademicSession(deletingTerm.academic_session)}
                </div>
                <div className="text-gray-500 dark:text-gray-400">
                  {termUtils.formatDateRange(deletingTerm.start_date, deletingTerm.end_date)}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowDeleteModal(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              className="btn btn-danger"
            >
              Delete Term
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default TermList;
