import apiClient from './api';
import {
  Idea,
  CreateIdeaData,
  UpdateIdeaData,
  ListIdeasParams,
  ListIdeasResponse,
} from '../types/idea.types';

/**
 * Get all ideas (with filters and pagination)
 */
export const getAllIdeas = async (params?: ListIdeasParams): Promise<ListIdeasResponse> => {
  const queryParams = new URLSearchParams();

  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());
  if (params?.stage) queryParams.append('stage', params.stage);
  if (params?.categoryTags) queryParams.append('categoryTags', params.categoryTags.join(','));
  if (params?.helpWantedTags) queryParams.append('helpWantedTags', params.helpWantedTags.join(','));
  if (params?.search) queryParams.append('search', params.search);
  if (params?.sortBy) queryParams.append('sortBy', params.sortBy);

  const response = await apiClient.get<ListIdeasResponse>(
    `/ideas?${queryParams.toString()}`
  );
  return response.data;
};

/**
 * Get single idea by ID
 */
export const getIdeaById = async (id: string): Promise<Idea> => {
  const response = await apiClient.get<Idea>(`/ideas/${id}`);
  return response.data;
};

/**
 * Create a new idea
 */
export const createIdea = async (data: CreateIdeaData): Promise<Idea> => {
  const response = await apiClient.post<Idea>('/ideas', data);
  return response.data;
};

/**
 * Update idea
 */
export const updateIdea = async (id: string, data: UpdateIdeaData): Promise<Idea> => {
  const response = await apiClient.put<Idea>(`/ideas/${id}`, data);
  return response.data;
};

/**
 * Delete idea
 */
export const deleteIdea = async (id: string): Promise<void> => {
  await apiClient.delete(`/ideas/${id}`);
};

/**
 * Get ideas by user ID
 */
export const getIdeasByUser = async (userId: string): Promise<Idea[]> => {
  const response = await apiClient.get<Idea[]>(`/ideas/user/${userId}`);
  return response.data;
};
