/**
 * Pending Approvals Page
 * 
 * Allows school owners/admins to review and approve/reject
 * promotion decisions submitted by teachers.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { promotionService, PendingPromotionRequest } from '../../services/sessionService';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../contexts/AuthContext';
import {
    CheckIcon,
    XMarkIcon,
    ClockIcon,
    UserGroupIcon,
    AcademicCapIcon
} from '@heroicons/react/24/outline';

const PendingApprovalsPage = () => {
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();
    const { user } = useAuth();

    const [pendingRequests, setPendingRequests] = useState<PendingPromotionRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);

    // Modal states
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<PendingPromotionRequest | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    useEffect(() => {
        loadPendingApprovals();
    }, []);

    const loadPendingApprovals = async () => {
        try {
            setLoading(true);
            const response = await promotionService.getPendingApprovals();
            setPendingRequests(response.pending_requests);
        } catch (err) {
            showError('Failed to load pending approvals');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (request: PendingPromotionRequest) => {
        try {
            setProcessing(request.id);
            const result = await promotionService.approveRequest(request.id);
            showSuccess(`Successfully promoted ${result.successful} students`);
            // Remove from list
            setPendingRequests(prev => prev.filter(r => r.id !== request.id));
        } catch (err) {
            showError('Failed to approve promotion request');
            console.error(err);
        } finally {
            setProcessing(null);
        }
    };

    const openRejectModal = (request: PendingPromotionRequest) => {
        setSelectedRequest(request);
        setRejectReason('');
        setShowRejectModal(true);
    };

    const handleReject = async () => {
        if (!selectedRequest) return;

        try {
            setProcessing(selectedRequest.id);
            await promotionService.rejectRequest(selectedRequest.id, rejectReason);
            showSuccess('Promotion request rejected');
            setPendingRequests(prev => prev.filter(r => r.id !== selectedRequest.id));
            setShowRejectModal(false);
            setSelectedRequest(null);
        } catch (err) {
            showError('Failed to reject promotion request');
            console.error(err);
        } finally {
            setProcessing(null);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Pending Promotion Approvals
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Review and approve promotion decisions submitted by teachers
                    </p>
                </div>
                <button
                    onClick={() => navigate(-1)}
                    className="btn btn-secondary"
                >
                    Back
                </button>
            </div>

            {/* Pending Requests */}
            {pendingRequests.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
                    <ClockIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No Pending Approvals
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                        There are no promotion requests waiting for your approval.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {pendingRequests.map((request) => (
                        <div
                            key={request.id}
                            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 rounded-xl bg-primary-100 dark:bg-primary-900/30">
                                        <AcademicCapIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white">
                                            {request.session_name} - {request.class_name}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
                                            <UserGroupIcon className="h-4 w-4" />
                                            <span>{request.total_decisions} students</span>
                                            <span className="mx-2">•</span>
                                            <span>Submitted by {request.submitter_name}</span>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {formatDate(request.submitted_at)}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleApprove(request)}
                                        disabled={processing === request.id}
                                        className="btn btn-primary flex items-center gap-2"
                                    >
                                        {processing === request.id ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                        ) : (
                                            <CheckIcon className="h-4 w-4" />
                                        )}
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => openRejectModal(request)}
                                        disabled={processing === request.id}
                                        className="btn btn-secondary flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/20"
                                    >
                                        <XMarkIcon className="h-4 w-4" />
                                        Reject
                                    </button>
                                </div>
                            </div>

                            {/* Decision Summary */}
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex gap-4 text-sm">
                                    <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                        {request.decisions.filter(d => d.action === 'promote').length} Promoting
                                    </span>
                                    <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                                        {request.decisions.filter(d => d.action === 'repeat').length} Repeating
                                    </span>
                                    <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                        {request.decisions.filter(d => d.action === 'graduate').length} Graduating
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Reject Modal */}
            <Modal
                isOpen={showRejectModal}
                onClose={() => setShowRejectModal(false)}
                title="Reject Promotion Request"
            >
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-400">
                        Are you sure you want to reject this promotion request?
                        The submitter will be notified.
                    </p>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Reason (optional)
                        </label>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            rows={3}
                            className="input w-full"
                            placeholder="Provide a reason for rejection..."
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                        <button
                            onClick={() => setShowRejectModal(false)}
                            className="btn btn-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleReject}
                            disabled={processing !== null}
                            className="btn bg-red-600 text-white hover:bg-red-700"
                        >
                            {processing ? 'Rejecting...' : 'Reject Request'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default PendingApprovalsPage;
