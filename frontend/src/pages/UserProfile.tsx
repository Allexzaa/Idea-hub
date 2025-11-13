import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getUserProfile, UserProfileResponse } from '../services/user.service';
import { startConversation } from '../services/message.service';
import { useAuthStore } from '../store/authStore';
import { stageEmojis, stageLabels } from '../types/idea.types';

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated } = useAuthStore();
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStartingConversation, setIsStartingConversation] = useState(false);

  useEffect(() => {
    if (userId) {
      loadProfile();
    }
  }, [userId]);

  const loadProfile = async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      const data = await getUserProfile(userId);
      setProfile(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartConversation = async () => {
    if (!userId || !isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      setIsStartingConversation(true);
      const conversation = await startConversation(userId);
      navigate(`/messages/${conversation.id}`);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to start conversation');
    } finally {
      setIsStartingConversation(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-3xl mx-auto card">
        <p className="text-red-600 mb-4">{error || 'Profile not found'}</p>
        <Link to="/ideas" className="btn-ghost">
          Go to Ideas
        </Link>
      </div>
    );
  }

  const { user, stats, ideas } = profile;
  const isOwnProfile = currentUser?.id === user.id;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="card">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName || user.username}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                user.fullName?.[0] || user.username[0]
              )}
            </div>

            {/* User Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">
                {user.fullName || user.username}
              </h1>
              <p className="text-gray-600 mt-1">@{user.username}</p>

              {user.bio && (
                <p className="mt-3 text-gray-700">{user.bio}</p>
              )}

              {user.helpWith && (
                <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm font-medium text-orange-900">Can help with:</p>
                  <p className="text-sm text-orange-700 mt-1">{user.helpWith}</p>
                </div>
              )}

              {user.skillsTags && user.skillsTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {user.skillsTags.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {isOwnProfile ? (
            <Link to="/profile/edit" className="btn-ghost">
              Edit Profile
            </Link>
          ) : isAuthenticated ? (
            <button
              onClick={handleStartConversation}
              disabled={isStartingConversation}
              className="btn-primary disabled:opacity-50"
            >
              {isStartingConversation ? 'Starting...' : '💬 Message'}
            </button>
          ) : (
            <Link to="/login" className="btn-primary">
              Login to Message
            </Link>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{stats.ideasCount}</div>
            <div className="text-sm text-gray-600 mt-1">Ideas Shared</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-secondary">{stats.sparkedCount}</div>
            <div className="text-sm text-gray-600 mt-1">Ideas Sparked</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{stats.nurturedCount}</div>
            <div className="text-sm text-gray-600 mt-1">Ideas Nurtured</div>
          </div>
        </div>

        {/* Helpfulness Score */}
        <div className="mt-4 pt-4 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600">
            Helpfulness Score:{' '}
            <span className="font-bold text-secondary">{user.helpfulnessScore}</span>
          </p>
        </div>
      </div>

      {/* User's Ideas */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {isOwnProfile ? 'Your Ideas' : `${user.fullName || user.username}'s Ideas`}
        </h2>

        {ideas.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-600">
              {isOwnProfile ? "You haven't shared any ideas yet." : 'No ideas shared yet.'}
            </p>
            {isOwnProfile && (
              <Link to="/ideas/new" className="btn-primary inline-block mt-4">
                Share Your First Idea
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {ideas.map((idea) => (
              <Link
                key={idea.id}
                to={`/ideas/${idea.id}`}
                className="block card hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-2xl">{stageEmojis[idea.stage]}</span>
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full font-medium">
                        {stageLabels[idea.stage]}
                      </span>
                    </div>

                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {idea.title}
                    </h3>

                    <p className="text-gray-600 line-clamp-2">{idea.description}</p>

                    {/* Tags */}
                    {idea.categoryTags && idea.categoryTags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {idea.categoryTags.slice(0, 3).map((tag: string) => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                        {idea.categoryTags.length > 3 && (
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                            +{idea.categoryTags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="ml-4 flex flex-col items-end space-y-1 text-sm text-gray-600">
                    <span>✨ {idea.sparkCount}</span>
                    <span>🌱 {idea.nurtureCount}</span>
                    <span>💬 {idea.commentCount}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
                  Posted {new Date(idea.createdAt).toLocaleDateString()}
                </div>
              </Link>
            ))}

            {ideas.length >= 5 && (
              <div className="text-center pt-4">
                <p className="text-sm text-gray-600">
                  Showing latest 5 ideas.{' '}
                  <Link to={`/ideas?user=${userId}`} className="text-primary hover:underline">
                    View all ideas by this user
                  </Link>
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
