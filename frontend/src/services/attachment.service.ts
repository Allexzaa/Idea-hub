import apiClient from './api';

export interface Attachment {
  id: string;
  ideaId: string | null;
  commentId: string | null;
  userId: string;
  userName: string;
  fileName: string;
  fileUrl: string;
  fileType: string | null;
  fileSize: number | null;
  createdAt: string;
}

export interface UploadResponse {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string | null;
  fileSize: number | null;
}

/**
 * Upload file for an idea
 */
export const uploadForIdea = async (ideaId: string, file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post<UploadResponse>(
    `/attachments/idea/${ideaId}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

/**
 * Upload file for a comment
 */
export const uploadForComment = async (commentId: string, file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post<UploadResponse>(
    `/attachments/comment/${commentId}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

/**
 * Get attachments for an idea
 */
export const getIdeaAttachments = async (ideaId: string): Promise<Attachment[]> => {
  const response = await apiClient.get<Attachment[]>(`/attachments/idea/${ideaId}`);
  return response.data;
};

/**
 * Get attachments for a comment
 */
export const getCommentAttachments = async (commentId: string): Promise<Attachment[]> => {
  const response = await apiClient.get<Attachment[]>(`/attachments/comment/${commentId}`);
  return response.data;
};

/**
 * Delete attachment
 */
export const deleteAttachment = async (attachmentId: string): Promise<void> => {
  await apiClient.delete(`/attachments/${attachmentId}`);
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number | null): string => {
  if (!bytes) return 'Unknown size';

  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Get file icon based on file type
 */
export const getFileIcon = (fileType: string | null): string => {
  if (!fileType) return '📄';

  if (fileType.startsWith('image/')) return '🖼️';
  if (fileType === 'application/pdf') return '📄';
  return '📎';
};
