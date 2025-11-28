import React, { useState } from 'react';
import {
  EnvelopeIcon,
  SpeakerWaveIcon,
  ChartBarIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import MessageList from '../../components/communication/MessageList';
import MessageCompose from '../../components/communication/MessageCompose';
import AnnouncementList from '../../components/communication/AnnouncementList';
import CommunicationStats from '../../components/communication/CommunicationStats';
import { Message } from '../../services/communicationService';

type TabType = 'messages' | 'announcements' | 'statistics';

const CommunicationPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('messages');
  const [showMessageCompose, setShowMessageCompose] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  const tabs = [
    {
      id: 'messages' as TabType,
      name: 'Messages',
      icon: EnvelopeIcon,
      count: null,
    },
    {
      id: 'announcements' as TabType,
      name: 'Announcements',
      icon: SpeakerWaveIcon,
      count: null,
    },
    ...(user?.role !== 'student' && user?.role !== 'parent' ? [{
      id: 'statistics' as TabType,
      name: 'Statistics',
      icon: ChartBarIcon,
      count: null,
    }] : []),
  ];

  const handleMessageSent = () => {
    setShowMessageCompose(false);
    // Refresh message list if on messages tab
    if (activeTab === 'messages') {
      window.location.reload(); // Simple refresh for now
    }
  };

  const canCreateMessage = user?.role !== 'student' && user?.role !== 'parent';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Communication</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Messages, announcements, and notifications
          </p>
        </div>
        {canCreateMessage && activeTab === 'messages' && (
          <button
            onClick={() => setShowMessageCompose(true)}
            className="btn btn-primary flex items-center space-x-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span>New Message</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm ${isActive
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
              >
                <tab.icon
                  className={`-ml-0.5 mr-2 h-5 w-5 ${isActive
                      ? 'text-blue-500 dark:text-blue-400'
                      : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                    }`}
                />
                {tab.name}
                {tab.count !== null && (
                  <span
                    className={`ml-2 py-0.5 px-2 rounded-full text-xs ${isActive
                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
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
      <div className="mt-6">
        {activeTab === 'messages' && (
          <MessageList
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
