import React, { useState, useEffect } from 'react';
import { XMarkIcon, PaperAirplaneIcon, ClockIcon, UserGroupIcon, UserIcon } from '@heroicons/react/24/outline';
import { communicationService, MessageCreate, MessageType, RecipientType } from '../../services/communicationService';
import { academicService } from '../../services/academicService';
import { Class } from '../../types';

interface MessageComposeProps {
  onClose: () => void;
  onMessageSent: () => void;
  editMessage?: any;
}

const MessageCompose: React.FC<MessageComposeProps> = ({ onClose, onMessageSent, editMessage }) => {
  const [formData, setFormData] = useState<MessageCreate>({
    subject: '',
    content: '',
    message_type: MessageType.EMAIL,
    recipient_type: RecipientType.ALL_STUDENTS,
    is_urgent: false,
  });
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDraft, setIsDraft] = useState(false);

  useEffect(() => {
    fetchClasses();
    if (editMessage) {
      setFormData({
        subject: editMessage.subject,
        content: editMessage.content,
        message_type: editMessage.message_type,
        recipient_type: editMessage.recipient_type,
        recipient_class_id: editMessage.recipient_class_id,
        recipient_role: editMessage.recipient_role,
        is_urgent: editMessage.is_urgent,
        scheduled_at: editMessage.scheduled_at,
      });
    }
  }, [editMessage]);

  const fetchClasses = async () => {
    try {
      const response = await academicService.getClasses();
      setClasses(response);
    } catch (err) {
      console.error('Error fetching classes:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent, saveAsDraft = false) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (saveAsDraft) {
        // For draft, we don't set scheduled_at
        const draftData = { ...formData };
        delete draftData.scheduled_at;
        await communicationService.createMessage(draftData);
      } else {
        await communicationService.createMessage(formData);
      }
      onMessageSent();
      onClose();
    } catch (err: any) {
      setError(
        Array.isArray(err.response?.data?.detail)
          ? err.response.data.detail.map((e: any) => e.msg).join(', ')
          : err.response?.data?.detail || 'Failed to send message'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof MessageCreate, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {editMessage ? 'Edit Message' : 'New Message'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Send a message to students, teachers, or parents
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={(e) => handleSubmit(e, isDraft)} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
              <div className="flex-shrink-0">
                <XMarkIcon className="h-5 w-5 text-red-500" />
              </div>
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Message Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Message Type
              </label>
              <div className="relative">
                <select
                  value={formData.message_type}
                  onChange={(e) => handleInputChange('message_type', e.target.value as MessageType)}
                  className="input w-full pl-10"
                  required
                >
                  <option value={MessageType.EMAIL}>Email</option>
                  <option value={MessageType.SMS}>SMS</option>
                  <option value={MessageType.NOTIFICATION}>In-App Notification</option>
                </select>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {formData.message_type === MessageType.EMAIL && <PaperAirplaneIcon className="h-5 w-5 text-gray-400" />}
                  {formData.message_type === MessageType.SMS && <PaperAirplaneIcon className="h-5 w-5 text-gray-400 rotate-90" />}
                  {formData.message_type === MessageType.NOTIFICATION && <PaperAirplaneIcon className="h-5 w-5 text-gray-400" />}
                </div>
              </div>
            </div>

            {/* Recipients */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Recipients
              </label>
              <div className="relative">
                <select
                  value={formData.recipient_type}
                  onChange={(e) => handleInputChange('recipient_type', e.target.value as RecipientType)}
                  className="input w-full pl-10"
                  required
                >
                  <option value={RecipientType.ALL_STUDENTS}>All Students</option>
                  <option value={RecipientType.ALL_TEACHERS}>All Teachers</option>
                  <option value={RecipientType.ALL_PARENTS}>All Parents</option>
                  <option value={RecipientType.ROLE}>By Role</option>
                  <option value={RecipientType.CLASS}>By Class</option>
                </select>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserGroupIcon className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Conditional Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {formData.recipient_type === RecipientType.ROLE && (
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Role
                </label>
                <div className="relative">
                  <select
                    value={formData.recipient_role || ''}
                    onChange={(e) => handleInputChange('recipient_role', e.target.value)}
                    className="input w-full pl-10"
                    required
                  >
                    <option value="">Select Role</option>
                    <option value="TEACHER">Teachers</option>
                    <option value="STUDENT">Students</option>
                    <option value="PARENT">Parents</option>
                  </select>
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
            )}

            {formData.recipient_type === RecipientType.CLASS && (
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Class
                </label>
                <select
                  value={formData.recipient_class_id || ''}
                  onChange={(e) => handleInputChange('recipient_class_id', e.target.value)}
                  className="input w-full"
                  required
                >
                  <option value="">Select Class</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} - {cls.section}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Subject
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              className="input w-full"
              placeholder="Enter message subject"
              required
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Message Content
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              rows={6}
              className="input w-full resize-none"
              placeholder="Write your message here..."
              required
            />
          </div>

          {/* Options */}
          <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg space-y-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Additional Options</h3>

            <div className="flex flex-col sm:flex-row gap-6">
              {/* Urgent */}
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_urgent}
                  onChange={(e) => handleInputChange('is_urgent', e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded transition-colors"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Mark as Urgent</span>
              </label>

              {/* Schedule */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <ClockIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Schedule for later</span>
                </div>
                <input
                  type="datetime-local"
                  value={formData.scheduled_at || ''}
                  onChange={(e) => handleInputChange('scheduled_at', e.target.value)}
                  className="input w-full text-sm py-1.5"
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
          <button
            type="button"
            onClick={(e) => {
              setIsDraft(true);
              handleSubmit(e, true);
            }}
            disabled={loading}
            className="btn btn-secondary flex items-center gap-2"
          >
            <ClockIcon className="h-4 w-4" />
            <span>Save Draft</span>
          </button>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={(e) => handleSubmit(e, false)}
              disabled={loading}
              className="btn btn-primary flex items-center gap-2 px-6"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <PaperAirplaneIcon className="h-4 w-4" />
              )}
              <span>{formData.scheduled_at ? 'Schedule' : 'Send Message'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageCompose;
