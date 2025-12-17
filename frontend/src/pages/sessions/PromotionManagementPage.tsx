/**
 * Promotion Management Page
 * 
 * Allows school administrators to:
 * - Preview promotion candidates
 * - Make individual or bulk promotion decisions
 * - Auto-promote based on school rules
 * - Track promotion progress
 * 
 * Teachers can:
 * - View students in their assigned class
 * - Submit promotion decisions for approval
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sessionService, promotionService } from '../../services/sessionService';
import {
    AcademicSessionWithTerms,
    PromotionCandidate,
    PromotionDecision,
    PromotionAction,
    BulkPromotionResult,
} from '../../types/session';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../contexts/AuthContext';
import './PromotionManagement.css';

const actionColors: Record<PromotionAction, string> = {
    promote: '#22c55e',
    repeat: '#f59e0b',
    graduate: '#3b82f6',
    transfer: '#8b5cf6',
};

const actionLabels: Record<PromotionAction, string> = {
    promote: 'Promote',
    repeat: 'Repeat',
    graduate: 'Graduate',
    transfer: 'Transfer',
};

const PromotionManagementPage = () => {
    const { sessionId } = useParams<{ sessionId: string }>();
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();
    const { user } = useAuth();

    // Role checks
    const isTeacher = user?.role === 'teacher';
    const isAdmin = user?.role === 'school_owner' || user?.role === 'school_admin';

    const [session, setSession] = useState<AcademicSessionWithTerms | null>(null);
    const [candidates, setCandidates] = useState<PromotionCandidate[]>([]);
    const [decisions, setDecisions] = useState<Map<string, PromotionDecision>>(new Map());
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<BulkPromotionResult | null>(null);
    const [filterClass, setFilterClass] = useState<string>('');

    // Modal State
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState<'auto' | 'execute' | 'submit' | null>(null);

    // Stats
    const [stats, setStats] = useState({
        total: 0,
        promoting: 0,
        repeating: 0,
        graduating: 0,
    });

    // Get unique classes for filter
    const uniqueClasses = Array.from(
        new Set(candidates.map((c) => c.current_class_name))
    ).sort();

    useEffect(() => {
        if (sessionId) {
            loadData();
        }
    }, [sessionId]);

    useEffect(() => {
        // Update stats based on decisions
        const promoting = Array.from(decisions.values()).filter(
            (d) => d.action === 'promote'
        ).length;
        const repeating = Array.from(decisions.values()).filter(
            (d) => d.action === 'repeat'
        ).length;
        const graduating = Array.from(decisions.values()).filter(
            (d) => d.action === 'graduate'
        ).length;

        setStats({
            total: candidates.length,
            promoting,
            repeating,
            graduating,
        });
    }, [decisions, candidates]);

    const loadData = async () => {
        try {
            setLoading(true);

            // Load session details
            const sessionData = await sessionService.getSession(sessionId!);
            setSession(sessionData);

            // Load promotion preview
            const preview = await promotionService.previewPromotions(sessionId!);
            setCandidates(preview.candidates);

            // Initialize decisions with suggested actions
            const initialDecisions = new Map<string, PromotionDecision>();
            preview.candidates.forEach((candidate) => {
                initialDecisions.set(candidate.student_id, {
                    student_id: candidate.student_id,
                    class_history_id: '', // Will be fetched when executing
                    action: candidate.suggested_action,
                    next_class_id: candidate.next_class_id || undefined,
                });
            });
            setDecisions(initialDecisions);

            setError(null);
        } catch (err) {
            const msg = 'Failed to load promotion data';
            setError(msg);
            showError(msg);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const updateDecision = (
        studentId: string,
        action: PromotionAction,
        nextClassId?: string
    ) => {
        setDecisions((prev) => {
            const newDecisions = new Map(prev);
            const existing = newDecisions.get(studentId);
            newDecisions.set(studentId, {
                student_id: studentId,
                class_history_id: existing?.class_history_id || '',
                action,
                next_class_id: nextClassId,
            });
            return newDecisions;
        });
    };

    const setAllToAction = (action: PromotionAction) => {
        setDecisions((prev) => {
            const newDecisions = new Map(prev);
            candidates.forEach((candidate) => {
                const existing = newDecisions.get(candidate.student_id);
                newDecisions.set(candidate.student_id, {
                    student_id: candidate.student_id,
                    class_history_id: existing?.class_history_id || '',
                    action,
                    next_class_id: action === 'promote' ? candidate.next_class_id || undefined : undefined,
                });
            });
            return newDecisions;
        });
    };

    const initiateAutoPromote = () => {
        setConfirmAction('auto');
        setShowConfirmModal(true);
    };

    const initiateExecute = () => {
        setConfirmAction(isTeacher ? 'submit' : 'execute');
        setShowConfirmModal(true);
    };

    const handleConfirmAction = async () => {
        setShowConfirmModal(false);
        if (!confirmAction) return;

        try {
            setProcessing(true);
            if (confirmAction === 'auto') {
                const res = await promotionService.autoPromote(sessionId!);
                setResult(res);
                showSuccess('Promotions processed successfully');
            } else if (confirmAction === 'submit') {
                // Teacher submitting for approval
                const decisionsArray = Array.from(decisions.values());
                await promotionService.submitForApproval({
                    session_id: sessionId!,
                    decisions: decisionsArray
                });
                showSuccess('Promotion decisions submitted for approval. The school administrator will review and approve.');
            } else {
                // Admin executing promotions
                const res = await promotionService.autoPromote(sessionId!);
                setResult(res);
                showSuccess('Promotions executed successfully');
            }
        } catch (err: unknown) {
            const errorMessage =
                (err as { response?: { data?: { detail?: string } } }).response?.data
                    ?.detail || 'Failed to process promotions';
            showError(errorMessage);
        } finally {
            setProcessing(false);
            setConfirmAction(null);
        }
    };

    const filteredCandidates = filterClass
        ? candidates.filter((c) => c.current_class_name === filterClass)
        : candidates;

    if (loading) {
        return (
            <div className="promotion-management loading">
                <div className="spinner" />
                <p>Loading promotion data...</p>
            </div>
        );
    }

    if (result) {
        return (
            <div className="promotion-management">
                <div className="result-container">
                    <div className="result-header">
                        <div className="result-icon success">✓</div>
                        <h1>Promotions Complete!</h1>
                        <p>
                            {result.successful} of {result.total_processed} students processed
                            successfully
                        </p>
                    </div>

                    <div className="result-stats">
                        <div className="stat-card promoted">
                            <span className="stat-value">{result.promoted}</span>
                            <span className="stat-label">Promoted</span>
                        </div>
                        <div className="stat-card repeated">
                            <span className="stat-value">{result.repeated}</span>
                            <span className="stat-label">Repeated</span>
                        </div>
                        <div className="stat-card graduated">
                            <span className="stat-value">{result.graduated}</span>
                            <span className="stat-label">Graduated</span>
                        </div>
                        {result.failed > 0 && (
                            <div className="stat-card failed">
                                <span className="stat-value">{result.failed}</span>
                                <span className="stat-label">Failed</span>
                            </div>
                        )}
                    </div>

                    {result.failed > 0 && (
                        <div className="error-details">
                            <h3>Failed Promotions</h3>
                            <ul>
                                {result.results
                                    .filter((r) => !r.success)
                                    .map((r, i) => (
                                        <li key={i}>
                                            <strong>{r.student_name}</strong>: {r.error}
                                        </li>
                                    ))}
                            </ul>
                        </div>
                    )}

                    <div className="result-actions">
                        <button
                            className="btn-primary"
                            onClick={() => navigate(-1)}
                        >
                            Back to Sessions
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="promotion-management">
            <div className="page-header">
                <div className="header-content">
                    <button className="back-btn" onClick={() => navigate(-1)}>
                        ← Back
                    </button>
                    <h1>Student Promotions</h1>
                    {session && (
                        <p>
                            Academic Session: <strong>{session.name}</strong>
                        </p>
                    )}
                </div>
            </div>

            {error && (
                <div className="error-message">
                    <span>{error}</span>
                    <button onClick={loadData}>Retry</button>
                </div>
            )}

            {/* Stats Bar */}
            <div className="stats-bar">
                <div className="stat">
                    <span className="stat-value">{stats.total}</span>
                    <span className="stat-label">Total Students</span>
                </div>
                <div className="stat promoting">
                    <span className="stat-value">{stats.promoting}</span>
                    <span className="stat-label">Promoting</span>
                </div>
                <div className="stat repeating">
                    <span className="stat-value">{stats.repeating}</span>
                    <span className="stat-label">Repeating</span>
                </div>
                <div className="stat graduating">
                    <span className="stat-value">{stats.graduating}</span>
                    <span className="stat-label">Graduating</span>
                </div>
            </div>

            {/* Actions Bar */}
            <div className="actions-bar">
                <div className="filter-group">
                    <label>Filter by class:</label>
                    <select
                        value={filterClass}
                        onChange={(e) => setFilterClass(e.target.value)}
                    >
                        <option value="">All Classes</option>
                        {uniqueClasses.map((cls) => (
                            <option key={cls} value={cls}>
                                {cls}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="bulk-actions">
                    <button
                        className="btn-action"
                        onClick={() => setAllToAction('promote')}
                    >
                        Mark All Promote
                    </button>
                    <button
                        className="btn-action"
                        onClick={() => setAllToAction('repeat')}
                    >
                        Mark All Repeat
                    </button>
                    {isAdmin && (
                        <button
                            className="btn-auto"
                            onClick={initiateAutoPromote}
                            disabled={processing}
                        >
                            🚀 Auto-Promote
                        </button>
                    )}
                </div>
            </div>

            {/* Candidates Table */}
            <div className="candidates-table-container">
                <table className="candidates-table">
                    <thead>
                        <tr>
                            <th>Student</th>
                            <th>Admission No.</th>
                            <th>Current Class</th>
                            <th>Session Avg.</th>
                            <th>Next Class</th>
                            <th>Decision</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCandidates.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="empty-cell">
                                    <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                                        <p className="text-lg font-medium mb-2">No students found for promotion</p>
                                        <p className="text-sm">
                                            This could be because:
                                        </p>
                                        <ul className="text-sm list-disc list-inside mt-2 text-left">
                                            <li>No students are enrolled in this session</li>
                                            <li>All students have already been promoted</li>
                                            <li>Class history records are missing</li>
                                        </ul>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredCandidates.map((candidate) => {
                                const decision = decisions.get(candidate.student_id);
                                return (
                                    <tr key={candidate.student_id}>
                                        <td className="student-name">{candidate.student_name}</td>
                                        <td>{candidate.admission_number}</td>
                                        <td>{candidate.current_class_name}</td>
                                        <td>
                                            {candidate.session_average !== null ? (
                                                <span
                                                    className={`average ${candidate.session_average >= 50 ? 'good' : 'low'
                                                        }`}
                                                >
                                                    {candidate.session_average.toFixed(1)}%
                                                </span>
                                            ) : (
                                                <span className="no-data">N/A</span>
                                            )}
                                        </td>
                                        <td className="next-class">
                                            {candidate.next_class_name || (
                                                <span className="graduating">🎓 Graduating</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="decision-buttons">
                                                {(['promote', 'repeat', 'graduate'] as PromotionAction[]).map(
                                                    (action) => (
                                                        <button
                                                            key={action}
                                                            className={`decision-btn ${action} ${decision?.action === action ? 'selected' : ''
                                                                }`}
                                                            style={
                                                                decision?.action === action
                                                                    ? { backgroundColor: actionColors[action] }
                                                                    : {}
                                                            }
                                                            onClick={() =>
                                                                updateDecision(
                                                                    candidate.student_id,
                                                                    action,
                                                                    action === 'promote'
                                                                        ? candidate.next_class_id || undefined
                                                                        : undefined
                                                                )
                                                            }
                                                            disabled={
                                                                action === 'graduate' &&
                                                                candidate.next_class_id !== null
                                                            }
                                                        >
                                                            {actionLabels[action]}
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Execute Button */}
            <div className="execute-bar">
                <div className="execute-summary">
                    <span>
                        Ready to process <strong>{candidates.length}</strong> students
                    </span>
                </div>
                <button
                    className="btn-execute"
                    onClick={initiateExecute}
                    disabled={processing || candidates.length === 0}
                >
                    {processing ? 'Processing...' : (isTeacher ? 'Submit for Approval' : 'Execute Promotions')}
                </button>
            </div>

            {/* Confirmation Modal */}
            <Modal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                title={
                    confirmAction === 'auto'
                        ? 'Auto-Promote Students'
                        : confirmAction === 'submit'
                            ? 'Submit Promotion Decisions'
                            : 'Execute Promotions'
                }
            >
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-400">
                        {confirmAction === 'auto'
                            ? "This will automatically promote students based on your school's configured rules. Are you sure you want to continue?"
                            : confirmAction === 'submit'
                                ? "Your promotion decisions will be submitted to the school administrator for review and approval. Continue?"
                                : "Are you sure you want to execute these promotion decisions? This action cannot be undone."}
                    </p>

                    <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                        <button
                            type="button"
                            onClick={() => setShowConfirmModal(false)}
                            className="btn btn-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirmAction}
                            disabled={processing}
                            className="btn btn-primary"
                        >
                            {processing ? <div className="spinner-sm" /> : (confirmAction === 'submit' ? 'Submit' : 'Confirm')}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default PromotionManagementPage;
