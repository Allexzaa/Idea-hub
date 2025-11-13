import { query } from '../config/database';

export interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  last_message_at: Date;
  created_at: Date;
}

export interface ConversationWithUser {
  id: string;
  otherUser: {
    id: string;
    username: string;
    fullName: string | null;
    avatarUrl: string | null;
  };
  lastMessage: {
    content: string;
    senderId: string;
    createdAt: Date;
    isRead: boolean;
  } | null;
  unreadCount: number;
  lastMessageAt: Date;
}

/**
 * Get or create a conversation between two users
 */
export const getOrCreateConversation = async (
  userId1: string,
  userId2: string
): Promise<Conversation> => {
  // Ensure consistent ordering
  const [user1Id, user2Id] = userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];

  // Try to find existing conversation
  const findResult = await query(
    'SELECT * FROM conversations WHERE user1_id = $1 AND user2_id = $2',
    [user1Id, user2Id]
  );

  if (findResult.rows.length > 0) {
    return findResult.rows[0];
  }

  // Create new conversation
  const createResult = await query(
    `INSERT INTO conversations (user1_id, user2_id)
     VALUES ($1, $2)
     RETURNING *`,
    [user1Id, user2Id]
  );

  return createResult.rows[0];
};

/**
 * Get conversation by ID
 */
export const getConversationById = async (
  conversationId: string
): Promise<Conversation | null> => {
  const result = await query(
    'SELECT * FROM conversations WHERE id = $1',
    [conversationId]
  );
  return result.rows[0] || null;
};

/**
 * Check if user is part of conversation
 */
export const isUserInConversation = async (
  conversationId: string,
  userId: string
): Promise<boolean> => {
  const result = await query(
    'SELECT id FROM conversations WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)',
    [conversationId, userId]
  );
  return result.rows.length > 0;
};

/**
 * Get all conversations for a user
 */
export const getUserConversations = async (
  userId: string
): Promise<ConversationWithUser[]> => {
  const result = await query(
    `SELECT
      c.id,
      c.last_message_at,
      CASE
        WHEN c.user1_id = $1 THEN u2.id
        ELSE u1.id
      END as other_user_id,
      CASE
        WHEN c.user1_id = $1 THEN u2.username
        ELSE u1.username
      END as other_username,
      CASE
        WHEN c.user1_id = $1 THEN u2.full_name
        ELSE u1.full_name
      END as other_full_name,
      CASE
        WHEN c.user1_id = $1 THEN u2.avatar_url
        ELSE u1.avatar_url
      END as other_avatar_url,
      m.content as last_message_content,
      m.sender_id as last_message_sender_id,
      m.created_at as last_message_created_at,
      m.is_read as last_message_is_read,
      (
        SELECT COUNT(*)
        FROM messages
        WHERE conversation_id = c.id
          AND sender_id != $1
          AND is_read = FALSE
      ) as unread_count
    FROM conversations c
    JOIN users u1 ON c.user1_id = u1.id
    JOIN users u2 ON c.user2_id = u2.id
    LEFT JOIN LATERAL (
      SELECT content, sender_id, created_at, is_read
      FROM messages
      WHERE conversation_id = c.id
      ORDER BY created_at DESC
      LIMIT 1
    ) m ON true
    WHERE c.user1_id = $1 OR c.user2_id = $1
    ORDER BY c.last_message_at DESC`,
    [userId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    otherUser: {
      id: row.other_user_id,
      username: row.other_username,
      fullName: row.other_full_name,
      avatarUrl: row.other_avatar_url,
    },
    lastMessage: row.last_message_content
      ? {
          content: row.last_message_content,
          senderId: row.last_message_sender_id,
          createdAt: row.last_message_created_at,
          isRead: row.last_message_is_read,
        }
      : null,
    unreadCount: parseInt(row.unread_count),
    lastMessageAt: row.last_message_at,
  }));
};

/**
 * Update last message timestamp
 */
export const updateLastMessageAt = async (
  conversationId: string
): Promise<void> => {
  await query(
    'UPDATE conversations SET last_message_at = NOW() WHERE id = $1',
    [conversationId]
  );
};

/**
 * Delete conversation
 */
export const deleteConversation = async (
  conversationId: string
): Promise<void> => {
  await query('DELETE FROM conversations WHERE id = $1', [conversationId]);
};
