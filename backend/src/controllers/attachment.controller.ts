import { Request, Response } from 'express';
import {
  createAttachment,
  getAttachmentsByIdea,
  getAttachmentsByComment,
  getAttachmentById,
  deleteAttachment,
} from '../models/attachment.model';
import { getIdeaById } from '../models/idea.model';
import { getCommentById } from '../models/comment.model';
import { deleteFile, getFileUrl } from '../config/upload';

/**
 * Upload file for an idea
 */
export const uploadForIdea = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ideaId } = req.params;
    const userId = (req as any).userId;
    const file = req.file;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    // Verify idea exists
    const idea = await getIdeaById(ideaId);
    if (!idea) {
      // Delete uploaded file
      deleteFile(file.filename);
      res.status(404).json({ error: 'Idea not found' });
      return;
    }

    // Create attachment record
    const attachment = await createAttachment({
      ideaId,
      userId,
      fileName: file.originalname,
      fileUrl: getFileUrl(file.filename),
      fileType: file.mimetype,
      fileSize: file.size,
    });

    res.status(201).json({
      id: attachment.id,
      fileName: attachment.file_name,
      fileUrl: attachment.file_url,
      fileType: attachment.file_type,
      fileSize: attachment.file_size,
    });
  } catch (error: any) {
    console.error('Upload for idea error:', error);
    // Clean up file if error
    if (req.file) {
      deleteFile(req.file.filename);
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Upload file for a comment
 */
export const uploadForComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { commentId } = req.params;
    const userId = (req as any).userId;
    const file = req.file;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    // Verify comment exists
    const comment = await getCommentById(commentId);
    if (!comment) {
      // Delete uploaded file
      deleteFile(file.filename);
      res.status(404).json({ error: 'Comment not found' });
      return;
    }

    // Create attachment record
    const attachment = await createAttachment({
      commentId,
      userId,
      fileName: file.originalname,
      fileUrl: getFileUrl(file.filename),
      fileType: file.mimetype,
      fileSize: file.size,
    });

    res.status(201).json({
      id: attachment.id,
      fileName: attachment.file_name,
      fileUrl: attachment.file_url,
      fileType: attachment.file_type,
      fileSize: attachment.file_size,
    });
  } catch (error: any) {
    console.error('Upload for comment error:', error);
    // Clean up file if error
    if (req.file) {
      deleteFile(req.file.filename);
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get attachments for an idea
 */
export const getIdeaAttachments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ideaId } = req.params;

    const attachments = await getAttachmentsByIdea(ideaId);

    res.status(200).json(attachments);
  } catch (error) {
    console.error('Get idea attachments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get attachments for a comment
 */
export const getCommentAttachments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { commentId } = req.params;

    const attachments = await getAttachmentsByComment(commentId);

    res.status(200).json(attachments);
  } catch (error) {
    console.error('Get comment attachments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete attachment
 */
export const removeAttachment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { attachmentId } = req.params;
    const userId = (req as any).userId;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Get attachment
    const attachment = await getAttachmentById(attachmentId);
    if (!attachment) {
      res.status(404).json({ error: 'Attachment not found' });
      return;
    }

    // Check ownership
    if (attachment.user_id !== userId) {
      res.status(403).json({ error: 'You can only delete your own attachments' });
      return;
    }

    // Extract filename from URL
    const filename = attachment.file_url.split('/').pop();
    if (filename) {
      deleteFile(filename);
    }

    // Delete from database
    await deleteAttachment(attachmentId);

    res.status(200).json({ message: 'Attachment deleted successfully' });
  } catch (error) {
    console.error('Delete attachment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
