import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  browseCampaigns,
  formatCurrency,
  calculateProgress,
  getDaysRemaining,
} from '../services/funding.service';
import { CampaignWithDetails } from '../types/funding.types';
import { categoryOptions } from '../types/idea.types';
import { useAuthStore } from '../store/authStore';

type SortOption = 'recent' | 'ending_soon' | 'trending' | 'funding_goal';

export default function BrowseCampaigns() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const [campaigns, setCampaigns] = useState<CampaignWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  // Filter states
  const [sortBy, setSortBy] = useState<SortOption>('trending');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [minGoal, setMinGoal] = useState('');
  const [maxGoal, setMaxGoal] = useState('');
  const [offset, setOffset] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadCampaigns(true);
  }, [sortBy, selectedCategories, minGoal, maxGoal]);

  const loadCampaigns = async (reset: boolean = false) => {
    try {
      setIsLoading(true);
      const currentOffset = reset ? 0 : offset;

      const response = await browseCampaigns({
        sortBy,
        limit: 12,
        offset: currentOffset,
        categoryTags: selectedCategories.length > 0 ? selectedCategories : undefined,
        minGoal: minGoal ? parseFloat(minGoal) : undefined,
        maxGoal: maxGoal ? parseFloat(maxGoal) : undefined,
      });

      if (reset) {
        setCampaigns(response.campaigns);
        setOffset(12);
      } else {
        setCampaigns([...campaigns, ...response.campaigns]);
        setOffset(currentOffset + 12);
      }

      setHasMore(response.pagination.hasMore);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load campaigns');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const handleClearFilters = () => {
    setSelectedCategories([]);
    setMinGoal('');
    setMaxGoal('');
    setSortBy('trending');
  };

  const hasActiveFilters =
    selectedCategories.length > 0 || minGoal || maxGoal;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Browse Funding Campaigns</h1>
          <p className="text-gray-600 mt-1">Discover and support innovative ideas</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card space-y-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="trending">Trending</option>
            <option value="recent">Newest First</option>
            <option value="ending_soon">Ending Soon</option>
            <option value="funding_goal">Highest Goal</option>
          </select>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-ghost ${hasActiveFilters ? 'bg-primary text-white' : ''}`}
          >
            🎛️ Filters{' '}
            {hasActiveFilters &&
              `(${selectedCategories.length + (minGoal ? 1 : 0) + (maxGoal ? 1 : 0)})`}
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="space-y-4 pt-4 border-t border-gray-200">
            {/* Category Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Categories</label>
              <div className="flex flex-wrap gap-2">
                {categoryOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => toggleCategory(option.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategories.includes(option.value)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Funding Goal Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Funding Goal Range (USD)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="number"
                  value={minGoal}
                  onChange={(e) => setMinGoal(e.target.value)}
                  className="input-field"
                  placeholder="Min goal"
                  min="0"
                />
                <input
                  type="number"
                  value={maxGoal}
                  onChange={(e) => setMaxGoal(e.target.value)}
                  className="input-field"
                  placeholder="Max goal"
                  min="0"
                />
              </div>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="pt-2 border-t border-gray-200">
                <button
                  onClick={handleClearFilters}
                  className="text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="card bg-red-50 border-red-200 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Campaigns Grid */}
      {campaigns.length === 0 && !isLoading ? (
        <div className="card text-center py-12">
          <p className="text-gray-600 text-lg">No active campaigns found</p>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => {
              const progress = calculateProgress(campaign.currentAmount, campaign.fundingGoal);
              const daysRemaining = getDaysRemaining(campaign.endDate);

              return (
                <Link
                  key={campaign.id}
                  to={`/campaigns/${campaign.id}`}
                  className="card hover:shadow-lg transition-shadow"
                >
                  {/* Status Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        campaign.status === 'funded'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {campaign.status === 'funded' ? '✓ FUNDED' : 'ACTIVE'}
                    </span>
                    <span className="text-sm text-gray-600 capitalize">{campaign.ideaStage}</span>
                  </div>

                  {/* Campaign Title */}
                  <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">
                    {campaign.title}
                  </h3>

                  {/* Creator */}
                  <p className="text-sm text-gray-600 mb-3">by {campaign.creatorName}</p>

                  {/* Description */}
                  <p className="text-gray-700 text-sm mb-4 line-clamp-3">{campaign.description}</p>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(campaign.currentAmount, campaign.currency)}
                      </span>
                      <span className="text-gray-600">{progress}%</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex justify-between text-sm text-gray-600 pt-3 border-t border-gray-100">
                    <div>
                      <span className="font-medium">{campaign.investorCount}</span> backers
                    </div>
                    <div>
                      <span className="font-medium">{daysRemaining}</span> days left
                    </div>
                  </div>

                  {/* Categories */}
                  {campaign.categoryTags && campaign.categoryTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {campaign.categoryTags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Load More */}
          {hasMore && !isLoading && (
            <div className="text-center pt-8">
              <button onClick={() => loadCampaigns(false)} className="btn-ghost">
                Load More Campaigns
              </button>
            </div>
          )}

          {isLoading && campaigns.length > 0 && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          )}
        </div>
      )}

      {isLoading && campaigns.length === 0 && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
}
