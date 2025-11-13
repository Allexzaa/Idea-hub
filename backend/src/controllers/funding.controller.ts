import { Request, Response } from 'express';
import {
  createCampaign,
  getCampaignById,
  getCampaignWithDetails,
  getCampaignsByIdeaId,
  getActiveCampaignByIdeaId,
  getActiveCampaigns,
  updateCampaignStatus,
  updateCampaignStats,
  updateCampaign,
  deleteCampaign,
  canCreateCampaign,
} from '../models/funding-campaign.model';
import {
  createTier,
  getTiersByCampaignId,
  updateTier,
  deleteTier,
  isTierAvailable,
  incrementTierBackers,
  decrementTierBackers,
} from '../models/campaign-tier.model';
import {
  createInvestment,
  getInvestmentsByCampaignId,
  getInvestmentsByUserId,
  getCampaignInvestmentStats,
  updateInvestmentStatus,
  cancelInvestment,
  hasUserInvested,
  getUserCampaignTotal,
  getTopInvestors,
} from '../models/investment.model';
import {
  createUpdate,
  getUpdatesByCampaignId,
  getUpdateWithDetails,
  updateCampaignUpdate,
  deleteUpdate,
} from '../models/campaign-update.model';
import { sendNotification } from '../utils/notifications';

/**
 * Create a new funding campaign
 */
export const createFundingCampaign = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const {
      ideaId,
      title,
      description,
      fundingGoal,
      minimumInvestment,
      currency,
      startDate,
      endDate,
      useOfFunds,
      milestones,
      tiers,
    } = req.body;

    // Validate required fields
    if (!ideaId || !title || !description || !fundingGoal || !startDate || !endDate) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Check if user can create campaign for this idea
    const canCreate = await canCreateCampaign(ideaId, userId);
    if (!canCreate) {
      res.status(403).json({
        error: 'Cannot create campaign. Either you don\'t own this idea, it\'s not in the right stage (Building/Launched/Validated), or there\'s already an active campaign.',
      });
      return;
    }

    // Create campaign
    const campaign = await createCampaign({
      ideaId,
      creatorId: userId,
      title,
      description,
      fundingGoal,
      minimumInvestment: minimumInvestment || 10,
      currency: currency || 'USD',
      startDate,
      endDate,
      useOfFunds,
      milestones,
    });

    // Create tiers if provided
    if (tiers && Array.isArray(tiers) && tiers.length > 0) {
      for (const tier of tiers) {
        await createTier({
          campaignId: campaign.id,
          name: tier.name,
          amount: tier.amount,
          description: tier.description,
          rewards: tier.rewards,
          maxBackers: tier.maxBackers,
          estimatedDelivery: tier.estimatedDelivery,
        });
      }
    }

    res.status(201).json(campaign);
  } catch (error) {
    console.error('Error creating funding campaign:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get campaign by ID with full details
 */
export const getFundingCampaign = async (req: Request, res: Response): Promise<void> => {
  try {
    const { campaignId } = req.params;

    const campaign = await getCampaignWithDetails(campaignId);
    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    // Get tiers
    const tiers = await getTiersByCampaignId(campaignId);

    // Get investment stats
    const stats = await getCampaignInvestmentStats(campaignId);

    // Get top investors
    const topInvestors = await getTopInvestors(campaignId, 5);

    res.json({
      campaign,
      tiers,
      stats,
      topInvestors,
    });
  } catch (error) {
    console.error('Error getting campaign:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get all campaigns for an idea
 */
export const getIdeaCampaigns = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ideaId } = req.params;
    const campaigns = await getCampaignsByIdeaId(ideaId);

    res.json(campaigns);
  } catch (error) {
    console.error('Error getting idea campaigns:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get active campaign for an idea
 */
export const getActiveIdeaCampaign = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ideaId } = req.params;
    const campaign = await getActiveCampaignByIdeaId(ideaId);

    if (!campaign) {
      res.status(404).json({ error: 'No active campaign found' });
      return;
    }

    // Get tiers
    const tiers = await getTiersByCampaignId(campaign.id);

    // Get investment stats
    const stats = await getCampaignInvestmentStats(campaign.id);

    res.json({
      campaign,
      tiers,
      stats,
    });
  } catch (error) {
    console.error('Error getting active campaign:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Browse all active campaigns
 */
export const browseCampaigns = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      limit,
      offset,
      sortBy,
      categoryTags,
      minGoal,
      maxGoal,
    } = req.query;

    const result = await getActiveCampaigns({
      limit: limit ? parseInt(limit as string) : 20,
      offset: offset ? parseInt(offset as string) : 0,
      sortBy: (sortBy as any) || 'recent',
      categoryTags: categoryTags ? (categoryTags as string).split(',') : undefined,
      minGoal: minGoal ? parseFloat(minGoal as string) : undefined,
      maxGoal: maxGoal ? parseFloat(maxGoal as string) : undefined,
    });

    res.json({
      campaigns: result.campaigns,
      pagination: {
        total: result.total,
        limit: limit ? parseInt(limit as string) : 20,
        offset: offset ? parseInt(offset as string) : 0,
        hasMore: result.total > (parseInt(offset as string) || 0) + result.campaigns.length,
      },
    });
  } catch (error) {
    console.error('Error browsing campaigns:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update campaign
 */
export const updateFundingCampaign = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { campaignId } = req.params;
    const updates = req.body;

    // Check campaign exists and user is creator
    const campaign = await getCampaignById(campaignId);
    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    if (campaign.creatorId !== userId) {
      res.status(403).json({ error: 'Not authorized to update this campaign' });
      return;
    }

    // Cannot update active campaigns (only draft campaigns)
    if (campaign.status !== 'draft') {
      res.status(400).json({ error: 'Can only update draft campaigns' });
      return;
    }

    const updatedCampaign = await updateCampaign(campaignId, updates);
    res.json(updatedCampaign);
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Launch campaign (change from draft to active)
 */
export const launchCampaign = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { campaignId } = req.params;

    const campaign = await getCampaignById(campaignId);
    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    if (campaign.creatorId !== userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    if (campaign.status !== 'draft') {
      res.status(400).json({ error: 'Campaign is not in draft status' });
      return;
    }

    await updateCampaignStatus(campaignId, 'active');

    res.json({ message: 'Campaign launched successfully' });
  } catch (error) {
    console.error('Error launching campaign:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Cancel campaign
 */
export const cancelCampaign = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { campaignId } = req.params;

    const campaign = await getCampaignById(campaignId);
    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    if (campaign.creatorId !== userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    await updateCampaignStatus(campaignId, 'cancelled');

    res.json({ message: 'Campaign cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling campaign:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete campaign (only if draft and no investments)
 */
export const removeCampaign = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { campaignId } = req.params;

    const campaign = await getCampaignById(campaignId);
    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    if (campaign.creatorId !== userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    if (campaign.status !== 'draft') {
      res.status(400).json({ error: 'Can only delete draft campaigns' });
      return;
    }

    await deleteCampaign(campaignId);

    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Create investment/pledge
 */
export const makeInvestment = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { campaignId } = req.params;
    const { tierId, amount, message, isAnonymous } = req.body;

    // Validate
    if (!amount || amount <= 0) {
      res.status(400).json({ error: 'Invalid investment amount' });
      return;
    }

    // Check campaign exists and is active
    const campaign = await getCampaignById(campaignId);
    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    if (campaign.status !== 'active') {
      res.status(400).json({ error: 'Campaign is not active' });
      return;
    }

    // Check campaign hasn't ended
    if (new Date(campaign.endDate) < new Date()) {
      res.status(400).json({ error: 'Campaign has ended' });
      return;
    }

    // Check minimum investment
    if (amount < campaign.minimumInvestment) {
      res.status(400).json({
        error: `Minimum investment is ${campaign.currency} ${campaign.minimumInvestment}`,
      });
      return;
    }

    // If tier specified, check it's available
    if (tierId) {
      const available = await isTierAvailable(tierId);
      if (!available) {
        res.status(400).json({ error: 'This tier is no longer available' });
        return;
      }
    }

    // Create investment
    const investment = await createInvestment({
      campaignId,
      userId,
      tierId,
      amount,
      message,
      isAnonymous: isAnonymous || false,
    });

    // Confirm investment immediately (in production, this would be after payment)
    await updateInvestmentStatus(investment.id, 'confirmed');

    // Update tier backer count
    if (tierId) {
      await incrementTierBackers(tierId);
    }

    // Update campaign stats
    const stats = await getCampaignInvestmentStats(campaignId);
    await updateCampaignStats(campaignId, stats.totalAmount, stats.investorCount);

    // Check if campaign is now funded
    if (stats.totalAmount >= campaign.fundingGoal) {
      await updateCampaignStatus(campaignId, 'funded');
      // Send notification to creator
      await sendNotification({
        userId: campaign.creatorId,
        type: 'campaign_funded',
        actorId: null,
        actorName: null,
        relatedId: campaignId,
        relatedTitle: campaign.title,
      });
    }

    // Send investment notification to campaign creator
    const campaignDetails = await getCampaignWithDetails(campaignId);
    if (campaignDetails && !isAnonymous) {
      await sendNotification({
        userId: campaign.creatorId,
        type: 'investment_received',
        actorId: userId,
        actorName: req.userName || 'Someone',
        relatedId: campaignId,
        relatedTitle: campaign.title,
        metadata: { amount: amount.toString(), currency: campaign.currency },
      });
    }

    res.status(201).json(investment);
  } catch (error) {
    console.error('Error making investment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get campaign investments/backers
 */
export const getCampaignInvestments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { campaignId } = req.params;
    const { limit, offset } = req.query;

    const result = await getInvestmentsByCampaignId(campaignId, {
      limit: limit ? parseInt(limit as string) : 50,
      offset: offset ? parseInt(offset as string) : 0,
    });

    res.json({
      investments: result.investments,
      pagination: {
        total: result.total,
        limit: limit ? parseInt(limit as string) : 50,
        offset: offset ? parseInt(offset as string) : 0,
      },
    });
  } catch (error) {
    console.error('Error getting campaign investments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get user's investments
 */
export const getUserInvestments = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { limit, offset } = req.query;

    const result = await getInvestmentsByUserId(userId, {
      limit: limit ? parseInt(limit as string) : 50,
      offset: offset ? parseInt(offset as string) : 0,
    });

    res.json({
      investments: result.investments,
      pagination: {
        total: result.total,
        limit: limit ? parseInt(limit as string) : 50,
        offset: offset ? parseInt(offset as string) : 0,
      },
    });
  } catch (error) {
    console.error('Error getting user investments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Create campaign update
 */
export const postCampaignUpdate = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { campaignId } = req.params;
    const { title, content, isPublic } = req.body;

    if (!title || !content) {
      res.status(400).json({ error: 'Title and content are required' });
      return;
    }

    // Check campaign exists and user is creator
    const campaign = await getCampaignById(campaignId);
    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    if (campaign.creatorId !== userId) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const update = await createUpdate({
      campaignId,
      creatorId: userId,
      title,
      content,
      isPublic: isPublic !== false,
    });

    res.status(201).json(update);
  } catch (error) {
    console.error('Error creating campaign update:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get campaign updates
 */
export const getCampaignUpdates = async (req: Request, res: Response): Promise<void> => {
  try {
    const { campaignId } = req.params;
    const { limit, offset } = req.query;

    const result = await getUpdatesByCampaignId(campaignId, {
      limit: limit ? parseInt(limit as string) : 20,
      offset: offset ? parseInt(offset as string) : 0,
      publicOnly: true,
    });

    res.json({
      updates: result.updates,
      pagination: {
        total: result.total,
        limit: limit ? parseInt(limit as string) : 20,
        offset: offset ? parseInt(offset as string) : 0,
      },
    });
  } catch (error) {
    console.error('Error getting campaign updates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default {
  createFundingCampaign,
  getFundingCampaign,
  getIdeaCampaigns,
  getActiveIdeaCampaign,
  browseCampaigns,
  updateFundingCampaign,
  launchCampaign,
  cancelCampaign,
  removeCampaign,
  makeInvestment,
  getCampaignInvestments,
  getUserInvestments,
  postCampaignUpdate,
  getCampaignUpdates,
};
