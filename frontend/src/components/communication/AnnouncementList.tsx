import React, { useState, useEffect } from 'react';
import {
  SpeakerWaveIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { communicationService, Announcement } from '../../services/communicationService';
import { useAuth } from '../../contexts/AuthContext';
import AnnouncementForm from './AnnouncementForm';
import ConfirmationModal from '../ui/ConfirmationModal';

const AnnouncementList: React.FC = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    is_published: undefined as boolean | undefined,
    is_public: undefined as boolean | undefined,
    category: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await communicationService.getAnnouncements({
        ...filters,
        page: currentPage,
        size: 20,
      });
      setAnnouncements(response?.items || []);
      setTotalPages(response?.pages || 1);
    } catch (err) {
      setError('Failed to fetch announcements');
      console.error('Error fetching announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [currentPage, filters]);

  const handleDeleteAnnouncement = (announcementId: string) => {
    setAnnouncementToDelete(announcementId);
    setShowDeleteModal(true);
  };

  const confirmDeleteAnnouncement = async () => {
    if (!announcementToDelete) return;

    try {
      await communicationService.deleteAnnouncement(announcementToDelete);
      fetchAnnouncements();
    } catch (err) {
      console.error('Error deleting announcement:', err);
    } finally {
      setShowDeleteModal(false);
      setAnnouncementToDelete(null);
    }
  };

  const handleEditAnnouncement = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingAnnouncement(null);
    fetchAnnouncements();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20';
      case 'low':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20';
    }
  };

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchAnnouncements}
          className="mt-2 btn btn-primary"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Announcements</h2>
          <p className="text-gray-600 dark:text-gray-400">Manage school announcements and notices</p>
        </div>
        {user?.role === 'ADMIN' && (
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary flex items-center space-x-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span>New Announcement</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={filters.is_published === undefined ? '' : filters.is_published.toString()}
              onChange={(e) => setFilters({
                ...filters,
                is_published: e.target.value === '' ? undefined : e.target.value === 'true'
              })}
              className="input"
            >
              <option value="">All</option>
              <option value="true">Published</option>
              <option value="false">Draft</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Visibility
            </label>
            <select
              value={filters.is_public === undefined ? '' : filters.is_public.toString()}
              onChange={(e) => setFilters({
                ...filters,
                is_public: e.target.value === '' ? undefined : e.target.value === 'true'
              })}
              className="input"
            >
              <option value="">All</option>
              <option value="true">Public</option>
              <option value="false">Internal</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="input"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilters({
                  is_published: undefined,
                  is_public: undefined,
                  category: '',
                });
                setCurrentPage(1);
              }}
              className="btn btn-secondary w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements?.length === 0 ? (
          <div className="card p-8 text-center">
            <SpeakerWaveIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No announcements</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              No announcements found with the current filters.
            </p>
          </div>
        ) : (
          announcements.map((announcement) => (
            <div key={announcement.id} className="card p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {announcement.title}
                    </h3>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(announcement.priority)}`}>
                      {announcement.priority}
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                      {announcement.category}
                    </span>
                    {announcement.is_published ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                        <EyeIcon className="h-3 w-3 mr-1" />
                        Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400">
                        <EyeSlashIcon className="h-3 w-3 mr-1" />
                        Draft
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {announcement.content}
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>By: {announcement.publisher_name}</span>
                    {announcement.published_at && (
                      <span>Published: {new Date(announcement.published_at).toLocaleDateString()}</span>
                    )}
                    {announcement.expires_at && (
                      <span>Expires: {new Date(announcement.expires_at).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                {user?.role === 'ADMIN' && (
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleEditAnnouncement(announcement)}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                      title="Edit Announcement"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAnnouncement(announcement.id)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      title="Delete Announcement"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="btn btn-secondary disabled:opacity-50"
          >
            Previous
          </button>
          <span className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="btn btn-secondary disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Announcement Form Modal */}
      {showForm && (
        <AnnouncementForm
          onClose={handleFormClose}
          editAnnouncement={editingAnnouncement}
        />
      )}

      {/* Delete Announcement Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setAnnouncementToDelete(null);
        }}
        onConfirm={confirmDeleteAnnouncement}
        title="Delete Announcement"
        message="Are you sure you want to delete this announcement?\n\nThis action cannot be undone."
        confirmText="Delete Announcement"
        type="danger"
      />
    </div>
  );
};

export default AnnouncementList;
