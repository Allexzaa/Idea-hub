import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAllIdeas } from '../services/idea.service';
import { Idea, stageEmojis, stageLabels, categoryOptions, helpWantedOptions } from '../types/idea.types';
import { useAuthStore } from '../store/authStore';

type SortOption = 'recent' | 'sparks' | 'nurtures';
type StageOption = 'spark' | 'growing' | 'building' | 'launched' | 'validated' | '';

export default function IdeasFeed() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedStage, setSelectedStage] = useState<StageOption>('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedHelpWanted, setSelectedHelpWanted] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [offset, setOffset] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadIdeas(true);
  }, [searchQuery, selectedStage, selectedCategories, selectedHelpWanted, sortBy]);

  const loadIdeas = async (reset: boolean = false) => {
    try {
      setIsLoading(true);
      const currentOffset = reset ? 0 : offset;

      const response = await getAllIdeas({
        sortBy,
        limit: 20,
        offset: currentOffset,
        search: searchQuery || undefined,
        stage: selectedStage || undefined,
        categoryTags: selectedCategories.length > 0 ? selectedCategories : undefined,
        helpWantedTags: selectedHelpWanted.length > 0 ? selectedHelpWanted : undefined,
      });

      if (reset) {
        setIdeas(response.ideas);
        setOffset(20);
      } else {
        setIdeas([...ideas, ...response.ideas]);
        setOffset(currentOffset + 20);
      }

      setHasMore(response.pagination.hasMore);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load ideas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSearchInput('');
    setSelectedStage('');
    setSelectedCategories([]);
    setSelectedHelpWanted([]);
    setSortBy('recent');
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleHelpWanted = (tag: string) => {
    setSelectedHelpWanted(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const hasActiveFilters = searchQuery || selectedStage || selectedCategories.length > 0 || selectedHelpWanted.length > 0;

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

      {/* Search & Filter Bar */}
      <div className="card space-y-4">
        {/* Search + Sort */}
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search ideas by title or description..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <button type="submit" className="btn-primary">
              🔍
            </button>
          </form>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="recent">Newest First</option>
            <option value="sparks">Most Sparked</option>
            <option value="nurtures">Most Nurtured</option>
          </select>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-ghost ${hasActiveFilters ? 'bg-primary text-white' : ''}`}
          >
            🎛️ Filters {hasActiveFilters && `(${
              (searchQuery ? 1 : 0) +
              (selectedStage ? 1 : 0) +
              selectedCategories.length +
              selectedHelpWanted.length
            })`}
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="space-y-4 pt-4 border-t border-gray-200">
            {/* Stage Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Idea Stage
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedStage('')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedStage === ''
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Stages
                </button>
                {(['spark', 'growing', 'building', 'launched', 'validated'] as const).map((stage) => (
                  <button
                    key={stage}
                    onClick={() => setSelectedStage(stage)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedStage === stage
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {stageEmojis[stage]} {stageLabels[stage]}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categories
              </label>
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

            {/* Help Wanted Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Help Needed
              </label>
              <div className="flex flex-wrap gap-2">
                {helpWantedOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => toggleHelpWanted(option.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedHelpWanted.includes(option.value)
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
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

          {/* Load More */}
          {hasMore && !isLoading && (
            <div className="text-center pt-6">
              <button
                onClick={() => loadIdeas(false)}
                className="btn-ghost"
              >
                Load More Ideas
              </button>
            </div>
          )}

          {isLoading && ideas.length > 0 && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
