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
  PlusIcon,
  ChartPieIcon,
} from '@heroicons/react/24/outline';
import { Student, Parent } from '../../types';
import { studentService } from '../../services/studentService';
import GradeService, { Grade } from '../../services/gradeService';
import DocumentList from '../documents/DocumentList';
import DocumentUpload from '../documents/DocumentUpload';
import StudentAnalytics from './StudentAnalytics';
import AcademicRecords from './AcademicRecords';
import { attendanceService, StudentAttendanceSummary } from '../../services/attendanceService';
import { getSchoolCodeFromUrl } from '../../utils/schoolCode';

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
  const [parents, setParents] = useState<Parent[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<StudentAttendanceSummary | null>(null);
  const [loading, setLoading] = useState(false);
  // We still need grades for analytics tab if it uses them, but let's check.
  // StudentAnalytics takes grades as prop. So we might still need to fetch them for Analytics tab.
  // But for Academic Records tab, we use the component.
  const [grades, setGrades] = useState<Grade[]>([]);

  useEffect(() => {
    // Fetch grades for Analytics tab
    if (activeTab === 'analytics') {
      fetchGrades();
      fetchAttendance();
    }

    if (activeTab === 'family') {
      fetchParents();
    }
  }, [activeTab, student.id]);

  const fetchGrades = async () => {
    try {
      setLoading(true);
      const data = await GradeService.getGrades({ student_id: student.id });
      setGrades(data);
    } catch (error) {
      console.error('Failed to fetch grades:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async () => {
    try {
      const schoolCode = getSchoolCodeFromUrl();
      if (!schoolCode) return;

      const summary = await attendanceService.getStudentAttendanceSummary(schoolCode, student.id);
      setAttendanceSummary(summary);
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
      setAttendanceSummary(null);
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
            profile_completed: true,
            school_id: getSchoolCodeFromUrl(), // Use helper instead of student.user
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
    const totalPoints = grades.reduce((sum, grade) => sum + (grade.score / grade.total_marks) * 4, 0);
    return (totalPoints / grades.length).toFixed(2);
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: UserIcon },
    { id: 'academic', name: 'Academic Records', icon: ChartBarIcon },
    { id: 'analytics', name: 'Analytics', icon: ChartPieIcon },
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
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${student.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
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
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === tab.id
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
          <AcademicRecords
            student={student}
            onUpdate={() => {
              // Refresh grades for analytics if needed
              fetchGrades();
            }}
          />
        )}

        {activeTab === 'analytics' && (
          <StudentAnalytics
            student={student}
            grades={grades}
            attendanceSummary={attendanceSummary}
            loading={loading}
          />
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
          <DocumentsTab student={student} />
        )}
      </div>
    </div>
  );
};

// Documents Tab Component
const DocumentsTab: React.FC<{ student: Student }> = ({ student }) => {
  const [showUpload, setShowUpload] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadComplete = () => {
    setRefreshKey(prev => prev + 1);
    setShowUpload(false);
  };

  const handleDocumentUpdate = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Documents
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage student documents and files
          </p>
        </div>

        <button
          onClick={() => setShowUpload(!showUpload)}
          className="btn btn-primary flex items-center"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Upload Document
        </button>
      </div>

      {showUpload && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
            Upload New Document
          </h4>
          <DocumentUpload
            studentId={student.id}
            onUploadComplete={handleUploadComplete}
            onClose={() => setShowUpload(false)}
          />
        </div>
      )}

      <DocumentList
        key={refreshKey}
        studentId={student.id}
        onDocumentUpdate={handleDocumentUpdate}
        showActions={true}
        isAdmin={true} // You might want to pass this as a prop based on user role
      />
    </div>
  );
};

export default StudentProfile;
