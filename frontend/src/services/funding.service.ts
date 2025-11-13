import apiClient from './api';
import {
  FundingCampaign,
  CampaignWithDetails,
  CampaignFullDetails,
  CreateCampaignData,
  MakeInvestmentData,
  Investment,
  InvestmentWithDetails,
  CampaignUpdate,
  CampaignUpdateWithDetails,
} from '../types/funding.types';

/**
 * Create a new funding campaign
 */
export const createCampaign = async (data: CreateCampaignData): Promise<FundingCampaign> => {
  const response = await apiClient.post<FundingCampaign>('/funding/campaigns', data);
  return response.data;
};

/**
 * Get campaign by ID with full details
 */
export const getCampaign = async (campaignId: string): Promise<CampaignFullDetails> => {
  const response = await apiClient.get<CampaignFullDetails>(`/funding/campaigns/${campaignId}`);
  return response.data;
};

/**
 * Get all campaigns for an idea
 */
export const getIdeaCampaigns = async (ideaId: string): Promise<FundingCampaign[]> => {
  const response = await apiClient.get<FundingCampaign[]>(`/funding/ideas/${ideaId}/campaigns`);
  return response.data;
};

/**
 * Get active campaign for an idea
 */
export const getActiveIdeaCampaign = async (ideaId: string): Promise<{
  campaign: FundingCampaign;
  tiers: any[];
  stats: any;
}> => {
  const response = await apiClient.get(`/funding/ideas/${ideaId}/active`);
  return response.data;
};

/**
 * Browse all active campaigns
 */
export const browseCampaigns = async (params?: {
  limit?: number;
  offset?: number;
  sortBy?: 'recent' | 'ending_soon' | 'trending' | 'funding_goal';
  categoryTags?: string[];
  minGoal?: number;
  maxGoal?: number;
}): Promise<{
  campaigns: CampaignWithDetails[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}> => {
  const queryParams = new URLSearchParams();

  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());
  if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params?.categoryTags && params.categoryTags.length > 0) {
    queryParams.append('categoryTags', params.categoryTags.join(','));
  }
  if (params?.minGoal) queryParams.append('minGoal', params.minGoal.toString());
  if (params?.maxGoal) queryParams.append('maxGoal', params.maxGoal.toString());

  const response = await apiClient.get(`/funding/campaigns?${queryParams.toString()}`);
  return response.data;
};

/**
 * Update campaign (draft only)
 */
export const updateCampaign = async (
  campaignId: string,
  data: Partial<CreateCampaignData>
): Promise<FundingCampaign> => {
  const response = await apiClient.put<FundingCampaign>(`/funding/campaigns/${campaignId}`, data);
  return response.data;
};

/**
 * Launch campaign (change from draft to active)
 */
export const launchCampaign = async (campaignId: string): Promise<void> => {
  await apiClient.post(`/funding/campaigns/${campaignId}/launch`);
};

/**
 * Cancel campaign
 */
export const cancelCampaign = async (campaignId: string): Promise<void> => {
  await apiClient.post(`/funding/campaigns/${campaignId}/cancel`);
};

/**
 * Delete campaign (draft only)
 */
export const deleteCampaign = async (campaignId: string): Promise<void> => {
  await apiClient.delete(`/funding/campaigns/${campaignId}`);
};

/**
 * Make investment/pledge
 */
export const makeInvestment = async (data: MakeInvestmentData): Promise<Investment> => {
  const { campaignId, ...investmentData } = data;
  const response = await apiClient.post<Investment>(
    `/funding/campaigns/${campaignId}/invest`,
    investmentData
  );
  return response.data;
};

/**
 * Get campaign investments/backers
 */
export const getCampaignInvestments = async (
  campaignId: string,
  params?: { limit?: number; offset?: number }
): Promise<{
  investments: InvestmentWithDetails[];
  pagination: { total: number; limit: number; offset: number };
}> => {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());

  const response = await apiClient.get(
    `/funding/campaigns/${campaignId}/investments?${queryParams.toString()}`
  );
  return response.data;
};

/**
 * Get user's investments
 */
export const getMyInvestments = async (params?: {
  limit?: number;
  offset?: number;
}): Promise<{
  investments: InvestmentWithDetails[];
  pagination: { total: number; limit: number; offset: number };
}> => {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());

  const response = await apiClient.get(`/funding/my-investments?${queryParams.toString()}`);
  return response.data;
};

/**
 * Create campaign update
 */
export const createCampaignUpdate = async (
  campaignId: string,
  data: { title: string; content: string; isPublic?: boolean }
): Promise<CampaignUpdate> => {
  const response = await apiClient.post<CampaignUpdate>(
    `/funding/campaigns/${campaignId}/updates`,
    data
  );
  return response.data;
};

/**
 * Get campaign updates
 */
export const getCampaignUpdates = async (
  campaignId: string,
  params?: { limit?: number; offset?: number }
): Promise<{
  updates: CampaignUpdateWithDetails[];
  pagination: { total: number; limit: number; offset: number };
}> => {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());

  const response = await apiClient.get(
    `/funding/campaigns/${campaignId}/updates?${queryParams.toString()}`
  );
  return response.data;
};

/**
 * Format currency amount
 */
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

/**
 * Calculate funding progress percentage
 */
export const calculateProgress = (currentAmount: number, fundingGoal: number): number => {
  return Math.min(Math.round((currentAmount / fundingGoal) * 100), 100);
};

/**
 * Calculate days remaining
 */
export const getDaysRemaining = (endDate: string): number => {
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

/**
 * Check if campaign is active
 */
export const isCampaignActive = (campaign: FundingCampaign): boolean => {
  if (campaign.status !== 'active') return false;

  const now = new Date();
  const start = new Date(campaign.startDate);
  const end = new Date(campaign.endDate);

  return now >= start && now <= end;
};
