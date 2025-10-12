import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  ClockIcon,
  UserIcon,
  FolderIcon,
  TagIcon,
  ChartBarIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';
import { TeacherMaterial } from '../../types';
import { materialService } from '../../services/materialService';
import { useToast } from '../../hooks/useToast';
import LoadingSpinner from '../ui/LoadingSpinner';

interface MaterialDetailsProps {
  materialId: string;
  onClose: () => void;
  onEdit?: (material: TeacherMaterial) => void;
  onShare?: (material: TeacherMaterial) => void;
}

const MaterialDetails: React.FC<MaterialDetailsProps> = ({
  materialId,
  onClose,
  onEdit,
  onShare,
}) => {
  const [material, setMaterial] = useState<TeacherMaterial | null>(null);
  const [versions, setVersions] = useState<TeacherMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'versions' | 'analytics'>('details');
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    fetchMaterialDetails();
  }, [materialId]);

  const fetchMaterialDetails = async () => {
    try {
      setLoading(true);
      const [materialData, versionsData] = await Promise.all([
        materialService.getMaterialById(materialId),
        materialService.getMaterialVersions(materialId),
      ]);
      setMaterial(materialData);
      setVersions(versionsData);
    } catch (error: any) {
      console.error('Failed to fetch material details:', error);
      showError('Failed to load material details');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!material) return;
    try {
      const blob = await materialService.downloadMaterial(material.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = material.original_file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showSuccess('Download started');
    } catch (error: any) {
      console.error('Download failed:', error);
      showError('Failed to download material');
    }
  };

  const handlePreview = async () => {
    if (!material) return;
    try {
      const blob = await materialService.previewMaterial(material.id);
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (error: any) {
      console.error('Preview failed:', error);
      showError('Failed to preview material');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <LoadingSpinner />
      </div>
    );
  }

  if (!material) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Material not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between p-6 border-b dark:border-gray-700">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
            {material.title}
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {material.original_file_name} • {materialService.formatFileSize(material.file_size)}
          </p>
        </div>
        <button
          onClick={onClose}
          className="ml-4 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
          {[
            { id: 'details' as const, name: 'Details', icon: FolderIcon },
            { id: 'versions' as const, name: 'Versions', icon: DocumentDuplicateIcon },
            { id: 'analytics' as const, name: 'Analytics', icon: ChartBarIcon },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                  ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }
                `}
              >
                <Icon className="mr-2 h-5 w-5" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="space-y-6">
            {/* Description */}
            {material.description && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Description
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{material.description}</p>
              </div>
            )}

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Subject
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {material.subject?.name || 'N/A'}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Grade Level
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {material.grade_level || 'N/A'}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Topic
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {material.topic || 'N/A'}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Material Type
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {material.material_type}
                </p>
              </div>
            </div>

            {/* Tags */}
            {material.tags && material.tags.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {material.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200"
                    >
                      <TagIcon className="h-3 w-3 mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Info */}
            <div className="border-t dark:border-gray-700 pt-4">
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                <UserIcon className="h-4 w-4 mr-2" />
                Uploaded by {material.uploader?.full_name || 'Unknown'}
              </div>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <ClockIcon className="h-4 w-4 mr-2" />
                {formatDate(material.created_at)}
              </div>
            </div>

            {/* Status */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Status
              </h3>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  material.is_published
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                }`}
              >
                {material.is_published ? 'Published' : 'Draft'}
              </span>
            </div>
          </div>
        )}

        {/* Versions Tab */}
        {activeTab === 'versions' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Version History
            </h3>
            {versions.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No previous versions</p>
            ) : (
              <div className="space-y-3">
                {versions.map((version) => (
                  <div
                    key={version.id}
                    className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Version {version.version_number}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(version.created_at)}
                        </p>
                      </div>
                      <button
                        onClick={() => materialService.downloadMaterial(version.id)}
                        className="text-primary-600 hover:text-primary-700 dark:text-primary-400"
                      >
                        <ArrowDownTrayIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Material Analytics
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Views</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {material.view_count}
                </p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Downloads</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {material.download_count}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex justify-end space-x-3 p-6 border-t dark:border-gray-700">
        {materialService.canPreview(material.material_type) && (
          <button
            onClick={handlePreview}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            <EyeIcon className="h-5 w-5 mr-2" />
            Preview
          </button>
        )}
        <button
          onClick={handleDownload}
          className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
        >
          <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
          Download
        </button>
        {onShare && (
          <button
            onClick={() => onShare(material)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            Share
          </button>
        )}
      </div>
    </div>
  );
};

export default MaterialDetails;

