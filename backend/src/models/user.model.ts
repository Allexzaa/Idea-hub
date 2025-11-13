import { query } from '../config/database';
import { UserResponse } from '../types/auth.types';

export interface User {
  id: string;
  email: string;
  username: string;
  password_hash: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  skills_tags: string[] | null;
  help_with: string | null;
  helpfulness_score: number;
  oauth_provider: string | null;
  oauth_id: string | null;
  email_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Create a new user
 */
export const createUser = async (data: {
  email: string;
  username: string;
  passwordHash?: string;
  fullName: string;
  oauthProvider?: string;
  oauthId?: string;
}): Promise<User> => {
  const result = await query(
    `INSERT INTO users (email, username, password_hash, full_name, oauth_provider, oauth_id, email_verified)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      data.email,
      data.username,
      data.passwordHash || null,
      data.fullName,
      data.oauthProvider || null,
      data.oauthId || null,
      data.oauthProvider ? true : false, // Auto-verify OAuth users
    ]
  );
  return result.rows[0];
};

/**
 * Find user by email
 */
export const findUserByEmail = async (email: string): Promise<User | null> => {
  const result = await query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
};

/**
 * Find user by username
 */
export const findUserByUsername = async (username: string): Promise<User | null> => {
  const result = await query('SELECT * FROM users WHERE username = $1', [username]);
  return result.rows[0] || null;
};

/**
 * Find user by ID
 */
export const findUserById = async (id: string): Promise<User | null> => {
  const result = await query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0] || null;
};

/**
 * Find user by OAuth provider and ID
 */
export const findUserByOAuth = async (
  provider: string,
  oauthId: string
): Promise<User | null> => {
  const result = await query(
    'SELECT * FROM users WHERE oauth_provider = $1 AND oauth_id = $2',
    [provider, oauthId]
  );
  return result.rows[0] || null;
};

/**
 * Update user profile
 */
export const updateUserProfile = async (
  userId: string,
  data: {
    fullName?: string;
    bio?: string;
    skillsTags?: string[];
    helpWith?: string;
    avatarUrl?: string;
  }
): Promise<User> => {
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (data.fullName !== undefined) {
    updates.push(`full_name = $${paramIndex++}`);
    values.push(data.fullName);
  }
  if (data.bio !== undefined) {
    updates.push(`bio = $${paramIndex++}`);
    values.push(data.bio);
  }
  if (data.skillsTags !== undefined) {
    updates.push(`skills_tags = $${paramIndex++}`);
    values.push(data.skillsTags);
  }
  if (data.helpWith !== undefined) {
    updates.push(`help_with = $${paramIndex++}`);
    values.push(data.helpWith);
  }
  if (data.avatarUrl !== undefined) {
    updates.push(`avatar_url = $${paramIndex++}`);
    values.push(data.avatarUrl);
  }

  values.push(userId);

  const result = await query(
    `UPDATE users SET ${updates.join(', ')}, updated_at = NOW()
     WHERE id = $${paramIndex}
     RETURNING *`,
    values
  );

  return result.rows[0];
};

/**
 * Convert User to UserResponse (remove sensitive data)
 */
export const toUserResponse = (user: User): UserResponse => {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    fullName: user.full_name,
    avatarUrl: user.avatar_url,
    bio: user.bio,
    skillsTags: user.skills_tags,
    helpWith: user.help_with,
    helpfulnessScore: user.helpfulness_score,
    emailVerified: user.email_verified,
    createdAt: user.created_at,
  };
};
