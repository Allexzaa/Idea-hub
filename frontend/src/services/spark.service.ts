import apiClient from './api';

export interface SparkResponse {
  sparked: boolean;
  message?: string;
}

/**
 * Toggle spark on an idea
 */
export const toggleSpark = async (ideaId: string): Promise<SparkResponse> => {
  const response = await apiClient.post<SparkResponse>(`/ideas/${ideaId}/spark`);
  return response.data;
};

/**
 * Check if user has sparked an idea
 */
export const checkSpark = async (ideaId: string): Promise<{ sparked: boolean }> => {
  const response = await apiClient.get<{ sparked: boolean }>(`/ideas/${ideaId}/spark/check`);
  return response.data;
};

export interface NurtureData {
  helpMessage?: string;
}

export interface NurtureResponse {
  nurtured: boolean;
  message?: string;
}

export interface NurtureOffer {
  id: string;
  helpMessage: string | null;
  status: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    fullName: string | null;
    avatarUrl: string | null;
  };
}

/**
 * Offer to nurture an idea
 */
export const offerNurture = async (ideaId: string, data?: NurtureData): Promise<NurtureResponse> => {
  const response = await apiClient.post<NurtureResponse>(`/ideas/${ideaId}/nurture`, data);
  return response.data;
};

/**
 * Withdraw nurture offer
 */
export const withdrawNurture = async (ideaId: string): Promise<NurtureResponse> => {
  const response = await apiClient.delete<NurtureResponse>(`/ideas/${ideaId}/nurture`);
  return response.data;
};

/**
 * Check if user has offered to nurture
 */
export const checkNurture = async (ideaId: string): Promise<{ nurtured: boolean }> => {
  const response = await apiClient.get<{ nurtured: boolean }>(`/ideas/${ideaId}/nurture/check`);
  return response.data;
};

/**
 * Get all nurture offers for an idea
 */
export const getNurtures = async (ideaId: string): Promise<NurtureOffer[]> => {
  const response = await apiClient.get<NurtureOffer[]>(`/ideas/${ideaId}/nurtures`);
  return response.data;
};
