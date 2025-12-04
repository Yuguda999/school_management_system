import React, { useMemo } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import { Student } from '../../types';
import { Grade } from '../../services/gradeService';
import { StudentAttendanceSummary } from '../../services/attendanceService';

interface StudentAnalyticsProps {
    student: Student;
    grades: Grade[];
    attendanceSummary: StudentAttendanceSummary | null;
    loading?: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const StudentAnalytics: React.FC<StudentAnalyticsProps> = ({
    grades,
    attendanceSummary,
    loading
}) => {
    // Process grades for charts
    const subjectPerformance = useMemo(() => {
        const subjectMap = new Map<string, { name: string; total: number; count: number }>();

        grades.forEach(grade => {
            const subjectName = grade.subject_name || 'Unknown Subject';
            const current = subjectMap.get(grade.subject_id) || {
                name: subjectName,
                total: 0,
                count: 0
            };

            // Normalize score to percentage
            const percentage = (grade.score / grade.total_marks) * 100;

            subjectMap.set(grade.subject_id, {
                name: subjectName,
                total: current.total + percentage,
                count: current.count + 1
            });
        });

        return Array.from(subjectMap.values()).map(item => ({
            subject: item.name,
            average: Math.round(item.total / item.count)
        }));
    }, [grades]);

    const performanceTrend = useMemo(() => {
        // Sort grades by date
        const sortedGrades = [...grades].sort((a, b) =>
            new Date(a.graded_date).getTime() - new Date(b.graded_date).getTime()
        );

        return sortedGrades.map(grade => ({
            date: new Date(grade.graded_date).toLocaleDateString(),
            score: Math.round((grade.score / grade.total_marks) * 100),
            subject: grade.subject_name || 'Unknown',
            type: grade.exam_name || 'Assessment'
        }));
    }, [grades]);

    const attendanceData = useMemo(() => {
        if (!attendanceSummary) return [];

        return [
            { name: 'Present', value: attendanceSummary.present_days },
            { name: 'Absent', value: attendanceSummary.absent_days },
            { name: 'Late', value: attendanceSummary.late_days },
            { name: 'Excused', value: attendanceSummary.excused_days },
        ].filter(item => item.value > 0);
    }, [attendanceSummary]);

    if (loading) {
        return <div className="animate-pulse h-64 bg-gray-100 dark:bg-gray-800 rounded-xl"></div>;
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Average Score</h4>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                        {grades.length > 0
                            ? Math.round(grades.reduce((acc, g) => acc + (g.score / g.total_marks) * 100, 0) / grades.length) + '%'
                            : 'N/A'}
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Attendance Rate</h4>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                        {attendanceSummary ? `${attendanceSummary.attendance_rate}%` : 'N/A'}
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Assessments</h4>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                        {grades.length}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Subject Performance Chart */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Subject Performance</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={subjectPerformance}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                                <XAxis dataKey="subject" stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '0.5rem', color: '#F3F4F6' }}
                                    itemStyle={{ color: '#F3F4F6' }}
                                />
                                <Bar dataKey="average" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Attendance Distribution */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Attendance Overview</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={attendanceData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {attendanceData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '0.5rem', color: '#F3F4F6' }}
                                    itemStyle={{ color: '#F3F4F6' }}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Performance Trend */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm lg:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance Trend</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={performanceTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                                <XAxis dataKey="date" stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '0.5rem', color: '#F3F4F6' }}
                                    itemStyle={{ color: '#F3F4F6' }}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="score" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentAnalytics;
