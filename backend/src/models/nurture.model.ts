import { query } from '../config/database';

export interface Nurture {
  id: string;
  user_id: string;
  idea_id: string;
  help_message: string | null;
  status: string;
  created_at: Date;
}

export interface NurtureWithUser extends Nurture {
  user_username: string;
  user_full_name: string | null;
  user_avatar_url: string | null;
}

/**
 * Add a nurture offer to an idea
 */
export const addNurture = async (
  userId: string,
  ideaId: string,
  helpMessage?: string
): Promise<Nurture> => {
  const result = await query(
    `INSERT INTO nurtures (user_id, idea_id, help_message, status)
     VALUES ($1, $2, $3, 'offered')
     ON CONFLICT (user_id, idea_id) DO UPDATE
     SET help_message = EXCLUDED.help_message
     RETURNING *`,
    [userId, ideaId, helpMessage || null]
  );

  // Check if this is a new nurture
  if (result.rows.length > 0) {
    const isNew = result.rows[0].created_at.getTime() === new Date().getTime();
    if (isNew) {
      // Update nurture count on idea
      await query(
        'UPDATE ideas SET nurture_count = nurture_count + 1 WHERE id = $1',
        [ideaId]
      );
    }
  }

  return result.rows[0];
};

/**
 * Remove a nurture offer from an idea
 */
export const removeNurture = async (userId: string, ideaId: string): Promise<void> => {
  const result = await query(
    'DELETE FROM nurtures WHERE user_id = $1 AND idea_id = $2 RETURNING *',
    [userId, ideaId]
  );

  if (result.rows.length > 0) {
    // Update nurture count on idea
    await query(
      'UPDATE ideas SET nurture_count = GREATEST(nurture_count - 1, 0) WHERE id = $1',
      [ideaId]
    );
  }
};

/**
 * Check if user has offered to nurture an idea
 */
export const hasUserNurtured = async (userId: string, ideaId: string): Promise<boolean> => {
  const result = await query(
    'SELECT id FROM nurtures WHERE user_id = $1 AND idea_id = $2',
    [userId, ideaId]
  );
  return result.rows.length > 0;
};

/**
 * Get all nurtures for an idea (with user info)
 */
export const getNurturesByIdea = async (ideaId: string): Promise<NurtureWithUser[]> => {
  const result = await query(
    `SELECT nurtures.*,
            users.username as user_username,
            users.full_name as user_full_name,
            users.avatar_url as user_avatar_url
     FROM nurtures
     JOIN users ON nurtures.user_id = users.id
     WHERE nurtures.idea_id = $1
     ORDER BY nurtures.created_at DESC`,
    [ideaId]
  );
  return result.rows;
};

/**
 * Get all ideas nurtured by a user
 */
export const getNurturedIdeasByUser = async (userId: string): Promise<string[]> => {
  const result = await query(
    'SELECT idea_id FROM nurtures WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows.map(row => row.idea_id);
};

/**
 * Update nurture status (offered, accepted, declined)
 */
export const updateNurtureStatus = async (
  nurtureId: string,
  status: 'offered' | 'accepted' | 'declined'
): Promise<Nurture> => {
  const result = await query(
    'UPDATE nurtures SET status = $1 WHERE id = $2 RETURNING *',
    [status, nurtureId]
  );
  return result.rows[0];
};
