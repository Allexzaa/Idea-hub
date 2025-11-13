import { Request, Response } from 'express';
import { z } from 'zod';
import {
  addNurture,
  removeNurture,
  hasUserNurtured,
  getNurturesByIdea,
} from '../models/nurture.model';
import { getIdeaById } from '../models/idea.model';
import { findUserById } from '../models/user.model';
import { sendNurtureNotification } from '../utils/notifications';

const nurtureSchema = z.object({
  helpMessage: z.string().max(500).optional(),
});

/**
 * Add nurture offer to an idea
 */
export const offerNurture = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ideaId } = req.params;
    const userId = (req as any).userId;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Check if idea exists
    const idea = await getIdeaById(ideaId);
    if (!idea) {
      res.status(404).json({ error: 'Idea not found' });
      return;
    }

    // Validate input
    const { helpMessage } = nurtureSchema.parse(req.body);

    // Add nurture
    const nurture = await addNurture(userId, ideaId, helpMessage);

    // Send notification to idea creator
    const user = await findUserById(userId);
    if (user) {
      await sendNurtureNotification(
        idea.creator_id,
        userId,
        user.username,
        ideaId,
        idea.title,
        helpMessage
      );
    }

    res.status(200).json({
      nurtured: true,
      message: 'Nurture offer sent!',
      nurture,
    });
  } catch (error: any) {
    console.error('Offer nurture error:', error);

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
 * Remove nurture offer
 */
export const withdrawNurture = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ideaId } = req.params;
    const userId = (req as any).userId;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    await removeNurture(userId, ideaId);

    res.status(200).json({
      nurtured: false,
      message: 'Nurture offer withdrawn',
    });
  } catch (error) {
    console.error('Withdraw nurture error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Check if current user has offered to nurture an idea
 */
export const checkNurture = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ideaId } = req.params;
    const userId = (req as any).userId;

    if (!userId) {
      res.status(200).json({ nurtured: false });
      return;
    }

    const nurtured = await hasUserNurtured(userId, ideaId);
    res.status(200).json({ nurtured });
  } catch (error) {
    console.error('Check nurture error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get all nurture offers for an idea
 */
export const getNurtures = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ideaId } = req.params;

    const nurtures = await getNurturesByIdea(ideaId);

    const formatted = nurtures.map(n => ({
      id: n.id,
      helpMessage: n.help_message,
      status: n.status,
      createdAt: n.created_at,
      user: {
        id: n.user_id,
        username: n.user_username,
        fullName: n.user_full_name,
        avatarUrl: n.user_avatar_url,
      },
    }));

    res.status(200).json(formatted);
  } catch (error) {
    console.error('Get nurtures error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
