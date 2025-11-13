export type IdeaStage = 'spark' | 'growing' | 'building' | 'launched' | 'validated';

export interface Idea {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  stage: IdeaStage;
  categoryTags: string[];
  helpWantedTags: string[];
  sparkCount: number;
  nurtureCount: number;
  commentCount: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    username: string;
    fullName: string | null;
    avatarUrl: string | null;
  };
}

export interface CreateIdeaData {
  title: string;
  description: string;
  categoryTags?: string[];
  helpWantedTags?: string[];
}

export interface UpdateIdeaData {
  title?: string;
  description?: string;
  stage?: IdeaStage;
  categoryTags?: string[];
  helpWantedTags?: string[];
}

export interface ListIdeasParams {
  limit?: number;
  offset?: number;
  stage?: IdeaStage;
  categoryTags?: string[];
  helpWantedTags?: string[];
  search?: string;
  sortBy?: 'recent' | 'sparks' | 'nurtures';
}

export interface ListIdeasResponse {
  ideas: Idea[];
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// Stage emoji mapping
export const stageEmojis: Record<IdeaStage, string> = {
  spark: '💭',
  growing: '🌱',
  building: '🔨',
  launched: '🚀',
  validated: '✅',
};

// Stage labels
export const stageLabels: Record<IdeaStage, string> = {
  spark: 'Spark',
  growing: 'Growing',
  building: 'Building',
  launched: 'Launched',
  validated: 'Validated',
};

// Help wanted tag options
export const helpWantedOptions = [
  { value: 'design-feedback', label: '🎨 Design feedback' },
  { value: 'technical-cofounder', label: '💻 Technical co-founder' },
  { value: 'market-validation', label: '📊 Market validation' },
  { value: 'brainstorming', label: '💡 Brainstorming' },
  { value: 'similar-makers', label: '🔍 Similar makers' },
  { value: 'funding-advice', label: '💰 Funding advice' },
  { value: 'business-model', label: '🎯 Business model help' },
];

// Category tag options
export const categoryOptions = [
  { value: 'tech', label: 'Tech' },
  { value: 'saas', label: 'SaaS' },
  { value: 'healthtech', label: 'HealthTech' },
  { value: 'edtech', label: 'EdTech' },
  { value: 'fintech', label: 'FinTech' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'community', label: 'Community' },
  { value: 'productivity', label: 'Productivity' },
  { value: 'creative', label: 'Creative' },
  { value: 'other', label: 'Other' },
];
