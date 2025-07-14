import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import { Subject, Student } from '../../types';
import { academicService } from '../../services/academicService';
import { studentService } from '../../services/studentService';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { BookOpenIcon, AcademicCapIcon, UserGroupIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

interface SubjectWithStudents extends Subject {
  students: Student[];
  studentCount: number;
  loading: boolean;
}

const TeacherSubjectsPage: React.FC = () => {
  const { user } = useAuth();
  const { showError } = useToast();
  const [subjects, setSubjects] = useState<SubjectWithStudents[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role === 'teacher') {
      fetchTeacherSubjects();
    }
  }, [user]);

  const fetchTeacherSubjects = async () => {
    try {
      setLoading(true);

      if (!user?.id) {
        showError('User not found. Please log in again.', 'Error');
        return;
      }

      // Get teacher's assigned subjects
      const teacherSubjectAssignments = await academicService.getTeacherSubjects(user.id);

      // Get all subjects to get full subject details
      const allSubjects = await academicService.getSubjects({ is_active: true });

      // Filter subjects to only include those assigned to the teacher
      const assignedSubjectIds = teacherSubjectAssignments.map(assignment => assignment.subject_id);
      const teacherSubjects = allSubjects.filter(subject => assignedSubjectIds.includes(subject.id));

      // Initialize subjects with empty student arrays
      const subjectsWithStudents: SubjectWithStudents[] = teacherSubjects.map(subject => ({
        ...subject,
        students: [],
        studentCount: 0,
        loading: false
      }));

      setSubjects(subjectsWithStudents);
    } catch (error) {
      console.error('Failed to fetch teacher subjects:', error);
      showError('Failed to load your subjects. Please try again.', 'Error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsForSubject = async (subjectId: string) => {
    try {
      setSubjects(prev => prev.map(subject => 
        subject.id === subjectId 
          ? { ...subject, loading: true }
          : subject
      ));

      const students = await studentService.getStudentsBySubject(subjectId);
      
      setSubjects(prev => prev.map(subject => 
        subject.id === subjectId 
          ? { 
              ...subject, 
              students, 
              studentCount: students.length,
              loading: false 
            }
          : subject
      ));
    } catch (error) {
      console.error('Failed to fetch students for subject:', error);
      showError('Failed to load students for this subject.', 'Error');
      
      setSubjects(prev => prev.map(subject => 
        subject.id === subjectId 
          ? { ...subject, loading: false }
          : subject
      ));
    }
  };

  const handleSubjectClick = (subjectId: string) => {
    if (selectedSubject === subjectId) {
      setSelectedSubject(null);
    } else {
      setSelectedSubject(subjectId);
      const subject = subjects.find(s => s.id === subjectId);
      if (subject && subject.students.length === 0 && !subject.loading) {
        fetchStudentsForSubject(subjectId);
      }
    }
  };

  if (loading) {
    return <LoadingSpinner className="h-64" />;
  }

  if (user?.role !== 'teacher') {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">
          This page is only accessible to teachers.
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
          Current role: {user?.role}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Subjects & Students</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          View your assigned subjects and the students enrolled in each subject
        </p>
      </div>

      {/* Subjects Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BookOpenIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    My Subjects
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {subjects.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AcademicCapIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total Students
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {subjects.reduce((total, subject) => total + subject.studentCount, 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Active Subjects
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {subjects.filter(s => s.is_active).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subjects List */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {subjects.map((subject) => (
            <li key={subject.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <BookOpenIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-primary-600 dark:text-primary-400">
                          {subject.name}
                        </p>
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                          {subject.code}
                        </span>
                        {subject.is_core && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            Core
                          </span>
                        )}
                      </div>
                      {subject.description && (
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {subject.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {subject.studentCount > 0 ? (
                        <span>{subject.studentCount} students</span>
                      ) : (
                        <span>Click to load students</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleSubjectClick(subject.id)}
                      className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                      title={selectedSubject === subject.id ? 'Hide Students' : 'View Students'}
                    >
                      {selectedSubject === subject.id ? (
                        <EyeSlashIcon className="h-4 w-4" />
                      ) : (
                        <EyeIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Students List */}
                {selectedSubject === subject.id && (
                  <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                    {subject.loading ? (
                      <div className="flex justify-center py-4">
                        <LoadingSpinner className="h-8 w-8" />
                      </div>
                    ) : subject.students.length > 0 ? (
                      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600">
                          <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Student
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Admission Number
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Gender
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Age
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {subject.students.map((student) => (
                              <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="flex-shrink-0 h-8 w-8">
                                      <div className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                          {student.first_name?.[0]}{student.last_name?.[0]}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="ml-4">
                                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                                        {student.first_name} {student.last_name}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                  {student.admission_number}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 capitalize">
                                  {student.gender}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                  {student.age ? `${student.age} years` : 'N/A'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                        No students enrolled in this subject yet.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>

        {subjects.length === 0 && (
          <div className="text-center py-12">
            <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No subjects assigned</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              You haven't been assigned to teach any subjects yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherSubjectsPage;
