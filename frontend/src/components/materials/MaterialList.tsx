import React, { useState, useEffect } from 'react';
import {
  DocumentIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  PencilIcon,
  ShareIcon,
  StarIcon,
  FolderIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ClockIcon,
  CheckCircleIcon,
  CloudArrowUpIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { TeacherMaterial, MaterialListParams, MaterialType } from '../../types';
import { materialService } from '../../services/materialService';
import { useToast } from '../../hooks/useToast';
import { useConfirm } from '../../hooks/useConfirm';
import LoadingSpinner from '../ui/LoadingSpinner';
import ConfirmDialog from '../common/ConfirmDialog';
import AddToFolderModal from './AddToFolderModal';
import ContextMenu, { ContextMenuItem } from '../common/ContextMenu';

interface MaterialListProps {
  filters?: MaterialListParams;
  materials?: TeacherMaterial[]; // Optional pre-fetched materials
  loading?: boolean; // Optional loading state for pre-fetched materials
  onMaterialSelect?: (material: TeacherMaterial) => void;
  onMaterialEdit?: (material: TeacherMaterial) => void;
  onMaterialShare?: (material: TeacherMaterial) => void;
  onMaterialDelete?: (material: TeacherMaterial) => void;
  onUploadClick?: () => void;
  onRefresh?: () => void; // Callback to refresh materials
  showActions?: boolean;
  viewMode?: 'grid' | 'list';
  folderId?: string | null; // Current folder ID for context
}

const MaterialList: React.FC<MaterialListProps> = ({
  filters,
  materials: externalMaterials,
  loading: externalLoading,
  onMaterialSelect,
  onMaterialEdit,
  onMaterialShare,
  onMaterialDelete,
  onUploadClick,
  onRefresh,
  showActions = true,
  viewMode: initialViewMode = 'grid',
  folderId,
}) => {
  const [internalMaterials, setInternalMaterials] = useState<TeacherMaterial[]>([]);
  const [internalLoading, setInternalLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(initialViewMode);
  const [showAddToFolderModal, setShowAddToFolderModal] = useState(false);
  const [selectedMaterialForFolder, setSelectedMaterialForFolder] = useState<TeacherMaterial | null>(null);
  const [contextMenu, setContextMenu] = useState<{ isOpen: boolean; position: { x: number; y: number }; material: TeacherMaterial | null }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    material: null,
  });
  const { showSuccess, showError } = useToast();
  const { confirm, confirmState, handleClose, handleConfirm } = useConfirm();

  // Use external materials if provided, otherwise use internal state
  const materials = externalMaterials !== undefined ? externalMaterials : internalMaterials;
  const loading = externalLoading !== undefined ? externalLoading : internalLoading;

  useEffect(() => {
    // Only fetch if external materials are not provided
    if (externalMaterials === undefined) {
      fetchMaterials();
    }
  }, [filters, externalMaterials]);

  const fetchMaterials = async () => {
    try {
      setInternalLoading(true);
      const data = await materialService.getMaterials(filters);
      setInternalMaterials(data);
    } catch (error: any) {
      console.error('Failed to fetch materials:', error);
      showError('Failed to load materials');
    } finally {
      setInternalLoading(false);
    }
  };

  const handleDownload = async (material: TeacherMaterial) => {
    try {
      setActionLoading(material.id);
      const blob = await materialService.downloadMaterial(material.id);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = material.original_file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showSuccess('Material downloaded successfully');
    } catch (error: any) {
      console.error('Download failed:', error);
      showError('Failed to download material');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePreview = async (material: TeacherMaterial) => {
    try {
      setActionLoading(material.id);

      // Fetch the preview blob with authentication
      const blob = await materialService.previewMaterial(material.id);
      const url = window.URL.createObjectURL(blob);

      // Open in new tab
      window.open(url, '_blank', 'noopener,noreferrer');

      // Clean up the blob URL after a delay
      setTimeout(() => window.URL.revokeObjectURL(url), 10000);
    } catch (error: any) {
      console.error('Preview failed:', error);
      showError('Failed to preview material');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleFavorite = async (material: TeacherMaterial) => {
    try {
      setActionLoading(material.id);
      await materialService.updateMaterial(material.id, {
        is_favorite: !material.is_favorite,
      });
      await fetchMaterials();
      showSuccess(material.is_favorite ? 'Removed from favorites' : 'Added to favorites');
    } catch (error: any) {
      console.error('Failed to toggle favorite:', error);
      showError('Failed to update favorite status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddToFolder = (material: TeacherMaterial) => {
    setSelectedMaterialForFolder(material);
    setShowAddToFolderModal(true);
  };

  const handleContextMenu = (e: React.MouseEvent, material: TeacherMaterial) => {
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
      material,
    });
  };

  const getContextMenuItems = (material: TeacherMaterial): ContextMenuItem[] => {
    const items: ContextMenuItem[] = [
      {
        label: 'Open',
        icon: <EyeIcon className="w-5 h-5" />,
        onClick: () => handlePreview(material),
      },
      {
        label: 'Download',
        icon: <ArrowDownTrayIcon className="w-5 h-5" />,
        onClick: () => handleDownload(material),
      },
    ];

    if (onMaterialSelect) {
      items.push({
        label: 'View Details',
        icon: <DocumentIcon className="w-5 h-5" />,
        onClick: () => onMaterialSelect(material),
      });
    }

    items.push({
      label: 'Add to Folder',
      icon: <FolderIcon className="w-5 h-5" />,
      onClick: () => handleAddToFolder(material),
    });

    if (onMaterialShare) {
      items.push({
        label: 'Share',
        icon: <ShareIcon className="w-5 h-5" />,
        onClick: () => onMaterialShare(material),
      });
    }

    items.push({ divider: true } as ContextMenuItem);

    items.push({
      label: 'Delete',
      icon: <TrashIcon className="w-5 h-5" />,
      onClick: () => handleDelete(material),
      variant: 'danger',
    });

    return items;
  };

  const handleDelete = async (material: TeacherMaterial) => {
    const confirmed = await confirm({
      title: 'Delete Material',
      message: `Are you sure you want to delete "${material.title}"?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(material.id);
      await materialService.deleteMaterial(material.id);

      // Refresh materials
      if (onRefresh) {
        onRefresh();
      } else {
        await fetchMaterials();
      }

      showSuccess('Material deleted successfully');
      if (onMaterialDelete) onMaterialDelete(material);
    } catch (error: any) {
      console.error('Delete failed:', error);
      showError('Failed to delete material');
    } finally {
      setActionLoading(null);
    }
  };

  const getFileIcon = (materialType: MaterialType) => {
    return materialService.getFileIcon(materialType);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (materials.length === 0) {
    const hasFilters = filters && Object.keys(filters).some(key => {
      const value = filters[key as keyof MaterialListParams];
      return value !== undefined && value !== null && value !== '';
    });

    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
        {folderId ? (
          <>
            <FolderIcon className="mx-auto h-16 w-16 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
              This folder is empty
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Add materials to this folder by using the "Add to Folder" button on any material.
            </p>
          </>
        ) : hasFilters ? (
          <>
            <DocumentIcon className="mx-auto h-16 w-16 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
              No materials found
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Try adjusting your filters to find what you're looking for.
            </p>
          </>
        ) : (
          <>
            <CloudArrowUpIcon className="mx-auto h-16 w-16 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
              No materials yet
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Get started by uploading your first educational material.
            </p>
            {onUploadClick && (
              <button
                onClick={onUploadClick}
                className="mt-6 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <CloudArrowUpIcon className="h-5 w-5 mr-2" />
                Upload Your First Material
              </button>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* View Mode Toggle */}
      <div className="flex justify-end mb-4">
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`px-4 py-2 text-sm font-medium rounded-l-lg border ${
              viewMode === 'grid'
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Squares2X2Icon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 text-sm font-medium rounded-r-lg border-t border-r border-b ${
              viewMode === 'list'
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <ListBulletIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {materials.map((material) => (
            <div
              key={material.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow duration-200 overflow-hidden cursor-pointer"
              onClick={() => handlePreview(material)}
              onContextMenu={(e) => handleContextMenu(e, material)}
            >
              {/* File Icon/Preview */}
              <div className="h-32 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                <span className="text-6xl">{getFileIcon(material.material_type)}</span>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate flex-1">
                    {material.title}
                  </h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFavorite(material);
                    }}
                    disabled={actionLoading === material.id}
                    className="ml-2 text-yellow-500 hover:text-yellow-600"
                  >
                    {material.is_favorite ? (
                      <StarIconSolid className="h-5 w-5" />
                    ) : (
                      <StarIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>

                <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                  <p className="truncate">{material.file_size_mb?.toFixed(2)} MB</p>
                  {material.subject_name && <p className="truncate">📚 {material.subject_name}</p>}
                  {material.grade_level && <p className="truncate">🎓 {material.grade_level}</p>}
                  <p className="truncate">👁️ {material.view_count} • ⬇️ {material.download_count}</p>
                </div>

                {/* Tags */}
                {material.tags && material.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {material.tags.slice(0, 2).map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200"
                      >
                        {tag}
                      </span>
                    ))}
                    {material.tags.length > 2 && (
                      <span className="text-xs text-gray-500">+{material.tags.length - 2}</span>
                    )}
                  </div>
                )}

                {/* Status Badge */}
                <div className="mt-2">
                  {material.is_published ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      <CheckCircleIcon className="h-3 w-3 mr-1" />
                      Published
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                      <ClockIcon className="h-3 w-3 mr-1" />
                      Draft
                    </span>
                  )}
                </div>

                {/* Actions */}
                {showActions && (
                  <div className="mt-3 flex items-center justify-between border-t dark:border-gray-700 pt-3">
                    <div className="flex space-x-2">
                      {materialService.canPreview(material) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreview(material);
                          }}
                          disabled={actionLoading === material.id}
                          className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                          title="Preview"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(material);
                        }}
                        disabled={actionLoading === material.id}
                        className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                        title="Download"
                      >
                        <ArrowDownTrayIcon className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToFolder(material);
                        }}
                        className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                        title="Add to Folder"
                      >
                        <FolderIcon className="h-5 w-5" />
                      </button>
                      {onMaterialShare && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onMaterialShare(material);
                          }}
                          className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                          title="Share"
                        >
                          <ShareIcon className="h-5 w-5" />
                        </button>
                      )}
                      {onMaterialEdit && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onMaterialEdit(material);
                          }}
                          className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                          title="Edit"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(material);
                        }}
                        disabled={actionLoading === material.id}
                        className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                        title="Delete"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Material
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Uploaded
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {materials.map((material) => (
                <tr
                  key={material.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => handlePreview(material)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-3xl mr-3">{getFileIcon(material.material_type)}</span>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {material.title}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {material.original_file_name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {material.material_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {materialService.formatFileSize(material.file_size)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        material.is_published
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}
                    >
                      {material.is_published ? (
                        <>
                          <CheckCircleIcon className="h-3 w-3 mr-1" />
                          Published
                        </>
                      ) : (
                        <>
                          <ClockIcon className="h-3 w-3 mr-1" />
                          Draft
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(material.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFavorite(material);
                        }}
                        disabled={actionLoading === material.id}
                        className="text-gray-600 dark:text-gray-400 hover:text-yellow-500"
                        title={material.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        {material.is_favorite ? (
                          <StarIconSolid className="h-5 w-5 text-yellow-500" />
                        ) : (
                          <StarIcon className="h-5 w-5" />
                        )}
                      </button>
                      {materialService.canPreview(material.material_type) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreview(material);
                          }}
                          disabled={actionLoading === material.id}
                          className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                          title="Preview"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(material);
                        }}
                        disabled={actionLoading === material.id}
                        className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                        title="Download"
                      >
                        <ArrowDownTrayIcon className="h-5 w-5" />
                      </button>
                      {onMaterialShare && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onMaterialShare(material);
                          }}
                          disabled={actionLoading === material.id}
                          className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                          title="Share"
                        >
                          <ShareIcon className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(material);
                        }}
                        disabled={actionLoading === material.id}
                        className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                        title="Delete"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title={confirmState.title}
        message={confirmState.message || ''}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        variant={confirmState.variant}
      />

      {/* Add to Folder Modal */}
      {selectedMaterialForFolder && (
        <AddToFolderModal
          isOpen={showAddToFolderModal}
          onClose={() => {
            setShowAddToFolderModal(false);
            setSelectedMaterialForFolder(null);
            // Refresh materials if in folder view
            if (onRefresh) {
              onRefresh();
            }
          }}
          materialId={selectedMaterialForFolder.id}
          materialTitle={selectedMaterialForFolder.title}
          currentFolderId={folderId}
        />
      )}

      {/* Context Menu */}
      {contextMenu.material && (
        <ContextMenu
          isOpen={contextMenu.isOpen}
          position={contextMenu.position}
          items={getContextMenuItems(contextMenu.material)}
          onClose={() => setContextMenu({ isOpen: false, position: { x: 0, y: 0 }, material: null })}
        />
      )}
    </div>
  );
};

export default MaterialList;

