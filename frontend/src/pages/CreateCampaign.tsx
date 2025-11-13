import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { createCampaign, launchCampaign } from '../services/funding.service';
import { getIdeaById } from '../services/idea.service';
import { Idea } from '../types/idea.types';

interface TierForm {
  name: string;
  amount: string;
  description: string;
  rewards: string[];
  maxBackers: string;
  estimatedDelivery: string;
}

export default function CreateCampaign() {
  const navigate = useNavigate();
  const { ideaId } = useParams<{ ideaId: string }>();
  const { user } = useAuthStore();

  const [idea, setIdea] = useState<Idea | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Campaign form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fundingGoal, setFundingGoal] = useState('');
  const [minimumInvestment, setMinimumInvestment] = useState('10');
  const [currency, setCurrency] = useState('USD');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [useOfFunds, setUseOfFunds] = useState('');
  const [milestones, setMilestones] = useState<string[]>(['']);

  // Tiers
  const [tiers, setTiers] = useState<TierForm[]>([]);
  const [showTierForm, setShowTierForm] = useState(false);

  // Current reward input
  const [currentReward, setCurrentReward] = useState('');

  useEffect(() => {
    if (ideaId) {
      loadIdea();
    }
  }, [ideaId]);

  const loadIdea = async () => {
    if (!ideaId) return;

    try {
      const ideaData = await getIdeaById(ideaId);
      setIdea(ideaData);

      // Check if user owns the idea
      if (ideaData.creatorId !== user?.id) {
        setError('You can only create campaigns for your own ideas');
        return;
      }

      // Check stage requirement
      if (!['building', 'launched', 'validated'].includes(ideaData.stage)) {
        setError('Only ideas in Building, Launched, or Validated stages can seek funding');
        return;
      }

      // Pre-fill title from idea
      setTitle(`Funding for ${ideaData.title}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load idea');
    }
  };

  const addMilestone = () => {
    setMilestones([...milestones, '']);
  };

  const updateMilestone = (index: number, value: string) => {
    const updated = [...milestones];
    updated[index] = value;
    setMilestones(updated);
  };

  const removeMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const addTier = () => {
    setTiers([
      ...tiers,
      {
        name: '',
        amount: '',
        description: '',
        rewards: [],
        maxBackers: '',
        estimatedDelivery: '',
      },
    ]);
    setShowTierForm(true);
  };

  const updateTier = (index: number, field: keyof TierForm, value: any) => {
    const updated = [...tiers];
    updated[index] = { ...updated[index], [field]: value };
    setTiers(updated);
  };

  const addRewardToTier = (tierIndex: number, reward: string) => {
    if (!reward.trim()) return;
    const updated = [...tiers];
    updated[tierIndex].rewards = [...updated[tierIndex].rewards, reward];
    setTiers(updated);
  };

  const removeRewardFromTier = (tierIndex: number, rewardIndex: number) => {
    const updated = [...tiers];
    updated[tierIndex].rewards = updated[tierIndex].rewards.filter((_, i) => i !== rewardIndex);
    setTiers(updated);
  };

  const removeTier = (index: number) => {
    setTiers(tiers.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent, shouldLaunch: boolean = false) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!ideaId) {
        setError('Idea ID is required');
        return;
      }

      // Validate
      if (!title || !description || !fundingGoal || !startDate || !endDate) {
        setError('Please fill in all required fields');
        return;
      }

      const goal = parseFloat(fundingGoal);
      const minInv = parseFloat(minimumInvestment);

      if (isNaN(goal) || goal <= 0) {
        setError('Funding goal must be a positive number');
        return;
      }

      if (isNaN(minInv) || minInv <= 0) {
        setError('Minimum investment must be a positive number');
        return;
      }

      // Validate dates
      const start = new Date(startDate);
      const end = new Date(endDate);
      const now = new Date();

      if (start < now) {
        setError('Start date cannot be in the past');
        return;
      }

      if (end <= start) {
        setError('End date must be after start date');
        return;
      }

      // Prepare tiers data
      const tiersData = tiers
        .filter((t) => t.name && t.amount)
        .map((t) => ({
          name: t.name,
          amount: parseFloat(t.amount),
          description: t.description,
          rewards: t.rewards,
          maxBackers: t.maxBackers ? parseInt(t.maxBackers) : undefined,
          estimatedDelivery: t.estimatedDelivery || undefined,
        }));

      const campaignData = {
        ideaId,
        title,
        description,
        fundingGoal: goal,
        minimumInvestment: minInv,
        currency,
        startDate,
        endDate,
        useOfFunds: useOfFunds || undefined,
        milestones: milestones.filter((m) => m.trim()),
        tiers: tiersData.length > 0 ? tiersData : undefined,
      };

      const campaign = await createCampaign(campaignData);

      // Launch immediately if requested
      if (shouldLaunch) {
        await launchCampaign(campaign.id);
        navigate(`/campaigns/${campaign.id}`);
      } else {
        navigate(`/campaigns/${campaign.id}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create campaign');
    } finally {
      setIsLoading(false);
    }
  };

  if (error && !idea) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card bg-red-50 border-red-200">
          <p className="text-red-600">{error}</p>
          <button onClick={() => navigate(-1)} className="btn-secondary mt-4">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Create Funding Campaign</h1>
        {idea && (
          <p className="mt-2 text-gray-600">
            For: <span className="font-semibold">{idea.title}</span>
          </p>
        )}
      </div>

      {error && (
        <div className="mb-6 card bg-red-50 border-red-200">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
        {/* Basic Information */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Campaign Details</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Campaign Title *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field"
                placeholder="e.g., Funding for My Awesome Startup"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Campaign Description *
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className="input-field"
                placeholder="Describe your campaign, what you're building, and why people should invest..."
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="fundingGoal" className="block text-sm font-medium text-gray-700 mb-1">
                  Funding Goal ({currency}) *
                </label>
                <input
                  type="number"
                  id="fundingGoal"
                  value={fundingGoal}
                  onChange={(e) => setFundingGoal(e.target.value)}
                  className="input-field"
                  placeholder="50000"
                  min="1"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label htmlFor="minimumInvestment" className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Investment ({currency}) *
                </label>
                <input
                  type="number"
                  id="minimumInvestment"
                  value={minimumInvestment}
                  onChange={(e) => setMinimumInvestment(e.target.value)}
                  className="input-field"
                  placeholder="10"
                  min="1"
                  step="0.01"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="datetime-local"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                  End Date *
                </label>
                <input
                  type="datetime-local"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Use of Funds */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Use of Funds (Optional)</h2>
          <textarea
            value={useOfFunds}
            onChange={(e) => setUseOfFunds(e.target.value)}
            rows={4}
            className="input-field"
            placeholder="Explain how you will use the funds raised..."
          />
        </div>

        {/* Milestones */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Project Milestones (Optional)</h2>

          <div className="space-y-3">
            {milestones.map((milestone, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={milestone}
                  onChange={(e) => updateMilestone(index, e.target.value)}
                  className="input-field flex-1"
                  placeholder={`Milestone ${index + 1}`}
                />
                <button
                  type="button"
                  onClick={() => removeMilestone(index)}
                  className="btn-ghost text-red-600"
                >
                  Remove
                </button>
              </div>
            ))}

            <button type="button" onClick={addMilestone} className="btn-ghost">
              + Add Milestone
            </button>
          </div>
        </div>

        {/* Investment Tiers */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Investment Tiers (Optional)</h2>
          <p className="text-sm text-gray-600 mb-4">
            Create tiers with different amounts and rewards for your backers
          </p>

          <div className="space-y-4">
            {tiers.map((tier, tierIndex) => (
              <div key={tierIndex} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold">Tier {tierIndex + 1}</h3>
                  <button
                    type="button"
                    onClick={() => removeTier(tierIndex)}
                    className="text-red-600 text-sm"
                  >
                    Remove Tier
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={tier.name}
                      onChange={(e) => updateTier(tierIndex, 'name', e.target.value)}
                      className="input-field"
                      placeholder="Tier name (e.g., Early Bird)"
                    />
                    <input
                      type="number"
                      value={tier.amount}
                      onChange={(e) => updateTier(tierIndex, 'amount', e.target.value)}
                      className="input-field"
                      placeholder="Amount"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <textarea
                    value={tier.description}
                    onChange={(e) => updateTier(tierIndex, 'description', e.target.value)}
                    className="input-field"
                    placeholder="Tier description"
                    rows={2}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="number"
                      value={tier.maxBackers}
                      onChange={(e) => updateTier(tierIndex, 'maxBackers', e.target.value)}
                      className="input-field"
                      placeholder="Max backers (optional)"
                      min="1"
                    />
                    <input
                      type="date"
                      value={tier.estimatedDelivery}
                      onChange={(e) => updateTier(tierIndex, 'estimatedDelivery', e.target.value)}
                      className="input-field"
                      placeholder="Est. delivery"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rewards
                    </label>
                    <div className="space-y-2">
                      {tier.rewards.map((reward, rewardIndex) => (
                        <div key={rewardIndex} className="flex gap-2">
                          <input
                            type="text"
                            value={reward}
                            readOnly
                            className="input-field flex-1 bg-gray-50"
                          />
                          <button
                            type="button"
                            onClick={() => removeRewardFromTier(tierIndex, rewardIndex)}
                            className="text-red-600 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ))}

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={currentReward}
                          onChange={(e) => setCurrentReward(e.target.value)}
                          className="input-field flex-1"
                          placeholder="Add a reward"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addRewardToTier(tierIndex, currentReward);
                              setCurrentReward('');
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            addRewardToTier(tierIndex, currentReward);
                            setCurrentReward('');
                          }}
                          className="btn-secondary"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <button type="button" onClick={addTier} className="btn-ghost">
              + Add Investment Tier
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="card bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-ghost"
              disabled={isLoading}
            >
              Cancel
            </button>

            <button type="submit" className="btn-secondary" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Save as Draft'}
            </button>

            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              className="btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Launching...' : 'Create & Launch'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
