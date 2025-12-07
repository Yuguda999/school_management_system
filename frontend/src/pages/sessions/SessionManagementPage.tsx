/**
 * Session Management Page
 * 
 * Allows school administrators to manage academic sessions:
 * - View all sessions
 * - Create new sessions
 * - Start/complete/archive sessions
 * - Trigger promotions
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionService } from '../../services/sessionService';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import {
    AcademicSession,
    SessionStatus,
    CreateAcademicSessionRequest,
} from '../../types/session';
import './SessionManagement.css';

// Status color mapping
const statusColors: Record<SessionStatus, string> = {
    upcoming: '#6366f1',
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

// Confirm dialog state type
interface ConfirmState {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    type: 'danger' | 'primary';
    sessionId: string;
    action: 'start' | 'complete' | 'archive' | 'delete' | null;
}

const initialConfirmState: ConfirmState = {
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    type: 'primary',
    sessionId: '',
    action: null,
};

const SessionManagementPage = () => {
    const navigate = useNavigate();
    const [sessions, setSessions] = useState<AcademicSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [confirmState, setConfirmState] = useState<ConfirmState>(initialConfirmState);
    const [actionError, setActionError] = useState<string | null>(null);

    // Form state
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
            setError(null);
        } catch (err) {
            setError('Failed to load academic sessions');
            console.error(err);
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
            loadSessions();
        } catch (err: unknown) {
            const errorMessage = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed to create session';
            setActionError(errorMessage);
        } finally {
            setCreating(false);
        }
    };

    // Show confirm dialog for different actions
    const showConfirmDialog = (sessionId: string, action: ConfirmState['action']) => {
        const configs: Record<NonNullable<ConfirmState['action']>, Omit<ConfirmState, 'isOpen' | 'sessionId' | 'action'>> = {
            start: {
                title: 'Start Session',
                message: 'Are you sure you want to start this session? This will make it the current active session.',
                confirmLabel: 'Start Session',
                type: 'primary',
            },
            complete: {
                title: 'Complete Session',
                message: 'Are you sure you want to complete this session? Make sure all terms have ended.',
                confirmLabel: 'Complete',
                type: 'primary',
            },
            archive: {
                title: 'Archive Session',
                message: 'Archive this session? It will be moved to the archives and hidden from the main list.',
                confirmLabel: 'Archive',
                type: 'primary',
            },
            delete: {
                title: 'Delete Session',
                message: 'Are you sure you want to delete this session? This action cannot be undone.',
                confirmLabel: 'Delete',
                type: 'danger',
            },
        };

        if (action) {
            setConfirmState({
                isOpen: true,
                sessionId,
                action,
                ...configs[action],
            });
        }
    };

    const handleConfirmAction = async () => {
        const { sessionId, action } = confirmState;
        setConfirmState(initialConfirmState);

        try {
            switch (action) {
                case 'start':
                    await sessionService.startSession(sessionId);
                    break;
                case 'complete':
                    await sessionService.completeSession(sessionId);
                    break;
                case 'archive':
                    await sessionService.archiveSession(sessionId);
                    break;
                case 'delete':
                    await sessionService.deleteSession(sessionId);
                    break;
            }
            loadSessions();
        } catch (err: unknown) {
            const errorMessage = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail || `Failed to ${action} session`;
            setActionError(errorMessage);
        }
    };

    const handleSetCurrent = async (sessionId: string) => {
        try {
            await sessionService.setCurrentSession(sessionId);
            loadSessions();
        } catch (err: unknown) {
            const errorMessage = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Failed to set current session';
            setActionError(errorMessage);
        }
    };

    const navigateToPromotions = (sessionId: string) => {
        navigate(`/sessions/${sessionId}/promotions`);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    if (loading) {
        return (
            <div className="session-management loading">
                <div className="spinner" />
                <p>Loading sessions...</p>
            </div>
        );
    }

    return (
        <div className="session-management">
            <div className="page-header">
                <div className="header-content">
                    <h1>Academic Sessions</h1>
                    <p>Manage academic years and student promotions</p>
                </div>
                <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
                    <span className="icon">+</span>
                    New Session
                </button>
            </div>

            {error && (
                <div className="error-message">
                    <span>{error}</span>
                    <button onClick={loadSessions}>Retry</button>
                </div>
            )}

            {/* Action Error Toast */}
            {actionError && (
                <div className="error-message">
                    <span>{actionError}</span>
                    <button onClick={() => setActionError(null)}>Dismiss</button>
                </div>
            )}

            <div className="sessions-grid">
                {sessions.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📅</div>
                        <h3>No Academic Sessions</h3>
                        <p>Create your first academic session to get started.</p>
                        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
                            Create Session
                        </button>
                    </div>
                ) : (
                    sessions.map((session) => (
                        <div
                            key={session.id}
                            className={`session-card ${session.is_current ? 'current' : ''}`}
                        >
                            <div className="session-header">
                                <h3>{session.name}</h3>
                                <span
                                    className="status-badge"
                                    style={{ backgroundColor: statusColors[session.status] }}
                                >
                                    {statusLabels[session.status]}
                                </span>
                            </div>

                            <div className="session-details">
                                <div className="detail-item">
                                    <span className="label">Period</span>
                                    <span className="value">
                                        {formatDate(session.start_date)} - {formatDate(session.end_date)}
                                    </span>
                                </div>
                                <div className="detail-item">
                                    <span className="label">Term Structure</span>
                                    <span className="value">{session.term_count} Terms</span>
                                </div>
                                {session.is_current && (
                                    <div className="current-indicator">
                                        <span className="dot" />
                                        Current Session
                                    </div>
                                )}
                                {session.promotion_completed && (
                                    <div className="promotion-completed">
                                        ✓ Promotions Completed
                                    </div>
                                )}
                            </div>

                            <div className="session-actions">
                                {session.status === 'upcoming' && (
                                    <>
                                        <button
                                            className="btn-action start"
                                            onClick={() => showConfirmDialog(session.id, 'start')}
                                        >
                                            Start Session
                                        </button>
                                        <button
                                            className="btn-action delete"
                                            onClick={() => showConfirmDialog(session.id, 'delete')}
                                        >
                                            Delete
                                        </button>
                                    </>
                                )}

                                {session.status === 'active' && (
                                    <>
                                        {!session.is_current && (
                                            <button
                                                className="btn-action"
                                                onClick={() => handleSetCurrent(session.id)}
                                            >
                                                Set Current
                                            </button>
                                        )}
                                        <button
                                            className="btn-action complete"
                                            onClick={() => showConfirmDialog(session.id, 'complete')}
                                        >
                                            Complete Session
                                        </button>
                                    </>
                                )}

                                {session.status === 'completed' && (
                                    <>
                                        {!session.promotion_completed && (
                                            <button
                                                className="btn-action promote"
                                                onClick={() => navigateToPromotions(session.id)}
                                            >
                                                Run Promotions
                                            </button>
                                        )}
                                        <button
                                            className="btn-action archive"
                                            onClick={() => showConfirmDialog(session.id, 'archive')}
                                        >
                                            Archive
                                        </button>
                                    </>
                                )}

                                {session.status === 'archived' && (
                                    <button
                                        className="btn-action view"
                                        onClick={() => navigate(`/sessions/${session.id}`)}
                                    >
                                        View Details
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create Session Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Create Academic Session</h2>
                            <button className="close-btn" onClick={() => setShowCreateModal(false)}>
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleCreateSession}>
                            <div className="form-group">
                                <label htmlFor="name">Session Name</label>
                                <input
                                    id="name"
                                    type="text"
                                    placeholder="e.g., 2024/2025"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                    required
                                />
                                <small>Format: YYYY/YYYY (e.g., 2024/2025)</small>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="start_date">Start Date</label>
                                    <input
                                        id="start_date"
                                        type="date"
                                        value={formData.start_date}
                                        onChange={(e) =>
                                            setFormData({ ...formData, start_date: e.target.value })
                                        }
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="end_date">End Date</label>
                                    <input
                                        id="end_date"
                                        type="date"
                                        value={formData.end_date}
                                        onChange={(e) =>
                                            setFormData({ ...formData, end_date: e.target.value })
                                        }
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Term Structure</label>
                                <div className="term-options">
                                    <label className="radio-option">
                                        <input
                                            type="radio"
                                            name="term_count"
                                            value={2}
                                            checked={formData.term_count === 2}
                                            onChange={() =>
                                                setFormData({ ...formData, term_count: 2 })
                                            }
                                        />
                                        <span className="radio-label">
                                            <strong>2 Terms</strong>
                                            <small>Semester system</small>
                                        </span>
                                    </label>
                                    <label className="radio-option">
                                        <input
                                            type="radio"
                                            name="term_count"
                                            value={3}
                                            checked={formData.term_count === 3}
                                            onChange={() =>
                                                setFormData({ ...formData, term_count: 3 })
                                            }
                                        />
                                        <span className="radio-label">
                                            <strong>3 Terms</strong>
                                            <small>Term system</small>
                                        </span>
                                    </label>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => setShowCreateModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={creating}
                                >
                                    {creating ? 'Creating...' : 'Create Session'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={confirmState.isOpen}
                title={confirmState.title}
                message={confirmState.message}
                confirmLabel={confirmState.confirmLabel}
                confirmVariant={confirmState.type}
                onConfirm={handleConfirmAction}
                onCancel={() => setConfirmState(initialConfirmState)}
            />
        </div>
    );
};

export default SessionManagementPage;
