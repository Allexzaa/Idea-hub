import { Request, Response } from 'express';
import { z } from 'zod';
import {
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '../models/notification.model';

const getNotificationsSchema = z.object({
  limit: z.string().regex(/^\d+$/).optional(),
  offset: z.string().regex(/^\d+$/).optional(),
});

/**
 * Get notifications for current user
 */
export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Validate query params
    const validatedQuery = getNotificationsSchema.parse(req.query);
    const limit = validatedQuery.limit ? parseInt(validatedQuery.limit) : 20;
    const offset = validatedQuery.offset ? parseInt(validatedQuery.offset) : 0;

    const notifications = await getUserNotifications(userId, limit, offset);

    res.status(200).json(notifications);
  } catch (error: any) {
    console.error('Get notifications error:', error);

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
 * Get unread notification count
 */
export const getUnreadCount = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const count = await getUnreadNotificationCount(userId);

    res.status(200).json({ count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Mark notification as read
 */
export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { notificationId } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    await markNotificationAsRead(notificationId);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    await markAllNotificationsAsRead(userId);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete notification
 */
export const removeNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { notificationId } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    await deleteNotification(notificationId);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
