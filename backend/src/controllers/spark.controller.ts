import { Request, Response } from 'express';
import {
  addSpark,
  removeSpark,
  hasUserSparked,
  getSparksByIdea,
} from '../models/spark.model';
import { getIdeaById } from '../models/idea.model';
import { findUserById } from '../models/user.model';
import { sendSparkNotification } from '../utils/notifications';

/**
 * Toggle spark on an idea
 */
export const toggleSpark = async (req: Request, res: Response): Promise<void> => {
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

    // Check if user has already sparked
    const hasSparked = await hasUserSparked(userId, ideaId);

    if (hasSparked) {
      // Remove spark
      await removeSpark(userId, ideaId);
      res.status(200).json({ sparked: false, message: 'Spark removed' });
    } else {
      // Add spark
      await addSpark(userId, ideaId);

      // Send notification to idea creator
      const user = await findUserById(userId);
      if (user) {
        await sendSparkNotification(
          idea.creator_id,
          userId,
          user.username,
          ideaId,
          idea.title
        );
      }

      res.status(200).json({ sparked: true, message: 'Idea sparked!' });
    }
  } catch (error: any) {
    console.error('Toggle spark error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Check if current user has sparked an idea
 */
export const checkSpark = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ideaId } = req.params;
    const userId = (req as any).userId;

    if (!userId) {
      res.status(200).json({ sparked: false });
      return;
    }

    const sparked = await hasUserSparked(userId, ideaId);
    res.status(200).json({ sparked });
  } catch (error) {
    console.error('Check spark error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get all sparks for an idea
 */
export const getSparks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ideaId } = req.params;

    const sparks = await getSparksByIdea(ideaId);
    res.status(200).json(sparks);
  } catch (error) {
    console.error('Get sparks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
