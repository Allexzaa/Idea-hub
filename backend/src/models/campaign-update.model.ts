import pool from '../config/database';

export interface CampaignUpdate {
  id: string;
  campaignId: string;
  creatorId: string;
  title: string;
  content: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignUpdateWithDetails extends CampaignUpdate {
  creatorName: string;
  creatorAvatar: string | null;
}

/**
 * Create campaign update
 */
export const createUpdate = async (data: {
  campaignId: string;
  creatorId: string;
  title: string;
  content: string;
  isPublic?: boolean;
}): Promise<CampaignUpdate> => {
  const query = `
    INSERT INTO campaign_updates (
      campaign_id, creator_id, title, content, is_public
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;

  const values = [
    data.campaignId,
    data.creatorId,
    data.title,
    data.content,
    data.isPublic !== false, // Default to public
  ];

  const result = await pool.query(query, values);
  return mapUpdateFromDb(result.rows[0]);
};

/**
 * Get update by ID
 */
export const getUpdateById = async (updateId: string): Promise<CampaignUpdate | null> => {
  const query = 'SELECT * FROM campaign_updates WHERE id = $1';
  const result = await pool.query(query, [updateId]);
  return result.rows[0] ? mapUpdateFromDb(result.rows[0]) : null;
};

/**
 * Get update by ID with creator details
 */
export const getUpdateWithDetails = async (updateId: string): Promise<CampaignUpdateWithDetails | null> => {
  const query = `
    SELECT
      cu.*,
      u.username as creator_name,
      u.avatar_url as creator_avatar
    FROM campaign_updates cu
    JOIN users u ON cu.creator_id = u.id
    WHERE cu.id = $1
  `;

  const result = await pool.query(query, [updateId]);
  if (!result.rows[0]) return null;

  const row = result.rows[0];
  return {
    ...mapUpdateFromDb(row),
    creatorName: row.creator_name,
    creatorAvatar: row.creator_avatar,
  };
};

/**
 * Get all updates for a campaign
 */
export const getUpdatesByCampaignId = async (
  campaignId: string,
  params?: {
    limit?: number;
    offset?: number;
    publicOnly?: boolean;
  }
): Promise<{ updates: CampaignUpdateWithDetails[]; total: number }> => {
  const limit = params?.limit || 20;
  const offset = params?.offset || 0;
  const publicOnly = params?.publicOnly !== false;

  const whereConditions = ['cu.campaign_id = $1'];
  const queryParams: any[] = [campaignId];

  if (publicOnly) {
    whereConditions.push('cu.is_public = true');
  }

  const whereClause = whereConditions.join(' AND ');

  // Get total count
  const countQuery = `
    SELECT COUNT(*)
    FROM campaign_updates cu
    WHERE ${whereClause}
  `;
  const countResult = await pool.query(countQuery, queryParams);
  const total = parseInt(countResult.rows[0].count);

  // Get updates
  queryParams.push(limit, offset);
  const query = `
    SELECT
      cu.*,
      u.username as creator_name,
      u.avatar_url as creator_avatar
    FROM campaign_updates cu
    JOIN users u ON cu.creator_id = u.id
    WHERE ${whereClause}
    ORDER BY cu.created_at DESC
    LIMIT $2 OFFSET $3
  `;

  const result = await pool.query(query, queryParams);
  const updates = result.rows.map(row => ({
    ...mapUpdateFromDb(row),
    creatorName: row.creator_name,
    creatorAvatar: row.creator_avatar,
  }));

  return { updates, total };
};

/**
 * Update campaign update
 */
export const updateCampaignUpdate = async (
  updateId: string,
  data: {
    title?: string;
    content?: string;
    isPublic?: boolean;
  }
): Promise<CampaignUpdate | null> => {
  const updates: string[] = [];
  const values: any[] = [];
  let paramCounter = 1;

  if (data.title !== undefined) {
    updates.push(`title = $${paramCounter}`);
    values.push(data.title);
    paramCounter++;
  }

  if (data.content !== undefined) {
    updates.push(`content = $${paramCounter}`);
    values.push(data.content);
    paramCounter++;
  }

  if (data.isPublic !== undefined) {
    updates.push(`is_public = $${paramCounter}`);
    values.push(data.isPublic);
    paramCounter++;
  }

  if (updates.length === 0) return null;

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(updateId);

  const query = `
    UPDATE campaign_updates
    SET ${updates.join(', ')}
    WHERE id = $${paramCounter}
    RETURNING *
  `;

  const result = await pool.query(query, values);
  return result.rows[0] ? mapUpdateFromDb(result.rows[0]) : null;
};

/**
 * Delete campaign update
 */
export const deleteUpdate = async (updateId: string): Promise<void> => {
  await pool.query('DELETE FROM campaign_updates WHERE id = $1', [updateId]);
};

/**
 * Map database row to CampaignUpdate interface
 */
const mapUpdateFromDb = (row: any): CampaignUpdate => ({
  id: row.id,
  campaignId: row.campaign_id,
  creatorId: row.creator_id,
  title: row.title,
  content: row.content,
  isPublic: row.is_public,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});
