import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAllIdeas } from '../services/idea.service';
import { Idea, stageEmojis, stageLabels } from '../types/idea.types';
import { useAuthStore } from '../store/authStore';

export default function IdeasFeed() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadIdeas();
  }, []);

  const loadIdeas = async () => {
    try {
      setIsLoading(true);
      const response = await getAllIdeas({ sortBy: 'recent', limit: 20 });
      setIdeas(response.ideas);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load ideas');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading ideas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4">
        <p className="text-sm text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Ideas Feed</h2>
          <p className="text-gray-600 mt-1">Discover and connect with great ideas</p>
        </div>
        {isAuthenticated && (
          <button
            onClick={() => navigate('/ideas/new')}
            className="btn-primary"
          >
            ✨ Share Your Spark
          </button>
        )}
      </div>

      {/* Ideas List */}
      {ideas.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600 text-lg">No ideas yet. Be the first to share! 🌱</p>
          {isAuthenticated && (
            <button
              onClick={() => navigate('/ideas/new')}
              className="btn-primary mt-4"
            >
              Share Your First Idea
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {ideas.map((idea) => (
            <Link
              key={idea.id}
              to={`/ideas/${idea.id}`}
              className="card block hover:shadow-md transition-shadow"
            >
              {/* Idea Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold">
                    {idea.creator.fullName?.[0] || idea.creator.username[0]}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {idea.creator.fullName || idea.creator.username}
                    </p>
                    <p className="text-sm text-gray-500">
                      @{idea.creator.username} · {formatTimeAgo(idea.createdAt)}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-700">
                  {stageEmojis[idea.stage]} {stageLabels[idea.stage]}
                </span>
              </div>

              {/* Idea Content */}
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {idea.title}
              </h3>
              <p className="text-gray-600 mb-4 line-clamp-2">
                {idea.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {idea.helpWantedTags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-1 rounded-md bg-orange-100 text-orange-700"
                  >
                    {tag}
                  </span>
                ))}
                {idea.categoryTags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-1 rounded-md bg-blue-100 text-blue-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Stats */}
              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <span className="flex items-center space-x-1">
                  <span>✨</span>
                  <span>{idea.sparkCount} Sparks</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span>🌱</span>
                  <span>{idea.nurtureCount} Nurtures</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span>💬</span>
                  <span>{idea.commentCount} Comments</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span>👁️</span>
                  <span>{idea.viewCount} Views</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
