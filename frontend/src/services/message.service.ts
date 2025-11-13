import apiClient from './api';

export interface MessageUser {
  id: string;
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
}

export interface Message {
  id: string;
  conversationId: string;
  sender: MessageUser;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  otherUser: MessageUser;
  lastMessage: {
    content: string;
    senderId: string;
    createdAt: string;
    isRead: boolean;
  } | null;
  unreadCount: number;
  lastMessageAt: string;
}

export interface SendMessageData {
  recipientId: string;
  content: string;
}

/**
 * Get all conversations for current user
 */
export const getConversations = async (): Promise<Conversation[]> => {
  const response = await apiClient.get<Conversation[]>('/messages/conversations');
  return response.data;
};

/**
 * Get messages for a conversation
 */
export const getMessages = async (
  conversationId: string,
  limit?: number,
  offset?: number
): Promise<Message[]> => {
  const response = await apiClient.get<Message[]>(
    `/messages/conversations/${conversationId}`,
    { params: { limit, offset } }
  );
  return response.data;
};

/**
 * Send a message
 */
export const sendMessage = async (data: SendMessageData): Promise<Message> => {
  const response = await apiClient.post<Message>('/messages/send', data);
  return response.data;
};

/**
 * Start or get conversation with a user
 */
export const startConversation = async (otherUserId: string): Promise<{ id: string }> => {
  const response = await apiClient.post<{ id: string }>(
    `/messages/start/${otherUserId}`
  );
  return response.data;
};

/**
 * Get unread message count
 */
export const getUnreadCount = async (): Promise<number> => {
  const response = await apiClient.get<{ count: number }>('/messages/unread-count');
  return response.data.count;
};

/**
 * Mark conversation as read
 */
export const markConversationAsRead = async (conversationId: string): Promise<void> => {
  await apiClient.post(`/messages/conversations/${conversationId}/read`);
};
