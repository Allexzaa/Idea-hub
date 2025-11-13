import apiClient from './api';

export interface Comment {
  id: string;
  ideaId: string;
  content: string;
  parentCommentId: string | null;
  helpfulCount: number;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string;
    fullName: string | null;
    avatarUrl: string | null;
  };
  isHelpful?: boolean;
}

export interface CreateCommentData {
  content: string;
  parentCommentId?: string;
}

/**
 * Get all comments for an idea
 */
export const getComments = async (ideaId: string): Promise<Comment[]> => {
  const response = await apiClient.get<Comment[]>(`/ideas/${ideaId}/comments`);
  return response.data;
};

/**
 * Create a new comment
 */
export const createComment = async (
  ideaId: string,
  data: CreateCommentData
): Promise<Comment> => {
  const response = await apiClient.post<Comment>(`/ideas/${ideaId}/comments`, data);
  return response.data;
};

/**
 * Update comment
 */
export const updateComment = async (
  commentId: string,
  content: string
): Promise<Comment> => {
  const response = await apiClient.put<Comment>(`/comments/${commentId}`, { content });
  return response.data;
};

/**
 * Delete comment
 */
export const deleteComment = async (commentId: string): Promise<void> => {
  await apiClient.delete(`/comments/${commentId}`);
};

/**
 * Toggle helpful mark on comment
 */
export const toggleHelpful = async (commentId: string): Promise<{ helpful: boolean }> => {
  const response = await apiClient.post<{ helpful: boolean }>(
    `/comments/${commentId}/helpful`
  );
  return response.data;
};
