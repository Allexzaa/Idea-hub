import { Router } from 'express';
import {
  create,
  list,
  getById,
  update,
  remove,
  getByUser,
} from '../controllers/idea.controller';
import { authenticate, optionalAuth } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   GET /api/ideas
 * @desc    Get all ideas (with filters and pagination)
 * @access  Public
 */
router.get('/', optionalAuth, list);

/**
 * @route   POST /api/ideas
 * @desc    Create a new idea
 * @access  Private
 */
router.post('/', authenticate, create);

/**
 * @route   GET /api/ideas/:id
 * @desc    Get single idea by ID
 * @access  Public
 */
router.get('/:id', optionalAuth, getById);

/**
 * @route   PUT /api/ideas/:id
 * @desc    Update idea
 * @access  Private (owner only)
 */
router.put('/:id', authenticate, update);

/**
 * @route   DELETE /api/ideas/:id
 * @desc    Delete idea
 * @access  Private (owner only)
 */
router.delete('/:id', authenticate, remove);

/**
 * @route   GET /api/ideas/user/:userId
 * @desc    Get ideas by user
 * @access  Public
 */
router.get('/user/:userId', optionalAuth, getByUser);

export default router;
