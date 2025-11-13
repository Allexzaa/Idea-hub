import { Request, Response } from 'express';
import {
  registerSchema,
  loginSchema,
  AuthResponse,
} from '../types/auth.types';
import {
  createUser,
  findUserByEmail,
  findUserByUsername,
  toUserResponse,
} from '../models/user.model';
import { hashPassword, comparePassword } from '../utils/password';
import { generateTokenPair, verifyRefreshToken } from '../utils/jwt';

/**
 * Register a new user with email and password
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate input
    const validatedData = registerSchema.parse(req.body);

    // Check if email already exists
    const existingEmail = await findUserByEmail(validatedData.email);
    if (existingEmail) {
      res.status(400).json({ error: 'Email already registered' });
      return;
    }

    // Check if username already exists
    const existingUsername = await findUserByUsername(validatedData.username);
    if (existingUsername) {
      res.status(400).json({ error: 'Username already taken' });
      return;
    }

    // Hash password
    const passwordHash = await hashPassword(validatedData.password);

    // Create user
    const user = await createUser({
      email: validatedData.email,
      username: validatedData.username,
      passwordHash,
      fullName: validatedData.fullName,
    });

    // Generate tokens
    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      username: user.username,
    });

    // Return user and tokens
    const response: AuthResponse = {
      user: toUserResponse(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };

    res.status(201).json(response);
  } catch (error: any) {
    console.error('Registration error:', error);

    if (error.name === 'ZodError') {
      res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
      return;
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Login with email and password
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate input
    const validatedData = loginSchema.parse(req.body);

    // Find user by email
    const user = await findUserByEmail(validatedData.email);
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Check if user registered with OAuth (no password)
    if (!user.password_hash) {
      res.status(401).json({
        error: `This email is registered with ${user.oauth_provider}. Please use ${user.oauth_provider} to login.`,
      });
      return;
    }

    // Verify password
    const isPasswordValid = await comparePassword(
      validatedData.password,
      user.password_hash
    );

    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Generate tokens
    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      username: user.username,
    });

    // Return user and tokens
    const response: AuthResponse = {
      user: toUserResponse(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Login error:', error);

    if (error.name === 'ZodError') {
      res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
      return;
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Refresh access token using refresh token
 */
export const refreshToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token required' });
      return;
    }

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);

    // Generate new token pair
    const tokens = generateTokenPair({
      userId: payload.userId,
      email: payload.email,
      username: payload.username,
    });

    res.status(200).json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
};

/**
 * Get current user info
 */
export const getCurrentUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // User is attached to req by auth middleware
    const user = (req as any).user;

    if (!user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    res.status(200).json(toUserResponse(user));
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Logout (client-side should delete tokens)
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  // In a stateless JWT system, logout is handled client-side by deleting tokens
  // We could add token blacklisting with Redis here if needed
  res.status(200).json({ message: 'Logged out successfully' });
};
