import { query } from '../config/database';

export interface Comment {
  id: string;
  idea_id: string;
  user_id: string;
  parent_comment_id: string | null;
  content: string;
  helpful_count: number;
  is_edited: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CommentWithUser extends Comment {
  user_username: string;
  user_full_name: string | null;
  user_avatar_url: string | null;
}

/**
 * Create a new comment
 */
export const createComment = async (data: {
  ideaId: string;
  userId: string;
  content: string;
  parentCommentId?: string;
}): Promise<Comment> => {
  const result = await query(
    `INSERT INTO comments (idea_id, user_id, parent_comment_id, content)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [data.ideaId, data.userId, data.parentCommentId || null, data.content]
  );

  // Update comment count on idea
  await query(
    'UPDATE ideas SET comment_count = comment_count + 1 WHERE id = $1',
    [data.ideaId]
  );

  return result.rows[0];
};

/**
 * Get comments for an idea (with user info)
 */
export const getCommentsByIdea = async (ideaId: string): Promise<CommentWithUser[]> => {
  const result = await query(
    `SELECT comments.*,
            users.username as user_username,
            users.full_name as user_full_name,
            users.avatar_url as user_avatar_url
     FROM comments
     JOIN users ON comments.user_id = users.id
     WHERE comments.idea_id = $1
     ORDER BY comments.created_at ASC`,
    [ideaId]
  );
  return result.rows;
};

/**
 * Get comment by ID
 */
export const getCommentById = async (commentId: string): Promise<CommentWithUser | null> => {
  const result = await query(
    `SELECT comments.*,
            users.username as user_username,
            users.full_name as user_full_name,
            users.avatar_url as user_avatar_url
     FROM comments
     JOIN users ON comments.user_id = users.id
     WHERE comments.id = $1`,
    [commentId]
  );
  return result.rows[0] || null;
};

/**
 * Update comment
 */
export const updateComment = async (
  commentId: string,
  content: string
): Promise<Comment> => {
  const result = await query(
    `UPDATE comments
     SET content = $1, is_edited = true, updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [content, commentId]
  );
  return result.rows[0];
};

/**
 * Delete comment
 */
export const deleteComment = async (commentId: string, ideaId: string): Promise<void> => {
  await query('DELETE FROM comments WHERE id = $1', [commentId]);

  // Update comment count on idea
  await query(
    'UPDATE ideas SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = $1',
    [ideaId]
  );
};

/**
 * Mark comment as helpful
 */
export const markCommentHelpful = async (
  commentId: string,
  userId: string
): Promise<void> => {
  // Add to helpful marks
  await query(
    `INSERT INTO comment_helpful (comment_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT (comment_id, user_id) DO NOTHING`,
    [commentId, userId]
  );

  // Update helpful count
  await query(
    'UPDATE comments SET helpful_count = helpful_count + 1 WHERE id = $1',
    [commentId]
  );
};

/**
 * Unmark comment as helpful
 */
export const unmarkCommentHelpful = async (
  commentId: string,
  userId: string
): Promise<void> => {
  const result = await query(
    'DELETE FROM comment_helpful WHERE comment_id = $1 AND user_id = $2 RETURNING *',
    [commentId, userId]
  );

  if (result.rows.length > 0) {
    // Update helpful count
    await query(
      'UPDATE comments SET helpful_count = GREATEST(helpful_count - 1, 0) WHERE id = $1',
      [commentId]
    );
  }
};

/**
 * Check if user marked comment as helpful
 */
export const hasUserMarkedHelpful = async (
  commentId: string,
  userId: string
): Promise<boolean> => {
  const result = await query(
    'SELECT id FROM comment_helpful WHERE comment_id = $1 AND user_id = $2',
    [commentId, userId]
  );
  return result.rows.length > 0;
};
