import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getIdeaById, deleteIdea } from '../services/idea.service';
import { Idea, stageEmojis, stageLabels } from '../types/idea.types';
import { useAuthStore } from '../store/authStore';
import { toggleSpark, checkSpark, offerNurture, withdrawNurture, checkNurture, getNurtures, NurtureOffer } from '../services/spark.service';
import { getIdeaAttachments, Attachment } from '../services/attachment.service';
import { getActiveIdeaCampaign, formatCurrency, calculateProgress, getDaysRemaining } from '../services/funding.service';
import { FundingCampaign } from '../types/funding.types';
import Comments from '../components/Comments';
import AttachmentList from '../components/AttachmentList';

export default function IdeaDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [idea, setIdea] = useState<Idea | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Spark & Nurture state
  const [hasSparked, setHasSparked] = useState(false);
  const [hasNurtured, setHasNurtured] = useState(false);
  const [isSparkLoading, setIsSparkLoading] = useState(false);
  const [isNurtureLoading, setIsNurtureLoading] = useState(false);
  const [showNurtureDialog, setShowNurtureDialog] = useState(false);
  const [nurtureMessage, setNurtureMessage] = useState('');
  const [nurtures, setNurtures] = useState<NurtureOffer[]>([]);
  const [showNurtures, setShowNurtures] = useState(false);

  // Attachments state
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  // Funding campaign state
  const [activeCampaign, setActiveCampaign] = useState<FundingCampaign | null>(null);
  const [campaignStats, setCampaignStats] = useState<any>(null);

  useEffect(() => {
    if (id) {
      loadIdea();
      loadInteractionStatus();
      loadNurtures();
      loadAttachments();
      loadActiveCampaign();
    }
  }, [id]);

  const loadIdea = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      const data = await getIdeaById(id);
      setIdea(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load idea');
    } finally {
      setIsLoading(false);
    }
  };

  const loadInteractionStatus = async () => {
    if (!id || !isAuthenticated) return;

    try {
      const [sparkStatus, nurtureStatus] = await Promise.all([
        checkSpark(id),
        checkNurture(id),
      ]);
      setHasSparked(sparkStatus.sparked);
      setHasNurtured(nurtureStatus.nurtured);
    } catch (err) {
      // Silent fail
    }
  };

  const loadNurtures = async () => {
    if (!id) return;

    try {
      const data = await getNurtures(id);
      setNurtures(data);
    } catch (err) {
      // Silent fail
    }
  };

  const loadAttachments = async () => {
    if (!id) return;

    try {
      const data = await getIdeaAttachments(id);
      setAttachments(data);
    } catch (err) {
      // Silent fail
    }
  };

  const loadActiveCampaign = async () => {
    if (!id) return;

    try {
      const data = await getActiveIdeaCampaign(id);
      setActiveCampaign(data.campaign);
      setCampaignStats(data.stats);
    } catch (err) {
      // Silent fail - no active campaign
      setActiveCampaign(null);
      setCampaignStats(null);
    }
  };

  const handleDeleteAttachment = (attachmentId: string) => {
    setAttachments(attachments.filter(a => a.id !== attachmentId));
  };

  const handleSpark = async () => {
    if (!id || !isAuthenticated) return;

    setIsSparkLoading(true);
    try {
      const result = await toggleSpark(id);
      setHasSparked(result.sparked);

      // Update local count
      if (idea) {
        setIdea({
          ...idea,
          sparkCount: result.sparked ? idea.sparkCount + 1 : idea.sparkCount - 1,
        });
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to spark idea');
    } finally {
      setIsSparkLoading(false);
    }
  };

  const handleNurtureSubmit = async () => {
    if (!id || !isAuthenticated) return;

    setIsNurtureLoading(true);
    try {
      await offerNurture(id, { helpMessage: nurtureMessage });
      setHasNurtured(true);
      setShowNurtureDialog(false);
      setNurtureMessage('');

      // Update local count
      if (idea) {
        setIdea({
          ...idea,
          nurtureCount: idea.nurtureCount + 1,
        });
      }

      // Reload nurtures
      await loadNurtures();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to offer nurture');
    } finally {
      setIsNurtureLoading(false);
    }
  };

  const handleNurtureWithdraw = async () => {
    if (!id || !isAuthenticated) return;

    if (!confirm('Are you sure you want to withdraw your nurture offer?')) {
      return;
    }

    setIsNurtureLoading(true);
    try {
      await withdrawNurture(id);
      setHasNurtured(false);

      // Update local count
      if (idea) {
        setIdea({
          ...idea,
          nurtureCount: Math.max(idea.nurtureCount - 1, 0),
        });
      }

      // Reload nurtures
      await loadNurtures();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to withdraw nurture');
    } finally {
      setIsNurtureLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !idea) return;

    if (!confirm('Are you sure you want to delete this idea?')) {
      return;
    }

    try {
      await deleteIdea(id);
      navigate('/ideas');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete idea');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading idea...</p>
        </div>
      </div>
    );
  }

  if (error || !idea) {
    return (
      <div className="card">
        <p className="text-red-600">{error || 'Idea not found'}</p>
        <Link to="/ideas" className="btn-ghost mt-4">
          Back to Ideas
        </Link>
      </div>
    );
  }

  const isOwner = user?.id === idea.creatorId;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <Link to="/ideas" className="text-gray-600 hover:text-gray-900 inline-flex items-center">
        ← Back to Ideas
      </Link>

      {/* Main Idea Card */}
      <div className="card">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold text-lg">
              {idea.creator.fullName?.[0] || idea.creator.username[0]}
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {idea.creator.fullName || idea.creator.username}
              </p>
              <p className="text-sm text-gray-500">
                @{idea.creator.username}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Posted on {formatDate(idea.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium px-4 py-2 rounded-full bg-gray-100 text-gray-700">
              {stageEmojis[idea.stage]} {stageLabels[idea.stage]}
            </span>
            {isOwner && (
              <div className="flex space-x-2">
                <button
                  onClick={() => navigate(`/ideas/${idea.id}/edit`)}
                  className="text-sm px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="text-sm px-3 py-1 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {idea.title}
        </h1>

        {/* Description */}
        <div className="prose max-w-none mb-6">
          <p className="text-gray-700 whitespace-pre-wrap">{idea.description}</p>
        </div>

        {/* Tags */}
        {(idea.helpWantedTags.length > 0 || idea.categoryTags.length > 0) && (
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-700 mb-2">Tags:</p>
            <div className="flex flex-wrap gap-2">
              {idea.helpWantedTags.map((tag) => (
                <span
                  key={tag}
                  className="text-sm px-3 py-1 rounded-md bg-orange-100 text-orange-700"
                >
                  {tag}
                </span>
              ))}
              {idea.categoryTags.map((tag) => (
                <span
                  key={tag}
                  className="text-sm px-3 py-1 rounded-md bg-blue-100 text-blue-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="mb-6">
            <AttachmentList
              attachments={attachments}
              onDelete={handleDeleteAttachment}
            />
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center space-x-8 pt-6 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">✨</span>
            <div>
              <p className="text-lg font-semibold text-gray-900">{idea.sparkCount}</p>
              <p className="text-xs text-gray-500">Sparks</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🌱</span>
            <div>
              <p className="text-lg font-semibold text-gray-900">{idea.nurtureCount}</p>
              <p className="text-xs text-gray-500">Nurtures</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-2xl">💬</span>
            <div>
              <p className="text-lg font-semibold text-gray-900">{idea.commentCount}</p>
              <p className="text-xs text-gray-500">Comments</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-2xl">👁️</span>
            <div>
              <p className="text-lg font-semibold text-gray-900">{idea.viewCount}</p>
              <p className="text-xs text-gray-500">Views</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {isAuthenticated && !isOwner && (
          <div className="flex space-x-4 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleSpark}
              disabled={isSparkLoading}
              className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                hasSparked
                  ? 'bg-primary text-white'
                  : 'border-2 border-primary text-primary hover:bg-primary hover:text-white'
              } disabled:opacity-50`}
            >
              {isSparkLoading ? 'Loading...' : hasSparked ? '✨ Sparked!' : '✨ Spark This Idea'}
            </button>
            <button
              onClick={() => hasNurtured ? handleNurtureWithdraw() : setShowNurtureDialog(true)}
              disabled={isNurtureLoading}
              className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                hasNurtured
                  ? 'bg-secondary text-white'
                  : 'border-2 border-secondary text-secondary hover:bg-secondary hover:text-white'
              } disabled:opacity-50`}
            >
              {isNurtureLoading ? 'Loading...' : hasNurtured ? '🌱 Nurturing' : '🌱 Offer to Nurture'}
            </button>
          </div>
        )}
      </div>

      {/* Nurture Dialog */}
      {showNurtureDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Offer to Nurture 🌱</h3>
            <p className="text-gray-600 mb-4">
              Let {idea.creator.fullName || idea.creator.username} know how you can help with this idea!
            </p>
            <textarea
              value={nurtureMessage}
              onChange={(e) => setNurtureMessage(e.target.value)}
              placeholder="I can help with... (optional)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary mb-4"
              rows={4}
            />
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowNurtureDialog(false);
                  setNurtureMessage('');
                }}
                className="btn-ghost flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleNurtureSubmit}
                disabled={isNurtureLoading}
                className="btn-secondary flex-1"
              >
                {isNurtureLoading ? 'Sending...' : 'Send Offer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nurture Offers Section */}
      {nurtures.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">People Offering to Help 🌱</h3>
            <button
              onClick={() => setShowNurtures(!showNurtures)}
              className="text-sm text-primary hover:underline"
            >
              {showNurtures ? 'Hide' : `View ${nurtures.length} offer${nurtures.length > 1 ? 's' : ''}`}
            </button>
          </div>
          {showNurtures && (
            <div className="space-y-4">
              {nurtures.map((nurture) => (
                <div key={nurture.id} className="border-l-4 border-secondary pl-4 py-2">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-semibold">
                      {nurture.user.fullName?.[0] || nurture.user.username[0]}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{nurture.user.fullName || nurture.user.username}</p>
                      <p className="text-xs text-gray-500">@{nurture.user.username}</p>
                    </div>
                  </div>
                  {nurture.helpMessage && (
                    <p className="text-gray-700 text-sm">{nurture.helpMessage}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Funding Campaign Section */}
      {activeCampaign && campaignStats ? (
        <div className="card bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <span>💰</span> Active Funding Campaign
            </h3>
            <span className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
              ACTIVE
            </span>
          </div>

          <h4 className="text-lg font-medium text-gray-900 mb-3">{activeCampaign.title}</h4>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(campaignStats.totalAmount, activeCampaign.currency)}
              </p>
              <p className="text-sm text-gray-600">Raised</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {campaignStats.investorCount}
              </p>
              <p className="text-sm text-gray-600">Backers</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {getDaysRemaining(activeCampaign.endDate)}
              </p>
              <p className="text-sm text-gray-600">Days Left</p>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-700">
                Goal: {formatCurrency(activeCampaign.fundingGoal, activeCampaign.currency)}
              </span>
              <span className="font-semibold text-gray-900">
                {calculateProgress(campaignStats.totalAmount, activeCampaign.fundingGoal)}%
              </span>
            </div>
            <div className="w-full bg-white rounded-full h-3">
              <div
                className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(calculateProgress(campaignStats.totalAmount, activeCampaign.fundingGoal), 100)}%`,
                }}
              ></div>
            </div>
          </div>

          <Link
            to={`/campaigns/${activeCampaign.id}`}
            className="btn-primary w-full text-center"
          >
            View Campaign & Back This Project
          </Link>
        </div>
      ) : (
        isOwner &&
        ['building', 'launched', 'validated'].includes(idea.stage) && (
          <div className="card bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">💡</span>
              <h3 className="text-xl font-semibold">Ready to Seek Funding?</h3>
            </div>
            <p className="text-gray-700 mb-4">
              Your idea is at the {stageLabels[idea.stage]} stage! Create a funding campaign to get
              financial support from investors and the community.
            </p>
            <button
              onClick={() => navigate(`/ideas/${idea.id}/create-campaign`)}
              className="btn-primary"
            >
              🚀 Create Funding Campaign
            </button>
          </div>
        )
      )}

      {/* Comments Section */}
      <div className="card">
        <h3 className="text-xl font-semibold mb-6">Discussion 💬</h3>
        <Comments
          ideaId={idea.id}
          onCommentCountChange={(count) => {
            setIdea((prev) => (prev ? { ...prev, commentCount: count } : prev));
          }}
        />
      </div>
    </div>
  );
}
