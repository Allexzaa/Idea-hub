import { z } from 'zod';

// Idea stages
export const ideaStages = ['spark', 'growing', 'building', 'launched', 'validated'] as const;

// Create idea schema
export const createIdeaSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must be less than 200 characters'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description must be less than 5000 characters'),
  categoryTags: z.array(z.string()).optional(),
  helpWantedTags: z.array(z.string()).optional(),
});

// Update idea schema
export const updateIdeaSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  description: z.string().min(10).max(5000).optional(),
  stage: z.enum(ideaStages).optional(),
  categoryTags: z.array(z.string()).optional(),
  helpWantedTags: z.array(z.string()).optional(),
});

// Query params schema for listing ideas
export const listIdeasQuerySchema = z.object({
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  offset: z.string().optional().transform(val => val ? parseInt(val) : 0),
  stage: z.enum(ideaStages).optional(),
  categoryTags: z.string().optional().transform(val => val ? val.split(',') : undefined),
  helpWantedTags: z.string().optional().transform(val => val ? val.split(',') : undefined),
  search: z.string().optional(),
  sortBy: z.enum(['recent', 'sparks', 'nurtures']).optional(),
});

// Types
export type CreateIdeaInput = z.infer<typeof createIdeaSchema>;
export type UpdateIdeaInput = z.infer<typeof updateIdeaSchema>;
export type ListIdeasQuery = z.infer<typeof listIdeasQuerySchema>;

// Idea response (with creator info)
export interface IdeaResponse {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  stage: string;
  categoryTags: string[];
  helpWantedTags: string[];
  sparkCount: number;
  nurtureCount: number;
  commentCount: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    username: string;
    fullName: string | null;
    avatarUrl: string | null;
  };
}
