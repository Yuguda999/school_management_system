import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    CalendarDaysIcon,
    FunnelIcon,
    ArrowDownTrayIcon,
    MagnifyingGlassIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    TrashIcon,
    AcademicCapIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import PageHeader from '../../components/Layout/PageHeader';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Card from '../../components/ui/Card';
import DataTable, { Column } from '../../components/ui/DataTable';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import attendanceService, { AttendanceResponse, AttendanceStatus } from '../../services/attendanceService';
import { getSchoolCodeFromUrl } from '../../utils/schoolCode';
import { academicService } from '../../services/academicService';

const ClassAttendanceRecordsPage: React.FC = () => {
    const { user, logout } = useAuth();
    const { showError, showSuccess } = useToast();
    const navigate = useNavigate();
    const schoolCode = getSchoolCodeFromUrl();

    const [records, setRecords] = useState<AttendanceResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);

    // Filters
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [selectedStatus, setSelectedStatus] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [timeFilter, setTimeFilter] = useState<string>('30days');
    const [timeOfDay, setTimeOfDay] = useState<string>(''); // morning, afternoon, evening

    const [classes, setClasses] = useState<any[]>([]);
    const [showFilters, setShowFilters] = useState(false);

    // Delete modal
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [recordToDelete, setRecordToDelete] = useState<AttendanceResponse | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchFilterOptions();
        applyTimeFilter('30days');
    }, []);

    useEffect(() => {
        if (schoolCode) {
            fetchAttendanceRecords();
        }
    }, [schoolCode, startDate, endDate, selectedClass, selectedStatus]);

    const applyTimeFilter = (filter: string) => {
        const today = new Date();
        let start = new Date();

        switch (filter) {
            case 'today':
                start = today;
                break;
            case 'week':
                start.setDate(today.getDate() - 7);
                break;
            case '30days':
                start.setDate(today.getDate() - 30);
                break;
            case 'custom':
                return;
        }

        setStartDate(start.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
        setTimeFilter(filter);
    };

    const fetchFilterOptions = async () => {
        try {
            const classesData = await academicService.getClasses({ is_active: true });
            setClasses(classesData);
        } catch (error: any) {
            console.error('Failed to fetch filter options:', error);
        }
    };

    const fetchAttendanceRecords = async () => {
        if (!schoolCode) return;

        try {
            setLoading(true);
            const params: any = { subject_id: 'null' }; // Only class attendance (no subject)

            if (startDate) params.start_date = startDate;
            if (endDate) params.end_date = endDate;
            if (selectedClass) params.class_id = selectedClass;
            if (selectedStatus) params.status_filter = selectedStatus;

            const data = await attendanceService.getAttendanceRecords(schoolCode, params);
            setRecords(data);
        } catch (error: any) {
            console.error('Failed to fetch attendance records:', error);

            if (error.response?.status === 401) {
                logout();
                navigate('/login');
                return;
            }

            showError('Failed to load attendance records');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!recordToDelete || !schoolCode) return;

        try {
            setDeleting(true);
            await attendanceService.deleteAttendanceRecord(schoolCode, recordToDelete.id);
            showSuccess('Attendance record deleted successfully');
            setShowDeleteModal(false);
            setRecordToDelete(null);
            fetchAttendanceRecords();
        } catch (error: any) {
            console.error('Failed to delete:', error);
            if (error.response?.status === 403) {
                showError("You don't have permission to delete this record");
            } else {
                showError('Failed to delete attendance record');
            }
        } finally {
            setDeleting(false);
        }
    };

    const handleExport = async () => {
        if (!schoolCode) return;

        try {
            setExporting(true);
            const filteredRecords = getFilteredRecords();

            const headers = ['Date', 'Time', 'Time of Day', 'Student', 'Class', 'Status', 'Marked By', 'Notes'];
            const rows = filteredRecords.map(record => [
                record.date,
                new Date(record.created_at).toLocaleTimeString(),
                getTimeOfDayLabel(new Date(record.created_at)),
                record.student_name || '',
                record.class_name || '',
                record.status,
                record.marker_name || '',
                record.notes || ''
            ]);

            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `class_attendance_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            showSuccess('Class attendance records exported successfully');
        } catch (error: any) {
            console.error('Failed to export:', error);
            showError('Failed to export attendance records');
        } finally {
            setExporting(false);
        }
    };

    const clearFilters = () => {
        applyTimeFilter('30days');
        setSelectedClass('');
        setSelectedStatus('');
        setSearchTerm('');
        setTimeOfDay('');
    };

    const getTimeOfDay = (date: Date): 'morning' | 'afternoon' | 'evening' => {
        const hour = date.getHours();
        if (hour < 12) return 'morning';
        if (hour < 17) return 'afternoon';
        return 'evening';
    };

    const getTimeOfDayLabel = (date: Date): string => {
        const timeOfDay = getTimeOfDay(date);
        return timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1);
    };

    const getTimeOfDayColor = (date: Date): string => {
        const timeOfDay = getTimeOfDay(date);
        switch (timeOfDay) {
            case 'morning': return 'border-l-4 border-l-amber-400 bg-amber-50/50 dark:bg-amber-900/10';
            case 'afternoon': return 'border-l-4 border-l-orange-400 bg-orange-50/50 dark:bg-orange-900/10';
            case 'evening': return 'border-l-4 border-l-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10';
        }
    };

    const getTimeOfDayBadgeColor = (date: Date): string => {
        const timeOfDay = getTimeOfDay(date);
        switch (timeOfDay) {
            case 'morning': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
            case 'afternoon': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
            case 'evening': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400';
        }
    };

    const getStatusIcon = (status: AttendanceStatus) => {
        switch (status) {
            case AttendanceStatus.PRESENT:
                return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
            case AttendanceStatus.ABSENT:
                return <XCircleIcon className="h-5 w-5 text-red-600" />;
            case AttendanceStatus.LATE:
                return <ClockIcon className="h-5 w-5 text-yellow-600" />;
            case AttendanceStatus.EXCUSED:
                return <ExclamationTriangleIcon className="h-5 w-5 text-blue-600" />;
        }
    };

    const getStatusBadgeClass = (status: AttendanceStatus) => {
        switch (status) {
            case AttendanceStatus.PRESENT:
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case AttendanceStatus.ABSENT:
                return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            case AttendanceStatus.LATE:
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            case AttendanceStatus.EXCUSED:
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
        }
    };

    const getFilteredRecords = () => {
        return records.filter(record => {
            // Search filter
            if (searchTerm) {
                const search = searchTerm.toLowerCase();
                const matchesSearch = (
                    record.student_name?.toLowerCase().includes(search) ||
                    record.class_name?.toLowerCase().includes(search)
                );
                if (!matchesSearch) return false;
            }

            // Time of day filter
            if (timeOfDay) {
                const recordTimeOfDay = getTimeOfDay(new Date(record.created_at));
                if (recordTimeOfDay !== timeOfDay) return false;
            }

            return true;
        });
    };

    const filteredRecords = getFilteredRecords();

    // Calculate summary stats
    const summary = {
        total: filteredRecords.length,
        present: filteredRecords.filter(r => r.status === AttendanceStatus.PRESENT).length,
        absent: filteredRecords.filter(r => r.status === AttendanceStatus.ABSENT).length,
        late: filteredRecords.filter(r => r.status === AttendanceStatus.LATE).length,
        excused: filteredRecords.filter(r => r.status === AttendanceStatus.EXCUSED).length,
    };

    // Define table columns
    const columns: Column<AttendanceResponse>[] = [
        {
            key: 'date',
            header: 'Date',
            sortable: true,
            render: (record) => (
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(record.date).toLocaleDateString()}
                </div>
            )
        },
        {
            key: 'created_at',
            header: 'Time',
            sortable: true,
            render: (record) => {
                const createdAt = new Date(record.created_at);
                return (
                    <div className="flex flex-col gap-1">
                        <div className="text-sm text-gray-900 dark:text-white">
                            {createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full w-fit ${getTimeOfDayBadgeColor(createdAt)}`}>
                            {getTimeOfDayLabel(createdAt)}
                        </span>
                    </div>
                );
            }
        },
        {
            key: 'student_name',
            header: 'Student',
            sortable: true,
            render: (record) => (
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {record.student_name}
                </div>
            )
        },
        {
            key: 'class_name',
            header: 'Class',
            sortable: true,
            render: (record) => (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                    {record.class_name}
                </div>
            )
        },
        {
            key: 'status',
            header: 'Status',
            sortable: true,
            render: (record) => (
                <div className="flex items-center gap-2">
                    {getStatusIcon(record.status)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(record.status)}`}>
                        {record.status}
                    </span>
                </div>
            )
        },
        {
            key: 'marker_name',
            header: 'Marked By',
            render: (record) => (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                    {record.marker_name}
                </div>
            )
        },
        {
            key: 'notes',
            header: 'Notes',
            render: (record) => (
                <div className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                    {record.notes || '-'}
                </div>
            )
        },
    ];

    return (
        <div className="space-y-4 sm:space-y-6 animate-fade-in pb-6">
            <PageHeader
                title="Class Attendance Records"
                description="View and manage class attendance history"
                icon={<AcademicCapIcon className="h-8 w-8" />}
            />

            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                <Card variant="glass" className="border-l-4 border-l-gray-500 p-3 sm:p-4">
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Total</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{summary.total}</p>
                </Card>
                <Card variant="glass" className="border-l-4 border-l-green-500 p-3 sm:p-4">
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Present</p>
                    <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">{summary.present}</p>
                </Card>
                <Card variant="glass" className="border-l-4 border-l-red-500 p-3 sm:p-4">
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Absent</p>
                    <p className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">{summary.absent}</p>
                </Card>
                <Card variant="glass" className="border-l-4 border-l-yellow-500 p-3 sm:p-4">
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Late</p>
                    <p className="text-xl sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400">{summary.late}</p>
                </Card>
                <Card variant="glass" className="border-l-4 border-l-blue-500 col-span-2 sm:col-span-1 p-3 sm:p-4">
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Excused</p>
                    <p className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{summary.excused}</p>
                </Card>
            </div>

            {/* Filters and Actions */}
            <Card variant="glass">
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1 relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search students, classes..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="input pl-10 w-full"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="btn btn-secondary flex items-center justify-center"
                            >
                                <FunnelIcon className="h-5 w-5 sm:mr-2" />
                                <span className="hidden sm:inline">Filters</span>
                            </button>
                            <button
                                onClick={handleExport}
                                disabled={exporting || filteredRecords.length === 0}
                                className="btn btn-primary flex items-center justify-center"
                            >
                                <ArrowDownTrayIcon className="h-5 w-5 sm:mr-2" />
                                <span className="hidden sm:inline">{exporting ? 'Exporting...' : 'Export'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Filter Panel */}
                    {showFilters && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                            <div>
                                <label className="label-sm">Time Period</label>
                                <select
                                    value={timeFilter}
                                    onChange={(e) => applyTimeFilter(e.target.value)}
                                    className="input input-sm"
                                >
                                    <option value="today">Today</option>
                                    <option value="week">Last 7 Days</option>
                                    <option value="30days">Last 30 Days</option>
                                    <option value="custom">Custom Range</option>
                                </select>
                            </div>
                            <div>
                                <label className="label-sm">Start Date</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => {
                                        setStartDate(e.target.value);
                                        setTimeFilter('custom');
                                    }}
                                    className="input input-sm"
                                />
                            </div>
                            <div>
                                <label className="label-sm">End Date</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => {
                                        setEndDate(e.target.value);
                                        setTimeFilter('custom');
                                    }}
                                    max={new Date().toISOString().split('T')[0]}
                                    className="input input-sm"
                                />
                            </div>
                            <div>
                                <label className="label-sm">Time of Day</label>
                                <select
                                    value={timeOfDay}
                                    onChange={(e) => setTimeOfDay(e.target.value)}
                                    className="input input-sm"
                                >
                                    <option value="">All Times</option>
                                    <option value="morning">Morning (Before 12pm)</option>
                                    <option value="afternoon">Afternoon (12pm-5pm)</option>
                                    <option value="evening">Evening (After 5pm)</option>
                                </select>
                            </div>
                            <div>
                                <label className="label-sm">Class</label>
                                <select
                                    value={selectedClass}
                                    onChange={(e) => setSelectedClass(e.target.value)}
                                    className="input input-sm"
                                >
                                    <option value="">All Classes</option>
                                    {classes.map(cls => (
                                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="label-sm">Status</label>
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="input input-sm"
                                >
                                    <option value="">All Statuses</option>
                                    <option value={AttendanceStatus.PRESENT}>Present</option>
                                    <option value={AttendanceStatus.ABSENT}>Absent</option>
                                    <option value={AttendanceStatus.LATE}>Late</option>
                                    <option value={AttendanceStatus.EXCUSED}>Excused</option>
                                </select>
                            </div>
                            <div className="sm:col-span-2 lg:col-span-6 flex justify-end">
                                <button onClick={clearFilters} className="btn btn-outline btn-sm">
                                    Clear Filters
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            {/* Data Table */}
            <DataTable
                data={filteredRecords}
                columns={columns}
                loading={loading}
                emptyMessage="No class attendance records found"
                rowClassName={(record) => getTimeOfDayColor(new Date(record.created_at))}
                actions={(record) => (
                    <button
                        onClick={() => {
                            setRecordToDelete(record);
                            setShowDeleteModal(true);
                        }}
                        className="p-1 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Delete Record"
                    >
                        <TrashIcon className="h-5 w-5" />
                    </button>
                )}
            />

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setRecordToDelete(null);
                }}
                onConfirm={handleDelete}
                title="Delete Attendance Record"
                message={recordToDelete
                    ? `Are you sure you want to delete the attendance record for ${recordToDelete.student_name} on ${new Date(recordToDelete.date).toLocaleDateString()}?\n\nThis action cannot be undone.`
                    : ''}
                confirmText={deleting ? 'Deleting...' : 'Delete Record'}
                type="danger"
            />
        </div>
    );
};

export default ClassAttendanceRecordsPage;
