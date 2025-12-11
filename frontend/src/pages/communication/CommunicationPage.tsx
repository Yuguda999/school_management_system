import React, { useState } from 'react';
import {
  EnvelopeIcon,
  SpeakerWaveIcon,
  ChartBarIcon,
  PlusIcon,
  InboxIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import MessageList from '../../components/communication/MessageList';
import MessageCompose from '../../components/communication/MessageCompose';
import AnnouncementList from '../../components/communication/AnnouncementList';
import CommunicationStats from '../../components/communication/CommunicationStats';
import { Message } from '../../services/communicationService';

type TabType = 'inbox' | 'sent' | 'announcements' | 'statistics';

const CommunicationPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('inbox');
  const [showMessageCompose, setShowMessageCompose] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  const canCreateMessage = user?.role !== 'student' && user?.role !== 'parent';
  const canManageAnnouncements = user?.role === 'school_owner' || user?.role === 'school_admin' || user?.role === 'platform_super_admin';

  const tabs = [
    {
      id: 'inbox' as TabType,
      name: 'Inbox',
      icon: InboxIcon,
      count: null,
    },
    ...(canCreateMessage ? [{
      id: 'sent' as TabType,
      name: 'Sent',
      icon: PaperAirplaneIcon,
      count: null,
    }] : []),
    {
      id: 'announcements' as TabType,
      name: 'Announcements',
      icon: SpeakerWaveIcon,
      count: null,
    },
    ...(canCreateMessage ? [{
      id: 'statistics' as TabType,
      name: 'Statistics',
      icon: ChartBarIcon,
      count: null,
    }] : []),
  ];

  const handleMessageSent = () => {
    setShowMessageCompose(false);
    // Switch to sent tab to show the new message
    setActiveTab('sent');
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Communication</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Manage your messages and announcements
          </p>
        </div>
        <div className="flex gap-2">
          {canManageAnnouncements && activeTab === 'announcements' && (
            // Announcement button is handled inside AnnouncementList, but we could move it here if we wanted consistency.
            // For now, let's keep the "New Message" button here.
            null
          )}
          {canCreateMessage && (activeTab === 'inbox' || activeTab === 'sent') && (
            <button
              onClick={() => setShowMessageCompose(true)}
              className="btn btn-primary flex items-center space-x-2 shadow-sm"
            >
              <PlusIcon className="h-5 w-5" />
              <span>New Message</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        <nav className="-mb-px flex space-x-8 min-w-max">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${isActive
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
              >
                <tab.icon
                  className={`-ml-0.5 mr-2 h-5 w-5 ${isActive
                      ? 'text-primary-500 dark:text-primary-400'
                      : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                    }`}
                />
                {tab.name}
                {tab.count !== null && (
                  <span
                    className={`ml-2 py-0.5 px-2 rounded-full text-xs ${isActive
                        ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0">
        {activeTab === 'inbox' && (
          <MessageList
            viewType="inbox"
            onMessageSelect={setSelectedMessage}
            selectedMessageId={selectedMessage?.id}
          />
        )}
        {activeTab === 'sent' && (
          <MessageList
            viewType="sent"
            onMessageSelect={setSelectedMessage}
            selectedMessageId={selectedMessage?.id}
          />
        )}
        {activeTab === 'announcements' && <AnnouncementList />}
        {activeTab === 'statistics' && <CommunicationStats />}
      </div>

      {/* Message Compose Modal */}
      {showMessageCompose && (
        <MessageCompose
          onClose={() => setShowMessageCompose(false)}
          onMessageSent={handleMessageSent}
        />
      )}
    </div>
  );
};

export default CommunicationPage;
