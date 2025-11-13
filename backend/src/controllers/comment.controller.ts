import { Request, Response } from 'express';
import { z } from 'zod';
import {
  createComment,
  getCommentsByIdea,
  getCommentById,
  updateComment,
  deleteComment,
  markCommentHelpful,
  unmarkCommentHelpful,
  hasUserMarkedHelpful,
  CommentWithUser,
} from '../models/comment.model';
import { getIdeaById } from '../models/idea.model';

const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(2000, 'Comment too long'),
  parentCommentId: z.string().uuid().optional(),
});

interface CommentResponse {
  id: string;
  ideaId: string;
  content: string;
  parentCommentId: string | null;
  helpfulCount: number;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string;
    fullName: string | null;
    avatarUrl: string | null;
  };
  isHelpful?: boolean;
}

const toCommentResponse = (comment: CommentWithUser, isHelpful?: boolean): CommentResponse => {
  return {
    id: comment.id,
    ideaId: comment.idea_id,
    content: comment.content,
    parentCommentId: comment.parent_comment_id,
    helpfulCount: comment.helpful_count,
    isEdited: comment.is_edited,
    createdAt: comment.created_at.toISOString(),
    updatedAt: comment.updated_at.toISOString(),
    user: {
      id: comment.user_id,
      username: comment.user_username,
      fullName: comment.user_full_name,
      avatarUrl: comment.user_avatar_url,
    },
    isHelpful,
  };
};

/**
 * Create a new comment
 */
export const create = async (req: Request, res: Response): Promise<void> => {
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

    // Validate input
    const validatedData = commentSchema.parse(req.body);

    // Create comment
    const comment = await createComment({
      ideaId,
      userId,
      content: validatedData.content,
      parentCommentId: validatedData.parentCommentId,
    });

    // Get comment with user info
    const commentWithUser = await getCommentById(comment.id);
    if (!commentWithUser) {
      res.status(500).json({ error: 'Failed to create comment' });
      return;
    }

    res.status(201).json(toCommentResponse(commentWithUser));
  } catch (error: any) {
    console.error('Create comment error:', error);

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
 * Get all comments for an idea
 */
export const list = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ideaId } = req.params;
    const userId = (req as any).userId;

    const comments = await getCommentsByIdea(ideaId);

    // Check which comments user marked as helpful
    const commentsWithHelpful = await Promise.all(
      comments.map(async (comment) => {
        const isHelpful = userId
          ? await hasUserMarkedHelpful(comment.id, userId)
          : false;
        return toCommentResponse(comment, isHelpful);
      })
    );

    res.status(200).json(commentsWithHelpful);
  } catch (error) {
    console.error('List comments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update comment
 */
export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const { commentId } = req.params;
    const userId = (req as any).userId;

    // Get comment
    const comment = await getCommentById(commentId);
    if (!comment) {
      res.status(404).json({ error: 'Comment not found' });
      return;
    }

    // Check ownership
    if (comment.user_id !== userId) {
      res.status(403).json({ error: 'You can only edit your own comments' });
      return;
    }

    // Validate input
    const { content } = commentSchema.parse(req.body);

    // Update comment
    await updateComment(commentId, content);

    // Get updated comment
    const updatedComment = await getCommentById(commentId);
    if (!updatedComment) {
      res.status(500).json({ error: 'Failed to update comment' });
      return;
    }

    res.status(200).json(toCommentResponse(updatedComment));
  } catch (error: any) {
    console.error('Update comment error:', error);

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
 * Delete comment
 */
export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    const { commentId } = req.params;
    const userId = (req as any).userId;

    // Get comment
    const comment = await getCommentById(commentId);
    if (!comment) {
      res.status(404).json({ error: 'Comment not found' });
      return;
    }

    // Check ownership
    if (comment.user_id !== userId) {
      res.status(403).json({ error: 'You can only delete your own comments' });
      return;
    }

    // Delete comment
    await deleteComment(commentId, comment.idea_id);

    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Toggle helpful mark on comment
 */
export const toggleHelpful = async (req: Request, res: Response): Promise<void> => {
  try {
    const { commentId } = req.params;
    const userId = (req as any).userId;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Check if comment exists
    const comment = await getCommentById(commentId);
    if (!comment) {
      res.status(404).json({ error: 'Comment not found' });
      return;
    }

    // Check if already marked
    const isMarked = await hasUserMarkedHelpful(commentId, userId);

    if (isMarked) {
      await unmarkCommentHelpful(commentId, userId);
      res.status(200).json({ helpful: false, message: 'Mark removed' });
    } else {
      await markCommentHelpful(commentId, userId);
      res.status(200).json({ helpful: true, message: 'Marked as helpful!' });
    }
  } catch (error) {
    console.error('Toggle helpful error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
