import React, { useState, useEffect } from 'react';
import { XMarkIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline';
import { communicationService, AnnouncementCreate, Announcement } from '../../services/communicationService';

interface AnnouncementFormProps {
  onClose: () => void;
  editAnnouncement?: Announcement | null;
}

const AnnouncementForm: React.FC<AnnouncementFormProps> = ({ onClose, editAnnouncement }) => {
  const [formData, setFormData] = useState<AnnouncementCreate>({
    title: '',
    content: '',
    category: 'General',
    is_published: false,
    is_public: false,
    priority: 'medium',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    'General',
    'Academic',
    'Events',
    'Sports',
    'Holidays',
    'Emergency',
    'Maintenance',
    'Other'
  ];

  useEffect(() => {
    if (editAnnouncement) {
      setFormData({
        title: editAnnouncement.title,
        content: editAnnouncement.content,
        category: editAnnouncement.category,
        is_published: editAnnouncement.is_published,
        is_public: editAnnouncement.is_public,
        priority: editAnnouncement.priority,
        published_at: editAnnouncement.published_at,
        expires_at: editAnnouncement.expires_at,
      });
    }
  }, [editAnnouncement]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (editAnnouncement) {
        await communicationService.updateAnnouncement(editAnnouncement.id, formData);
      } else {
        await communicationService.createAnnouncement(formData);
      }
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save announcement');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof AnnouncementCreate, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <SpeakerWaveIcon className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {editAnnouncement ? 'Edit Announcement' : 'Create Announcement'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="input"
              placeholder="Enter announcement title"
              required
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Content *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              rows={6}
              className="input"
              placeholder="Enter announcement content..."
              required
            />
          </div>

          {/* Category and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="input"
                required
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value as 'low' | 'medium' | 'high')}
                className="input"
                required
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* Publishing Options */}
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_published"
                checked={formData.is_published}
                onChange={(e) => handleInputChange('is_published', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_published" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Publish immediately
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_public"
                checked={formData.is_public}
                onChange={(e) => handleInputChange('is_public', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_public" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Make public (visible to everyone)
              </label>
            </div>
          </div>

          {/* Scheduling */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Publish Date (optional)
              </label>
              <input
                type="datetime-local"
                value={formData.published_at || ''}
                onChange={(e) => handleInputChange('published_at', e.target.value)}
                className="input"
                min={new Date().toISOString().slice(0, 16)}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Leave empty to publish immediately when published
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Expiry Date (optional)
              </label>
              <input
                type="datetime-local"
                value={formData.expires_at || ''}
                onChange={(e) => handleInputChange('expires_at', e.target.value)}
                className="input"
                min={new Date().toISOString().slice(0, 16)}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Leave empty for no expiry
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary flex items-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <SpeakerWaveIcon className="h-4 w-4" />
              )}
              <span>{editAnnouncement ? 'Update' : 'Create'} Announcement</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AnnouncementForm;
