import { apiService } from './api';

// Enums matching backend
export enum AttendanceStatus {
    PRESENT = 'present',
    ABSENT = 'absent',
    LATE = 'late',
    EXCUSED = 'excused'
}

// Types
export interface AttendanceRecordInput {
    student_id: string;
    status: AttendanceStatus;
    notes?: string;
}

export interface BulkClassAttendanceCreate {
    date: string; // ISO date string
    class_id: string;
    term_id: string;
    records: AttendanceRecordInput[];
}

export interface BulkSubjectAttendanceCreate {
    date: string; // ISO date string
    class_id: string;
    subject_id: string;
    term_id: string;
    records: AttendanceRecordInput[];
}

export interface AttendanceResponse {
    id: string;
    date: string;
    status: AttendanceStatus;
    student_id: string;
    student_name?: string;
    class_id: string;
    class_name?: string;
    subject_id?: string;
    subject_name?: string;
    subject_code?: string;
    term_id: string;
    term_name?: string;
    marked_by?: string;
    marker_name?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface AttendanceUpdate {
    status?: AttendanceStatus;
    notes?: string;
}

export interface StudentAttendanceSummary {
    student_id: string;
    student_name: string;
    total_days: number;
    present_days: number;
    absent_days: number;
    late_days: number;
    excused_days: number;
    attendance_rate: number;
}

export interface AttendanceFilterParams {
    class_id?: string;
    subject_id?: string;
    student_id?: string;
    start_date?: string;
    end_date?: string;
    status?: AttendanceStatus;
    term_id?: string;
    skip?: number;
    limit?: number;
}

class AttendanceService {
    /**
     * Mark class attendance for all students in a class
     */
    async markClassAttendance(
        schoolCode: string,
        data: BulkClassAttendanceCreate
    ): Promise<AttendanceResponse[]> {
        return apiService.post<AttendanceResponse[]>(
            `/api/v1/school/${schoolCode}/attendance/class`,
            data
        );
    }

    /**
     * Mark subject attendance for students in a class
     */
    async markSubjectAttendance(
        schoolCode: string,
        data: BulkSubjectAttendanceCreate
    ): Promise<AttendanceResponse[]> {
        return apiService.post<AttendanceResponse[]>(
            `/api/v1/school/${schoolCode}/attendance/subject`,
            data
        );
    }

    /**
     * Get attendance records with flexible filtering
     */
    async getAttendanceRecords(
        schoolCode: string,
        params?: AttendanceFilterParams
    ): Promise<AttendanceResponse[]> {
        return apiService.get<AttendanceResponse[]>(
            `/api/v1/school/${schoolCode}/attendance`,
            { params }
        );
    }

    /**
     * Update an attendance record
     */
    async updateAttendanceRecord(
        schoolCode: string,
        attendanceId: string,
        data: AttendanceUpdate
    ): Promise<AttendanceResponse> {
        return apiService.put<AttendanceResponse>(
            `/api/v1/school/${schoolCode}/attendance/${attendanceId}`,
            data
        );
    }

    /**
     * Get attendance summary for a student
     */
    async getStudentAttendanceSummary(
        schoolCode: string,
        studentId: string,
        params?: { term_id?: string; subject_id?: string }
    ): Promise<StudentAttendanceSummary> {
        return apiService.get<StudentAttendanceSummary>(
            `/api/v1/school/${schoolCode}/attendance/summary/${studentId}`,
            { params }
        );
    }

    /**
     * Check if attendance already exists for a date/class/subject
     */
    async checkDuplicateAttendance(
        schoolCode: string,
        params: {
            class_id: string;
            date: string;
            subject_id?: string;
            term_id?: string;
        }
    ): Promise<{
        exists: boolean;
        count: number;
        marked_at: string | null;
        marked_by: string | null;
    }> {
        return apiService.get(
            `/api/v1/school/${schoolCode}/attendance/check-duplicate`,
            { params }
        );
    }

    /**
     * Delete an attendance record
     */
    async deleteAttendanceRecord(
        schoolCode: string,
        attendanceId: string
    ): Promise<void> {
        return apiService.delete(
            `/api/v1/school/${schoolCode}/attendance/${attendanceId}`
        );
    }

    /**
     * Delete all attendance records for a specific date/class/subject
     */
    async deleteBulkAttendance(
        schoolCode: string,
        params: {
            class_id: string;
            date: string;
            subject_id?: string;
        }
    ): Promise<{ deleted_count: number }> {
        return apiService.delete(
            `/api/v1/school/${schoolCode}/attendance/bulk`,
            { params }
        );
    }
}

export const attendanceService = new AttendanceService();
export default attendanceService;
