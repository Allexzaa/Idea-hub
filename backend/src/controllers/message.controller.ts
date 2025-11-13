import { Request, Response } from 'express';
import { z } from 'zod';
import {
  getOrCreateConversation,
  getUserConversations,
  isUserInConversation,
  updateLastMessageAt,
  getConversationById,
} from '../models/conversation.model';
import {
  createMessage,
  getMessagesByConversation,
  markConversationAsRead,
  getUnreadMessageCount,
} from '../models/message.model';
import { io } from '../index';

const createMessageSchema = z.object({
  recipientId: z.string().uuid('Invalid recipient ID'),
  content: z.string().min(1, 'Message cannot be empty').max(2000),
});

const getMessagesSchema = z.object({
  limit: z.string().regex(/^\d+$/).optional(),
  offset: z.string().regex(/^\d+$/).optional(),
});

/**
 * Get all conversations for current user
 */
export const getConversations = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const conversations = await getUserConversations(userId);

    res.status(200).json(conversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get messages for a conversation
 */
export const getMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { conversationId } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Verify user is part of conversation
    const hasAccess = await isUserInConversation(conversationId, userId);
    if (!hasAccess) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Validate query params
    const validatedQuery = getMessagesSchema.parse(req.query);
    const limit = validatedQuery.limit ? parseInt(validatedQuery.limit) : 50;
    const offset = validatedQuery.offset ? parseInt(validatedQuery.offset) : 0;

    const messages = await getMessagesByConversation(conversationId, limit, offset);

    // Mark messages as read
    await markConversationAsRead(conversationId, userId);

    res.status(200).json(messages);
  } catch (error: any) {
    console.error('Get messages error:', error);

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
 * Send a message
 */
export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Validate input
    const validatedData = createMessageSchema.parse(req.body);
    const { recipientId, content } = validatedData;

    // Don't allow messaging yourself
    if (recipientId === userId) {
      res.status(400).json({ error: 'Cannot message yourself' });
      return;
    }

    // Get or create conversation
    const conversation = await getOrCreateConversation(userId, recipientId);

    // Create message
    const message = await createMessage(conversation.id, userId, content);

    // Update last message timestamp
    await updateLastMessageAt(conversation.id);

    // Emit Socket.io event for real-time delivery
    io.to(`user:${recipientId}`).emit('new_message', {
      conversationId: conversation.id,
      message: {
        id: message.id,
        conversationId: message.conversation_id,
        sender: { id: userId },
        content: message.content,
        isRead: message.is_read,
        createdAt: message.created_at,
      },
    });

    res.status(201).json(message);
  } catch (error: any) {
    console.error('Send message error:', error);

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
 * Start or get conversation with a user
 */
export const startConversation = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { otherUserId } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (otherUserId === userId) {
      res.status(400).json({ error: 'Cannot create conversation with yourself' });
      return;
    }

    const conversation = await getOrCreateConversation(userId, otherUserId);

    res.status(200).json(conversation);
  } catch (error) {
    console.error('Start conversation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get unread message count
 */
export const getUnreadCount = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const count = await getUnreadMessageCount(userId);

    res.status(200).json({ count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Mark conversation as read
 */
export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { conversationId } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Verify user is part of conversation
    const hasAccess = await isUserInConversation(conversationId, userId);
    if (!hasAccess) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    await markConversationAsRead(conversationId, userId);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
