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
import { Class, Student, Subject, ClassLevel } from '../../types';

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
  const [activeTab, setActiveTab] = useState('overview');
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);

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
    }
  }, [activeTab, classData.id]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      const mockStudents: Student[] = [
        {
          id: '1',
          user_id: 'student1',
          student_id: 'STU001',
          class_id: classData.id,
          admission_date: '2024-01-15',
          status: 'active',
          user: {
            id: 'student1',
            email: 'student1@school.com',
            first_name: 'Alice',
            last_name: 'Johnson',
            full_name: 'Alice Johnson',
            role: 'student',
            is_active: true,
            is_verified: true,
            school_id: classData.school_id,
            created_at: '2024-01-15T00:00:00Z',
            updated_at: '2024-01-15T00:00:00Z',
          },
        },
        {
          id: '2',
          user_id: 'student2',
          student_id: 'STU002',
          class_id: classData.id,
          admission_date: '2024-01-20',
          status: 'active',
          user: {
            id: 'student2',
            email: 'student2@school.com',
            first_name: 'Bob',
            last_name: 'Smith',
            full_name: 'Bob Smith',
            role: 'student',
            is_active: true,
            is_verified: true,
            school_id: classData.school_id,
            created_at: '2024-01-20T00:00:00Z',
            updated_at: '2024-01-20T00:00:00Z',
          },
        },
      ];
      setStudents(mockStudents);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      const mockSubjects: Subject[] = [
        {
          id: 'math1',
          name: 'Mathematics',
          code: 'MATH101',
          credits: 3,
          school_id: classData.school_id,
          teacher_id: 'teacher1',
          teacher: classData.teacher,
        },
        {
          id: 'sci1',
          name: 'Science',
          code: 'SCI101',
          credits: 3,
          school_id: classData.school_id,
          teacher_id: 'teacher2',
        },
        {
          id: 'eng1',
          name: 'English',
          code: 'ENG101',
          credits: 3,
          school_id: classData.school_id,
          teacher_id: 'teacher3',
        },
      ];
      setSubjects(mockSubjects);
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
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
          {onEdit && (
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
              <button className="btn btn-primary btn-sm">
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Student
              </button>
            </div>
            
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
                      <tr key={student.id}>
                        <td className="table-cell">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center mr-3">
                              <AcademicCapIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            </div>
                            {student.user.full_name}
                          </div>
                        </td>
                        <td className="table-cell">{student.student_id}</td>
                        <td className="table-cell">{student.user.email}</td>
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
          </div>
        )}

        {activeTab === 'subjects' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Subjects ({subjects.length})
              </h3>
              <button className="btn btn-primary btn-sm">
                <PlusIcon className="h-4 w-4 mr-2" />
                Assign Subject
              </button>
            </div>
            
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
                          Teacher: {subject.teacher.user.full_name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="card p-6">
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              Class schedule feature coming soon
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassDetails;
