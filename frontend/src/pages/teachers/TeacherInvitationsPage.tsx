import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  EnvelopeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  TrashIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { TeacherInvitation, InvitationStatus } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { teacherInvitationService } from '../../services/teacherInvitationService';
import { useToast } from '../../hooks/useToast';

import DataTable, { Column } from '../../components/ui/DataTable';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import TeacherInvitationModal from '../../components/teachers/TeacherInvitationModal';
import ConfirmationModal from '../../components/ui/ConfirmationModal';

interface TeacherInvitationsPageProps {
  showInviteModal?: boolean;
  onCloseInviteModal?: () => void;
}

const TeacherInvitationsPage: React.FC<TeacherInvitationsPageProps> = ({
  showInviteModal: externalShowInviteModal = false,
  onCloseInviteModal
}) => {
  const { user, logout } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  
  const [invitations, setInvitations] = useState<TeacherInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvitation, setSelectedInvitation] = useState<TeacherInvitation | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [recentlyAccepted, setRecentlyAccepted] = useState<Set<string>>(new Set());

  const fetchInvitations = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await teacherInvitationService.getInvitations({ size: 100 });
      console.log('Full API Response:', response);
      console.log('Response type:', typeof response);
      console.log('Response keys:', Object.keys(response || {}));

      let newInvitations: TeacherInvitation[] = [];

      // Handle different response structures
      if (response && response.invitations && Array.isArray(response.invitations)) {
        newInvitations = response.invitations;
      } else if (response && Array.isArray(response)) {
        // If response is directly an array
        newInvitations = response;
      } else {
        console.warn('Unexpected response structure:', response);
        newInvitations = [];
      }

      // Track recently accepted invitations
      const previousInvitations = invitations;
      const newlyAccepted = new Set<string>();

      newInvitations.forEach(invitation => {
        const previousInvitation = previousInvitations.find(prev => prev.id === invitation.id);
        if (previousInvitation &&
            previousInvitation.status === 'pending' &&
            invitation.status === 'accepted') {
          newlyAccepted.add(invitation.id);
        }
      });

      if (newlyAccepted.size > 0) {
        setRecentlyAccepted(prev => new Set([...prev, ...newlyAccepted]));
        // Clear the recently accepted indicators after 10 seconds
        setTimeout(() => {
          setRecentlyAccepted(prev => {
            const updated = new Set(prev);
            newlyAccepted.forEach(id => updated.delete(id));
            return updated;
          });
        }, 10000);
      }

      setInvitations(newInvitations);
    } catch (error: any) {
      console.error('Error fetching invitations:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);

      // Handle authentication errors by redirecting to login
      if (error.response?.status === 401) {
        logout();
        navigate('/login');
        return;
      }

      // Set empty array to prevent undefined errors
      setInvitations([]);
      if (!silent) {
        showError(error.response?.data?.detail || 'Failed to load teacher invitations');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    console.log('TeacherInvitationsPage mounted');
    console.log('Current user:', user);
    console.log('User authenticated:', !!user);

    if (!user) {
      console.log('No user found, redirecting to login');
      navigate('/login');
      return;
    }

    fetchInvitations();
  }, [user, navigate]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchInvitations(true); // Silent refresh
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, invitations]);

  const handleResendInvitation = async (invitation: TeacherInvitation) => {
    console.log('Resending invitation for:', invitation);
    try {
      setActionLoading(invitation.id);
      const result = await teacherInvitationService.resendInvitation(invitation.id);
      console.log('Resend result:', result);
      showSuccess(`Invitation resent successfully to ${invitation.email}. A new invitation email has been sent.`);
      // Refresh the invitations list to show updated data
      await fetchInvitations();
    } catch (error: any) {
      console.error('Error resending invitation:', error);
      console.error('Error details:', error.response?.data);

      if (error.response?.status === 401) {
        logout();
        navigate('/login');
        return;
      }

      showError(error.response?.data?.detail || 'Failed to resend invitation. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelInvitation = async (invitation: TeacherInvitation) => {
    console.log('Cancelling invitation for:', invitation);
    try {
      setActionLoading(invitation.id);
      const result = await teacherInvitationService.cancelInvitation(invitation.id);
      console.log('Cancel result:', result);
      showSuccess(`Invitation to ${invitation.email} has been cancelled successfully.`);
      // Refresh the invitations list to show updated status
      await fetchInvitations();
    } catch (error: any) {
      console.error('Error cancelling invitation:', error);
      console.error('Error details:', error.response?.data);

      if (error.response?.status === 401) {
        logout();
        navigate('/login');
        return;
      }

      showError(error.response?.data?.detail || 'Failed to cancel invitation. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteInvitation = async () => {
    if (!selectedInvitation) return;

    console.log('Deleting invitation for:', selectedInvitation);
    try {
      setActionLoading(selectedInvitation.id);
      await teacherInvitationService.deleteInvitation(selectedInvitation.id);
      console.log('Delete successful for:', selectedInvitation.email);
      showSuccess(`Invitation to ${selectedInvitation.email} has been deleted successfully.`);
      // Refresh the invitations list to remove the deleted invitation
      await fetchInvitations();
      // Close the modal and clear selection
      setShowDeleteModal(false);
      setSelectedInvitation(null);
    } catch (error: any) {
      console.error('Error deleting invitation:', error);
      console.error('Error details:', error.response?.data);

      if (error.response?.status === 401) {
        logout();
        navigate('/login');
        return;
      }

      showError(error.response?.data?.detail || 'Failed to delete invitation. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusIcon = (status: InvitationStatus) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-4 w-4 text-yellow-500" />;
      case 'accepted':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'expired':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <XCircleIcon className="h-4 w-4 text-gray-500" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: InvitationStatus) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    
    switch (status) {
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200`;
      case 'accepted':
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`;
      case 'expired':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`;
      case 'cancelled':
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200`;
    }
  };

  const columns: Column<TeacherInvitation>[] = [
    {
      key: 'full_name',
      header: 'Teacher',
      sortable: true,
      render: (invitation) => (
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
              <EnvelopeIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </div>
          </div>
          <div className="ml-4 flex-1">
            <div className="flex items-center space-x-2">
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {invitation.full_name}
              </div>
              {recentlyAccepted.has(invitation.id) && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 animate-pulse">
                  Just Accepted!
                </span>
              )}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {invitation.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'department',
      header: 'Department',
      render: (invitation) => (
        <span className="text-sm text-gray-900 dark:text-gray-100">
          {invitation.department || 'Not specified'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (invitation) => (
        <span className={getStatusBadge(invitation.status)}>
          {getStatusIcon(invitation.status)}
          <span className="ml-1 capitalize">{invitation.status}</span>
        </span>
      ),
    },
    {
      key: 'invited_at',
      header: 'Invited',
      sortable: true,
      render: (invitation) => (
        <div className="text-sm text-gray-900 dark:text-gray-100">
          {new Date(invitation.invited_at).toLocaleDateString()}
        </div>
      ),
    },
    {
      key: 'expires_at',
      header: 'Expires',
      sortable: true,
      render: (invitation) => (
        <div className="text-sm">
          <div className={`${invitation.is_expired ? 'text-red-600' : 'text-gray-900 dark:text-gray-100'}`}>
            {new Date(invitation.expires_at).toLocaleDateString()}
          </div>
          {invitation.is_expired && (
            <div className="text-xs text-red-500">Expired</div>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header with Auto-refresh Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Teacher Invitations
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                autoRefresh
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
              }`}
            >
              <ArrowPathIcon className={`h-4 w-4 mr-1 ${autoRefresh ? 'animate-spin' : ''}`} />
              Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={() => fetchInvitations()}
              disabled={loading}
              className="btn btn-outline btn-sm"
            >
              <ArrowPathIcon className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh Now
            </button>
          </div>
        </div>
        {recentlyAccepted.size > 0 && (
          <div className="text-sm text-green-600 dark:text-green-400 font-medium">
            {recentlyAccepted.size} invitation{recentlyAccepted.size > 1 ? 's' : ''} recently accepted!
          </div>
        )}
      </div>

      <DataTable
        data={invitations}
        columns={columns}
        loading={loading}
        searchable={true}
        searchPlaceholder="Search invitations..."
        emptyMessage="No teacher invitations found"
        actions={(invitation) => {
          console.log('Rendering actions for invitation:', invitation.id, 'status:', invitation.status, 'expired:', invitation.is_expired, 'user role:', user?.role);
          return (
            <>
              {invitation.status === 'pending' && !invitation.is_expired && (
                <button
                  onClick={() => {
                    console.log('Resend button clicked for:', invitation.id);
                    handleResendInvitation(invitation);
                  }}
                  disabled={actionLoading !== null}
                  className="btn btn-ghost btn-sm hover:bg-blue-50 hover:text-blue-600"
                  title="Resend Invitation"
                >
                  {actionLoading === invitation.id ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <ArrowPathIcon className="h-4 w-4" />
                  )}
                </button>
              )}

              {invitation.status === 'pending' && (
                <button
                  onClick={() => {
                    console.log('Cancel button clicked for:', invitation.id);
                    handleCancelInvitation(invitation);
                  }}
                  disabled={actionLoading !== null}
                  className="btn btn-ghost btn-sm text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                  title="Cancel Invitation"
                >
                  {actionLoading === invitation.id ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <XCircleIcon className="h-4 w-4" />
                  )}
                </button>
              )}

              {(user?.role === 'super_admin' || user?.role === 'admin') && (
                <button
                  onClick={() => {
                    console.log('Delete button clicked for:', invitation.id);
                    setSelectedInvitation(invitation);
                    setShowDeleteModal(true);
                  }}
                  disabled={actionLoading !== null}
                  className="btn btn-ghost btn-sm text-red-600 hover:text-red-700 hover:bg-red-50"
                  title="Delete Invitation"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              )}
            </>
          );
        }}
      />

      {/* Invite Teacher Modal */}
      {onCloseInviteModal && (
        <TeacherInvitationModal
          isOpen={externalShowInviteModal}
          onClose={onCloseInviteModal}
          onSuccess={fetchInvitations}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedInvitation(null);
        }}
        onConfirm={handleDeleteInvitation}
        title="Delete Invitation"
        message={`Are you sure you want to delete the invitation for ${selectedInvitation?.email}? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
        loading={actionLoading === selectedInvitation?.id}
      />
    </div>
  );
};

export default TeacherInvitationsPage;
