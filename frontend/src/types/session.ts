/**
 * Types for Academic Sessions and Promotions
 */

// Session Status
export type SessionStatus = 'upcoming' | 'active' | 'completed' | 'archived';

// Academic Session
export interface AcademicSession {
    id: string;
    name: string; // e.g., "2023/2024"
    start_date: string;
    end_date: string;
    status: SessionStatus;
    term_count: number; // 2 or 3
    is_current: boolean;
    promotion_completed: boolean;
    school_id: string;
    created_at: string;
    updated_at: string;
}

// Term Summary for inclusion in session
export interface TermSummary {
    id: string;
    name: string;
    type: string;
    sequence_number: number;
    is_current: boolean;
    start_date: string;
    end_date: string;
}

// Academic Session with Terms
export interface AcademicSessionWithTerms extends AcademicSession {
    terms: TermSummary[];
}

// Create Session Request
export interface CreateAcademicSessionRequest {
    name: string;
    start_date: string;
    end_date: string;
    term_count: number;
}

// Update Session Request
export interface UpdateAcademicSessionRequest {
    name?: string;
    start_date?: string;
    end_date?: string;
    status?: SessionStatus;
    is_current?: boolean;
    promotion_completed?: boolean;
}

// ===================
// Promotion Types
// ===================

// Promotion Action
export type PromotionAction = 'promote' | 'repeat' | 'graduate' | 'transfer';

// Promotion Candidate
export interface PromotionCandidate {
    student_id: string;
    student_name: string;
    admission_number: string;
    current_class_id: string;
    current_class_name: string;
    session_average: number | null;
    promotion_eligible: boolean;
    suggested_action: PromotionAction;
    next_class_id: string | null;
    next_class_name: string | null;
}

// Promotion Decision
export interface PromotionDecision {
    student_id: string;
    class_history_id: string;
    action: PromotionAction;
    next_class_id?: string;
    remarks?: string;
}

// Bulk Promotion Request
export interface BulkPromotionRequest {
    session_id: string;
    decisions: PromotionDecision[];
}

// Promotion Result (for a single student)
export interface PromotionResult {
    student_id: string;
    student_name: string;
    success: boolean;
    action: string;
    from_class: string;
    to_class: string | null;
    error: string | null;
}

// Bulk Promotion Result
export interface BulkPromotionResult {
    total_processed: number;
    successful: number;
    failed: number;
    promoted: number;
    repeated: number;
    graduated: number;
    transferred: number;
    results: PromotionResult[];
}

// Promotion Preview Response
export interface PromotionPreviewResponse {
    session_id: string;
    session_name: string;
    total_students: number;
    promotable: number;
    repeating: number;
    graduating: number;
    candidates: PromotionCandidate[];
}

// Class Progression Item
export interface ClassProgression {
    class_id: string;
    next_class_id: string | null;
    next_class_name: string;
}

// ===================
// Session Transition Types
// ===================

export interface SessionTransitionRequest {
    old_session_id: string;
    new_session_id: string;
    run_promotions: boolean;
    auto_promote: boolean;
}

export interface SessionTransitionResult {
    old_session_id: string;
    new_session_id: string;
    old_session_name: string;
    new_session_name: string;
    promotions_completed: boolean;
    promotion_result: BulkPromotionResult | null;
    students_enrolled_in_new_session: number;
    message: string;
}
