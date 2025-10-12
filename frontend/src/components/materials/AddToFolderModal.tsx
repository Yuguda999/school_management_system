import React, { useState, useEffect } from 'react';
import { XMarkIcon, FolderIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { MaterialFolder } from '../../types';
import { materialService } from '../../services/materialService';
import { useToast } from '../../hooks/useToast';
import LoadingSpinner from '../ui/LoadingSpinner';

interface AddToFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  materialId: string;
  materialTitle: string;
  currentFolderId?: string | null;
}

const AddToFolderModal: React.FC<AddToFolderModalProps> = ({
  isOpen,
  onClose,
  materialId,
  materialTitle,
  currentFolderId,
}) => {
  const [folders, setFolders] = useState<MaterialFolder[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(currentFolderId || null);
  const [submitting, setSubmitting] = useState(false);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchFolders();
    }
  }, [isOpen]);

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

  const handleAddToFolder = async () => {
    if (!selectedFolderId) {
      showError('Please select a folder');
      return;
    }

    try {
      setSubmitting(true);
      await materialService.addMaterialToFolder(selectedFolderId, materialId);
      showSuccess('Material added to folder successfully');
      onClose();
    } catch (error: any) {
      console.error('Failed to add material to folder:', error);
      showError(error.response?.data?.detail || 'Failed to add material to folder');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveFromFolder = async () => {
    if (!currentFolderId) return;

    try {
      setSubmitting(true);
      await materialService.removeMaterialFromFolder(currentFolderId, materialId);
      showSuccess('Material removed from folder successfully');
      onClose();
    } catch (error: any) {
      console.error('Failed to remove material from folder:', error);
      showError(error.response?.data?.detail || 'Failed to remove material from folder');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredFolders = folders.filter((folder) =>
    folder.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Add to Folder
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {materialTitle}
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {/* Search */}
          <div className="relative mb-4">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search folders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Folder List */}
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : filteredFolders.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {searchTerm ? 'No folders found' : 'No folders available'}
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-2">
              {filteredFolders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => setSelectedFolderId(folder.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all ${
                    selectedFolderId === folder.id
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <FolderIcon
                    className="w-5 h-5"
                    style={{ color: folder.color || '#3B82F6' }}
                  />
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {folder.name}
                    </div>
                    {folder.description && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {folder.description}
                      </div>
                    )}
                  </div>
                  {folder.material_count !== undefined && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {folder.material_count} items
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 flex justify-between gap-3">
          <div>
            {currentFolderId && (
              <button
                onClick={handleRemoveFromFolder}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
              >
                Remove from Current Folder
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAddToFolder}
              disabled={!selectedFolderId || submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Adding...' : 'Add to Folder'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddToFolderModal;

