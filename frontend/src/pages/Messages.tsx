import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getConversations, Conversation } from '../services/message.service';
import { useAuthStore } from '../store/authStore';
import { initSocket, getSocket } from '../utils/socket';

export default function Messages() {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    loadConversations();

    // Initialize Socket.io for real-time updates
    if (user?.id) {
      const socket = initSocket(user.id);

      socket.on('new_message', () => {
        loadConversations();
      });

      return () => {
        socket.off('new_message');
      };
    }
  }, [isAuthenticated, user?.id]);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const data = await getConversations();
      setConversations(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load conversations');
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
          <p className="mt-4 text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto card">
        <p className="text-red-600 mb-4">{error}</p>
        <Link to="/ideas" className="btn-ghost">
          Go to Ideas
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
        <p className="text-gray-600 mt-2">
          Connect and collaborate with other IdeaNest members
        </p>
      </div>

      {conversations.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">💬</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No messages yet
          </h2>
          <p className="text-gray-600 mb-6">
            Start a conversation by visiting a user's profile and clicking "Message"
          </p>
          <Link to="/ideas" className="btn-primary inline-block">
            Browse Ideas
          </Link>
        </div>
      ) : (
        <div className="card divide-y divide-gray-200">
          {conversations.map((conversation) => (
            <Link
              key={conversation.id}
              to={`/messages/${conversation.id}`}
              className="block p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start space-x-4">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-lg font-semibold flex-shrink-0">
                  {conversation.otherUser.avatarUrl ? (
                    <img
                      src={conversation.otherUser.avatarUrl}
                      alt={conversation.otherUser.fullName || conversation.otherUser.username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    conversation.otherUser.fullName?.[0] || conversation.otherUser.username[0]
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {conversation.otherUser.fullName || conversation.otherUser.username}
                    </h3>
                    {conversation.lastMessage && (
                      <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                        {formatTimeAgo(conversation.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    @{conversation.otherUser.username}
                  </p>
                  {conversation.lastMessage && (
                    <p
                      className={`text-sm truncate ${
                        conversation.unreadCount > 0 && conversation.lastMessage.senderId !== user?.id
                          ? 'font-semibold text-gray-900'
                          : 'text-gray-600'
                      }`}
                    >
                      {conversation.lastMessage.senderId === user?.id && 'You: '}
                      {conversation.lastMessage.content}
                    </p>
                  )}
                </div>

                {/* Unread Badge */}
                {conversation.unreadCount > 0 && (
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-primary text-white text-xs font-bold rounded-full">
                      {conversation.unreadCount}
                    </span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
