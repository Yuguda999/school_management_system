import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  UserGroupIcon,
  UserIcon,
  GlobeAltIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';
import { TeacherMaterial, MaterialShareCreate, ShareType } from '../../types';
import { materialService } from '../../services/materialService';
import { useToast } from '../../hooks/useToast';
import LoadingSpinner from '../ui/LoadingSpinner';

interface MaterialShareProps {
  material: TeacherMaterial;
  onClose: () => void;
  onShareComplete?: () => void;
}

interface ClassOption {
  id: string;
  name: string;
}

interface StudentOption {
  id: string;
  name: string;
  class_name?: string;
}

const MaterialShare: React.FC<MaterialShareProps> = ({
  material,
  onClose,
  onShareComplete,
}) => {
  const [shareType, setShareType] = useState<ShareType>('CLASS');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [canDownload, setCanDownload] = useState(true);
  const [canView, setCanView] = useState(true);
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoadingData(true);
      // In a real implementation, fetch classes and students from API
      // For now, using mock data
      setClasses([
        { id: '1', name: 'Grade 10 - Section A' },
        { id: '2', name: 'Grade 10 - Section B' },
        { id: '3', name: 'Grade 11 - Section A' },
      ]);
      setStudents([
        { id: '1', name: 'John Doe', class_name: 'Grade 10 - Section A' },
        { id: '2', name: 'Jane Smith', class_name: 'Grade 10 - Section A' },
        { id: '3', name: 'Bob Johnson', class_name: 'Grade 10 - Section B' },
      ]);
    } catch (error: any) {
      console.error('Failed to fetch data:', error);
      showError('Failed to load classes and students');
    } finally {
      setLoadingData(false);
    }
  };

  const handleShare = async () => {
    try {
      setLoading(true);

      const shareData: MaterialShareCreate = {
        share_type: shareType,
        can_download: canDownload,
        can_view: canView,
        expires_at: expiresAt || undefined,
      };

      if (shareType === 'CLASS' && selectedClassId) {
        shareData.class_id = selectedClassId;
      } else if (shareType === 'INDIVIDUAL_STUDENT' && selectedStudentIds.length > 0) {
        shareData.student_id = selectedStudentIds[0]; // For single student
      }

      await materialService.shareMaterial(material.id, shareData);
      showSuccess('Material shared successfully');
      if (onShareComplete) onShareComplete();
      onClose();
    } catch (error: any) {
      console.error('Share failed:', error);
      showError(error.response?.data?.detail || 'Failed to share material');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const isValid = () => {
    if (shareType === 'CLASS') return selectedClassId !== '';
    if (shareType === 'INDIVIDUAL_STUDENT') return selectedStudentIds.length > 0;
    return true;
  };

  if (loadingData) {
    return (
      <div className="flex justify-center items-center h-96">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Share Material
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Share "{material.title}" with students or teachers
        </p>
      </div>

      {/* Share Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Share With
        </label>
        <div className="space-y-2">
          {[
            { value: 'ALL_STUDENTS' as ShareType, label: 'All Students', icon: UserGroupIcon },
            { value: 'CLASS' as ShareType, label: 'Specific Class', icon: AcademicCapIcon },
            { value: 'INDIVIDUAL_STUDENT' as ShareType, label: 'Individual Students', icon: UserIcon },
            { value: 'TEACHER' as ShareType, label: 'Other Teachers', icon: UserGroupIcon },
            { value: 'PUBLIC' as ShareType, label: 'Public (Anyone with link)', icon: GlobeAltIcon },
          ].map((option) => {
            const Icon = option.icon;
            return (
              <label
                key={option.value}
                className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                  shareType === option.value
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-700'
                }`}
              >
                <input
                  type="radio"
                  name="shareType"
                  value={option.value}
                  checked={shareType === option.value}
                  onChange={(e) => setShareType(e.target.value as ShareType)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                />
                <Icon className="ml-3 h-5 w-5 text-gray-400" />
                <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                  {option.label}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Class Selection */}
      {shareType === 'CLASS' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Class
          </label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="">Choose a class...</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Student Selection */}
      {shareType === 'INDIVIDUAL_STUDENT' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Students
          </label>
          <div className="max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md">
            {students.map((student) => (
              <label
                key={student.id}
                className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedStudentIds.includes(student.id)}
                  onChange={() => handleStudentToggle(student.id)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {student.name}
                  </p>
                  {student.class_name && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {student.class_name}
                    </p>
                  )}
                </div>
              </label>
            ))}
          </div>
          {selectedStudentIds.length > 0 && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {selectedStudentIds.length} student(s) selected
            </p>
          )}
        </div>
      )}

      {/* Permissions */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Permissions
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={canView}
              onChange={(e) => setCanView(e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <span className="ml-3 text-sm text-gray-900 dark:text-gray-100">
              Can view material
            </span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={canDownload}
              onChange={(e) => setCanDownload(e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <span className="ml-3 text-sm text-gray-900 dark:text-gray-100">
              Can download material
            </span>
          </label>
        </div>
      </div>

      {/* Expiration Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Expiration Date (Optional)
        </label>
        <input
          type="datetime-local"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Leave empty for no expiration
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t dark:border-gray-700">
        <button
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
        >
          Cancel
        </button>
        <button
          onClick={handleShare}
          disabled={loading || !isValid()}
          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {loading ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Sharing...
            </>
          ) : (
            'Share Material'
          )}
        </button>
      </div>
    </div>
  );
};

export default MaterialShare;

