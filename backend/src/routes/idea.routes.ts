import { Router } from 'express';
import {
  create,
  list,
  getById,
  update,
  remove,
  getByUser,
} from '../controllers/idea.controller';
import { toggleSpark, checkSpark, getSparks } from '../controllers/spark.controller';
import { offerNurture, withdrawNurture, checkNurture, getNurtures } from '../controllers/nurture.controller';
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

// Spark routes
/**
 * @route   POST /api/ideas/:ideaId/spark
 * @desc    Toggle spark on an idea
 * @access  Private
 */
router.post('/:ideaId/spark', authenticate, toggleSpark);

/**
 * @route   GET /api/ideas/:ideaId/spark/check
 * @desc    Check if user has sparked an idea
 * @access  Private
 */
router.get('/:ideaId/spark/check', authenticate, checkSpark);

/**
 * @route   GET /api/ideas/:ideaId/sparks
 * @desc    Get all sparks for an idea
 * @access  Public
 */
router.get('/:ideaId/sparks', optionalAuth, getSparks);

// Nurture routes
/**
 * @route   POST /api/ideas/:ideaId/nurture
 * @desc    Offer to nurture an idea
 * @access  Private
 */
router.post('/:ideaId/nurture', authenticate, offerNurture);

/**
 * @route   DELETE /api/ideas/:ideaId/nurture
 * @desc    Withdraw nurture offer
 * @access  Private
 */
router.delete('/:ideaId/nurture', authenticate, withdrawNurture);

/**
 * @route   GET /api/ideas/:ideaId/nurture/check
 * @desc    Check if user has offered to nurture
 * @access  Private
 */
router.get('/:ideaId/nurture/check', authenticate, checkNurture);

/**
 * @route   GET /api/ideas/:ideaId/nurtures
 * @desc    Get all nurture offers for an idea
 * @access  Public
 */
router.get('/:ideaId/nurtures', optionalAuth, getNurtures);

export default router;
