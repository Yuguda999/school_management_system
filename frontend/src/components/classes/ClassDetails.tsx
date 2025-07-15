import React, { useState, useEffect } from 'react';
import {
  UserGroupIcon,
  AcademicCapIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  PencilIcon,
  PlusIcon,
  BookOpenIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { Class, Student, Subject, ClassLevel, TimetableEntry, Term } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { useCurrentTerm } from '../../hooks/useCurrentTerm';
import { getClassLevelDisplay } from '../../utils/classUtils';
import { studentService } from '../../services/studentService';
import { academicService } from '../../services/academicService';
import DetailedStudentProfile from '../students/DetailedStudentProfile';

interface ClassDetailsProps {
  classData: Class;
  onEdit?: () => void;
  onClose?: () => void;
}

const ClassDetails: React.FC<ClassDetailsProps> = ({
  classData,
  onEdit,
  onClose
}) => {
  const { user } = useAuth();
  const { canManageUsers } = usePermissions();
  const { currentTerm } = useCurrentTerm();
  const [activeTab, setActiveTab] = useState('overview');
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showStudentProfile, setShowStudentProfile] = useState(false);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);

  // Check if user can edit classes (only admins and super admins, not teachers)
  const canEditClass = user && ['super_admin', 'admin'].includes(user.role);

  // Check if user is class teacher (can view detailed student info)
  const isClassTeacher = user && user.role === 'teacher' && classData.teacher_id === user.id;

  const handleViewStudent = (student: Student) => {
    if (isClassTeacher || canEditClass) {
      setSelectedStudent(student);
      setShowStudentProfile(true);
    }
  };

  const getClassLevelDisplay = (level: ClassLevel): string => {
    const levelMap: Record<ClassLevel, string> = {
      [ClassLevel.NURSERY_1]: 'Nursery 1',
      [ClassLevel.NURSERY_2]: 'Nursery 2',
      [ClassLevel.PRIMARY_1]: 'Primary 1',
      [ClassLevel.PRIMARY_2]: 'Primary 2',
      [ClassLevel.PRIMARY_3]: 'Primary 3',
      [ClassLevel.PRIMARY_4]: 'Primary 4',
      [ClassLevel.PRIMARY_5]: 'Primary 5',
      [ClassLevel.PRIMARY_6]: 'Primary 6',
      [ClassLevel.JSS_1]: 'JSS 1',
      [ClassLevel.JSS_2]: 'JSS 2',
      [ClassLevel.JSS_3]: 'JSS 3',
      [ClassLevel.SS_1]: 'SS 1',
      [ClassLevel.SS_2]: 'SS 2',
      [ClassLevel.SS_3]: 'SS 3',
    };
    return levelMap[level] || level;
  };

  useEffect(() => {
    if (activeTab === 'students') {
      fetchStudents();
    } else if (activeTab === 'subjects') {
      fetchSubjects();
    } else if (activeTab === 'schedule') {
      fetchTimetable();
    }
  }, [activeTab, classData.id]);



  const fetchStudents = async () => {
    try {
      setLoading(true);

      // Fetch real students data for this class
      const response = await studentService.getStudents({
        class_id: classData.id,
        status: 'active',
        page: 1,
        size: 100
      });

      setStudents(response.items || []);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      setLoading(true);

      // Fetch real subjects assigned to this class
      const classSubjects = await academicService.getClassSubjects(classData.id);

      // Extract subject information from class subjects
      const subjectsList: Subject[] = classSubjects.map(cs => ({
        id: cs.subject_id,
        name: cs.subject_name || 'Unknown Subject',
        code: cs.subject_code || '',
        credits: 0, // Credits not available in ClassSubjectAssignmentResponse
        school_id: classData.school_id,
        teacher_id: undefined,
        teacher: undefined,
        description: '',
        is_core: cs.is_core,
        is_active: true,
        created_at: cs.created_at || '',
        updated_at: cs.updated_at || ''
      }));

      setSubjects(subjectsList);
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      if (!currentTerm) {
        console.warn('No current term found');
        setTimetable([]);
        return;
      }

      const timetableEntries = await academicService.getClassTimetable(classData.id, currentTerm.id);
      setTimetable(timetableEntries);
    } catch (error) {
      console.error('Failed to fetch timetable:', error);
      setTimetable([]);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BuildingOfficeIcon },
    { id: 'students', name: 'Students', icon: AcademicCapIcon },
    { id: 'subjects', name: 'Subjects', icon: BookOpenIcon },
    { id: 'schedule', name: 'Schedule', icon: ClockIcon },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="h-16 w-16 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
            <BuildingOfficeIcon className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {classData.name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {getClassLevelDisplay(classData.level)}{classData.section ? ` - Section ${classData.section}` : ''}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Academic Session: {classData.academic_session}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          {onEdit && canEditClass && (
            <button onClick={onEdit} className="btn btn-primary">
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit Class
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="btn btn-outline">
              Close
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon className="h-5 w-5 mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                Class Information
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Class Name:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {classData.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Class Level:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {getClassLevelDisplay(classData.level)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Section:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {classData.section || 'Not specified'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Academic Session:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {classData.academic_session}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Capacity:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {classData.capacity}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Current Students:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {classData.student_count || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Status:</span>
                  <span className={`text-sm font-medium ${classData.is_active ? 'text-green-600' : 'text-red-600'}`}>
                    {classData.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {classData.description && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Description:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {classData.description}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="card p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                Class Teacher
              </h3>
              {classData.teacher_name ? (
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                    <UserGroupIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {classData.teacher_name}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No teacher assigned
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Students ({classData.student_count || 0}/{classData.capacity})
              </h3>
              {canEditClass && (
                <button className="btn btn-primary btn-sm">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Student
                </button>
              )}
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : students.length > 0 ? (
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead className="table-header">
                      <tr>
                        <th className="table-header-cell">Student</th>
                        <th className="table-header-cell">Student ID</th>
                        <th className="table-header-cell">Email</th>
                        <th className="table-header-cell">Status</th>
                        <th className="table-header-cell">Admission Date</th>
                      </tr>
                    </thead>
                    <tbody className="table-body">
                      {students.map((student) => (
                        <tr
                          key={student.id}
                          className={`${(isClassTeacher || canEditClass) ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : ''}`}
                          onClick={() => handleViewStudent(student)}
                        >
                          <td className="table-cell">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center mr-3">
                                <AcademicCapIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                              </div>
                              {student.first_name} {student.last_name}
                            </div>
                          </td>
                          <td className="table-cell">{student.admission_number}</td>
                          <td className="table-cell">{student.email}</td>
                          <td className="table-cell">
                            <span className={`badge ${
                              student.status === 'active' ? 'badge-success' : 'badge-error'
                            }`}>
                              {student.status}
                            </span>
                          </td>
                          <td className="table-cell">
                            {new Date(student.admission_date).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="card p-6">
                <div className="text-center py-8">
                  <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No students found in this class</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                    Students will appear here once they are assigned to this class
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'subjects' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Subjects ({subjects.length})
              </h3>
              {canEditClass && (
                <button className="btn btn-primary btn-sm">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Assign Subject
                </button>
              )}
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : subjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {subjects.map((subject) => (
                  <div key={subject.id} className="card p-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-lg bg-secondary-100 dark:bg-secondary-900 flex items-center justify-center">
                        <BookOpenIcon className="h-5 w-5 text-secondary-600 dark:text-secondary-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {subject.name}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {subject.code} • {subject.credits} credits
                        </p>
                        {subject.teacher && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Teacher: {subject.teacher.user?.full_name || subject.teacher.first_name + ' ' + subject.teacher.last_name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card p-6">
                <div className="text-center py-8">
                  <BookOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No subjects assigned to this class</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                    Subjects will appear here once they are assigned to this class
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Class Timetable {currentTerm && `- ${currentTerm.name}`}
              </h3>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : timetable.length > 0 ? (
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead className="table-header">
                      <tr>
                        <th className="table-header-cell">Day</th>
                        <th className="table-header-cell">Time</th>
                        <th className="table-header-cell">Subject</th>
                        <th className="table-header-cell">Teacher</th>
                        <th className="table-header-cell">Room</th>
                      </tr>
                    </thead>
                    <tbody className="table-body">
                      {timetable
                        .sort((a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time))
                        .map((entry) => (
                          <tr key={entry.id}>
                            <td className="table-cell">
                              <span className="font-medium">
                                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][entry.day_of_week]}
                              </span>
                            </td>
                            <td className="table-cell">
                              <span className="text-sm">
                                {entry.start_time} - {entry.end_time}
                              </span>
                            </td>
                            <td className="table-cell">
                              <div className="flex items-center">
                                <div className="h-8 w-8 rounded-lg bg-secondary-100 dark:bg-secondary-900 flex items-center justify-center mr-3">
                                  <BookOpenIcon className="h-4 w-4 text-secondary-600 dark:text-secondary-400" />
                                </div>
                                <span className="font-medium">{entry.subject_name}</span>
                              </div>
                            </td>
                            <td className="table-cell">
                              <span className="text-sm">{entry.teacher_name || 'Not assigned'}</span>
                            </td>
                            <td className="table-cell">
                              <span className="text-sm">{entry.room || 'TBA'}</span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="card p-6">
                <div className="text-center py-8">
                  <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    {currentTerm ? 'No timetable entries found for this class' : 'No active term found'}
                  </p>
                  {!currentTerm && (
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                      Please ensure there is an active academic term to view the timetable
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Student Profile Modal */}
      {showStudentProfile && selectedStudent && (
        <DetailedStudentProfile
          student={selectedStudent}
          onClose={() => {
            setShowStudentProfile(false);
            setSelectedStudent(null);
          }}
        />
      )}
    </div>
  );
};

export default ClassDetails;
