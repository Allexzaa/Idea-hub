import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getIdeaById, updateIdea } from '../services/idea.service';
import { categoryOptions, helpWantedOptions, ideaStages, stageLabels, stageEmojis, IdeaStage } from '../types/idea.types';
import { useAuthStore } from '../store/authStore';

const updateIdeaSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200).optional(),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000).optional(),
  stage: z.enum(['spark', 'growing', 'building', 'launched', 'validated']).optional(),
  categoryTags: z.array(z.string()).optional(),
  helpWantedTags: z.array(z.string()).optional(),
});

type UpdateIdeaFormData = z.infer<typeof updateIdeaSchema>;

export default function EditIdea() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedHelpWanted, setSelectedHelpWanted] = useState<string[]>([]);
  const [selectedStage, setSelectedStage] = useState<IdeaStage>('spark');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<UpdateIdeaFormData>({
    resolver: zodResolver(updateIdeaSchema),
  });

  useEffect(() => {
    if (id) {
      loadIdea();
    }
  }, [id]);

  const loadIdea = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      const idea = await getIdeaById(id);

      // Check ownership
      if (idea.creatorId !== user?.id) {
        setError('You can only edit your own ideas');
        return;
      }

      // Pre-fill form
      setValue('title', idea.title);
      setValue('description', idea.description);
      setSelectedStage(idea.stage);
      setSelectedCategories(idea.categoryTags || []);
      setSelectedHelpWanted(idea.helpWantedTags || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load idea');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCategory = (value: string) => {
    setSelectedCategories((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    );
  };

  const toggleHelpWanted = (value: string) => {
    setSelectedHelpWanted((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    );
  };

  const onSubmit = async (data: UpdateIdeaFormData) => {
    if (!id) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await updateIdea(id, {
        ...data,
        stage: selectedStage,
        categoryTags: selectedCategories,
        helpWantedTags: selectedHelpWanted,
      });
      navigate(`/ideas/${id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update idea');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto card">
        <p className="text-red-600 mb-4">{error}</p>
        <Link to={id ? `/ideas/${id}` : '/ideas'} className="btn-ghost">
          Go Back
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <Link to={`/ideas/${id}`} className="text-gray-600 hover:text-gray-900 mb-4 inline-block">
          ← Back to Idea
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Edit Your Idea</h1>
        <p className="text-gray-600 mt-2">
          Update your idea details and track its progress
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Idea Title
          </label>
          <input
            {...register('title')}
            type="text"
            placeholder="e.g., A platform to connect local musicians"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            {...register('description')}
            rows={8}
            placeholder="Describe your idea in detail..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        {/* Stage */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Idea Stage
          </label>
          <div className="grid grid-cols-5 gap-2">
            {ideaStages.map((stage) => (
              <button
                key={stage}
                type="button"
                onClick={() => setSelectedStage(stage)}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  selectedStage === stage
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div>{stageEmojis[stage]}</div>
                <div className="text-xs mt-1">{stageLabels[stage]}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Category Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categories
          </label>
          <div className="flex flex-wrap gap-2">
            {categoryOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleCategory(option.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategories.includes(option.value)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Help Wanted Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What help do you need?
          </label>
          <div className="flex flex-wrap gap-2">
            {helpWantedOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleHelpWanted(option.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedHelpWanted.includes(option.value)
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate(`/ideas/${id}`)}
            className="btn-ghost flex-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary flex-1 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
