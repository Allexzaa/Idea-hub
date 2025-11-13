-- Funding Campaigns Table
CREATE TABLE IF NOT EXISTS funding_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  funding_goal DECIMAL(12, 2) NOT NULL,
  minimum_investment DECIMAL(12, 2) NOT NULL DEFAULT 10.00,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'funded', 'ended', 'cancelled')),
  current_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  investor_count INTEGER NOT NULL DEFAULT 0,
  use_of_funds TEXT,
  milestones TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_funding_campaigns_idea ON funding_campaigns(idea_id);
CREATE INDEX idx_funding_campaigns_creator ON funding_campaigns(creator_id);
CREATE INDEX idx_funding_campaigns_status ON funding_campaigns(status);
CREATE INDEX idx_funding_campaigns_end_date ON funding_campaigns(end_date);

-- Campaign Tiers Table (Investment tiers with rewards)
CREATE TABLE IF NOT EXISTS campaign_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES funding_campaigns(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  description TEXT NOT NULL,
  rewards TEXT[] NOT NULL DEFAULT '{}',
  max_backers INTEGER,
  current_backers INTEGER NOT NULL DEFAULT 0,
  estimated_delivery DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_campaign_tiers_campaign ON campaign_tiers(campaign_id);

-- Investments Table
CREATE TABLE IF NOT EXISTS investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES funding_campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier_id UUID REFERENCES campaign_tiers(id) ON DELETE SET NULL,
  amount DECIMAL(12, 2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  message TEXT,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_investments_campaign ON investments(campaign_id);
CREATE INDEX idx_investments_user ON investments(user_id);
CREATE INDEX idx_investments_tier ON investments(tier_id);
CREATE INDEX idx_investments_status ON investments(status);

-- Campaign Updates Table
CREATE TABLE IF NOT EXISTS campaign_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES funding_campaigns(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_campaign_updates_campaign ON campaign_updates(campaign_id);
CREATE INDEX idx_campaign_updates_creator ON campaign_updates(creator_id);
