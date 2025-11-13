import pool from '../config/database';

export interface CampaignTier {
  id: string;
  campaignId: string;
  name: string;
  amount: number;
  description: string;
  rewards: string[];
  maxBackers: number | null;
  currentBackers: number;
  estimatedDelivery: string | null;
  createdAt: string;
}

/**
 * Create campaign tier
 */
export const createTier = async (data: {
  campaignId: string;
  name: string;
  amount: number;
  description: string;
  rewards?: string[];
  maxBackers?: number;
  estimatedDelivery?: string;
}): Promise<CampaignTier> => {
  const query = `
    INSERT INTO campaign_tiers (
      campaign_id, name, amount, description, rewards,
      max_backers, estimated_delivery
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;

  const values = [
    data.campaignId,
    data.name,
    data.amount,
    data.description,
    data.rewards || [],
    data.maxBackers || null,
    data.estimatedDelivery || null,
  ];

  const result = await pool.query(query, values);
  return mapTierFromDb(result.rows[0]);
};

/**
 * Get tier by ID
 */
export const getTierById = async (tierId: string): Promise<CampaignTier | null> => {
  const query = 'SELECT * FROM campaign_tiers WHERE id = $1';
  const result = await pool.query(query, [tierId]);
  return result.rows[0] ? mapTierFromDb(result.rows[0]) : null;
};

/**
 * Get all tiers for a campaign
 */
export const getTiersByCampaignId = async (campaignId: string): Promise<CampaignTier[]> => {
  const query = `
    SELECT * FROM campaign_tiers
    WHERE campaign_id = $1
    ORDER BY amount ASC
  `;
  const result = await pool.query(query, [campaignId]);
  return result.rows.map(mapTierFromDb);
};

/**
 * Update tier
 */
export const updateTier = async (
  tierId: string,
  data: {
    name?: string;
    amount?: number;
    description?: string;
    rewards?: string[];
    maxBackers?: number;
    estimatedDelivery?: string;
  }
): Promise<CampaignTier | null> => {
  const updates: string[] = [];
  const values: any[] = [];
  let paramCounter = 1;

  if (data.name !== undefined) {
    updates.push(`name = $${paramCounter}`);
    values.push(data.name);
    paramCounter++;
  }

  if (data.amount !== undefined) {
    updates.push(`amount = $${paramCounter}`);
    values.push(data.amount);
    paramCounter++;
  }

  if (data.description !== undefined) {
    updates.push(`description = $${paramCounter}`);
    values.push(data.description);
    paramCounter++;
  }

  if (data.rewards !== undefined) {
    updates.push(`rewards = $${paramCounter}`);
    values.push(data.rewards);
    paramCounter++;
  }

  if (data.maxBackers !== undefined) {
    updates.push(`max_backers = $${paramCounter}`);
    values.push(data.maxBackers);
    paramCounter++;
  }

  if (data.estimatedDelivery !== undefined) {
    updates.push(`estimated_delivery = $${paramCounter}`);
    values.push(data.estimatedDelivery);
    paramCounter++;
  }

  if (updates.length === 0) return null;

  values.push(tierId);

  const query = `
    UPDATE campaign_tiers
    SET ${updates.join(', ')}
    WHERE id = $${paramCounter}
    RETURNING *
  `;

  const result = await pool.query(query, values);
  return result.rows[0] ? mapTierFromDb(result.rows[0]) : null;
};

/**
 * Increment tier backer count
 */
export const incrementTierBackers = async (tierId: string): Promise<void> => {
  const query = `
    UPDATE campaign_tiers
    SET current_backers = current_backers + 1
    WHERE id = $1
  `;
  await pool.query(query, [tierId]);
};

/**
 * Decrement tier backer count
 */
export const decrementTierBackers = async (tierId: string): Promise<void> => {
  const query = `
    UPDATE campaign_tiers
    SET current_backers = GREATEST(current_backers - 1, 0)
    WHERE id = $1
  `;
  await pool.query(query, [tierId]);
};

/**
 * Delete tier
 */
export const deleteTier = async (tierId: string): Promise<void> => {
  await pool.query('DELETE FROM campaign_tiers WHERE id = $1', [tierId]);
};

/**
 * Check if tier is available
 */
export const isTierAvailable = async (tierId: string): Promise<boolean> => {
  const tier = await getTierById(tierId);
  if (!tier) return false;

  // If no max backers set, always available
  if (!tier.maxBackers) return true;

  // Check if current backers is less than max
  return tier.currentBackers < tier.maxBackers;
};

/**
 * Map database row to CampaignTier interface
 */
const mapTierFromDb = (row: any): CampaignTier => ({
  id: row.id,
  campaignId: row.campaign_id,
  name: row.name,
  amount: parseFloat(row.amount),
  description: row.description,
  rewards: row.rewards || [],
  maxBackers: row.max_backers,
  currentBackers: parseInt(row.current_backers) || 0,
  estimatedDelivery: row.estimated_delivery,
  createdAt: row.created_at,
});
