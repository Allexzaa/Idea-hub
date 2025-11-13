import apiClient from './api';

export interface User {
  id: string;
  email: string;
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  skillsTags: string[] | null;
  helpWith: string | null;
  helpfulnessScore: number;
  emailVerified: boolean;
  createdAt: string;
}

export interface UserProfileResponse {
  user: User;
  stats: {
    ideasCount: number;
    sparkedCount: number;
    nurturedCount: number;
  };
  ideas: any[]; // Latest 5 ideas
}

export interface UpdateProfileData {
  fullName?: string;
  bio?: string;
  skillsTags?: string[];
  helpWith?: string;
  avatarUrl?: string;
}

/**
 * Get user profile by ID
 */
export const getUserProfile = async (userId: string): Promise<UserProfileResponse> => {
  const response = await apiClient.get<UserProfileResponse>(`/users/${userId}`);
  return response.data;
};

/**
 * Update current user's profile
 */
export const updateProfile = async (data: UpdateProfileData): Promise<User> => {
  const response = await apiClient.put<User>('/users/me', data);
  return response.data;
};
