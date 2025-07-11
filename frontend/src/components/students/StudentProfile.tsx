import React, { useState, useEffect } from 'react';
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  AcademicCapIcon,
  UserGroupIcon,
  ChartBarIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { Student, Grade, Parent } from '../../types';

interface StudentProfileProps {
  student: Student;
  onEdit?: () => void;
  onClose?: () => void;
}

const StudentProfile: React.FC<StudentProfileProps> = ({
  student,
  onEdit,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [grades, setGrades] = useState<Grade[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'academic') {
      fetchGrades();
    } else if (activeTab === 'family') {
      fetchParents();
    }
  }, [activeTab, student.id]);

  const fetchGrades = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      const mockGrades: Grade[] = [
        {
          id: '1',
          student_id: student.id,
          subject_id: 'math1',
          term_id: 'term1',
          assignment_type: 'Test',
          score: 85,
          max_score: 100,
          date_recorded: '2024-01-15T00:00:00Z',
          comments: 'Good performance',
          student,
          subject: {
            id: 'math1',
            name: 'Mathematics',
            code: 'MATH101',
            credits: 3,
            school_id: student.user.school_id,
          },
          term: {
            id: 'term1',
            name: 'First Term',
            start_date: '2024-01-01',
            end_date: '2024-03-31',
            academic_year: '2024',
            school_id: student.user.school_id,
            is_current: true,
          },
        },
        {
          id: '2',
          student_id: student.id,
          subject_id: 'sci1',
          term_id: 'term1',
          assignment_type: 'Assignment',
          score: 92,
          max_score: 100,
          date_recorded: '2024-01-20T00:00:00Z',
          comments: 'Excellent work',
          student,
          subject: {
            id: 'sci1',
            name: 'Science',
            code: 'SCI101',
            credits: 3,
            school_id: student.user.school_id,
          },
          term: {
            id: 'term1',
            name: 'First Term',
            start_date: '2024-01-01',
            end_date: '2024-03-31',
            academic_year: '2024',
            school_id: student.user.school_id,
            is_current: true,
          },
        },
      ];
      setGrades(mockGrades);
    } catch (error) {
      console.error('Failed to fetch grades:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchParents = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      const mockParents: Parent[] = [
        {
          id: '1',
          user_id: 'parent1',
          phone: '+1234567890',
          address: '123 Main St, City, State',
          occupation: 'Engineer',
          user: {
            id: 'parent1',
            email: 'parent@example.com',
            first_name: 'John',
            last_name: 'Doe',
            full_name: 'John Doe',
            role: 'parent',
            is_active: true,
            is_verified: true,
            school_id: student.user.school_id,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
          children: [student],
        },
      ];
      setParents(mockParents);
    } catch (error) {
      console.error('Failed to fetch parents:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateGPA = () => {
    if (grades.length === 0) return 'N/A';
    const totalPoints = grades.reduce((sum, grade) => sum + (grade.score / grade.max_score) * 4, 0);
    return (totalPoints / grades.length).toFixed(2);
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: UserIcon },
    { id: 'academic', name: 'Academic Records', icon: ChartBarIcon },
    { id: 'family', name: 'Family', icon: UserGroupIcon },
    { id: 'documents', name: 'Documents', icon: DocumentTextIcon },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="h-16 w-16 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
            <UserIcon className="h-8 w-8 text-gray-500 dark:text-gray-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {student.first_name} {student.last_name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Admission Number: {student.admission_number}
            </p>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              student.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
              student.status === 'inactive' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
              'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
            }`}>
              {student.status}
            </span>
          </div>
        </div>
        <div className="flex space-x-2">
          {onEdit && (
            <button onClick={onEdit} className="btn btn-primary">
              Edit Profile
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
                Personal Information
              </h3>
              <div className="space-y-3">
                {student.email && (
                  <div className="flex items-center">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {student.email}
                    </span>
                  </div>
                )}
                {student.phone && (
                  <div className="flex items-center">
                    <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {student.phone}
                    </span>
                  </div>
                )}
                <div className="flex items-center">
                  <CalendarIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    Born: {new Date(student.date_of_birth).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400 mr-3">Gender:</span>
                  <span className="text-sm text-gray-900 dark:text-gray-100 capitalize">
                    {student.gender}
                  </span>
                </div>
                <div className="flex items-center">
                  <CalendarIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    Admitted: {new Date(student.admission_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center">
                  <AcademicCapIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    Class: {student.current_class_name || 'Not assigned'}
                  </span>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                Address Information
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Address:</span>
                  <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                    {student.address_line1}
                    {student.address_line2 && <><br />{student.address_line2}</>}
                    <br />
                    {student.city}, {student.state} {student.postal_code}
                  </p>
                </div>
              </div>
            </div>

            {(student.guardian_name || student.guardian_phone || student.guardian_email) && (
              <div className="card p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                  Guardian Information
                </h3>
                <div className="space-y-3">
                  {student.guardian_name && (
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Name:</span>
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {student.guardian_name}
                        {student.guardian_relationship && ` (${student.guardian_relationship})`}
                      </p>
                    </div>
                  )}
                  {student.guardian_phone && (
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Phone:</span>
                      <p className="text-sm text-gray-900 dark:text-gray-100">{student.guardian_phone}</p>
                    </div>
                  )}
                  {student.guardian_email && (
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Email:</span>
                      <p className="text-sm text-gray-900 dark:text-gray-100">{student.guardian_email}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(student.emergency_contact_name || student.emergency_contact_phone) && (
              <div className="card p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                  Emergency Contact
                </h3>
                <div className="space-y-3">
                  {student.emergency_contact_name && (
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Name:</span>
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {student.emergency_contact_name}
                        {student.emergency_contact_relationship && ` (${student.emergency_contact_relationship})`}
                      </p>
                    </div>
                  )}
                  {student.emergency_contact_phone && (
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Phone:</span>
                      <p className="text-sm text-gray-900 dark:text-gray-100">{student.emergency_contact_phone}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(student.medical_conditions || student.allergies || student.blood_group) && (
              <div className="card p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                  Medical Information
                </h3>
                <div className="space-y-3">
                  {student.blood_group && (
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Blood Group:</span>
                      <p className="text-sm text-gray-900 dark:text-gray-100">{student.blood_group}</p>
                    </div>
                  )}
                  {student.medical_conditions && (
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Medical Conditions:</span>
                      <p className="text-sm text-gray-900 dark:text-gray-100">{student.medical_conditions}</p>
                    </div>
                  )}
                  {student.allergies && (
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Allergies:</span>
                      <p className="text-sm text-gray-900 dark:text-gray-100">{student.allergies}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="card p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                Academic Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Current GPA:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {calculateGPA()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Total Subjects:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {grades.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Academic Year:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    2024
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'academic' && (
          <div className="space-y-6">
            <div className="card">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Recent Grades
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead className="table-header">
                    <tr>
                      <th className="table-header-cell">Subject</th>
                      <th className="table-header-cell">Type</th>
                      <th className="table-header-cell">Score</th>
                      <th className="table-header-cell">Date</th>
                      <th className="table-header-cell">Comments</th>
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {grades.map((grade) => (
                      <tr key={grade.id}>
                        <td className="table-cell">{grade.subject.name}</td>
                        <td className="table-cell">
                          <span className="badge badge-primary">{grade.assignment_type}</span>
                        </td>
                        <td className="table-cell">
                          <span className={`font-medium ${
                            (grade.score / grade.max_score) >= 0.8 ? 'text-green-600 dark:text-green-400' :
                            (grade.score / grade.max_score) >= 0.6 ? 'text-yellow-600 dark:text-yellow-400' :
                            'text-red-600 dark:text-red-400'
                          }`}>
                            {grade.score}/{grade.max_score}
                          </span>
                        </td>
                        <td className="table-cell">
                          {new Date(grade.date_recorded).toLocaleDateString()}
                        </td>
                        <td className="table-cell">{grade.comments || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'family' && (
          <div className="space-y-6">
            <div className="card">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Parent/Guardian Information
                </h3>
              </div>
              <div className="p-6">
                {parents.length > 0 ? (
                  <div className="space-y-4">
                    {parents.map((parent) => (
                      <div key={parent.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-center space-x-4">
                          <div className="h-12 w-12 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                            <UserIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {parent.user.full_name}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {parent.user.email}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {parent.phone}
                            </p>
                            {parent.occupation && (
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Occupation: {parent.occupation}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    No parent information available
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="card p-6">
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              Document management feature coming soon
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentProfile;
