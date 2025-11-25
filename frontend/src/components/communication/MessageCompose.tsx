import React, { useState, useEffect } from 'react';
import { XMarkIcon, PaperAirplaneIcon, ClockIcon } from '@heroicons/react/24/outline';
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
    recipient_type: RecipientType.ALL,
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {editMessage ? 'Edit Message' : 'Compose Message'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={(e) => handleSubmit(e, isDraft)} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Message Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Message Type
            </label>
            <select
              value={formData.message_type}
              onChange={(e) => handleInputChange('message_type', e.target.value as MessageType)}
              className="input"
              required
            >
              <option value={MessageType.EMAIL}>Email</option>
              <option value={MessageType.SMS}>SMS</option>
              <option value={MessageType.NOTIFICATION}>Notification</option>
            </select>
          </div>

          {/* Recipients */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Recipients
            </label>
            <select
              value={formData.recipient_type}
              onChange={(e) => handleInputChange('recipient_type', e.target.value as RecipientType)}
              className="input"
              required
            >
              <option value={RecipientType.ALL}>All Users</option>
              <option value={RecipientType.ROLE}>By Role</option>
              <option value={RecipientType.CLASS}>By Class</option>
            </select>
          </div>

          {/* Role Selection */}
          {formData.recipient_type === RecipientType.ROLE && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Role
              </label>
              <select
                value={formData.recipient_role || ''}
                onChange={(e) => handleInputChange('recipient_role', e.target.value)}
                className="input"
                required
              >
                <option value="">Select Role</option>
                <option value="TEACHER">Teachers</option>
                <option value="STUDENT">Students</option>
                <option value="PARENT">Parents</option>
              </select>
            </div>
          )}

          {/* Class Selection */}
          {formData.recipient_type === RecipientType.CLASS && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Class
              </label>
              <select
                value={formData.recipient_class_id || ''}
                onChange={(e) => handleInputChange('recipient_class_id', e.target.value)}
                className="input"
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

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Subject
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              className="input"
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
              className="input"
              placeholder="Enter your message content..."
              required
            />
          </div>

          {/* Options */}
          <div className="space-y-4">
            {/* Urgent */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_urgent"
                checked={formData.is_urgent}
                onChange={(e) => handleInputChange('is_urgent', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_urgent" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Mark as urgent
              </label>
            </div>

            {/* Schedule */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Schedule for later (optional)
              </label>
              <input
                type="datetime-local"
                value={formData.scheduled_at || ''}
                onChange={(e) => handleInputChange('scheduled_at', e.target.value)}
                className="input"
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-6">
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={(e) => {
                  setIsDraft(true);
                  handleSubmit(e, true);
                }}
                disabled={loading}
                className="btn btn-secondary flex items-center space-x-2"
              >
                <ClockIcon className="h-4 w-4" />
                <span>Save as Draft</span>
              </button>
            </div>
            <div className="flex space-x-3">
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
                  <PaperAirplaneIcon className="h-4 w-4" />
                )}
                <span>{formData.scheduled_at ? 'Schedule' : 'Send'} Message</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MessageCompose;
