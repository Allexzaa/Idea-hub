import pool from '../config/database';

export interface Investment {
  id: string;
  campaignId: string;
  userId: string;
  tierId: string | null;
  amount: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  message: string | null;
  isAnonymous: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InvestmentWithDetails extends Investment {
  userName: string;
  userAvatar: string | null;
  campaignTitle: string;
  ideaId: string;
  ideaTitle: string;
  tierName: string | null;
}

/**
 * Create investment/pledge
 */
export const createInvestment = async (data: {
  campaignId: string;
  userId: string;
  tierId?: string;
  amount: number;
  message?: string;
  isAnonymous?: boolean;
}): Promise<Investment> => {
  const query = `
    INSERT INTO investments (
      campaign_id, user_id, tier_id, amount, message, is_anonymous, status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;

  const values = [
    data.campaignId,
    data.userId,
    data.tierId || null,
    data.amount,
    data.message || null,
    data.isAnonymous || false,
    'pending', // Start as pending, can be confirmed later
  ];

  const result = await pool.query(query, values);
  return mapInvestmentFromDb(result.rows[0]);
};

/**
 * Get investment by ID
 */
export const getInvestmentById = async (investmentId: string): Promise<Investment | null> => {
  const query = 'SELECT * FROM investments WHERE id = $1';
  const result = await pool.query(query, [investmentId]);
  return result.rows[0] ? mapInvestmentFromDb(result.rows[0]) : null;
};

/**
 * Get investments for a campaign with pagination
 */
export const getInvestmentsByCampaignId = async (
  campaignId: string,
  params?: {
    limit?: number;
    offset?: number;
    includeAnonymous?: boolean;
  }
): Promise<{ investments: InvestmentWithDetails[]; total: number }> => {
  const limit = params?.limit || 50;
  const offset = params?.offset || 0;
  const includeAnonymous = params?.includeAnonymous !== false;

  let whereClause = 'i.campaign_id = $1 AND i.status = $2';
  const queryParams: any[] = [campaignId, 'confirmed'];

  // Get total count
  const countQuery = `
    SELECT COUNT(*)
    FROM investments i
    WHERE ${whereClause}
  `;
  const countResult = await pool.query(countQuery, queryParams);
  const total = parseInt(countResult.rows[0].count);

  // Get investments
  queryParams.push(limit, offset);
  const query = `
    SELECT
      i.*,
      u.username as user_name,
      u.avatar_url as user_avatar,
      fc.title as campaign_title,
      fc.idea_id,
      idea.title as idea_title,
      ct.name as tier_name
    FROM investments i
    JOIN users u ON i.user_id = u.id
    JOIN funding_campaigns fc ON i.campaign_id = fc.id
    JOIN ideas idea ON fc.idea_id = idea.id
    LEFT JOIN campaign_tiers ct ON i.tier_id = ct.id
    WHERE ${whereClause}
    ORDER BY i.created_at DESC
    LIMIT $3 OFFSET $4
  `;

  const result = await pool.query(query, queryParams);
  const investments = result.rows.map(row => {
    const investment = mapInvestmentFromDb(row);
    return {
      ...investment,
      userName: row.is_anonymous && !includeAnonymous ? 'Anonymous' : row.user_name,
      userAvatar: row.is_anonymous && !includeAnonymous ? null : row.user_avatar,
      campaignTitle: row.campaign_title,
      ideaId: row.idea_id,
      ideaTitle: row.idea_title,
      tierName: row.tier_name,
    };
  });

  return { investments, total };
};

/**
 * Get investments by user
 */
export const getInvestmentsByUserId = async (
  userId: string,
  params?: { limit?: number; offset?: number }
): Promise<{ investments: InvestmentWithDetails[]; total: number }> => {
  const limit = params?.limit || 50;
  const offset = params?.offset || 0;

  // Get total count
  const countQuery = `
    SELECT COUNT(*)
    FROM investments
    WHERE user_id = $1
  `;
  const countResult = await pool.query(countQuery, [userId]);
  const total = parseInt(countResult.rows[0].count);

  // Get investments
  const query = `
    SELECT
      i.*,
      u.username as user_name,
      u.avatar_url as user_avatar,
      fc.title as campaign_title,
      fc.idea_id,
      idea.title as idea_title,
      ct.name as tier_name
    FROM investments i
    JOIN users u ON i.user_id = u.id
    JOIN funding_campaigns fc ON i.campaign_id = fc.id
    JOIN ideas idea ON fc.idea_id = idea.id
    LEFT JOIN campaign_tiers ct ON i.tier_id = ct.id
    WHERE i.user_id = $1
    ORDER BY i.created_at DESC
    LIMIT $2 OFFSET $3
  `;

  const result = await pool.query(query, [userId, limit, offset]);
  const investments = result.rows.map(row => ({
    ...mapInvestmentFromDb(row),
    userName: row.user_name,
    userAvatar: row.user_avatar,
    campaignTitle: row.campaign_title,
    ideaId: row.idea_id,
    ideaTitle: row.idea_title,
    tierName: row.tier_name,
  }));

  return { investments, total };
};

/**
 * Get investment statistics for a campaign
 */
export const getCampaignInvestmentStats = async (campaignId: string): Promise<{
  totalAmount: number;
  investorCount: number;
  averageInvestment: number;
}> => {
  const query = `
    SELECT
      COALESCE(SUM(amount), 0) as total_amount,
      COUNT(DISTINCT user_id) as investor_count,
      COALESCE(AVG(amount), 0) as average_investment
    FROM investments
    WHERE campaign_id = $1 AND status = 'confirmed'
  `;

  const result = await pool.query(query, [campaignId]);
  const row = result.rows[0];

  return {
    totalAmount: parseFloat(row.total_amount),
    investorCount: parseInt(row.investor_count),
    averageInvestment: parseFloat(row.average_investment),
  };
};

/**
 * Update investment status
 */
export const updateInvestmentStatus = async (
  investmentId: string,
  status: 'pending' | 'confirmed' | 'cancelled'
): Promise<Investment | null> => {
  const query = `
    UPDATE investments
    SET status = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING *
  `;

  const result = await pool.query(query, [status, investmentId]);
  return result.rows[0] ? mapInvestmentFromDb(result.rows[0]) : null;
};

/**
 * Cancel investment
 */
export const cancelInvestment = async (investmentId: string): Promise<void> => {
  await updateInvestmentStatus(investmentId, 'cancelled');
};

/**
 * Check if user has invested in campaign
 */
export const hasUserInvested = async (campaignId: string, userId: string): Promise<boolean> => {
  const query = `
    SELECT COUNT(*) as count
    FROM investments
    WHERE campaign_id = $1 AND user_id = $2 AND status != 'cancelled'
  `;

  const result = await pool.query(query, [campaignId, userId]);
  return parseInt(result.rows[0].count) > 0;
};

/**
 * Get user's total investment in a campaign
 */
export const getUserCampaignTotal = async (campaignId: string, userId: string): Promise<number> => {
  const query = `
    SELECT COALESCE(SUM(amount), 0) as total
    FROM investments
    WHERE campaign_id = $1 AND user_id = $2 AND status = 'confirmed'
  `;

  const result = await pool.query(query, [campaignId, userId]);
  return parseFloat(result.rows[0].total);
};

/**
 * Get top investors for a campaign
 */
export const getTopInvestors = async (
  campaignId: string,
  limit: number = 10
): Promise<Array<{ userId: string; userName: string; totalAmount: number; investmentCount: number }>> => {
  const query = `
    SELECT
      i.user_id,
      u.username as user_name,
      SUM(i.amount) as total_amount,
      COUNT(*) as investment_count
    FROM investments i
    JOIN users u ON i.user_id = u.id
    WHERE i.campaign_id = $1 AND i.status = 'confirmed' AND i.is_anonymous = false
    GROUP BY i.user_id, u.username
    ORDER BY total_amount DESC
    LIMIT $2
  `;

  const result = await pool.query(query, [campaignId, limit]);
  return result.rows.map(row => ({
    userId: row.user_id,
    userName: row.user_name,
    totalAmount: parseFloat(row.total_amount),
    investmentCount: parseInt(row.investment_count),
  }));
};

/**
 * Delete investment
 */
export const deleteInvestment = async (investmentId: string): Promise<void> => {
  await pool.query('DELETE FROM investments WHERE id = $1', [investmentId]);
};

/**
 * Map database row to Investment interface
 */
const mapInvestmentFromDb = (row: any): Investment => ({
  id: row.id,
  campaignId: row.campaign_id,
  userId: row.user_id,
  tierId: row.tier_id,
  amount: parseFloat(row.amount),
  status: row.status,
  message: row.message,
  isAnonymous: row.is_anonymous,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});
