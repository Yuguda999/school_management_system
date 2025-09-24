import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  CalendarIcon,
  AcademicCapIcon,
  ClockIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { Term } from '../../types';
import { useCurrentTerm } from '../../hooks/useCurrentTerm';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { termUtils } from '../../utils/termUtils';
import PageHeader from '../../components/Layout/PageHeader';
import TermList from '../../components/terms/TermList';
import TermForm from '../../components/terms/TermForm';
import CurrentTermIndicator from '../../components/terms/CurrentTermIndicator';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const TermManagementPage: React.FC = () => {
  const { user } = useAuth();
  const { canManageTerms } = usePermissions();
  const {
    currentTerm,
    allTerms,
    termsBySession,
    loading,
    refresh
  } = useCurrentTerm();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTerm, setEditingTerm] = useState<Term | null>(null);

  useEffect(() => {
    refresh();
  }, []);

  const handleCreateTerm = () => {
    setEditingTerm(null);
    setShowCreateModal(true);
  };

  const handleEditTerm = (term: Term) => {
    setEditingTerm(term);
    setShowEditModal(true);
  };

  const handleFormSuccess = () => {
    refresh();
  };

  const getTermStatistics = () => {
    const totalTerms = allTerms.length;
    const activeTerms = allTerms.filter(term => term.is_active).length;
    const completedTerms = allTerms.filter(term => termUtils.getTermStatus(term) === 'past').length;
    const upcomingTerms = allTerms.filter(term => termUtils.getTermStatus(term) === 'upcoming').length;
    const academicSessions = Object.keys(termsBySession).length;

    return {
      totalTerms,
      activeTerms,
      completedTerms,
      upcomingTerms,
      academicSessions
    };
  };

  const stats = getTermStatistics();

  // Check permissions - now handled by usePermissions hook
  if (!canManageTerms()) {
    return (
      <div className="text-center py-12">
        <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          Access Denied
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          You don't have permission to manage terms.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Term Management"
        description="Manage academic terms and sessions for your school"
        action={
          <button
            onClick={handleCreateTerm}
            className="btn btn-primary"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Term
          </button>
        }
      />

      {/* Current Term Indicator */}
      <CurrentTermIndicator variant="banner" />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CalendarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Terms</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.totalTerms}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AcademicCapIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Terms</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.activeTerms}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-6 w-6 text-amber-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Upcoming</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.upcomingTerms}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-6 w-6 text-gray-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.completedTerms}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CalendarIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Sessions</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{stats.academicSessions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Terms by Academic Session */}
      {Object.keys(termsBySession).length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Terms by Academic Session
          </h3>
          <div className="space-y-4">
            {Object.entries(termsBySession)
              .sort(([a], [b]) => b.localeCompare(a)) // Sort sessions in descending order
              .map(([session, terms]) => (
                <div key={session} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    {termUtils.formatAcademicSession(session)}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {termUtils.sortTerms(terms).map((term) => (
                      <div
                        key={term.id}
                        className={`p-3 rounded-lg border ${
                          currentTerm?.id === term.id
                            ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
                            : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {term.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {termUtils.formatDateRange(term.start_date, term.end_date)}
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${termUtils.getTermStatusColor(term)}`}>
                              {termUtils.getTermStatusText(term)}
                            </span>
                            {currentTerm?.id === term.id && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-green-800 bg-green-100">
                                Current
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Terms List */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            All Terms
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage all academic terms for your school
          </p>
        </div>
        <div className="p-6">
          {loading ? (
            <LoadingSpinner />
          ) : (
            <TermList
              onEdit={handleEditTerm}
              onRefresh={refresh}
            />
          )}
        </div>
      </div>

      {/* Create Term Modal */}
      <TermForm
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleFormSuccess}
        mode="create"
      />

      {/* Edit Term Modal */}
      <TermForm
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleFormSuccess}
        term={editingTerm}
        mode="edit"
      />
    </div>
  );
};

export default TermManagementPage;
