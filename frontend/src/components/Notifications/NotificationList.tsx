import React from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { Notification, NotificationType } from '../../types';
import { Info, AlertTriangle, XCircle, CheckCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface NotificationListProps {
    onClose?: () => void;
}

const NotificationList: React.FC<NotificationListProps> = ({ onClose }) => {
    const { notifications, loading, markAsRead } = useNotifications();

    if (loading && notifications.length === 0) {
        return (
            <div className="p-8 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p className="text-sm">Loading notifications...</p>
            </div>
        );
    }

    if (notifications.length === 0) {
        return (
            <div className="p-8 text-center text-gray-500">
                <p className="text-sm">No notifications yet</p>
            </div>
        );
    }

    const getIcon = (type: NotificationType) => {
        switch (type) {
            case NotificationType.INFO:
                return <Info className="h-5 w-5 text-blue-500" />;
            case NotificationType.WARNING:
                return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
            case NotificationType.ERROR:
                return <XCircle className="h-5 w-5 text-red-500" />;
            case NotificationType.SUCCESS:
                return <CheckCircle className="h-5 w-5 text-green-500" />;
            default:
                return <Info className="h-5 w-5 text-gray-500" />;
        }
    };

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.is_read) {
            await markAsRead(notification.id);
        }

        if (notification.link) {
            // Navigate to link if present
            // We might need useNavigate here if we want SPA navigation
            // For now, simple window location or we can pass navigate prop
            window.location.href = notification.link;
            if (onClose) onClose();
        }
    };

    return (
        <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {notifications.map((notification) => (
                <li
                    key={notification.id}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${!notification.is_read ? 'bg-blue-50/50 dark:bg-blue-900/20' : 'dark:bg-gray-800'}`}
                    onClick={() => handleNotificationClick(notification)}
                >
                    <div className="p-4 flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                            {getIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${!notification.is_read ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                {notification.title}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                {notification.message}
                            </p>
                            <div className="mt-2 flex items-center text-xs text-gray-400 dark:text-gray-500">
                                <Clock className="h-3 w-3 mr-1" />
                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </div>
                        </div>
                        {!notification.is_read && (
                            <div className="flex-shrink-0 self-center">
                                <span className="inline-block h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400"></span>
                            </div>
                        )}
                    </div>
                </li>
            ))}
        </ul>
    );
};

export default NotificationList;
