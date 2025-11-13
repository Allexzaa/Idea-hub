import { Router } from 'express';
import {
  update,
  remove,
  toggleHelpful,
} from '../controllers/comment.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   PUT /api/comments/:commentId
 * @desc    Update comment
 * @access  Private (owner only)
 */
router.put('/:commentId', authenticate, update);

/**
 * @route   DELETE /api/comments/:commentId
 * @desc    Delete comment
 * @access  Private (owner only)
 */
router.delete('/:commentId', authenticate, remove);

/**
 * @route   POST /api/comments/:commentId/helpful
 * @desc    Toggle helpful mark on comment
 * @access  Private
 */
router.post('/:commentId/helpful', authenticate, toggleHelpful);

export default router;
