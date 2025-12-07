/**
 * Session Management Component
 * Embedded in Settings > Academic tab
 */

import { useState, useEffect } from 'react';
import { AcademicSession, CreateAcademicSessionRequest, SessionStatus } from '../../types/session';
import { sessionService } from '../../services/sessionService';
import LoadingSpinner from '../ui/LoadingSpinner';
import Modal from '../ui/Modal';
import { useToast } from '../../hooks/useToast';
import {
    PlusIcon,
    CalendarIcon,
    CheckCircleIcon,
    PlayIcon,
    ArchiveBoxIcon,
    StarIcon,
    PencilIcon,
    TrashIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

const statusColors: Record<SessionStatus, string> = {
    upcoming: '#f59e0b',
    active: '#22c55e',
    completed: '#3b82f6',
    archived: '#9ca3af',
};

const statusLabels: Record<SessionStatus, string> = {
    upcoming: 'Upcoming',
    active: 'Active',
    completed: 'Completed',
    archived: 'Archived',
};

const SessionManagement = () => {
    const [sessions, setSessions] = useState<AcademicSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [editingSession, setEditingSession] = useState<AcademicSession | null>(null);
    const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const { showSuccess, showError } = useToast();

    const [formData, setFormData] = useState<CreateAcademicSessionRequest>({
        name: '',
        start_date: '',
        end_date: '',
        term_count: 3,
    });

    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = async () => {
        try {
            setLoading(true);
            const data = await sessionService.getSessions();
            setSessions(data);
        } catch (err) {
            console.error('Failed to load sessions:', err);
            showError('Failed to load academic sessions');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSession = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setCreating(true);
            await sessionService.createSession(formData);
            setShowCreateModal(false);
            setFormData({ name: '', start_date: '', end_date: '', term_count: 3 });
            showSuccess('Session created successfully');
            loadSessions();
        } catch (err: unknown) {
            const errorMessage = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed to create session';
            showError(errorMessage);
        } finally {
            setCreating(false);
        }
    };

    const handleSetCurrent = async (sessionId: string) => {
        try {
            await sessionService.setCurrentSession(sessionId);
            showSuccess('Session set as current');
            loadSessions();
        } catch (err) {
            showError('Failed to set current session');
        }
    };

    const handleStartSession = async (sessionId: string) => {
        try {
            await sessionService.startSession(sessionId);
            showSuccess('Session started');
            loadSessions();
        } catch (err) {
            showError('Failed to start session');
        }
    };

    const handleCompleteSession = async (sessionId: string) => {
        try {
            await sessionService.completeSession(sessionId);
            showSuccess('Session completed');
            loadSessions();
        } catch (err) {
            showError('Failed to complete session');
        }
    };

    const handleArchiveSession = async (sessionId: string) => {
        try {
            await sessionService.archiveSession(sessionId);
            showSuccess('Session archived');
            loadSessions();
        } catch (err) {
            showError('Failed to archive session');
        }
    };

    const handleEditSession = (session: AcademicSession) => {
        setEditingSession(session);
        setFormData({
            name: session.name,
            start_date: session.start_date.split('T')[0],
            end_date: session.end_date.split('T')[0],
            term_count: session.term_count,
        });
        setShowEditModal(true);
    };

    const handleUpdateSession = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSession) return;

        try {
            setUpdating(true);
            await sessionService.updateSession(editingSession.id, formData);
            setShowEditModal(false);
            setEditingSession(null);
            setFormData({ name: '', start_date: '', end_date: '', term_count: 3 });
            showSuccess('Session updated successfully');
            loadSessions();
        } catch (err: unknown) {
            const errorMessage = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed to update session';
            showError(errorMessage);
        } finally {
            setUpdating(false);
        }
    };

    const handleDeleteConfirm = (sessionId: string) => {
        setDeletingSessionId(sessionId);
        setShowDeleteConfirm(true);
    };

    const handleDeleteSession = async () => {
        if (!deletingSessionId) return;

        try {
            setDeleting(true);
            await sessionService.deleteSession(deletingSessionId);
            setShowDeleteConfirm(false);
            setDeletingSessionId(null);
            showSuccess('Session deleted successfully');
            loadSessions();
        } catch (err: unknown) {
            const errorMessage = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed to delete session';
            showError(errorMessage);
        } finally {
            setDeleting(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Academic Sessions
                </h3>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn btn-primary btn-sm flex items-center gap-2"
                >
                    <PlusIcon className="h-4 w-4" />
                    New Session
                </button>
            </div>

            {/* Sessions List */}
            {sessions.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No academic sessions found. Create your first session to get started.
                </div>
            ) : (
                <div className="space-y-3">
                    {sessions.map((session) => (
                        <div
                            key={session.id}
                            className={`p-4 rounded-xl border-2 transition-all ${session.is_current
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: statusColors[session.status] }}
                                    />
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {session.name}
                                            </span>
                                            {session.is_current && (
                                                <StarIconSolid className="h-4 w-4 text-yellow-500" />
                                            )}
                                            <span
                                                className="text-xs px-2 py-0.5 rounded-full"
                                                style={{
                                                    backgroundColor: `${statusColors[session.status]}20`,
                                                    color: statusColors[session.status],
                                                }}
                                            >
                                                {statusLabels[session.status]}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <CalendarIcon className="h-4 w-4" />
                                                {formatDate(session.start_date)} - {formatDate(session.end_date)}
                                            </span>
                                            <span>{session.term_count} terms</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    {!session.is_current && session.status !== 'archived' && (
                                        <button
                                            onClick={() => handleSetCurrent(session.id)}
                                            className="p-2 text-gray-400 hover:text-yellow-500 transition-colors"
                                            title="Set as current"
                                        >
                                            <StarIcon className="h-5 w-5" />
                                        </button>
                                    )}
                                    {session.status === 'upcoming' && (
                                        <button
                                            onClick={() => handleStartSession(session.id)}
                                            className="p-2 text-gray-400 hover:text-green-500 transition-colors"
                                            title="Start session"
                                        >
                                            <PlayIcon className="h-5 w-5" />
                                        </button>
                                    )}
                                    {session.status === 'active' && (
                                        <button
                                            onClick={() => handleCompleteSession(session.id)}
                                            className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                                            title="Complete session"
                                        >
                                            <CheckCircleIcon className="h-5 w-5" />
                                        </button>
                                    )}
                                    {session.status === 'completed' && (
                                        <button
                                            onClick={() => handleArchiveSession(session.id)}
                                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                            title="Archive session"
                                        >
                                            <ArchiveBoxIcon className="h-5 w-5" />
                                        </button>
                                    )}
                                    {/* Edit button - only for upcoming sessions */}
                                    {session.status === 'upcoming' && (
                                        <button
                                            onClick={() => handleEditSession(session)}
                                            className="p-2 text-gray-400 hover:text-primary-500 transition-colors"
                                            title="Edit session"
                                        >
                                            <PencilIcon className="h-5 w-5" />
                                        </button>
                                    )}
                                    {/* Delete button - only for upcoming sessions without terms */}
                                    {session.status === 'upcoming' && (
                                        <button
                                            onClick={() => handleDeleteConfirm(session.id)}
                                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                            title="Delete session"
                                        >
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Session Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Create Academic Session"
            >
                <form onSubmit={handleCreateSession} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Session Name *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., 2024/2025"
                            className="input"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Start Date *
                            </label>
                            <input
                                type="date"
                                value={formData.start_date}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                className="input"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                End Date *
                            </label>
                            <input
                                type="date"
                                value={formData.end_date}
                                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                className="input"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Term Structure *
                        </label>
                        <select
                            value={formData.term_count}
                            onChange={(e) => setFormData({ ...formData, term_count: parseInt(e.target.value) })}
                            className="input"
                        >
                            <option value={2}>2 Terms (Semester)</option>
                            <option value={3}>3 Terms (Trimester)</option>
                        </select>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            This determines the maximum number of terms you can create for this session.
                        </p>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                        <button
                            type="button"
                            onClick={() => setShowCreateModal(false)}
                            className="btn btn-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={creating}
                            className="btn btn-primary"
                        >
                            {creating ? <LoadingSpinner size="sm" /> : 'Create Session'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Edit Session Modal */}
            <Modal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setEditingSession(null);
                    setFormData({ name: '', start_date: '', end_date: '', term_count: 3 });
                }}
                title="Edit Academic Session"
            >
                <form onSubmit={handleUpdateSession} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Session Name *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., 2024/2025"
                            className="input"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Start Date *
                            </label>
                            <input
                                type="date"
                                value={formData.start_date}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                className="input"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                End Date *
                            </label>
                            <input
                                type="date"
                                value={formData.end_date}
                                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                className="input"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Term Structure *
                        </label>
                        <select
                            value={formData.term_count}
                            onChange={(e) => setFormData({ ...formData, term_count: parseInt(e.target.value) })}
                            className="input"
                        >
                            <option value={2}>2 Terms (Semester)</option>
                            <option value={3}>3 Terms (Trimester)</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                        <button
                            type="button"
                            onClick={() => {
                                setShowEditModal(false);
                                setEditingSession(null);
                            }}
                            className="btn btn-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={updating}
                            className="btn btn-primary"
                        >
                            {updating ? <LoadingSpinner size="sm" /> : 'Update Session'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteConfirm}
                onClose={() => {
                    setShowDeleteConfirm(false);
                    setDeletingSessionId(null);
                }}
                title="Delete Session"
            >
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-400">
                        Are you sure you want to delete this session? This action cannot be undone.
                    </p>
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                        <p className="text-sm text-amber-800 dark:text-amber-200">
                            <strong>Warning:</strong> All terms associated with this session will also be deleted.
                        </p>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                        <button
                            type="button"
                            onClick={() => {
                                setShowDeleteConfirm(false);
                                setDeletingSessionId(null);
                            }}
                            className="btn btn-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleDeleteSession}
                            disabled={deleting}
                            className="btn btn-danger"
                        >
                            {deleting ? <LoadingSpinner size="sm" /> : 'Delete Session'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default SessionManagement;
