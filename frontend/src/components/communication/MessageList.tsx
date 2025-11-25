import React, { useState, useEffect } from 'react';
import {
  EnvelopeIcon,
  PhoneIcon,
  BellIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  TrashIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import { communicationService, Message, MessageType, MessageStatus } from '../../services/communicationService';
import { useAuth } from '../../contexts/AuthContext';
import ConfirmationModal from '../ui/ConfirmationModal';

interface MessageListProps {
  onMessageSelect?: (message: Message) => void;
  selectedMessageId?: string;
}

const MessageList: React.FC<MessageListProps> = ({ onMessageSelect, selectedMessageId }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    message_type: '' as MessageType | '',
    status: '' as MessageStatus | '',
    is_urgent: undefined as boolean | undefined,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await communicationService.getMessages({
        ...filters,
        message_type: filters.message_type || undefined,
        status: filters.status || undefined,
        page: currentPage,
        size: 20,
      });
      setMessages(response?.items || []);
      setTotalPages(response?.pages || 1);
    } catch (err) {
      setError('Failed to fetch messages');
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [currentPage, filters]);

  const handleSendMessage = async (messageId: string) => {
    try {
      await communicationService.sendMessage(messageId);
      fetchMessages(); // Refresh the list
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      await communicationService.markAsRead(messageId);
      fetchMessages(); // Refresh the list
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    setMessageToDelete(messageId);
    setShowDeleteModal(true);
  };

  const confirmDeleteMessage = async () => {
    if (!messageToDelete) return;

    try {
      await communicationService.deleteMessage(messageToDelete);
      fetchMessages(); // Refresh the list
    } catch (err) {
      console.error('Error deleting message:', err);
    } finally {
      setShowDeleteModal(false);
      setMessageToDelete(null);
    }
  };

  const getMessageTypeIcon = (type: MessageType) => {
    switch (type) {
      case MessageType.EMAIL:
        return <EnvelopeIcon className="h-5 w-5" />;
      case MessageType.SMS:
        return <PhoneIcon className="h-5 w-5" />;
      case MessageType.NOTIFICATION:
        return <BellIcon className="h-5 w-5" />;
      default:
        return <EnvelopeIcon className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: MessageStatus) => {
    switch (status) {
      case MessageStatus.DRAFT:
        return 'text-gray-500 bg-gray-100';
      case MessageStatus.SCHEDULED:
        return 'text-blue-500 bg-blue-100';
      case MessageStatus.SENT:
        return 'text-green-500 bg-green-100';
      case MessageStatus.DELIVERED:
        return 'text-green-600 bg-green-200';
      case MessageStatus.READ:
        return 'text-green-700 bg-green-300';
      case MessageStatus.FAILED:
        return 'text-red-500 bg-red-100';
      default:
        return 'text-gray-500 bg-gray-100';
    }
  };

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
          onClick={fetchMessages}
          className="mt-2 btn btn-primary"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Type
            </label>
            <select
              value={filters.message_type}
              onChange={(e) => setFilters({ ...filters, message_type: e.target.value as MessageType | '' })}
              className="input"
            >
              <option value="">All Types</option>
              <option value={MessageType.EMAIL}>Email</option>
              <option value={MessageType.SMS}>SMS</option>
              <option value={MessageType.NOTIFICATION}>Notification</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value as MessageStatus | '' })}
              className="input"
            >
              <option value="">All Status</option>
              <option value={MessageStatus.DRAFT}>Draft</option>
              <option value={MessageStatus.SCHEDULED}>Scheduled</option>
              <option value={MessageStatus.SENT}>Sent</option>
              <option value={MessageStatus.DELIVERED}>Delivered</option>
              <option value={MessageStatus.READ}>Read</option>
              <option value={MessageStatus.FAILED}>Failed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Priority
            </label>
            <select
              value={filters.is_urgent === undefined ? '' : filters.is_urgent.toString()}
              onChange={(e) => setFilters({
                ...filters,
                is_urgent: e.target.value === '' ? undefined : e.target.value === 'true'
              })}
              className="input"
            >
              <option value="">All</option>
              <option value="true">Urgent</option>
              <option value="false">Normal</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilters({
                  message_type: '',
                  status: '',
                  is_urgent: undefined,
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

      {/* Messages List */}
      <div className="card">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Messages</h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {messages?.length === 0 ? (
            <div className="p-8 text-center">
              <EnvelopeIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No messages</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                No messages found with the current filters.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${selectedMessageId === message.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                onClick={() => onMessageSelect?.(message)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="flex-shrink-0">
                      {getMessageTypeIcon(message.message_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {message.subject}
                        </p>
                        {message.is_urgent && (
                          <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                        )}
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(message.status)}`}>
                          {message.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {message.content}
                      </p>
                      <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                        <span>From: {message.sender_name}</span>
                        <span>Recipients: {message.recipients_count}</span>
                        {message.sent_at && (
                          <span>Sent: {new Date(message.sent_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {message.status === MessageStatus.DRAFT && user?.role !== 'student' && user?.role !== 'parent' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSendMessage(message.id);
                        }}
                        className="p-1 text-blue-600 hover:text-blue-800"
                        title="Send Message"
                      >
                        <PaperAirplaneIcon className="h-4 w-4" />
                      </button>
                    )}
                    {message.status === MessageStatus.SENT && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(message.id);
                        }}
                        className="p-1 text-green-600 hover:text-green-800"
                        title="Mark as Read"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                    )}
                    {user?.role !== 'student' && user?.role !== 'parent' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMessage(message.id);
                        }}
                        className="p-1 text-red-600 hover:text-red-800"
                        title="Delete Message"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
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

      {/* Delete Message Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setMessageToDelete(null);
        }}
        onConfirm={confirmDeleteMessage}
        title="Delete Message"
        message="Are you sure you want to delete this message?\n\nThis action cannot be undone."
        confirmText="Delete Message"
        type="danger"
      />
    </div>
  );
};

export default MessageList;
