import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createIdea } from '../services/idea.service';
import { categoryOptions, helpWantedOptions } from '../types/idea.types';

const createIdeaSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000),
  categoryTags: z.array(z.string()).optional(),
  helpWantedTags: z.array(z.string()).optional(),
});

type CreateIdeaFormData = z.infer<typeof createIdeaSchema>;

export default function CreateIdea() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedHelpWanted, setSelectedHelpWanted] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateIdeaFormData>({
    resolver: zodResolver(createIdeaSchema),
  });

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

  const onSubmit = async (data: CreateIdeaFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const idea = await createIdea({
        ...data,
        categoryTags: selectedCategories,
        helpWantedTags: selectedHelpWanted,
      });
      navigate(`/ideas/${idea.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create idea');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Share Your Spark ✨</h1>
        <p className="text-gray-600 mt-2">
          Share your idea with the IdeaNest community
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
            Idea Title *
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
            Description *
          </label>
          <textarea
            {...register('description')}
            rows={8}
            placeholder="Describe your idea in detail. What problem does it solve? Who is it for? What makes it unique?"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        {/* Category Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categories (select all that apply)
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
            What help do you need? (optional)
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
            onClick={() => navigate('/ideas')}
            className="btn-ghost flex-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary flex-1 disabled:opacity-50"
          >
            {isLoading ? 'Creating...' : 'Share Your Idea 🚀'}
          </button>
        </div>
      </form>
    </div>
  );
}
