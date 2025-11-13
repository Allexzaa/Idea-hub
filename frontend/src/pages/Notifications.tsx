import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  Notification,
} from '../services/notification.service';
import { useAuthStore } from '../store/authStore';
import { getSocket } from '../utils/socket';

export default function Notifications() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    loadNotifications();

    // Listen for real-time notifications
    const socket = getSocket();
    if (socket) {
      socket.on('notification', () => {
        loadNotifications();
      });

      return () => {
        socket.off('notification');
      };
    }
  }, [isAuthenticated]);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const data = await getNotifications(50);
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
      setNotifications(notifications.map(n =>
        n.id === notificationId ? { ...n, isRead: true } : n
      ));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setIsMarkingAllRead(true);
      await markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
      setNotifications(notifications.filter(n => n.id !== notificationId));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const getNotificationLink = (notification: Notification): string => {
    if (notification.type === 'message') return '/messages';
    if (notification.ideaId) return `/ideas/${notification.ideaId}`;
    return '#';
  };

  const getNotificationIcon = (type: string): string => {
    switch (type) {
      case 'spark': return '✨';
      case 'nurture': return '🌱';
      case 'comment': return '💬';
      case 'message': return '📩';
      case 'helpful_comment': return '⭐';
      default: return '🔔';
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-2">
            {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={isMarkingAllRead}
            className="btn-ghost disabled:opacity-50"
          >
            {isMarkingAllRead ? 'Marking...' : 'Mark all as read'}
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">🔔</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No notifications yet
          </h2>
          <p className="text-gray-600 mb-6">
            When others interact with your ideas, you'll see notifications here
          </p>
          <Link to="/ideas" className="btn-primary inline-block">
            Browse Ideas
          </Link>
        </div>
      ) : (
        <div className="card divide-y divide-gray-200">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 flex items-start space-x-4 ${
                !notification.isRead ? 'bg-blue-50' : ''
              }`}
            >
              <Link
                to={getNotificationLink(notification)}
                onClick={() => {
                  if (!notification.isRead) {
                    handleMarkAsRead(notification.id);
                  }
                }}
                className="flex-1 flex items-start space-x-4 hover:opacity-75"
              >
                <span className="text-3xl flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatTimeAgo(notification.createdAt)}
                  </p>
                </div>
                {!notification.isRead && (
                  <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1"></div>
                )}
              </Link>

              <button
                onClick={() => handleDelete(notification.id)}
                className="text-gray-400 hover:text-red-600 p-1"
                title="Delete notification"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
