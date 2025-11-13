import { Request, Response } from 'express';
import {
  createIdeaSchema,
  updateIdeaSchema,
  listIdeasQuerySchema,
  IdeaResponse,
} from '../types/idea.types';
import {
  createIdea,
  getAllIdeas,
  getIdeaById,
  updateIdea,
  deleteIdea,
  getIdeasByUserId,
  incrementViewCount,
  IdeaWithCreator,
} from '../models/idea.model';

/**
 * Convert database idea to API response format
 */
const toIdeaResponse = (idea: IdeaWithCreator): IdeaResponse => {
  return {
    id: idea.id,
    creatorId: idea.creator_id,
    title: idea.title,
    description: idea.description,
    stage: idea.stage,
    categoryTags: idea.category_tags || [],
    helpWantedTags: idea.help_wanted_tags || [],
    sparkCount: idea.spark_count,
    nurtureCount: idea.nurture_count,
    commentCount: idea.comment_count,
    viewCount: idea.view_count,
    createdAt: idea.created_at.toISOString(),
    updatedAt: idea.updated_at.toISOString(),
    creator: {
      id: idea.creator_id,
      username: idea.creator_username,
      fullName: idea.creator_full_name,
      avatarUrl: idea.creator_avatar_url,
    },
  };
};

/**
 * Create a new idea
 */
export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Validate input
    const validatedData = createIdeaSchema.parse(req.body);

    // Create idea
    const idea = await createIdea({
      creatorId: userId,
      title: validatedData.title,
      description: validatedData.description,
      categoryTags: validatedData.categoryTags,
      helpWantedTags: validatedData.helpWantedTags,
    });

    // Get idea with creator info
    const ideaWithCreator = await getIdeaById(idea.id);

    if (!ideaWithCreator) {
      res.status(500).json({ error: 'Failed to create idea' });
      return;
    }

    res.status(201).json(toIdeaResponse(ideaWithCreator));
  } catch (error: any) {
    console.error('Create idea error:', error);

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
 * Get all ideas (with filters and pagination)
 */
export const list = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate query params
    const query = listIdeasQuerySchema.parse(req.query);

    // Get ideas
    const ideas = await getAllIdeas({
      limit: query.limit,
      offset: query.offset,
      stage: query.stage,
      categoryTags: query.categoryTags,
      helpWantedTags: query.helpWantedTags,
      searchQuery: query.search,
      sortBy: query.sortBy,
    });

    const response = ideas.map(toIdeaResponse);

    res.status(200).json({
      ideas: response,
      pagination: {
        limit: query.limit,
        offset: query.offset,
        hasMore: ideas.length === query.limit,
      },
    });
  } catch (error: any) {
    console.error('List ideas error:', error);

    if (error.name === 'ZodError') {
      res.status(400).json({
        error: 'Invalid query parameters',
        details: error.errors,
      });
      return;
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get single idea by ID
 */
export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const idea = await getIdeaById(id);

    if (!idea) {
      res.status(404).json({ error: 'Idea not found' });
      return;
    }

    // Increment view count
    await incrementViewCount(id);

    res.status(200).json(toIdeaResponse(idea));
  } catch (error) {
    console.error('Get idea error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update idea
 */
export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    // Get idea
    const idea = await getIdeaById(id);

    if (!idea) {
      res.status(404).json({ error: 'Idea not found' });
      return;
    }

    // Check ownership
    if (idea.creator_id !== userId) {
      res.status(403).json({ error: 'You can only edit your own ideas' });
      return;
    }

    // Validate input
    const validatedData = updateIdeaSchema.parse(req.body);

    // Update idea
    await updateIdea(id, validatedData);

    // Get updated idea
    const updatedIdea = await getIdeaById(id);

    if (!updatedIdea) {
      res.status(500).json({ error: 'Failed to update idea' });
      return;
    }

    res.status(200).json(toIdeaResponse(updatedIdea));
  } catch (error: any) {
    console.error('Update idea error:', error);

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
 * Delete idea (soft delete)
 */
export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).userId;

    // Get idea
    const idea = await getIdeaById(id);

    if (!idea) {
      res.status(404).json({ error: 'Idea not found' });
      return;
    }

    // Check ownership
    if (idea.creator_id !== userId) {
      res.status(403).json({ error: 'You can only delete your own ideas' });
      return;
    }

    // Delete idea
    await deleteIdea(id);

    res.status(200).json({ message: 'Idea deleted successfully' });
  } catch (error) {
    console.error('Delete idea error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get ideas by user
 */
export const getByUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const ideas = await getIdeasByUserId(userId);
    const response = ideas.map(toIdeaResponse);

    res.status(200).json(response);
  } catch (error) {
    console.error('Get user ideas error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
