import { Router } from 'express';
import { getUserProfile, updateProfile } from '../controllers/user.controller';
import { authenticate, optionalAuth } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   GET /api/users/:userId
 * @desc    Get user profile
 * @access  Public
 */
router.get('/:userId', optionalAuth, getUserProfile);

/**
 * @route   PUT /api/users/me
 * @desc    Update current user's profile
 * @access  Private
 */
router.put('/me', authenticate, updateProfile);

export default router;
