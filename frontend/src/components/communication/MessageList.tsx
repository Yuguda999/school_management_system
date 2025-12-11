import React, { useState, useEffect } from 'react';
import {
  EnvelopeIcon,
  PhoneIcon,
  BellIcon,
  TrashIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  InboxIcon
} from '@heroicons/react/24/outline';
import { communicationService, Message, MessageType, MessageStatus } from '../../services/communicationService';
import { useAuth } from '../../contexts/AuthContext';
import ConfirmationModal from '../ui/ConfirmationModal';

interface MessageListProps {
  onMessageSelect?: (message: Message) => void;
  selectedMessageId?: string;
  viewType?: 'inbox' | 'sent';
}

const MessageList: React.FC<MessageListProps> = ({
  onMessageSelect,
  selectedMessageId,
  viewType = 'inbox'
}) => {
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

      const params: any = {
        ...filters,
        message_type: filters.message_type || undefined,
        status: filters.status || undefined,
        page: currentPage,
        size: 20,
      };

      // Filter based on view type
      if (viewType === 'inbox') {
        params.recipient_id = user?.id;
      } else if (viewType === 'sent') {
        params.sender_id = user?.id;
      }

      const response = await communicationService.getMessages(params);
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
    if (user) {
      fetchMessages();
    }
  }, [currentPage, filters, viewType, user]);

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
        return 'text-gray-500 bg-gray-100 dark:text-gray-400 dark:bg-gray-800';
      case MessageStatus.SCHEDULED:
        return 'text-blue-500 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20';
      case MessageStatus.SENT:
        return 'text-green-500 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
      case MessageStatus.DELIVERED:
        return 'text-green-600 bg-green-200 dark:text-green-300 dark:bg-green-900/30';
      case MessageStatus.READ:
        return 'text-green-700 bg-green-300 dark:text-green-200 dark:bg-green-900/40';
      case MessageStatus.FAILED:
        return 'text-red-500 bg-red-100 dark:text-red-400 dark:bg-red-900/20';
      default:
        return 'text-gray-500 bg-gray-100 dark:text-gray-400 dark:bg-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400">{error}</p>
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
    <div className="space-y-4 h-full flex flex-col">
      {/* Filters */}
      <div className="card p-4 bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">
              Type
            </label>
            <select
              value={filters.message_type}
              onChange={(e) => setFilters({ ...filters, message_type: e.target.value as MessageType | '' })}
              className="input w-full text-sm"
            >
              <option value="">All Types</option>
              <option value={MessageType.EMAIL}>Email</option>
              <option value={MessageType.SMS}>SMS</option>
              <option value={MessageType.NOTIFICATION}>Notification</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value as MessageStatus | '' })}
              className="input w-full text-sm"
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
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">
              Priority
            </label>
            <select
              value={filters.is_urgent === undefined ? '' : filters.is_urgent.toString()}
              onChange={(e) => setFilters({
                ...filters,
                is_urgent: e.target.value === '' ? undefined : e.target.value === 'true'
              })}
              className="input w-full text-sm"
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
              className="btn btn-secondary w-full text-sm"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col min-h-0">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {viewType === 'inbox' ? 'Inbox' : 'Sent Messages'}
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {messages.length} messages
          </span>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-200 dark:divide-gray-700">
          {messages?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-full mb-4">
                {viewType === 'inbox' ? (
                  <InboxIcon className="h-12 w-12 text-gray-400" />
                ) : (
                  <PaperAirplaneIcon className="h-12 w-12 text-gray-400" />
                )}
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {viewType === 'inbox' ? 'Your inbox is empty' : 'No sent messages'}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                {viewType === 'inbox'
                  ? "When you receive messages, they will appear here."
                  : "Messages you send will appear here."}
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors border-l-4 ${selectedMessageId === message.id
                  ? 'bg-primary-50 dark:bg-primary-900/10 border-primary-500'
                  : 'border-transparent'
                  }`}
                onClick={() => onMessageSelect?.(message)}
              >
                <div className="flex items-start gap-4">
                  {/* Icon/Avatar */}
                  <div className="flex-shrink-0 mt-1">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${message.is_urgent
                      ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                      {getMessageTypeIcon(message.message_type)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[200px]">
                          {viewType === 'inbox' ? message.sender_name : `To: ${message.recipient_type}`}
                        </span>
                        {message.is_urgent && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                            Urgent
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {message.created_at ? new Date(message.created_at).toLocaleDateString() : ''}
                      </span>
                    </div>

                    <h4 className={`text-sm font-medium mb-1 truncate ${message.status === MessageStatus.READ ? 'text-gray-600 dark:text-gray-300' : 'text-gray-900 dark:text-white'
                      }`}>
                      {message.subject}
                    </h4>

                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
                      {message.content}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(message.status)}`}>
                          {message.status}
                        </span>
                        {viewType === 'sent' && (
                          <span>{message.recipients_count} recipients</span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {message.status === MessageStatus.DRAFT && viewType === 'sent' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSendMessage(message.id);
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
                            title="Send Message"
                          >
                            <PaperAirplaneIcon className="h-4 w-4" />
                          </button>
                        )}
                        {message.status === MessageStatus.SENT && viewType === 'inbox' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(message.id);
                            }}
                            className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full transition-colors"
                            title="Mark as Read"
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                          </button>
                        )}
                        {viewType === 'sent' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMessage(message.id);
                            }}
                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                            title="Delete Message"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-center items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="btn btn-secondary btn-sm disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="btn btn-secondary btn-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

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
