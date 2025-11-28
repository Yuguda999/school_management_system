export interface DashboardStats {
    total_students: number;
    total_teachers: number;
    total_classes: number;
    total_subjects: number;
    active_terms: number;
    pending_fees: number;
    recent_enrollments: number;
    attendance_rate: number;
    total_revenue: number;
    // Teacher specific stats
    my_students_count?: number;
    my_classes_count?: number;
    assignments_due?: number;
    average_grade?: number;
}

export interface EnrollmentTrend {
    month: string;
    students: number;
}

export interface RevenueData {
    month: string;
    revenue: number;
}

export interface AttendanceData {
    status: string;
    count: number;
    percentage: number;
}

export interface PerformanceData {
    subject: string;
    average_score: number;
    target_score: number;
}

export interface RecentActivity {
    id: string;
    type: string;
    title: string;
    description: string;
    timestamp: string;
    user_name?: string;
}

export interface DashboardData {
    stats: DashboardStats;
    enrollment_trend: EnrollmentTrend[];
    revenue_data: RevenueData[];
    attendance_data: AttendanceData[];
    performance_data: PerformanceData[];
    recent_activities: RecentActivity[];
}
