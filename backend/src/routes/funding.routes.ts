import { Router } from 'express';
import {
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
} from '../controllers/funding.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   POST /api/funding/campaigns
 * @desc    Create a new funding campaign
 * @access  Private
 */
router.post('/campaigns', authenticate, createFundingCampaign);

/**
 * @route   GET /api/funding/campaigns
 * @desc    Browse all active campaigns
 * @access  Public
 */
router.get('/campaigns', browseCampaigns);

/**
 * @route   GET /api/funding/campaigns/:campaignId
 * @desc    Get campaign by ID with full details
 * @access  Public
 */
router.get('/campaigns/:campaignId', getFundingCampaign);

/**
 * @route   PUT /api/funding/campaigns/:campaignId
 * @desc    Update campaign (draft only)
 * @access  Private
 */
router.put('/campaigns/:campaignId', authenticate, updateFundingCampaign);

/**
 * @route   POST /api/funding/campaigns/:campaignId/launch
 * @desc    Launch campaign (change from draft to active)
 * @access  Private
 */
router.post('/campaigns/:campaignId/launch', authenticate, launchCampaign);

/**
 * @route   POST /api/funding/campaigns/:campaignId/cancel
 * @desc    Cancel campaign
 * @access  Private
 */
router.post('/campaigns/:campaignId/cancel', authenticate, cancelCampaign);

/**
 * @route   DELETE /api/funding/campaigns/:campaignId
 * @desc    Delete campaign (draft only)
 * @access  Private
 */
router.delete('/campaigns/:campaignId', authenticate, removeCampaign);

/**
 * @route   GET /api/funding/ideas/:ideaId/campaigns
 * @desc    Get all campaigns for an idea
 * @access  Public
 */
router.get('/ideas/:ideaId/campaigns', getIdeaCampaigns);

/**
 * @route   GET /api/funding/ideas/:ideaId/active
 * @desc    Get active campaign for an idea
 * @access  Public
 */
router.get('/ideas/:ideaId/active', getActiveIdeaCampaign);

/**
 * @route   POST /api/funding/campaigns/:campaignId/invest
 * @desc    Make investment/pledge
 * @access  Private
 */
router.post('/campaigns/:campaignId/invest', authenticate, makeInvestment);

/**
 * @route   GET /api/funding/campaigns/:campaignId/investments
 * @desc    Get campaign investments/backers
 * @access  Public
 */
router.get('/campaigns/:campaignId/investments', getCampaignInvestments);

/**
 * @route   GET /api/funding/my-investments
 * @desc    Get user's investments
 * @access  Private
 */
router.get('/my-investments', authenticate, getUserInvestments);

/**
 * @route   POST /api/funding/campaigns/:campaignId/updates
 * @desc    Create campaign update
 * @access  Private
 */
router.post('/campaigns/:campaignId/updates', authenticate, postCampaignUpdate);

/**
 * @route   GET /api/funding/campaigns/:campaignId/updates
 * @desc    Get campaign updates
 * @access  Public
 */
router.get('/campaigns/:campaignId/updates', getCampaignUpdates);

export default router;
