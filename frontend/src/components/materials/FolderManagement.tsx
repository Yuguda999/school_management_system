import React, { useState, useEffect } from 'react';
import {
  FolderIcon,
  FolderOpenIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  DocumentIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  EllipsisVerticalIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { MaterialFolder, MaterialFolderCreate, MaterialFolderUpdate, TeacherMaterial } from '../../types';
import { materialService } from '../../services/materialService';
import { useToast } from '../../hooks/useToast';
import { useConfirm } from '../../hooks/useConfirm';
import LoadingSpinner from '../ui/LoadingSpinner';
import Modal from '../ui/Modal';
import ConfirmDialog from '../common/ConfirmDialog';
import ContextMenu, { ContextMenuItem } from '../common/ContextMenu';

interface FolderManagementProps {
  onFolderSelect?: (folderId: string) => void;
  onMaterialSelect?: (material: TeacherMaterial) => void;
  onMaterialShare?: (material: TeacherMaterial) => void;
}

const FolderManagement: React.FC<FolderManagementProps> = ({ onFolderSelect, onMaterialSelect, onMaterialShare }) => {
  const [folders, setFolders] = useState<MaterialFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [folderMaterials, setFolderMaterials] = useState<Map<string, TeacherMaterial[]>>(new Map());
  const [loadingMaterials, setLoadingMaterials] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState<MaterialFolder | null>(null);
  const [newFolderData, setNewFolderData] = useState<MaterialFolderCreate>({
    name: '',
    description: '',
    color: '#3B82F6',
  });
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    material: TeacherMaterial | null;
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    material: null,
  });
  const { showSuccess, showError } = useToast();
  const { confirm, confirmState, handleClose, handleConfirm } = useConfirm();

  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    try {
      setLoading(true);
      const data = await materialService.getFolders();
      setFolders(data);
    } catch (error: any) {
      console.error('Failed to fetch folders:', error);
      showError('Failed to load folders');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderData.name.trim()) {
      showError('Folder name is required');
      return;
    }

    try {
      await materialService.createFolder(newFolderData);
      showSuccess('Folder created successfully');
      setShowCreateModal(false);
      setNewFolderData({ name: '', description: '', color: '#3B82F6' });
      await fetchFolders();
    } catch (error: any) {
      console.error('Failed to create folder:', error);
      showError(error.response?.data?.detail || 'Failed to create folder');
    }
  };

  const handleUpdateFolder = async () => {
    if (!editingFolder) return;

    try {
      const updateData: MaterialFolderUpdate = {
        name: editingFolder.name,
        description: editingFolder.description,
        color: editingFolder.color,
      };
      await materialService.updateFolder(editingFolder.id, updateData);
      showSuccess('Folder updated successfully');
      setShowEditModal(false);
      setEditingFolder(null);
      await fetchFolders();
    } catch (error: any) {
      console.error('Failed to update folder:', error);
      showError(error.response?.data?.detail || 'Failed to update folder');
    }
  };

  const handleDeleteFolder = async (folder: MaterialFolder) => {
    const confirmed = await confirm({
      title: 'Delete Folder',
      message: `Are you sure you want to delete "${folder.name}"?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
    });

    if (!confirmed) {
      return;
    }

    try {
      await materialService.deleteFolder(folder.id);
      showSuccess('Folder deleted successfully');
      await fetchFolders();
    } catch (error: any) {
      console.error('Failed to delete folder:', error);
      showError(error.response?.data?.detail || 'Failed to delete folder');
    }
  };

  const handleMaterialAction = (material: TeacherMaterial, e: React.MouseEvent) => {
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
      material,
    });
  };

  const handleViewMaterial = async (material: TeacherMaterial) => {
    try {
      // Check if material can be previewed (PDF, images, videos, etc.)
      const previewableTypes = [
        'application/pdf',
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'text/plain', 'text/html',
        'video/mp4', 'video/webm',
        'audio/mpeg', 'audio/wav', 'audio/mp3'
      ];

      const canPreview = previewableTypes.some(type => material.mime_type?.includes(type));

      if (canPreview) {
        // Fetch the preview blob with authentication
        const blob = await materialService.previewMaterial(material.id);
        const url = window.URL.createObjectURL(blob);

        // Open in new tab
        window.open(url, '_blank', 'noopener,noreferrer');

        // Clean up the blob URL after a delay
        setTimeout(() => window.URL.revokeObjectURL(url), 10000);
      } else {
        // For non-previewable files (DOCX, etc.), download them instead
        await handleDownloadMaterial(material);
        showSuccess('Download started - file cannot be previewed in browser');
      }
    } catch (error) {
      console.error('Failed to view material:', error);
      showError('Failed to open material');
    }
  };

  const handleDownloadMaterial = async (material: TeacherMaterial) => {
    try {
      const blob = await materialService.downloadMaterial(material.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      // Use original filename if available, otherwise use title with extension from mime type
      link.download = material.original_file_name || material.title;
      link.click();
      window.URL.revokeObjectURL(url);
      showSuccess('Download started');
    } catch (error) {
      console.error('Failed to download material:', error);
      showError('Failed to download material');
    }
  };

  const handleShareMaterial = async (material: TeacherMaterial) => {
    if (onMaterialShare) {
      onMaterialShare(material);
    } else {
      showError('Share functionality not available');
    }
  };

  const handleToggleFavorite = async (material: TeacherMaterial) => {
    try {
      // Use updateMaterial to toggle favorite status
      await materialService.updateMaterial(material.id, {
        is_favorite: !material.is_favorite,
      });
      showSuccess(material.is_favorite ? 'Removed from favorites' : 'Added to favorites');
      // Refresh the folder materials
      const folderId = Array.from(folderMaterials.entries()).find(([_, materials]) =>
        materials.some(m => m.id === material.id)
      )?.[0];
      if (folderId) {
        const materials = await materialService.getFolderMaterials(folderId);
        setFolderMaterials((prev) => new Map(prev).set(folderId, materials));
      }
    } catch (error: any) {
      console.error('Failed to toggle favorite:', error);
      showError('Failed to update favorite status');
    }
  };

  const handleDeleteMaterial = async (material: TeacherMaterial) => {
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
      await materialService.deleteMaterial(material.id);
      showSuccess('Material deleted successfully');
      // Refresh the folder materials
      const folderId = Array.from(folderMaterials.entries()).find(([_, materials]) =>
        materials.some(m => m.id === material.id)
      )?.[0];
      if (folderId) {
        const materials = await materialService.getFolderMaterials(folderId);
        setFolderMaterials((prev) => new Map(prev).set(folderId, materials));
      }
    } catch (error: any) {
      console.error('Failed to delete material:', error);
      showError('Failed to delete material');
    }
  };

  const handleRemoveFromFolder = async (material: TeacherMaterial, folderId: string) => {
    const confirmed = await confirm({
      title: 'Remove from Folder',
      message: `Remove "${material.title}" from this folder?`,
      confirmText: 'Remove',
      cancelText: 'Cancel',
      variant: 'warning',
    });

    if (!confirmed) {
      return;
    }

    try {
      await materialService.removeMaterialFromFolder(folderId, material.id);
      showSuccess('Material removed from folder');
      // Refresh the folder materials
      const materials = await materialService.getFolderMaterials(folderId);
      setFolderMaterials((prev) => new Map(prev).set(folderId, materials));
    } catch (error: any) {
      console.error('Failed to remove from folder:', error);
      showError('Failed to remove material from folder');
    }
  };

  const getMaterialContextMenuItems = (material: TeacherMaterial, folderId: string): ContextMenuItem[] => {
    const items: ContextMenuItem[] = [
      {
        label: 'Open',
        icon: <EyeIcon className="w-5 h-5" />,
        onClick: () => handleViewMaterial(material),
      },
      {
        label: 'Download',
        icon: <ArrowDownTrayIcon className="w-5 h-5" />,
        onClick: () => handleDownloadMaterial(material),
      },
    ];

    if (onMaterialSelect) {
      items.push({
        label: 'View Details',
        icon: <DocumentIcon className="w-5 h-5" />,
        onClick: () => onMaterialSelect(material),
      });
    }

    items.push(
      {
        label: material.is_favorite ? 'Remove from Favorites' : 'Add to Favorites',
        icon: material.is_favorite ? <StarIconSolid className="w-5 h-5" /> : <StarIcon className="w-5 h-5" />,
        onClick: () => handleToggleFavorite(material),
      },
      {
        label: 'Share',
        icon: <ShareIcon className="w-5 h-5" />,
        onClick: () => handleShareMaterial(material),
      },
      { divider: true } as ContextMenuItem,
      {
        label: 'Remove from Folder',
        icon: <FolderIcon className="w-5 h-5" />,
        onClick: () => handleRemoveFromFolder(material, folderId),
        variant: 'default',
      },
      {
        label: 'Delete',
        icon: <TrashIcon className="w-5 h-5" />,
        onClick: () => handleDeleteMaterial(material),
        variant: 'danger',
      }
    );

    return items;
  };

  const toggleFolder = async (folderId: string) => {
    const isExpanded = expandedFolders.has(folderId);

    if (isExpanded) {
      // Collapse folder
      setExpandedFolders((prev) => {
        const newSet = new Set(prev);
        newSet.delete(folderId);
        return newSet;
      });
    } else {
      // Expand folder and fetch materials
      setExpandedFolders((prev) => {
        const newSet = new Set(prev);
        newSet.add(folderId);
        return newSet;
      });

      // Fetch materials if not already loaded
      if (!folderMaterials.has(folderId)) {
        try {
          setLoadingMaterials((prev) => new Set(prev).add(folderId));
          const materials = await materialService.getFolderMaterials(folderId);
          setFolderMaterials((prev) => new Map(prev).set(folderId, materials));
        } catch (error: any) {
          console.error('Failed to fetch folder materials:', error);
          showError('Failed to load folder contents');
        } finally {
          setLoadingMaterials((prev) => {
            const newSet = new Set(prev);
            newSet.delete(folderId);
            return newSet;
          });
        }
      }
    }
  };

  const openEditModal = (folder: MaterialFolder) => {
    setEditingFolder({ ...folder });
    setShowEditModal(true);
  };

  const renderFolder = (folder: MaterialFolder, level: number = 0) => {
    const isExpanded = expandedFolders.has(folder.id);
    const hasChildren = folder.children && folder.children.length > 0;

    return (
      <div key={folder.id} style={{ marginLeft: `${level * 20}px` }}>
        <div
          className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg group cursor-pointer"
          onClick={() => toggleFolder(folder.id)}
        >
          <div className="flex items-center flex-1 min-w-0">
            {/* Chevron for expand/collapse */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(folder.id);
              }}
              className="mr-1"
            >
              {isExpanded ? (
                <ChevronDownIcon className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRightIcon className="h-4 w-4 text-gray-500" />
              )}
            </button>
            {isExpanded ? (
              <FolderOpenIcon
                className="h-5 w-5 mr-2 flex-shrink-0"
                style={{ color: folder.color || '#3B82F6' }}
              />
            ) : (
              <FolderIcon
                className="h-5 w-5 mr-2 flex-shrink-0"
                style={{ color: folder.color || '#3B82F6' }}
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {folder.name}
              </p>
              {folder.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {folder.description}
                </p>
              )}
            </div>
            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
              {folder.material_count || 0} items
            </span>
          </div>
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                openEditModal(folder);
              }}
              className="p-1 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
              title="Edit folder"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteFolder(folder);
              }}
              className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
              title="Delete folder"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Render child folders */}
        {isExpanded && hasChildren && (
          <div className="mt-1">
            {folder.children!.map((child) => renderFolder(child, level + 1))}
          </div>
        )}

        {/* Render materials in this folder */}
        {isExpanded && (
          <div className="mt-1 ml-8">
            {loadingMaterials.has(folder.id) ? (
              <div className="flex items-center justify-center py-4">
                <LoadingSpinner />
              </div>
            ) : (
              <>
                {folderMaterials.get(folder.id)?.map((material) => (
                  <div
                    key={material.id}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg group mb-1 cursor-pointer"
                    onClick={() => handleViewMaterial(material)}
                  >
                    <div className="flex items-center flex-1 min-w-0">
                      {/* File Icon */}
                      <div className="h-8 w-8 mr-2 flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-700 dark:to-gray-600 rounded flex-shrink-0">
                        <span className="text-lg">{materialService.getFileIcon(material.material_type)}</span>
                      </div>

                      {/* Material Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {material.title}
                          </p>
                          {material.is_favorite && (
                            <StarIconSolid className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {material.material_type} • {new Date(material.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Three-dot menu */}
                    <button
                      onClick={(e) => handleMaterialAction(material, e)}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="More options"
                    >
                      <EllipsisVerticalIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))}
                {folderMaterials.get(folder.id)?.length === 0 && (
                  <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                    No materials in this folder
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Folders</h3>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          New Folder
        </button>
      </div>

      {/* Folder Tree */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        {folders.length === 0 ? (
          <div className="text-center py-8">
            <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              No folders yet
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Create a folder to organize your materials
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Your First Folder
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {folders.filter((f) => !f.parent_id).map((folder) => renderFolder(folder))}
          </div>
        )}
      </div>

      {/* Create Folder Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Folder"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Folder Name *
            </label>
            <input
              type="text"
              value={newFolderData.name}
              onChange={(e) => setNewFolderData({ ...newFolderData, name: e.target.value })}
              placeholder="e.g., Grade 10 Materials"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={newFolderData.description || ''}
              onChange={(e) =>
                setNewFolderData({ ...newFolderData, description: e.target.value })
              }
              rows={3}
              placeholder="Optional description"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Color
            </label>
            <input
              type="color"
              value={newFolderData.color || '#3B82F6'}
              onChange={(e) => setNewFolderData({ ...newFolderData, color: e.target.value })}
              className="h-10 w-20 border border-gray-300 dark:border-gray-600 rounded-md"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateFolder}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700"
            >
              Create Folder
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Folder Modal */}
      {editingFolder && (
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Edit Folder"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Folder Name *
              </label>
              <input
                type="text"
                value={editingFolder.name}
                onChange={(e) => setEditingFolder({ ...editingFolder, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={editingFolder.description || ''}
                onChange={(e) =>
                  setEditingFolder({ ...editingFolder, description: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Color
              </label>
              <input
                type="color"
                value={editingFolder.color || '#3B82F6'}
                onChange={(e) => setEditingFolder({ ...editingFolder, color: e.target.value })}
                className="h-10 w-20 border border-gray-300 dark:border-gray-600 rounded-md"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateFolder}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </Modal>
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

      {/* Context Menu for Materials */}
      {contextMenu.material && (
        <ContextMenu
          isOpen={contextMenu.isOpen}
          position={contextMenu.position}
          items={getMaterialContextMenuItems(
            contextMenu.material,
            Array.from(folderMaterials.entries()).find(([_, materials]) =>
              materials.some(m => m.id === contextMenu.material!.id)
            )?.[0] || ''
          )}
          onClose={() => setContextMenu({ isOpen: false, position: { x: 0, y: 0 }, material: null })}
        />
      )}
    </div>
  );
};

export default FolderManagement;

