import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getMessages,
  sendMessage,
  markConversationAsRead,
  Message,
} from '../services/message.service';
import { getUserProfile } from '../services/user.service';
import { useAuthStore } from '../store/authStore';
import { getSocket } from '../utils/socket';

export default function Conversation() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otherUser, setOtherUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (conversationId) {
      loadMessages();
    }

    // Listen for new messages via Socket.io
    const socket = getSocket();
    if (socket) {
      socket.on('new_message', (data: any) => {
        if (data.conversationId === conversationId) {
          setMessages((prev) => [data.message, ...prev]);
          scrollToBottom();
        }
      });

      return () => {
        socket.off('new_message');
      };
    }
  }, [conversationId, isAuthenticated]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    if (!conversationId) return;

    try {
      setIsLoading(true);
      const data = await getMessages(conversationId);
      setMessages(data.reverse()); // Reverse to show oldest first

      // Get other user info from first message
      if (data.length > 0) {
        const firstMessage = data[0];
        const otherUserId = firstMessage.sender.id === user?.id
          ? data.find(m => m.sender.id !== user?.id)?.sender.id
          : firstMessage.sender.id;

        if (otherUserId) {
          const profile = await getUserProfile(otherUserId);
          setOtherUser(profile.user);
        }
      }

      // Mark as read
      await markConversationAsRead(conversationId);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !otherUser || isSending) return;

    setIsSending(true);
    try {
      const message = await sendMessage({
        recipientId: otherUser.id,
        content: newMessage,
      });

      setMessages([...messages, message as any]);
      setNewMessage('');
      scrollToBottom();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto card">
        <p className="text-red-600 mb-4">{error}</p>
        <Link to="/messages" className="btn-ghost">
          Back to Messages
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="card mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/messages" className="text-gray-600 hover:text-gray-900">
              ← Back
            </Link>
            {otherUser && (
              <>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold">
                  {otherUser.avatarUrl ? (
                    <img
                      src={otherUser.avatarUrl}
                      alt={otherUser.fullName || otherUser.username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    otherUser.fullName?.[0] || otherUser.username[0]
                  )}
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">
                    {otherUser.fullName || otherUser.username}
                  </h2>
                  <p className="text-sm text-gray-600">@{otherUser.username}</p>
                </div>
              </>
            )}
          </div>
          {otherUser && (
            <Link to={`/users/${otherUser.id}`} className="btn-ghost">
              View Profile
            </Link>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="card mb-4" style={{ height: '500px', overflow: 'auto' }}>
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <div className="text-6xl mb-4">💬</div>
              <p className="text-gray-600">
                No messages yet. Start the conversation!
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 p-4">
            {messages.map((message) => {
              const isOwn = message.sender.id === user?.id;
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-2 max-w-md ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {!isOwn && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                        {message.sender.avatarUrl ? (
                          <img
                            src={message.sender.avatarUrl}
                            alt={message.sender.fullName || message.sender.username}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          message.sender.fullName?.[0] || message.sender.username[0]
                        )}
                      </div>
                    )}
                    <div>
                      <div
                        className={`px-4 py-2 rounded-lg ${
                          isOwn
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{message.content}</p>
                      </div>
                      <p className={`text-xs text-gray-500 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                        {formatTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Send Message Form */}
      <form onSubmit={handleSendMessage} className="card">
        <div className="flex space-x-2">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
            placeholder="Type a message... (Press Enter to send)"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            rows={2}
          />
          <button
            type="submit"
            disabled={isSending || !newMessage.trim()}
            className="btn-primary self-end disabled:opacity-50"
          >
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
}
