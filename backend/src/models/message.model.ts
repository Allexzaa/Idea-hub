import { query } from '../config/database';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: Date;
}

export interface MessageWithSender {
  id: string;
  conversationId: string;
  sender: {
    id: string;
    username: string;
    fullName: string | null;
    avatarUrl: string | null;
  };
  content: string;
  isRead: boolean;
  createdAt: Date;
}

/**
 * Create a new message
 */
export const createMessage = async (
  conversationId: string,
  senderId: string,
  content: string
): Promise<Message> => {
  const result = await query(
    `INSERT INTO messages (conversation_id, sender_id, content)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [conversationId, senderId, content]
  );
  return result.rows[0];
};

/**
 * Get messages for a conversation
 */
export const getMessagesByConversation = async (
  conversationId: string,
  limit: number = 50,
  offset: number = 0
): Promise<MessageWithSender[]> => {
  const result = await query(
    `SELECT
      m.id,
      m.conversation_id,
      m.content,
      m.is_read,
      m.created_at,
      u.id as sender_id,
      u.username as sender_username,
      u.full_name as sender_full_name,
      u.avatar_url as sender_avatar_url
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    WHERE m.conversation_id = $1
    ORDER BY m.created_at DESC
    LIMIT $2 OFFSET $3`,
    [conversationId, limit, offset]
  );

  return result.rows.map((row) => ({
    id: row.id,
    conversationId: row.conversation_id,
    sender: {
      id: row.sender_id,
      username: row.sender_username,
      fullName: row.sender_full_name,
      avatarUrl: row.sender_avatar_url,
    },
    content: row.content,
    isRead: row.is_read,
    createdAt: row.created_at,
  }));
};

/**
 * Mark message as read
 */
export const markMessageAsRead = async (messageId: string): Promise<void> => {
  await query(
    'UPDATE messages SET is_read = TRUE WHERE id = $1',
    [messageId]
  );
};

/**
 * Mark all messages in conversation as read for a user
 */
export const markConversationAsRead = async (
  conversationId: string,
  userId: string
): Promise<void> => {
  await query(
    `UPDATE messages
     SET is_read = TRUE
     WHERE conversation_id = $1
       AND sender_id != $2
       AND is_read = FALSE`,
    [conversationId, userId]
  );
};

/**
 * Get unread message count for user
 */
export const getUnreadMessageCount = async (
  userId: string
): Promise<number> => {
  const result = await query(
    `SELECT COUNT(*) as count
     FROM messages m
     JOIN conversations c ON m.conversation_id = c.id
     WHERE (c.user1_id = $1 OR c.user2_id = $1)
       AND m.sender_id != $1
       AND m.is_read = FALSE`,
    [userId]
  );
  return parseInt(result.rows[0].count);
};

/**
 * Delete message
 */
export const deleteMessage = async (messageId: string): Promise<void> => {
  await query('DELETE FROM messages WHERE id = $1', [messageId]);
};
