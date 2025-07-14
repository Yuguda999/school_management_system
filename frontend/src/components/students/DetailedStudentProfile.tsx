import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  HeartIcon,
  ExclamationTriangleIcon,
  AcademicCapIcon,
  CalendarIcon,
  IdentificationIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { Student } from '../../types';
import { studentService } from '../../services/studentService';

interface DetailedStudentProfileProps {
  student: Student;
  onClose: () => void;
}

const DetailedStudentProfile: React.FC<DetailedStudentProfileProps> = ({
  student: initialStudent,
  onClose
}) => {
  const [student, setStudent] = useState<Student>(initialStudent);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');

  useEffect(() => {
    // Fetch complete student details
    const fetchStudentDetails = async () => {
      try {
        setLoading(true);
        const detailedStudent = await studentService.getStudentById(initialStudent.id);
        setStudent(detailedStudent);
      } catch (error) {
        console.error('Failed to fetch student details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentDetails();
  }, [initialStudent.id]);

  const tabs = [
    { id: 'personal', name: 'Personal Info', icon: UserIcon },
    { id: 'contact', name: 'Contact & Address', icon: MapPinIcon },
    { id: 'family', name: 'Family & Guardian', icon: UserGroupIcon },
    { id: 'medical', name: 'Medical Info', icon: HeartIcon },
    { id: 'academic', name: 'Academic Info', icon: AcademicCapIcon },
  ];

  const calculateAge = (dateOfBirth: string): number => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
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
                'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {student.status}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <XMarkIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
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
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <>
              {activeTab === 'personal' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        Basic Information
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Full Name:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {student.first_name} {student.middle_name ? `${student.middle_name} ` : ''}{student.last_name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Date of Birth:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : 'Not provided'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Age:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {student.date_of_birth ? calculateAge(student.date_of_birth) : 'N/A'} years
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Gender:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {student.gender || 'Not specified'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Blood Group:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {student.blood_group || 'Not provided'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        Academic Details
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Admission Date:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {new Date(student.admission_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Current Class:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {student.current_class_name || 'Not assigned'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Status:</span>
                          <span className={`text-sm font-medium ${
                            student.status === 'active' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {student.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {student.notes && (
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        Additional Notes
                      </h3>
                      <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                        {student.notes}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'contact' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        Contact Information
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
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        Address Information
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-start">
                          <MapPinIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                          <div className="text-sm text-gray-900 dark:text-gray-100">
                            {student.address_line1}
                            {student.address_line2 && <><br />{student.address_line2}</>}
                            <br />
                            {student.city}, {student.state} {student.postal_code}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'family' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        Guardian Information
                      </h3>
                      <div className="space-y-3">
                        {student.guardian_name && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Guardian Name:</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {student.guardian_name}
                            </span>
                          </div>
                        )}
                        {student.guardian_phone && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Guardian Phone:</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {student.guardian_phone}
                            </span>
                          </div>
                        )}
                        {student.guardian_email && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Guardian Email:</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {student.guardian_email}
                            </span>
                          </div>
                        )}
                        {student.guardian_relationship && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Relationship:</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {student.guardian_relationship}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        Emergency Contact
                      </h3>
                      <div className="space-y-3">
                        {student.emergency_contact_name && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Contact Name:</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {student.emergency_contact_name}
                            </span>
                          </div>
                        )}
                        {student.emergency_contact_phone && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Contact Phone:</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {student.emergency_contact_phone}
                            </span>
                          </div>
                        )}
                        {student.emergency_contact_relationship && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Relationship:</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {student.emergency_contact_relationship}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'medical' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        Medical Information
                      </h3>
                      <div className="space-y-4">
                        {student.medical_conditions && (
                          <div className="space-y-2">
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Medical Conditions:</span>
                            <p className="text-sm text-gray-900 dark:text-gray-100 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                              <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-400 inline mr-2" />
                              {student.medical_conditions}
                            </p>
                          </div>
                        )}
                        {student.allergies && (
                          <div className="space-y-2">
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Allergies:</span>
                            <p className="text-sm text-gray-900 dark:text-gray-100 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                              <ExclamationTriangleIcon className="h-4 w-4 text-red-600 dark:text-red-400 inline mr-2" />
                              {student.allergies}
                            </p>
                          </div>
                        )}
                        {!student.medical_conditions && !student.allergies && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                            No medical conditions or allergies recorded.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'academic' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        Academic Record
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Admission Number:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {student.admission_number}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Admission Date:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {new Date(student.admission_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Current Class:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {student.current_class_name || 'Not assigned'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Academic Status:</span>
                          <span className={`text-sm font-medium ${
                            student.status === 'active' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {student.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        Additional Information
                      </h3>
                      <div className="space-y-3">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Academic performance and grade information can be viewed in the Grades section.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailedStudentProfile;
