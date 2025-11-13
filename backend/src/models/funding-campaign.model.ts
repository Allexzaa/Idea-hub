import pool from '../config/database';

export interface FundingCampaign {
  id: string;
  ideaId: string;
  creatorId: string;
  title: string;
  description: string;
  fundingGoal: number;
  minimumInvestment: number;
  currency: string;
  startDate: string;
  endDate: string;
  status: 'draft' | 'active' | 'funded' | 'ended' | 'cancelled';
  currentAmount: number;
  investorCount: number;
  useOfFunds: string | null;
  milestones: string[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignWithDetails extends FundingCampaign {
  ideaTitle: string;
  ideaStage: string;
  creatorName: string;
  categoryTags: string[];
}

/**
 * Create a new funding campaign
 */
export const createCampaign = async (data: {
  ideaId: string;
  creatorId: string;
  title: string;
  description: string;
  fundingGoal: number;
  minimumInvestment: number;
  currency?: string;
  startDate: string;
  endDate: string;
  useOfFunds?: string;
  milestones?: string[];
}): Promise<FundingCampaign> => {
  const query = `
    INSERT INTO funding_campaigns (
      idea_id, creator_id, title, description, funding_goal,
      minimum_investment, currency, start_date, end_date,
      use_of_funds, milestones, status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *
  `;

  const values = [
    data.ideaId,
    data.creatorId,
    data.title,
    data.description,
    data.fundingGoal,
    data.minimumInvestment,
    data.currency || 'USD',
    data.startDate,
    data.endDate,
    data.useOfFunds || null,
    data.milestones || null,
    'draft', // campaigns start as draft
  ];

  const result = await pool.query(query, values);
  return mapCampaignFromDb(result.rows[0]);
};

/**
 * Get campaign by ID
 */
export const getCampaignById = async (campaignId: string): Promise<FundingCampaign | null> => {
  const query = 'SELECT * FROM funding_campaigns WHERE id = $1';
  const result = await pool.query(query, [campaignId]);
  return result.rows[0] ? mapCampaignFromDb(result.rows[0]) : null;
};

/**
 * Get campaign by ID with idea and creator details
 */
export const getCampaignWithDetails = async (campaignId: string): Promise<CampaignWithDetails | null> => {
  const query = `
    SELECT
      fc.*,
      i.title as idea_title,
      i.stage as idea_stage,
      i.category_tags,
      u.username as creator_name
    FROM funding_campaigns fc
    JOIN ideas i ON fc.idea_id = i.id
    JOIN users u ON fc.creator_id = u.id
    WHERE fc.id = $1
  `;

  const result = await pool.query(query, [campaignId]);
  if (!result.rows[0]) return null;

  const row = result.rows[0];
  return {
    ...mapCampaignFromDb(row),
    ideaTitle: row.idea_title,
    ideaStage: row.idea_stage,
    creatorName: row.creator_name,
    categoryTags: row.category_tags || [],
  };
};

/**
 * Get all campaigns for an idea
 */
export const getCampaignsByIdeaId = async (ideaId: string): Promise<FundingCampaign[]> => {
  const query = `
    SELECT * FROM funding_campaigns
    WHERE idea_id = $1
    ORDER BY created_at DESC
  `;
  const result = await pool.query(query, [ideaId]);
  return result.rows.map(mapCampaignFromDb);
};

/**
 * Get active campaign for an idea (only one active at a time)
 */
export const getActiveCampaignByIdeaId = async (ideaId: string): Promise<FundingCampaign | null> => {
  const query = `
    SELECT * FROM funding_campaigns
    WHERE idea_id = $1 AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 1
  `;
  const result = await pool.query(query, [ideaId]);
  return result.rows[0] ? mapCampaignFromDb(result.rows[0]) : null;
};

/**
 * Get all active campaigns with pagination
 */
export const getActiveCampaigns = async (params: {
  limit?: number;
  offset?: number;
  sortBy?: 'recent' | 'ending_soon' | 'trending' | 'funding_goal';
  categoryTags?: string[];
  minGoal?: number;
  maxGoal?: number;
}): Promise<{ campaigns: CampaignWithDetails[]; total: number }> => {
  const limit = params.limit || 20;
  const offset = params.offset || 0;

  let orderBy = 'fc.created_at DESC';
  switch (params.sortBy) {
    case 'ending_soon':
      orderBy = 'fc.end_date ASC';
      break;
    case 'trending':
      orderBy = 'fc.investor_count DESC, fc.current_amount DESC';
      break;
    case 'funding_goal':
      orderBy = 'fc.funding_goal DESC';
      break;
  }

  let whereConditions = ["fc.status = 'active'"];
  const queryParams: any[] = [];
  let paramCounter = 1;

  if (params.categoryTags && params.categoryTags.length > 0) {
    queryParams.push(params.categoryTags);
    whereConditions.push(`i.category_tags && $${paramCounter}::text[]`);
    paramCounter++;
  }

  if (params.minGoal !== undefined) {
    queryParams.push(params.minGoal);
    whereConditions.push(`fc.funding_goal >= $${paramCounter}`);
    paramCounter++;
  }

  if (params.maxGoal !== undefined) {
    queryParams.push(params.maxGoal);
    whereConditions.push(`fc.funding_goal <= $${paramCounter}`);
    paramCounter++;
  }

  const whereClause = whereConditions.join(' AND ');

  // Get total count
  const countQuery = `
    SELECT COUNT(*)
    FROM funding_campaigns fc
    JOIN ideas i ON fc.idea_id = i.id
    WHERE ${whereClause}
  `;
  const countResult = await pool.query(countQuery, queryParams);
  const total = parseInt(countResult.rows[0].count);

  // Get campaigns
  queryParams.push(limit, offset);
  const query = `
    SELECT
      fc.*,
      i.title as idea_title,
      i.stage as idea_stage,
      i.category_tags,
      u.username as creator_name
    FROM funding_campaigns fc
    JOIN ideas i ON fc.idea_id = i.id
    JOIN users u ON fc.creator_id = u.id
    WHERE ${whereClause}
    ORDER BY ${orderBy}
    LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
  `;

  const result = await pool.query(query, queryParams);
  const campaigns = result.rows.map(row => ({
    ...mapCampaignFromDb(row),
    ideaTitle: row.idea_title,
    ideaStage: row.idea_stage,
    creatorName: row.creator_name,
    categoryTags: row.category_tags || [],
  }));

  return { campaigns, total };
};

/**
 * Update campaign status
 */
export const updateCampaignStatus = async (
  campaignId: string,
  status: 'draft' | 'active' | 'funded' | 'ended' | 'cancelled'
): Promise<void> => {
  const query = `
    UPDATE funding_campaigns
    SET status = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
  `;
  await pool.query(query, [status, campaignId]);
};

/**
 * Update campaign funding stats
 */
export const updateCampaignStats = async (
  campaignId: string,
  currentAmount: number,
  investorCount: number
): Promise<void> => {
  const query = `
    UPDATE funding_campaigns
    SET
      current_amount = $1,
      investor_count = $2,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $3
  `;
  await pool.query(query, [currentAmount, investorCount, campaignId]);
};

/**
 * Update campaign details
 */
export const updateCampaign = async (
  campaignId: string,
  data: {
    title?: string;
    description?: string;
    fundingGoal?: number;
    minimumInvestment?: number;
    endDate?: string;
    useOfFunds?: string;
    milestones?: string[];
  }
): Promise<FundingCampaign | null> => {
  const updates: string[] = [];
  const values: any[] = [];
  let paramCounter = 1;

  if (data.title !== undefined) {
    updates.push(`title = $${paramCounter}`);
    values.push(data.title);
    paramCounter++;
  }

  if (data.description !== undefined) {
    updates.push(`description = $${paramCounter}`);
    values.push(data.description);
    paramCounter++;
  }

  if (data.fundingGoal !== undefined) {
    updates.push(`funding_goal = $${paramCounter}`);
    values.push(data.fundingGoal);
    paramCounter++;
  }

  if (data.minimumInvestment !== undefined) {
    updates.push(`minimum_investment = $${paramCounter}`);
    values.push(data.minimumInvestment);
    paramCounter++;
  }

  if (data.endDate !== undefined) {
    updates.push(`end_date = $${paramCounter}`);
    values.push(data.endDate);
    paramCounter++;
  }

  if (data.useOfFunds !== undefined) {
    updates.push(`use_of_funds = $${paramCounter}`);
    values.push(data.useOfFunds);
    paramCounter++;
  }

  if (data.milestones !== undefined) {
    updates.push(`milestones = $${paramCounter}`);
    values.push(data.milestones);
    paramCounter++;
  }

  if (updates.length === 0) return null;

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(campaignId);

  const query = `
    UPDATE funding_campaigns
    SET ${updates.join(', ')}
    WHERE id = $${paramCounter}
    RETURNING *
  `;

  const result = await pool.query(query, values);
  return result.rows[0] ? mapCampaignFromDb(result.rows[0]) : null;
};

/**
 * Delete campaign
 */
export const deleteCampaign = async (campaignId: string): Promise<void> => {
  await pool.query('DELETE FROM funding_campaigns WHERE id = $1', [campaignId]);
};

/**
 * Check if user can create campaign for idea
 */
export const canCreateCampaign = async (ideaId: string, userId: string): Promise<boolean> => {
  // Check if user owns the idea
  const ideaQuery = 'SELECT creator_id, stage FROM ideas WHERE id = $1';
  const ideaResult = await pool.query(ideaQuery, [ideaId]);

  if (!ideaResult.rows[0]) return false;

  const { creator_id, stage } = ideaResult.rows[0];

  // Must be idea owner
  if (creator_id !== userId) return false;

  // Must be in Building, Launched, or Validated stage
  if (!['building', 'launched', 'validated'].includes(stage)) return false;

  // Check if there's already an active campaign
  const activeCampaign = await getActiveCampaignByIdeaId(ideaId);
  if (activeCampaign) return false;

  return true;
};

/**
 * Map database row to FundingCampaign interface
 */
const mapCampaignFromDb = (row: any): FundingCampaign => ({
  id: row.id,
  ideaId: row.idea_id,
  creatorId: row.creator_id,
  title: row.title,
  description: row.description,
  fundingGoal: parseFloat(row.funding_goal),
  minimumInvestment: parseFloat(row.minimum_investment),
  currency: row.currency,
  startDate: row.start_date,
  endDate: row.end_date,
  status: row.status,
  currentAmount: parseFloat(row.current_amount) || 0,
  investorCount: parseInt(row.investor_count) || 0,
  useOfFunds: row.use_of_funds,
  milestones: row.milestones,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});
