import { query } from '../config/database';

export interface Spark {
  id: string;
  user_id: string;
  idea_id: string;
  created_at: Date;
}

/**
 * Add a spark to an idea
 */
export const addSpark = async (userId: string, ideaId: string): Promise<Spark> => {
  const result = await query(
    `INSERT INTO sparks (user_id, idea_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, idea_id) DO NOTHING
     RETURNING *`,
    [userId, ideaId]
  );

  if (result.rows.length === 0) {
    throw new Error('Spark already exists');
  }

  // Update spark count on idea
  await query(
    'UPDATE ideas SET spark_count = spark_count + 1 WHERE id = $1',
    [ideaId]
  );

  return result.rows[0];
};

/**
 * Remove a spark from an idea
 */
export const removeSpark = async (userId: string, ideaId: string): Promise<void> => {
  const result = await query(
    'DELETE FROM sparks WHERE user_id = $1 AND idea_id = $2 RETURNING *',
    [userId, ideaId]
  );

  if (result.rows.length > 0) {
    // Update spark count on idea
    await query(
      'UPDATE ideas SET spark_count = GREATEST(spark_count - 1, 0) WHERE id = $1',
      [ideaId]
    );
  }
};

/**
 * Check if user has sparked an idea
 */
export const hasUserSparked = async (userId: string, ideaId: string): Promise<boolean> => {
  const result = await query(
    'SELECT id FROM sparks WHERE user_id = $1 AND idea_id = $2',
    [userId, ideaId]
  );
  return result.rows.length > 0;
};

/**
 * Get all sparks for an idea
 */
export const getSparksByIdea = async (ideaId: string): Promise<Spark[]> => {
  const result = await query(
    'SELECT * FROM sparks WHERE idea_id = $1 ORDER BY created_at DESC',
    [ideaId]
  );
  return result.rows;
};

/**
 * Get all ideas sparked by a user
 */
export const getSparkedIdeasByUser = async (userId: string): Promise<string[]> => {
  const result = await query(
    'SELECT idea_id FROM sparks WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows.map(row => row.idea_id);
};
