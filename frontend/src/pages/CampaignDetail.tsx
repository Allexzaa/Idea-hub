import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  getCampaign,
  getCampaignInvestments,
  getCampaignUpdates,
  formatCurrency,
  calculateProgress,
  getDaysRemaining,
  isCampaignActive,
} from '../services/funding.service';
import { CampaignFullDetails, InvestmentWithDetails, CampaignUpdateWithDetails } from '../types/funding.types';
import InvestmentModal from '../components/InvestmentModal';

export default function CampaignDetail() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  const [campaignData, setCampaignData] = useState<CampaignFullDetails | null>(null);
  const [investments, setInvestments] = useState<InvestmentWithDetails[]>([]);
  const [updates, setUpdates] = useState<CampaignUpdateWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'about' | 'updates' | 'backers'>('about');

  useEffect(() => {
    if (campaignId) {
      loadCampaign();
    }
  }, [campaignId]);

  const loadCampaign = async () => {
    if (!campaignId) return;

    try {
      setIsLoading(true);
      const [campaignResult, investmentsResult, updatesResult] = await Promise.all([
        getCampaign(campaignId),
        getCampaignInvestments(campaignId, { limit: 20 }),
        getCampaignUpdates(campaignId, { limit: 10 }),
      ]);

      setCampaignData(campaignResult);
      setInvestments(investmentsResult.investments);
      setUpdates(updatesResult.updates);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load campaign');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvestmentSuccess = () => {
    setShowInvestModal(false);
    loadCampaign(); // Reload to update stats
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !campaignData) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card bg-red-50 border-red-200">
          <p className="text-red-600">{error || 'Campaign not found'}</p>
          <button onClick={() => navigate('/campaigns')} className="btn-secondary mt-4">
            Browse Campaigns
          </button>
        </div>
      </div>
    );
  }

  const { campaign, tiers, stats, topInvestors } = campaignData;
  const progress = calculateProgress(stats.totalAmount, campaign.fundingGoal);
  const daysRemaining = getDaysRemaining(campaign.endDate);
  const isActive = isCampaignActive(campaign);
  const isCreator = user?.id === campaign.creatorId;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link to={`/ideas/${campaign.ideaId}`} className="text-primary hover:underline text-sm mb-2 inline-block">
          ← Back to Idea: {campaign.ideaTitle}
        </Link>

        <h1 className="text-3xl font-bold text-gray-900">{campaign.title}</h1>

        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
          <span>by {campaign.creatorName}</span>
          <span>•</span>
          <span className="capitalize">{campaign.ideaStage} stage</span>
          <span>•</span>
          <span className={`font-semibold ${
            campaign.status === 'active' ? 'text-green-600' :
            campaign.status === 'funded' ? 'text-blue-600' :
            'text-gray-600'
          }`}>
            {campaign.status.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress Card */}
          <div className="card">
            <div className="mb-4">
              <div className="flex justify-between items-baseline mb-2">
                <div>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatCurrency(stats.totalAmount, campaign.currency)}
                  </p>
                  <p className="text-sm text-gray-600">
                    of {formatCurrency(campaign.fundingGoal, campaign.currency)} goal
                  </p>
                </div>
                <p className="text-2xl font-semibold text-primary">{progress}%</p>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div
                  className="bg-primary h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-semibold text-gray-900">{stats.investorCount}</p>
                  <p className="text-sm text-gray-600">Backers</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-gray-900">{daysRemaining}</p>
                  <p className="text-sm text-gray-600">Days Left</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(stats.averageInvestment, campaign.currency)}
                  </p>
                  <p className="text-sm text-gray-600">Avg Investment</p>
                </div>
              </div>
            </div>

            {isActive && !isCreator && (
              <button onClick={() => setShowInvestModal(true)} className="btn-primary w-full">
                💰 Back This Project
              </button>
            )}

            {isCreator && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  You are the creator of this campaign
                </p>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('about')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'about'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                About
              </button>
              <button
                onClick={() => setActiveTab('updates')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'updates'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Updates ({updates.length})
              </button>
              <button
                onClick={() => setActiveTab('backers')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'backers'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Backers ({stats.investorCount})
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'about' && (
            <div className="space-y-6">
              <div className="card">
                <h2 className="text-xl font-semibold mb-3">Campaign Description</h2>
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap">{campaign.description}</p>
                </div>
              </div>

              {campaign.useOfFunds && (
                <div className="card">
                  <h2 className="text-xl font-semibold mb-3">Use of Funds</h2>
                  <p className="whitespace-pre-wrap text-gray-700">{campaign.useOfFunds}</p>
                </div>
              )}

              {campaign.milestones && campaign.milestones.length > 0 && (
                <div className="card">
                  <h2 className="text-xl font-semibold mb-3">Milestones</h2>
                  <ul className="space-y-2">
                    {campaign.milestones.map((milestone, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-primary mr-2">✓</span>
                        <span className="text-gray-700">{milestone}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'updates' && (
            <div className="space-y-4">
              {updates.length === 0 ? (
                <div className="card text-center py-12">
                  <p className="text-gray-600">No updates yet</p>
                </div>
              ) : (
                updates.map((update) => (
                  <div key={update.id} className="card">
                    <div className="flex items-start gap-3">
                      <img
                        src={update.creatorAvatar || 'https://via.placeholder.com/40'}
                        alt={update.creatorName}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="flex-1">
                        <div className="flex items-baseline justify-between mb-1">
                          <h3 className="font-semibold text-gray-900">{update.title}</h3>
                          <p className="text-sm text-gray-500">
                            {new Date(update.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap">{update.content}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'backers' && (
            <div className="space-y-4">
              {investments.length === 0 ? (
                <div className="card text-center py-12">
                  <p className="text-gray-600">No backers yet. Be the first!</p>
                </div>
              ) : (
                <div className="card">
                  <h2 className="text-xl font-semibold mb-4">Recent Backers</h2>
                  <div className="space-y-3">
                    {investments.map((investment) => (
                      <div key={investment.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                        <div className="flex items-center gap-3">
                          <img
                            src={investment.userAvatar || 'https://via.placeholder.com/32'}
                            alt={investment.userName}
                            className="w-8 h-8 rounded-full"
                          />
                          <div>
                            <p className="font-medium text-gray-900">{investment.userName}</p>
                            {investment.tierName && (
                              <p className="text-sm text-gray-600">{investment.tierName}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(investment.amount, campaign.currency)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(investment.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Investment Tiers */}
          {tiers.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Investment Tiers</h2>
              <div className="space-y-4">
                {tiers.map((tier) => (
                  <div key={tier.id} className="border border-gray-200 rounded-lg p-4 hover:border-primary transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900">{tier.name}</h3>
                      <p className="font-bold text-primary">
                        {formatCurrency(tier.amount, campaign.currency)}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{tier.description}</p>

                    {tier.rewards.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-gray-700 mb-1">Rewards:</p>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {tier.rewards.map((reward, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-primary mr-1">•</span>
                              <span>{reward}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-xs text-gray-600">
                      {tier.maxBackers ? (
                        <span>
                          {tier.currentBackers}/{tier.maxBackers} claimed
                        </span>
                      ) : (
                        <span>{tier.currentBackers} backers</span>
                      )}
                      {tier.estimatedDelivery && (
                        <span>Est: {new Date(tier.estimatedDelivery).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Investors */}
          {topInvestors.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Top Backers</h2>
              <div className="space-y-3">
                {topInvestors.map((investor, index) => (
                  <div key={investor.userId} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-semibold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{investor.userName}</p>
                      <p className="text-sm text-gray-600">
                        {formatCurrency(investor.totalAmount, campaign.currency)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Campaign Info */}
          <div className="card bg-gray-50">
            <h2 className="text-lg font-semibold mb-3">Campaign Info</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Minimum Investment:</span>
                <span className="font-medium">
                  {formatCurrency(campaign.minimumInvestment, campaign.currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Start Date:</span>
                <span className="font-medium">
                  {new Date(campaign.startDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">End Date:</span>
                <span className="font-medium">
                  {new Date(campaign.endDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Investment Modal */}
      {showInvestModal && (
        <InvestmentModal
          campaign={campaign}
          tiers={tiers}
          onClose={() => setShowInvestModal(false)}
          onSuccess={handleInvestmentSuccess}
        />
      )}
    </div>
  );
}
