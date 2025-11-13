import apiClient from './api';

export type NotificationType =
  | 'spark'
  | 'nurture'
  | 'comment'
  | 'message'
  | 'collaboration_invite'
  | 'helpful_comment';

export interface NotificationActor {
  id: string;
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  actor: NotificationActor | null;
  ideaId: string | null;
  ideaTitle?: string | null;
  commentId: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
}

/**
 * Get notifications for current user
 */
export const getNotifications = async (
  limit?: number,
  offset?: number
): Promise<Notification[]> => {
  const response = await apiClient.get<Notification[]>('/notifications', {
    params: { limit, offset },
  });
  return response.data;
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (): Promise<number> => {
  const response = await apiClient.get<{ count: number }>('/notifications/unread-count');
  return response.data.count;
};

/**
 * Mark notification as read
 */
export const markAsRead = async (notificationId: string): Promise<void> => {
  await apiClient.post(`/notifications/${notificationId}/read`);
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (): Promise<void> => {
  await apiClient.post('/notifications/mark-all-read');
};

/**
 * Delete notification
 */
export const deleteNotification = async (notificationId: string): Promise<void> => {
  await apiClient.delete(`/notifications/${notificationId}`);
};
