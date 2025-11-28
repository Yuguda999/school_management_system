import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    CalendarDaysIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    ArrowLeftIcon,
    CheckIcon,
    AcademicCapIcon,
    DocumentTextIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import { useCurrentTerm } from '../../hooks/useCurrentTerm';
import PageHeader from '../../components/Layout/PageHeader';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Card from '../../components/ui/Card';
import { Student } from '../../types';
import { studentService } from '../../services/studentService';
import { academicService } from '../../services/academicService';
import attendanceService, { AttendanceStatus, AttendanceRecordInput } from '../../services/attendanceService';
import { getSchoolCodeFromUrl } from '../../utils/schoolCode';

const SubjectAttendancePage: React.FC = () => {
    const { user, logout } = useAuth();
    const { showSuccess, showError } = useToast();
    const { currentTerm } = useCurrentTerm();
    const navigate = useNavigate();
    const schoolCode = getSchoolCodeFromUrl();

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [students, setStudents] = useState<Student[]>([]);
    const [teacherSubjects, setTeacherSubjects] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);

    const [selectedSubject, setSelectedSubject] = useState<string>('');
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [attendance, setAttendance] = useState<Map<string, AttendanceStatus>>(new Map());
    const [notes, setNotes] = useState<Map<string, string>>(new Map());

    // Fetch teacher's subjects
    useEffect(() => {
        if (user) {
            fetchTeacherSubjects();
        }
    }, [user]);

    // Fetch classes when subject changes
    useEffect(() => {
        if (selectedSubject) {
            fetchClassesForSubject();
        } else {
            setClasses([]);
            setSelectedClass('');
        }
    }, [selectedSubject]);

    // Fetch students when class changes
    useEffect(() => {
        if (selectedClass) {
            fetchStudentsForClass();
        } else {
            setStudents([]);
        }
    }, [selectedClass]);

    const fetchTeacherSubjects = async () => {
        try {
            const subjects = await academicService.getTeacherSubjects(user!.id);
            setTeacherSubjects(subjects);
        } catch (error: any) {
            console.error('Failed to fetch teacher subjects:', error);

            if (error.response?.status === 401) {
                logout();
                navigate('/login');
                return;
            }

            showError('Failed to load your assigned subjects');
        }
    };

    const fetchClassesForSubject = async () => {
        try {
            setLoading(true);
            const classAssignments = await academicService.getSubjectClasses(selectedSubject);

            // Get unique class IDs
            const classIds = [...new Set(classAssignments.map(ca => ca.class_id))];

            // Fetch full class details
            const allClasses = await academicService.getClasses();
            const filteredClasses = allClasses.filter(c => classIds.includes(c.id));

            setClasses(filteredClasses);
        } catch (error: any) {
            console.error('Failed to fetch classes:', error);
            showError('Failed to load classes for this subject');
        } finally {
            setLoading(false);
        }
    };

    const fetchStudentsForClass = async () => {
        try {
            setLoading(true);
            const studentsData = await studentService.getStudents({
                class_id: selectedClass,
                status: 'active'
            });

            setStudents(studentsData.items || []);

            // Initialize attendance to 'present' for all students
            const initialAttendance = new Map<string, AttendanceStatus>();
            (studentsData.items || []).forEach((student: Student) => {
                initialAttendance.set(student.id, AttendanceStatus.PRESENT);
            });
            setAttendance(initialAttendance);
            setNotes(new Map());

        } catch (error: any) {
            console.error('Failed to fetch students:', error);
            if (error.response?.status === 401) {
                logout();
                navigate('/login');
                return;
            }
            showError('Failed to load students');
        } finally {
            setLoading(false);
        }
    };

    const handleAttendanceChange = (studentId: string, status: AttendanceStatus) => {
        const newAttendance = new Map(attendance);
        newAttendance.set(studentId, status);
        setAttendance(newAttendance);
    };

    const handleNoteChange = (studentId: string, note: string) => {
        const newNotes = new Map(notes);
        if (note.trim()) {
            newNotes.set(studentId, note);
        } else {
            newNotes.delete(studentId);
        }
        setNotes(newNotes);
    };

    const handleMarkAllPresent = () => {
        const newAttendance = new Map<string, AttendanceStatus>();
        students.forEach(student => {
            newAttendance.set(student.id, AttendanceStatus.PRESENT);
        });
        setAttendance(newAttendance);
        showSuccess('All students marked as present');
    };

    const handleSaveAttendance = async () => {
        if (!currentTerm) {
            showError('No active term found. Please set a current term.');
            return;
        }

        if (!selectedSubject || !selectedClass) {
            showError('Please select both a subject and a class');
            return;
        }

        if (!schoolCode) {
            showError('School code not found');
            return;
        }

        try {
            setSaving(true);

            // Build attendance records
            const records: AttendanceRecordInput[] = students.map(student => ({
                student_id: student.id,
                status: attendance.get(student.id) || AttendanceStatus.PRESENT,
                notes: notes.get(student.id)
            }));

            await attendanceService.markSubjectAttendance(schoolCode, {
                date: selectedDate,
                class_id: selectedClass,
                subject_id: selectedSubject,
                term_id: currentTerm.id,
                records
            });

            showSuccess('Subject attendance saved successfully!');
        } catch (error: any) {
            console.error('Failed to save attendance:', error);

            if (error.response?.status === 401) {
                logout();
                navigate('/login');
                return;
            }

            if (error.response?.status === 403) {
                showError('You don\'t have permission to mark attendance for this subject');
                return;
            }

            showError(error.response?.data?.detail || 'Failed to save attendance');
        } finally {
            setSaving(false);
        }
    };

    const getStatusColor = (status: AttendanceStatus) => {
        switch (status) {
            case AttendanceStatus.PRESENT:
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800';
            case AttendanceStatus.ABSENT:
                return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
            case AttendanceStatus.LATE:
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
            case AttendanceStatus.EXCUSED:
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    const getStatusIcon = (status: AttendanceStatus) => {
        switch (status) {
            case AttendanceStatus.PRESENT:
                return <CheckCircleIcon className="h-5 w-5" />;
            case AttendanceStatus.ABSENT:
                return <XCircleIcon className="h-5 w-5" />;
            case AttendanceStatus.LATE:
                return <ClockIcon className="h-5 w-5" />;
            case AttendanceStatus.EXCUSED:
                return <ExclamationTriangleIcon className="h-5 w-5" />;
            default:
                return null;
        }
    };

    const selectedSubjectInfo = teacherSubjects.find(s => s.subject_id === selectedSubject);
    const selectedClassInfo = classes.find(c => c.id === selectedClass);

    const attendanceSummary = {
        present: Array.from(attendance.values()).filter(s => s === AttendanceStatus.PRESENT).length,
        absent: Array.from(attendance.values()).filter(s => s === AttendanceStatus.ABSENT).length,
        late: Array.from(attendance.values()).filter(s => s === AttendanceStatus.LATE).length,
        excused: Array.from(attendance.values()).filter(s => s === AttendanceStatus.EXCUSED).length,
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <PageHeader
                title="Mark Subject Attendance"
                description="Take attendance for a specific subject and class"
                actions={
                    <div className="flex gap-2">
                        <button
                            onClick={() => navigate(`/${schoolCode}/teacher/attendance/subject/records`)}
                            className="btn btn-secondary"
                        >
                            <DocumentTextIcon className="h-5 w-5 mr-2" />
                            View Records
                        </button>
                        <button
                            onClick={() => navigate(-1)}
                            className="btn btn-outline"
                        >
                            <ArrowLeftIcon className="h-5 w-5 mr-2" />
                            Back
                        </button>
                    </div>
                }
            />

            {/* Selection Controls */}
            <Card variant="glass">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="subject-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Select Subject *
                        </label>
                        <select
                            id="subject-select"
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            className="input"
                        >
                            <option value="">-- Choose Subject --</option>
                            {teacherSubjects.map(subject => (
                                <option key={subject.subject_id} value={subject.subject_id}>
                                    {subject.subject_name} ({subject.subject_code})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="class-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Select Class *
                        </label>
                        <select
                            id="class-select"
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            disabled={!selectedSubject || loading}
                            className="input disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <option value="">-- Choose Class --</option>
                            {classes.map(cls => (
                                <option key={cls.id} value={cls.id}>
                                    {cls.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="date-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Date *
                        </label>
                        <input
                            type="date"
                            id="date-select"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                            className="input"
                        />
                    </div>
                </div>

                {selectedSubjectInfo && selectedClassInfo && (
                    <div className="mt-4 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
                        <div className="flex items-center space-x-3">
                            <AcademicCapIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {selectedSubjectInfo.subject_name} - {selectedClassInfo.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {students.length} student{students.length !== 1 ? 's' : ''} enrolled
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </Card>

            {/* Show content only when both subject and class are selected */}
            {selectedSubject && selectedClass && (
                <>
                    {/* Summary Cards - same as ClassAttendancePage */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        <Card variant="glass" className="border-l-4 border-l-gray-500">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Total Students</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{students.length}</p>
                            </div>
                        </Card>
                        <Card variant="glass" className="border-l-4 border-l-green-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Present</p>
                                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{attendanceSummary.present}</p>
                                </div>
                                <CheckCircleIcon className="h-8 w-8 text-green-500" />
                            </div>
                        </Card>
                        <Card variant="glass" className="border-l-4 border-l-red-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Absent</p>
                                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{attendanceSummary.absent}</p>
                                </div>
                                <XCircleIcon className="h-8 w-8 text-red-500" />
                            </div>
                        </Card>
                        <Card variant="glass" className="border-l-4 border-l-yellow-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Late</p>
                                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{attendanceSummary.late}</p>
                                </div>
                                <ClockIcon className="h-8 w-8 text-yellow-500" />
                            </div>
                        </Card>
                        <Card variant="glass" className="border-l-4 border-l-blue-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Excused</p>
                                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{attendanceSummary.excused}</p>
                                </div>
                                <ExclamationTriangleIcon className="h-8 w-8 text-blue-500" />
                            </div>
                        </Card>
                    </div>

                    {/* Action Buttons */}
                    <Card variant="glass">
                        <div className="flex items-center justify-between">
                            <button
                                onClick={handleMarkAllPresent}
                                className="btn btn-outline"
                            >
                                <CheckIcon className="h-5 w-5 mr-2" />
                                Mark All Present
                            </button>
                            <button
                                onClick={handleSaveAttendance}
                                disabled={saving || students.length === 0}
                                className="btn btn-primary"
                            >
                                {saving ? (
                                    <>
                                        <LoadingSpinner size="sm" className="mr-2" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <CalendarDaysIcon className="h-5 w-5 mr-2" />
                                        Save Attendance
                                    </>
                                )}
                            </button>
                        </div>
                    </Card>

                    {/* Students List */}
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <LoadingSpinner size="lg" />
                        </div>
                    ) : students.length > 0 ? (
                        <Card variant="glass">
                            <div className="space-y-2">
                                {students.map((student, index) => {
                                    const currentStatus = attendance.get(student.id) || AttendanceStatus.PRESENT;
                                    const currentNote = notes.get(student.id) || '';

                                    return (
                                        <div
                                            key={student.id}
                                            className={`p-4 rounded-lg border-2 transition-all duration-200 ${getStatusColor(currentStatus)}`}
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-center space-x-4 flex-1">
                                                    <div className="flex-shrink-0 w-8 text-center">
                                                        <span className="text-sm font-bold">{index + 1}</span>
                                                    </div>
                                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-900 dark:to-secondary-900 flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold shrink-0">
                                                        {student.first_name.charAt(0)}{student.last_name.charAt(0)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium truncate">
                                                            {student.first_name} {student.last_name}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                            {student.admission_number}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-2">
                                                    {Object.values(AttendanceStatus).map(status => (
                                                        <button
                                                            key={status}
                                                            onClick={() => handleAttendanceChange(student.id, status)}
                                                            className={`
                                px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
                                flex items-center space-x-1
                                ${currentStatus === status
                                                                    ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-800 shadow-lg scale-105'
                                                                    : 'opacity-60 hover:opacity-100'
                                                                }
                                ${getStatusColor(status)}
                              `}
                                                        >
                                                            {getStatusIcon(status)}
                                                            <span className="capitalize">{status}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="mt-3 ml-14">
                                                <input
                                                    type="text"
                                                    placeholder="Add note (optional)..."
                                                    value={currentNote}
                                                    onChange={(e) => handleNoteChange(student.id, e.target.value)}
                                                    className="input input-sm w-full"
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    ) : (
                        <Card variant="glass">
                            <div className="text-center py-12">
                                <AcademicCapIcon className="h-12 w-12 mx-auto text-gray-400" />
                                <p className="mt-4 text-gray-500 dark:text-gray-400">
                                    No students found for this class
                                </p>
                            </div>
                        </Card>
                    )}
                </>
            )}

            {/* Empty State - show when no selection */}
            {(!selectedSubject || !selectedClass) && (
                <Card variant="glass">
                    <div className="text-center py-12">
                        <AcademicCapIcon className="h-16 w-16 mx-auto text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                            Select Subject and Class
                        </h3>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            Choose a subject and class to start taking attendance
                        </p>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default SubjectAttendancePage;
