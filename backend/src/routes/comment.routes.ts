import { Router } from 'express';
import {
  create,
  list,
} from '../controllers/comment.controller';
import { authenticate, optionalAuth } from '../middleware/auth.middleware';

const router = Router({ mergeParams: true }); // Important: merge params from parent router

/**
 * @route   GET /api/ideas/:ideaId/comments
 * @desc    Get all comments for an idea
 * @access  Public
 */
router.get('/', optionalAuth, list);

/**
 * @route   POST /api/ideas/:ideaId/comments
 * @desc    Create a new comment
 * @access  Private
 */
router.post('/', authenticate, create);

export default router;
