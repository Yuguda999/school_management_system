import React, { useState, useEffect } from 'react';
import { XMarkIcon, SpeakerWaveIcon, CalendarIcon, TagIcon, FlagIcon } from '@heroicons/react/24/outline';
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
    is_urgent: false,
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
        is_urgent: editAnnouncement.is_urgent,
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <SpeakerWaveIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editAnnouncement ? 'Edit Announcement' : 'New Announcement'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Create a new announcement for the school
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
              <div className="flex-shrink-0">
                <XMarkIcon className="h-5 w-5 text-red-500" />
              </div>
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="input w-full font-medium"
              placeholder="Enter announcement title"
              required
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Content
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              rows={6}
              className="input w-full resize-none"
              placeholder="Write your announcement content..."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <div className="relative">
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="input w-full pl-10"
                  required
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <TagIcon className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Urgent Flag */}
            <div className="flex items-end pb-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_urgent}
                  onChange={(e) => handleInputChange('is_urgent', e.target.checked)}
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded transition-colors"
                />
                <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <FlagIcon className="h-4 w-4 text-red-500" />
                  Mark as Urgent
                </span>
              </label>
            </div>
          </div>

          {/* Settings Section */}
          <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg space-y-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Publishing Settings</h3>

            <div className="flex flex-col sm:flex-row gap-6">
              <div className="space-y-3">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_published}
                    onChange={(e) => handleInputChange('is_published', e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded transition-colors"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Publish Immediately</span>
                </label>

                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_public}
                    onChange={(e) => handleInputChange('is_public', e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded transition-colors"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Make Public (Visible to everyone)</span>
                </label>
              </div>

              <div className="flex-1 grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Publish Date (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type="datetime-local"
                      value={formData.published_at || ''}
                      onChange={(e) => handleInputChange('published_at', e.target.value)}
                      className="input w-full text-sm py-1.5 pl-9"
                      min={new Date().toISOString().slice(0, 16)}
                    />
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                      <CalendarIcon className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Expiry Date (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type="datetime-local"
                      value={formData.expires_at || ''}
                      onChange={(e) => handleInputChange('expires_at', e.target.value)}
                      className="input w-full text-sm py-1.5 pl-9"
                      min={new Date().toISOString().slice(0, 16)}
                    />
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                      <CalendarIcon className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-outline"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn btn-primary flex items-center gap-2 px-6"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <SpeakerWaveIcon className="h-4 w-4" />
            )}
            <span>{editAnnouncement ? 'Update Announcement' : 'Create Announcement'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementForm;
