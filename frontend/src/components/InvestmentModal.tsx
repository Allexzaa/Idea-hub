import { useState } from 'react';
import { makeInvestment, formatCurrency } from '../services/funding.service';
import { FundingCampaign, CampaignTier } from '../types/funding.types';

interface InvestmentModalProps {
  campaign: FundingCampaign;
  tiers: CampaignTier[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function InvestmentModal({ campaign, tiers, onClose, onSuccess }: InvestmentModalProps) {
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [investmentType, setInvestmentType] = useState<'tier' | 'custom'>('tier');

  const selectedTier = tiers.find((t) => t.id === selectedTierId);
  const amount = investmentType === 'tier' && selectedTier
    ? selectedTier.amount
    : parseFloat(customAmount) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Validate
      if (amount < campaign.minimumInvestment) {
        setError(`Minimum investment is ${formatCurrency(campaign.minimumInvestment, campaign.currency)}`);
        return;
      }

      if (investmentType === 'tier' && !selectedTierId) {
        setError('Please select a tier');
        return;
      }

      if (investmentType === 'custom' && (!customAmount || isNaN(amount))) {
        setError('Please enter a valid amount');
        return;
      }

      // Check tier availability
      if (selectedTier && selectedTier.maxBackers) {
        if (selectedTier.currentBackers >= selectedTier.maxBackers) {
          setError('This tier is no longer available');
          return;
        }
      }

      await makeInvestment({
        campaignId: campaign.id,
        tierId: investmentType === 'tier' ? selectedTierId || undefined : undefined,
        amount,
        message: message || undefined,
        isAnonymous,
      });

      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to process investment');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Back This Project</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
              disabled={isLoading}
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Investment Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Choose Investment Option
            </label>
            <div className="flex gap-4">
              {tiers.length > 0 && (
                <button
                  type="button"
                  onClick={() => setInvestmentType('tier')}
                  className={`flex-1 p-4 border-2 rounded-lg text-center transition-colors ${
                    investmentType === 'tier'
                      ? 'border-primary bg-primary bg-opacity-10'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <p className="font-semibold">Select a Tier</p>
                  <p className="text-sm text-gray-600 mt-1">Get rewards</p>
                </button>
              )}
              <button
                type="button"
                onClick={() => setInvestmentType('custom')}
                className={`flex-1 p-4 border-2 rounded-lg text-center transition-colors ${
                  investmentType === 'custom'
                    ? 'border-primary bg-primary bg-opacity-10'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <p className="font-semibold">Custom Amount</p>
                <p className="text-sm text-gray-600 mt-1">Invest any amount</p>
              </button>
            </div>
          </div>

          {/* Tier Selection */}
          {investmentType === 'tier' && tiers.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Tier
              </label>
              <div className="space-y-3">
                {tiers.map((tier) => {
                  const isAvailable = !tier.maxBackers || tier.currentBackers < tier.maxBackers;

                  return (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => isAvailable && setSelectedTierId(tier.id)}
                      disabled={!isAvailable}
                      className={`w-full text-left p-4 border-2 rounded-lg transition-colors ${
                        selectedTierId === tier.id
                          ? 'border-primary bg-primary bg-opacity-10'
                          : isAvailable
                          ? 'border-gray-300 hover:border-gray-400'
                          : 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900">{tier.name}</h3>
                        <p className="font-bold text-primary">
                          {formatCurrency(tier.amount, campaign.currency)}
                        </p>
                      </div>

                      <p className="text-sm text-gray-600 mb-2">{tier.description}</p>

                      {tier.rewards.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs font-medium text-gray-700 mb-1">Includes:</p>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {tier.rewards.map((reward, index) => (
                              <li key={index} className="flex items-start">
                                <span className="text-primary mr-1">✓</span>
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
                            {!isAvailable && <span className="text-red-600 ml-2">SOLD OUT</span>}
                          </span>
                        ) : (
                          <span>{tier.currentBackers} backers</span>
                        )}
                        {tier.estimatedDelivery && (
                          <span>Delivery: {new Date(tier.estimatedDelivery).toLocaleDateString()}</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Custom Amount */}
          {investmentType === 'custom' && (
            <div>
              <label htmlFor="customAmount" className="block text-sm font-medium text-gray-700 mb-2">
                Investment Amount ({campaign.currency})
              </label>
              <input
                type="number"
                id="customAmount"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="input-field"
                placeholder={`Minimum ${campaign.minimumInvestment}`}
                min={campaign.minimumInvestment}
                step="0.01"
                required={investmentType === 'custom'}
              />
              <p className="mt-1 text-xs text-gray-600">
                Minimum: {formatCurrency(campaign.minimumInvestment, campaign.currency)}
              </p>
            </div>
          )}

          {/* Message */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              Leave a Message (Optional)
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="input-field"
              placeholder="Share your support or thoughts..."
            />
          </div>

          {/* Anonymous Option */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isAnonymous"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <label htmlFor="isAnonymous" className="ml-2 block text-sm text-gray-700">
              Make this investment anonymous
            </label>
          </div>

          {/* Summary */}
          {amount > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-gray-900">Investment Summary</h3>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Amount:</span>
                <span className="font-semibold">{formatCurrency(amount, campaign.currency)}</span>
              </div>
              {selectedTier && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tier:</span>
                  <span className="font-semibold">{selectedTier.name}</span>
                </div>
              )}
              {isAnonymous && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Visibility:</span>
                  <span className="font-semibold">Anonymous</span>
                </div>
              )}
            </div>
          )}

          {/* Disclaimer */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-xs text-yellow-800">
              <strong>Important:</strong> This is a pledge commitment. Actual payment processing would be
              integrated with a payment provider like Stripe. By continuing, you agree to invest the specified
              amount to support this project.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost flex-1"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={isLoading || amount === 0}
            >
              {isLoading ? 'Processing...' : `Invest ${formatCurrency(amount, campaign.currency)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
