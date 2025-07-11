import React, { useState, useEffect } from 'react';
import { 
  Subject, 
  TeacherSubjectAssignment, 
  ClassSubjectAssignment 
} from '../../types';
import { academicService } from '../../services/academicService';
import { useToast } from '../../hooks/useToast';
import LoadingSpinner from '../ui/LoadingSpinner';
import { 
  AcademicCapIcon, 
  UserGroupIcon,
  BookOpenIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

interface SubjectOverviewProps {
  subjectId: string;
}

const SubjectOverview: React.FC<SubjectOverviewProps> = ({ subjectId }) => {
  const [subject, setSubject] = useState<Subject | null>(null);
  const [teachers, setTeachers] = useState<TeacherSubjectAssignment[]>([]);
  const [classes, setClasses] = useState<ClassSubjectAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    loadData();
  }, [subjectId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [subjectData, teachersData, classesData] = await Promise.all([
        academicService.getSubject(subjectId),
        academicService.getSubjectTeachers(subjectId),
        academicService.getSubjectClasses(subjectId)
      ]);
      
      setSubject(subjectData);
      setTeachers(teachersData);
      setClasses(classesData);
    } catch (error) {
      console.error('Error loading subject data:', error);
      showToast('Failed to load subject information', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Subject not found</p>
      </div>
    );
  }

  const headOfSubject = teachers.find(t => t.is_head_of_subject);

  return (
    <div className="space-y-6">
      {/* Subject Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <BookOpenIcon className="h-10 w-10 text-blue-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{subject.name}</h1>
            <p className="text-sm text-gray-600">Code: {subject.code}</p>
            {subject.description && (
              <p className="text-sm text-gray-700 mt-2">{subject.description}</p>
            )}
          </div>
          <div className="flex-shrink-0">
            <div className="flex flex-col space-y-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                subject.is_core 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {subject.is_core ? 'Core Subject' : 'Elective'}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {subject.credit_units} {subject.credit_units === 1 ? 'Unit' : 'Units'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Teachers Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <AcademicCapIcon className="h-6 w-6 text-gray-600" />
            <h2 className="text-lg font-medium text-gray-900">Teachers</h2>
            <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {teachers.length}
            </span>
          </div>

          {teachers.length === 0 ? (
            <div className="text-center py-8">
              <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No teachers assigned</h3>
              <p className="mt-1 text-sm text-gray-500">
                No teachers have been assigned to this subject yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {headOfSubject && (
                <div className="border-l-4 border-blue-500 bg-blue-50 p-3 rounded">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        Head of Subject
                      </p>
                      <p className="text-sm text-blue-700">
                        {headOfSubject.teacher_name}
                      </p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Head
                    </span>
                  </div>
                </div>
              )}

              {teachers.filter(t => !t.is_head_of_subject).map((teacher) => (
                <div
                  key={teacher.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {teacher.teacher_name}
                    </p>
                  </div>
                  <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Classes Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <UserGroupIcon className="h-6 w-6 text-gray-600" />
            <h2 className="text-lg font-medium text-gray-900">Classes</h2>
            <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {classes.length}
            </span>
          </div>

          {classes.length === 0 ? (
            <div className="text-center py-8">
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No classes assigned</h3>
              <p className="mt-1 text-sm text-gray-500">
                This subject is not offered by any classes yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {classes.map((classAssignment) => (
                <div
                  key={classAssignment.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {classAssignment.class_name}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      classAssignment.is_core 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {classAssignment.is_core ? 'Core' : 'Elective'}
                    </span>
                    <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{teachers.length}</div>
            <div className="text-sm text-gray-600">Teachers Assigned</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{classes.length}</div>
            <div className="text-sm text-gray-600">Classes Offering</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {classes.filter(c => c.is_core).length}
            </div>
            <div className="text-sm text-gray-600">Core Assignments</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubjectOverview;
