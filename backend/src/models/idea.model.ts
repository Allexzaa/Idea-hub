import { query } from '../config/database';

export type IdeaStage = 'spark' | 'growing' | 'building' | 'launched' | 'validated';

export interface Idea {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  stage: IdeaStage;
  category_tags: string[] | null;
  help_wanted_tags: string[] | null;
  spark_count: number;
  nurture_count: number;
  comment_count: number;
  view_count: number;
  is_archived: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface IdeaWithCreator extends Idea {
  creator_username: string;
  creator_full_name: string | null;
  creator_avatar_url: string | null;
}

/**
 * Create a new idea
 */
export const createIdea = async (data: {
  creatorId: string;
  title: string;
  description: string;
  categoryTags?: string[];
  helpWantedTags?: string[];
}): Promise<Idea> => {
  const result = await query(
    `INSERT INTO ideas (creator_id, title, description, category_tags, help_wanted_tags)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      data.creatorId,
      data.title,
      data.description,
      data.categoryTags || [],
      data.helpWantedTags || [],
    ]
  );
  return result.rows[0];
};

/**
 * Get all ideas (with pagination and filters)
 */
export const getAllIdeas = async (options: {
  limit?: number;
  offset?: number;
  stage?: IdeaStage;
  categoryTags?: string[];
  helpWantedTags?: string[];
  searchQuery?: string;
  sortBy?: 'recent' | 'sparks' | 'nurtures';
}): Promise<IdeaWithCreator[]> => {
  const {
    limit = 20,
    offset = 0,
    stage,
    categoryTags,
    helpWantedTags,
    searchQuery,
    sortBy = 'recent',
  } = options;

  let queryText = `
    SELECT ideas.*,
           users.username as creator_username,
           users.full_name as creator_full_name,
           users.avatar_url as creator_avatar_url
    FROM ideas
    JOIN users ON ideas.creator_id = users.id
    WHERE ideas.is_archived = false
  `;

  const params: any[] = [];
  let paramIndex = 1;

  // Filters
  if (stage) {
    queryText += ` AND ideas.stage = $${paramIndex++}`;
    params.push(stage);
  }

  if (categoryTags && categoryTags.length > 0) {
    queryText += ` AND ideas.category_tags && $${paramIndex++}`;
    params.push(categoryTags);
  }

  if (helpWantedTags && helpWantedTags.length > 0) {
    queryText += ` AND ideas.help_wanted_tags && $${paramIndex++}`;
    params.push(helpWantedTags);
  }

  if (searchQuery) {
    queryText += ` AND (ideas.title ILIKE $${paramIndex} OR ideas.description ILIKE $${paramIndex})`;
    params.push(`%${searchQuery}%`);
    paramIndex++;
  }

  // Sorting
  if (sortBy === 'sparks') {
    queryText += ' ORDER BY ideas.spark_count DESC, ideas.created_at DESC';
  } else if (sortBy === 'nurtures') {
    queryText += ' ORDER BY ideas.nurture_count DESC, ideas.created_at DESC';
  } else {
    queryText += ' ORDER BY ideas.created_at DESC';
  }

  // Pagination
  queryText += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  params.push(limit, offset);

  const result = await query(queryText, params);
  return result.rows;
};

/**
 * Get idea by ID
 */
export const getIdeaById = async (ideaId: string): Promise<IdeaWithCreator | null> => {
  const result = await query(
    `SELECT ideas.*,
            users.username as creator_username,
            users.full_name as creator_full_name,
            users.avatar_url as creator_avatar_url
     FROM ideas
     JOIN users ON ideas.creator_id = users.id
     WHERE ideas.id = $1 AND ideas.is_archived = false`,
    [ideaId]
  );
  return result.rows[0] || null;
};

/**
 * Update idea
 */
export const updateIdea = async (
  ideaId: string,
  data: {
    title?: string;
    description?: string;
    stage?: IdeaStage;
    categoryTags?: string[];
    helpWantedTags?: string[];
  }
): Promise<Idea> => {
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.title !== undefined) {
    updates.push(`title = $${paramIndex++}`);
    values.push(data.title);
  }
  if (data.description !== undefined) {
    updates.push(`description = $${paramIndex++}`);
    values.push(data.description);
  }
  if (data.stage !== undefined) {
    updates.push(`stage = $${paramIndex++}`);
    values.push(data.stage);
  }
  if (data.categoryTags !== undefined) {
    updates.push(`category_tags = $${paramIndex++}`);
    values.push(data.categoryTags);
  }
  if (data.helpWantedTags !== undefined) {
    updates.push(`help_wanted_tags = $${paramIndex++}`);
    values.push(data.helpWantedTags);
  }

  values.push(ideaId);

  const result = await query(
    `UPDATE ideas
     SET ${updates.join(', ')}, updated_at = NOW()
     WHERE id = $${paramIndex}
     RETURNING *`,
    values
  );

  return result.rows[0];
};

/**
 * Delete idea (soft delete - archive)
 */
export const deleteIdea = async (ideaId: string): Promise<void> => {
  await query('UPDATE ideas SET is_archived = true WHERE id = $1', [ideaId]);
};

/**
 * Get ideas by user ID
 */
export const getIdeasByUserId = async (userId: string): Promise<IdeaWithCreator[]> => {
  const result = await query(
    `SELECT ideas.*,
            users.username as creator_username,
            users.full_name as creator_full_name,
            users.avatar_url as creator_avatar_url
     FROM ideas
     JOIN users ON ideas.creator_id = users.id
     WHERE ideas.creator_id = $1 AND ideas.is_archived = false
     ORDER BY ideas.created_at DESC`,
    [userId]
  );
  return result.rows;
};

/**
 * Increment view count
 */
export const incrementViewCount = async (ideaId: string): Promise<void> => {
  await query(
    'UPDATE ideas SET view_count = view_count + 1 WHERE id = $1',
    [ideaId]
  );
};

/**
 * Update counts (for sparks, nurtures, comments)
 */
export const updateIdeaCounts = async (
  ideaId: string,
  counts: {
    sparkCount?: number;
    nurtureCount?: number;
    commentCount?: number;
  }
): Promise<void> => {
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (counts.sparkCount !== undefined) {
    updates.push(`spark_count = $${paramIndex++}`);
    values.push(counts.sparkCount);
  }
  if (counts.nurtureCount !== undefined) {
    updates.push(`nurture_count = $${paramIndex++}`);
    values.push(counts.nurtureCount);
  }
  if (counts.commentCount !== undefined) {
    updates.push(`comment_count = $${paramIndex++}`);
    values.push(counts.commentCount);
  }

  if (updates.length === 0) return;

  values.push(ideaId);

  await query(
    `UPDATE ideas SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
    values
  );
};
