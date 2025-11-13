import { Request, Response } from 'express';
import { z } from 'zod';
import {
  findUserById,
  updateUserProfile,
  toUserResponse,
} from '../models/user.model';
import { getIdeasByUserId } from '../models/idea.model';
import { getSparkedIdeasByUser } from '../models/spark.model';
import { getNurturedIdeasByUser } from '../models/nurture.model';

const updateProfileSchema = z.object({
  fullName: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  skillsTags: z.array(z.string()).optional(),
  helpWith: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
});

/**
 * Get user profile by ID
 */
export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const user = await findUserById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Get user's ideas
    const ideas = await getIdeasByUserId(userId);

    // Get sparked and nurtured counts
    const sparkedIdeas = await getSparkedIdeasByUser(userId);
    const nurturedIdeas = await getNurturedIdeasByUser(userId);

    res.status(200).json({
      user: toUserResponse(user),
      stats: {
        ideasCount: ideas.length,
        sparkedCount: sparkedIdeas.length,
        nurturedCount: nurturedIdeas.length,
      },
      ideas: ideas.slice(0, 5), // Return latest 5 ideas
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update current user's profile
 */
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Validate input
    const validatedData = updateProfileSchema.parse(req.body);

    // Update profile
    const updatedUser = await updateUserProfile(userId, validatedData);

    res.status(200).json(toUserResponse(updatedUser));
  } catch (error: any) {
    console.error('Update profile error:', error);

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
