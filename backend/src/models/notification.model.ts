import { query } from '../config/database';

export type NotificationType =
  | 'spark'
  | 'nurture'
  | 'comment'
  | 'message'
  | 'collaboration_invite'
  | 'helpful_comment';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  actor_id: string | null;
  idea_id: string | null;
  comment_id: string | null;
  message: string;
  is_read: boolean;
  created_at: Date;
}

export interface NotificationWithActor {
  id: string;
  userId: string;
  type: NotificationType;
  actor: {
    id: string;
    username: string;
    fullName: string | null;
    avatarUrl: string | null;
  } | null;
  ideaId: string | null;
  ideaTitle?: string | null;
  commentId: string | null;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

/**
 * Create a notification
 */
export const createNotification = async (data: {
  userId: string;
  type: NotificationType;
  actorId?: string;
  ideaId?: string;
  commentId?: string;
  message: string;
}): Promise<Notification> => {
  const result = await query(
    `INSERT INTO notifications (user_id, type, actor_id, idea_id, comment_id, message)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      data.userId,
      data.type,
      data.actorId || null,
      data.ideaId || null,
      data.commentId || null,
      data.message,
    ]
  );
  return result.rows[0];
};

/**
 * Get notifications for a user
 */
export const getUserNotifications = async (
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<NotificationWithActor[]> => {
  const result = await query(
    `SELECT
      n.id,
      n.user_id,
      n.type,
      n.idea_id,
      n.comment_id,
      n.message,
      n.is_read,
      n.created_at,
      u.id as actor_id,
      u.username as actor_username,
      u.full_name as actor_full_name,
      u.avatar_url as actor_avatar_url,
      i.title as idea_title
    FROM notifications n
    LEFT JOIN users u ON n.actor_id = u.id
    LEFT JOIN ideas i ON n.idea_id = i.id
    WHERE n.user_id = $1
    ORDER BY n.created_at DESC
    LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  return result.rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    type: row.type,
    actor: row.actor_id
      ? {
          id: row.actor_id,
          username: row.actor_username,
          fullName: row.actor_full_name,
          avatarUrl: row.actor_avatar_url,
        }
      : null,
    ideaId: row.idea_id,
    ideaTitle: row.idea_title,
    commentId: row.comment_id,
    message: row.message,
    isRead: row.is_read,
    createdAt: row.created_at,
  }));
};

/**
 * Get unread notification count
 */
export const getUnreadNotificationCount = async (
  userId: string
): Promise<number> => {
  const result = await query(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = FALSE',
    [userId]
  );
  return parseInt(result.rows[0].count);
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (
  notificationId: string
): Promise<void> => {
  await query(
    'UPDATE notifications SET is_read = TRUE WHERE id = $1',
    [notificationId]
  );
};

/**
 * Mark all notifications as read for a user
 */
export const markAllNotificationsAsRead = async (
  userId: string
): Promise<void> => {
  await query(
    'UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE',
    [userId]
  );
};

/**
 * Delete notification
 */
export const deleteNotification = async (
  notificationId: string
): Promise<void> => {
  await query('DELETE FROM notifications WHERE id = $1', [notificationId]);
};

/**
 * Delete old read notifications (cleanup - older than 30 days)
 */
export const deleteOldNotifications = async (
  userId: string,
  daysOld: number = 30
): Promise<void> => {
  await query(
    `DELETE FROM notifications
     WHERE user_id = $1
       AND is_read = TRUE
       AND created_at < NOW() - INTERVAL '1 day' * $2`,
    [userId, daysOld]
  );
};
