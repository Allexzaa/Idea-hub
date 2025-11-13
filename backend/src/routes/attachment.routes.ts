import { Router } from 'express';
import {
  uploadForIdea,
  uploadForComment,
  getIdeaAttachments,
  getCommentAttachments,
  removeAttachment,
} from '../controllers/attachment.controller';
import { authenticate } from '../middleware/auth.middleware';
import { upload } from '../config/upload';

const router = Router();

/**
 * @route   POST /api/attachments/idea/:ideaId
 * @desc    Upload file for an idea
 * @access  Private
 */
router.post(
  '/idea/:ideaId',
  authenticate,
  upload.single('file'),
  uploadForIdea
);

/**
 * @route   POST /api/attachments/comment/:commentId
 * @desc    Upload file for a comment
 * @access  Private
 */
router.post(
  '/comment/:commentId',
  authenticate,
  upload.single('file'),
  uploadForComment
);

/**
 * @route   GET /api/attachments/idea/:ideaId
 * @desc    Get attachments for an idea
 * @access  Public
 */
router.get('/idea/:ideaId', getIdeaAttachments);

/**
 * @route   GET /api/attachments/comment/:commentId
 * @desc    Get attachments for a comment
 * @access  Public
 */
router.get('/comment/:commentId', getCommentAttachments);

/**
 * @route   DELETE /api/attachments/:attachmentId
 * @desc    Delete attachment
 * @access  Private
 */
router.delete('/:attachmentId', authenticate, removeAttachment);

export default router;
