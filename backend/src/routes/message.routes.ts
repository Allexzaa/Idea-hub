import { Router } from 'express';
import {
  getConversations,
  getMessages,
  sendMessage,
  startConversation,
  getUnreadCount,
  markAsRead,
} from '../controllers/message.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * All message routes require authentication
 */

/**
 * @route   GET /api/messages/conversations
 * @desc    Get all conversations for current user
 * @access  Private
 */
router.get('/conversations', authenticate, getConversations);

/**
 * @route   GET /api/messages/unread-count
 * @desc    Get unread message count
 * @access  Private
 */
router.get('/unread-count', authenticate, getUnreadCount);

/**
 * @route   GET /api/messages/conversations/:conversationId
 * @desc    Get messages for a conversation
 * @access  Private
 */
router.get('/conversations/:conversationId', authenticate, getMessages);

/**
 * @route   POST /api/messages/conversations/:conversationId/read
 * @desc    Mark conversation as read
 * @access  Private
 */
router.post('/conversations/:conversationId/read', authenticate, markAsRead);

/**
 * @route   POST /api/messages/send
 * @desc    Send a message
 * @access  Private
 */
router.post('/send', authenticate, sendMessage);

/**
 * @route   POST /api/messages/start/:otherUserId
 * @desc    Start or get conversation with a user
 * @access  Private
 */
router.post('/start/:otherUserId', authenticate, startConversation);

export default router;
