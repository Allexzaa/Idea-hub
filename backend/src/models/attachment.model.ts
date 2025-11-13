import { query } from '../config/database';

export interface Attachment {
  id: string;
  idea_id: string | null;
  comment_id: string | null;
  user_id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  created_at: Date;
}

export interface AttachmentWithUser {
  id: string;
  ideaId: string | null;
  commentId: string | null;
  userId: string;
  userName: string;
  fileName: string;
  fileUrl: string;
  fileType: string | null;
  fileSize: number | null;
  createdAt: Date;
}

/**
 * Create an attachment
 */
export const createAttachment = async (data: {
  ideaId?: string;
  commentId?: string;
  userId: string;
  fileName: string;
  fileUrl: string;
  fileType?: string;
  fileSize?: number;
}): Promise<Attachment> => {
  const result = await query(
    `INSERT INTO attachments (idea_id, comment_id, user_id, file_name, file_url, file_type, file_size)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      data.ideaId || null,
      data.commentId || null,
      data.userId,
      data.fileName,
      data.fileUrl,
      data.fileType || null,
      data.fileSize || null,
    ]
  );
  return result.rows[0];
};

/**
 * Get attachments for an idea
 */
export const getAttachmentsByIdea = async (
  ideaId: string
): Promise<AttachmentWithUser[]> => {
  const result = await query(
    `SELECT
      a.id,
      a.idea_id,
      a.comment_id,
      a.user_id,
      a.file_name,
      a.file_url,
      a.file_type,
      a.file_size,
      a.created_at,
      u.username as user_name
    FROM attachments a
    JOIN users u ON a.user_id = u.id
    WHERE a.idea_id = $1
    ORDER BY a.created_at ASC`,
    [ideaId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    ideaId: row.idea_id,
    commentId: row.comment_id,
    userId: row.user_id,
    userName: row.user_name,
    fileName: row.file_name,
    fileUrl: row.file_url,
    fileType: row.file_type,
    fileSize: row.file_size,
    createdAt: row.created_at,
  }));
};

/**
 * Get attachments for a comment
 */
export const getAttachmentsByComment = async (
  commentId: string
): Promise<AttachmentWithUser[]> => {
  const result = await query(
    `SELECT
      a.id,
      a.idea_id,
      a.comment_id,
      a.user_id,
      a.file_name,
      a.file_url,
      a.file_type,
      a.file_size,
      a.created_at,
      u.username as user_name
    FROM attachments a
    JOIN users u ON a.user_id = u.id
    WHERE a.comment_id = $1
    ORDER BY a.created_at ASC`,
    [commentId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    ideaId: row.idea_id,
    commentId: row.comment_id,
    userId: row.user_id,
    userName: row.user_name,
    fileName: row.file_name,
    fileUrl: row.file_url,
    fileType: row.file_type,
    fileSize: row.file_size,
    createdAt: row.created_at,
  }));
};

/**
 * Get attachment by ID
 */
export const getAttachmentById = async (
  attachmentId: string
): Promise<Attachment | null> => {
  const result = await query(
    'SELECT * FROM attachments WHERE id = $1',
    [attachmentId]
  );
  return result.rows[0] || null;
};

/**
 * Delete attachment
 */
export const deleteAttachment = async (
  attachmentId: string
): Promise<void> => {
  await query('DELETE FROM attachments WHERE id = $1', [attachmentId]);
};

/**
 * Get all attachments by user
 */
export const getAttachmentsByUser = async (
  userId: string
): Promise<Attachment[]> => {
  const result = await query(
    'SELECT * FROM attachments WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows;
};
