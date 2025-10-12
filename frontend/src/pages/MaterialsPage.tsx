import React, { useState, useEffect } from 'react';
import {
  CloudArrowUpIcon,
  FolderIcon,
  ChartBarIcon,
  DocumentIcon,
  PlusIcon,
  HomeIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import PageHeader from '../components/Layout/PageHeader';
import MaterialList from '../components/materials/MaterialList';
import MaterialUpload from '../components/materials/MaterialUpload';
import MaterialDetails from '../components/materials/MaterialDetails';
import MaterialShare from '../components/materials/MaterialShare';
import FolderManagement from '../components/materials/FolderManagement';
import Modal from '../components/ui/Modal';
import { MaterialListParams, MaterialStats, StorageQuota, TeacherMaterial, MaterialFolder } from '../types';
import { materialService } from '../services/materialService';
import { useToast } from '../hooks/useToast';
import LoadingSpinner from '../components/ui/LoadingSpinner';

type TabType = 'all' | 'upload' | 'folders' | 'stats';

const MaterialsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<TeacherMaterial | null>(null);
  const [filters, setFilters] = useState<MaterialListParams>({});
  const [stats, setStats] = useState<MaterialStats | null>(null);
  const [quota, setQuota] = useState<StorageQuota | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentFolder, setCurrentFolder] = useState<MaterialFolder | null>(null);
  const [folderMaterials, setFolderMaterials] = useState<TeacherMaterial[]>([]);
  const [loadingFolderMaterials, setLoadingFolderMaterials] = useState(false);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (activeTab === 'stats') {
      fetchStats();
    }
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const [statsData, quotaData] = await Promise.all([
        materialService.getMaterialStats(),
        materialService.getStorageQuota(),
      ]);
      setStats(statsData);
      setQuota(quotaData);
    } catch (error: any) {
      console.error('Failed to fetch stats:', error);
      showError('Failed to load statistics');
    } finally {
      setLoadingStats(false);
    }
  };

  const handleUploadComplete = () => {
    setShowUploadModal(false);
    setRefreshKey((prev) => prev + 1);
    showSuccess('Materials uploaded successfully');
  };

  const handleFilterChange = (newFilters: Partial<MaterialListParams>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleMaterialSelect = (material: TeacherMaterial) => {
    setSelectedMaterial(material);
    setShowDetailsModal(true);
  };

  const handleShareClick = (material: TeacherMaterial) => {
    setSelectedMaterial(material);
    setShowShareModal(true);
  };

  const handleFolderSelect = async (folderId: string) => {
    try {
      setLoadingFolderMaterials(true);
      const materials = await materialService.getFolderMaterials(folderId);
      setFolderMaterials(materials);

      // Find the folder details
      const folders = await materialService.getFolders();
      const folder = folders.find(f => f.id === folderId);
      if (folder) {
        setCurrentFolder(folder);
      }
      setActiveTab('all');
    } catch (error: any) {
      console.error('Failed to fetch folder materials:', error);
      showError('Failed to load folder contents');
    } finally {
      setLoadingFolderMaterials(false);
    }
  };

  const handleBackToAllMaterials = () => {
    setCurrentFolder(null);
    setFolderMaterials([]);
  };

  const handleShareComplete = () => {
    setShowShareModal(false);
    setRefreshKey((prev) => prev + 1);
  };

  const tabs = [
    { id: 'all' as TabType, name: 'All Materials', icon: DocumentIcon },
    { id: 'folders' as TabType, name: 'Folders', icon: FolderIcon },
    { id: 'stats' as TabType, name: 'Statistics', icon: ChartBarIcon },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Materials Management"
        description="Upload, organize, and share educational materials with students"
        action={
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <CloudArrowUpIcon className="h-5 w-5 mr-2" />
            Upload Material
          </button>
        }
      />

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
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
                <Icon
                  className={`
                    -ml-0.5 mr-2 h-5 w-5
                    ${
                      activeTab === tab.id
                        ? 'text-primary-500 dark:text-primary-400'
                        : 'text-gray-400 group-hover:text-gray-500'
                    }
                  `}
                />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Breadcrumb Navigation */}
      {currentFolder && activeTab === 'all' && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
          <nav className="flex items-center space-x-2 text-sm">
            <button
              onClick={handleBackToAllMaterials}
              className="flex items-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              <HomeIcon className="w-4 h-4 mr-1" />
              All Materials
            </button>
            <ChevronRightIcon className="w-4 h-4 text-gray-400" />
            <span className="flex items-center text-gray-900 dark:text-white font-medium">
              <FolderIcon
                className="w-4 h-4 mr-1"
                style={{ color: currentFolder.color || '#3B82F6' }}
              />
              {currentFolder.name}
            </span>
            {currentFolder.material_count !== undefined && (
              <span className="ml-2 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                {currentFolder.material_count} items
              </span>
            )}
          </nav>
        </div>
      )}

      {/* Tab Content */}
      <div className="mt-6">
        {/* All Materials Tab */}
        {activeTab === 'all' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Search
                  </label>
                  <input
                    type="text"
                    placeholder="Search materials..."
                    value={filters.search || ''}
                    onChange={(e) => handleFilterChange({ search: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Grade Level
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Grade 10"
                    value={filters.grade_level || ''}
                    onChange={(e) => handleFilterChange({ grade_level: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={filters.is_published === undefined ? 'all' : filters.is_published ? 'published' : 'draft'}
                    onChange={(e) =>
                      handleFilterChange({
                        is_published: e.target.value === 'all' ? undefined : e.target.value === 'published',
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                  >
                    <option value="all">All</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Favorites
                  </label>
                  <select
                    value={filters.is_favorite === undefined ? 'all' : filters.is_favorite ? 'yes' : 'no'}
                    onChange={(e) =>
                      handleFilterChange({
                        is_favorite: e.target.value === 'all' ? undefined : e.target.value === 'yes',
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
                  >
                    <option value="all">All</option>
                    <option value="yes">Favorites Only</option>
                    <option value="no">Non-Favorites</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Materials List */}
            <MaterialList
              key={refreshKey}
              filters={currentFolder ? undefined : filters}
              materials={currentFolder ? folderMaterials : undefined}
              loading={currentFolder ? loadingFolderMaterials : undefined}
              folderId={currentFolder?.id}
              showActions={true}
              onUploadClick={() => setShowUploadModal(true)}
              onMaterialSelect={handleMaterialSelect}
              onMaterialShare={handleShareClick}
              onRefresh={currentFolder ? () => handleFolderSelect(currentFolder.id) : undefined}
            />
          </div>
        )}

        {/* Folders Tab */}
        {activeTab === 'folders' && (
          <FolderManagement
            onFolderSelect={handleFolderSelect}
            onMaterialSelect={handleMaterialSelect}
            onMaterialShare={handleShareClick}
          />
        )}

        {/* Statistics Tab */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            {loadingStats ? (
              <div className="flex justify-center items-center h-64">
                <LoadingSpinner />
              </div>
            ) : (
              <>
                {/* Storage Quota */}
                {quota && (
                  <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                      Storage Quota
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600 dark:text-gray-400">
                            {quota.used_mb.toFixed(2)} MB of {quota.quota_mb} MB used
                          </span>
                          <span className="text-gray-600 dark:text-gray-400">
                            {quota.percentage_used.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              quota.percentage_used > 90
                                ? 'bg-red-600'
                                : quota.percentage_used > 75
                                ? 'bg-yellow-600'
                                : 'bg-primary-600'
                            }`}
                            style={{ width: `${Math.min(quota.percentage_used, 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Remaining</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {quota.remaining_mb.toFixed(2)} MB
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Total Materials</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {quota.material_count}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Overview Stats */}
                {stats && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Materials</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                          {stats.total_materials}
                        </p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Published</p>
                        <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                          {stats.published_materials}
                        </p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Views</p>
                        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                          {stats.total_views}
                        </p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Downloads</p>
                        <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">
                          {stats.total_downloads}
                        </p>
                      </div>
                    </div>

                    {/* Materials by Type */}
                    {stats.materials_by_type && Object.keys(stats.materials_by_type).length > 0 && (
                      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                          Materials by Type
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {Object.entries(stats.materials_by_type).map(([type, count]) => (
                            <div key={type} className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                                {count}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{type}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Popular Materials */}
                    {stats.popular_materials && stats.popular_materials.length > 0 && (
                      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                          Most Popular Materials
                        </h3>
                        <div className="space-y-3">
                          {stats.popular_materials.map((material) => (
                            <div
                              key={material.id}
                              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                              onClick={() => handleMaterialSelect(material)}
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                  {material.title}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {material.view_count} views • {material.download_count} downloads
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recent Uploads */}
                    {stats.recent_uploads && stats.recent_uploads.length > 0 && (
                      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                          Recent Uploads
                        </h3>
                        <div className="space-y-3">
                          {stats.recent_uploads.map((material) => (
                            <div
                              key={material.id}
                              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                              onClick={() => handleMaterialSelect(material)}
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                  {material.title}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(material.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload Materials"
        size="lg"
      >
        <MaterialUpload
          onUploadComplete={handleUploadComplete}
          onClose={() => setShowUploadModal(false)}
          allowBulk={true}
        />
      </Modal>

      {/* Material Details Modal */}
      {selectedMaterial && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          title=""
          size="xl"
        >
          <MaterialDetails
            materialId={selectedMaterial.id}
            onClose={() => setShowDetailsModal(false)}
            onShare={(material) => {
              setShowDetailsModal(false);
              handleShareClick(material);
            }}
          />
        </Modal>
      )}

      {/* Material Share Modal */}
      {selectedMaterial && (
        <Modal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          title=""
          size="lg"
        >
          <MaterialShare
            material={selectedMaterial}
            onClose={() => setShowShareModal(false)}
            onShareComplete={handleShareComplete}
          />
        </Modal>
      )}
    </div>
  );
};

export default MaterialsPage;

