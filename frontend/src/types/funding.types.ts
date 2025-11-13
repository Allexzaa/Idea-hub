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

export interface CampaignStats {
  totalAmount: number;
  investorCount: number;
  averageInvestment: number;
}

export interface TopInvestor {
  userId: string;
  userName: string;
  totalAmount: number;
  investmentCount: number;
}

export interface CampaignFullDetails {
  campaign: CampaignWithDetails;
  tiers: CampaignTier[];
  stats: CampaignStats;
  topInvestors: TopInvestor[];
}

export interface CreateCampaignData {
  ideaId: string;
  title: string;
  description: string;
  fundingGoal: number;
  minimumInvestment: number;
  currency?: string;
  startDate: string;
  endDate: string;
  useOfFunds?: string;
  milestones?: string[];
  tiers?: Array<{
    name: string;
    amount: number;
    description: string;
    rewards?: string[];
    maxBackers?: number;
    estimatedDelivery?: string;
  }>;
}

export interface MakeInvestmentData {
  campaignId: string;
  tierId?: string;
  amount: number;
  message?: string;
  isAnonymous?: boolean;
}
