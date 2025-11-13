import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { updateProfile, getUserProfile } from '../services/user.service';
import { useAuthStore } from '../store/authStore';

const updateProfileSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(100),
  bio: z.string().max(500).optional(),
  helpWith: z.string().max(500).optional(),
  avatarUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;

export default function EditProfile() {
  const navigate = useNavigate();
  const { user, setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    if (!user?.id) {
      navigate('/login');
      return;
    }

    try {
      setIsLoading(true);
      const data = await getUserProfile(user.id);

      // Pre-fill form
      setValue('fullName', data.user.fullName || '');
      setValue('bio', data.user.bio || '');
      setValue('helpWith', data.user.helpWith || '');
      setValue('avatarUrl', data.user.avatarUrl || '');
      setSkills(data.user.skillsTags || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const onSubmit = async (data: UpdateProfileFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const updatedUser = await updateProfile({
        ...data,
        skillsTags: skills,
        avatarUrl: data.avatarUrl || undefined,
        bio: data.bio || undefined,
        helpWith: data.helpWith || undefined,
      });

      // Update auth store
      if (user) {
        setAuth({
          ...user,
          fullName: updatedUser.fullName,
          bio: updatedUser.bio,
          skillsTags: updatedUser.skillsTags,
          helpWith: updatedUser.helpWith,
          avatarUrl: updatedUser.avatarUrl,
        });
      }

      navigate(`/users/${user?.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile');
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

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Edit Your Profile</h1>
        <p className="text-gray-600 mt-2">
          Update your profile information and let others know about your skills
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Full Name */}
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
            Full Name *
          </label>
          <input
            {...register('fullName')}
            type="text"
            placeholder="Enter your full name"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          {errors.fullName && (
            <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
          )}
        </div>

        {/* Bio */}
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
            Bio
          </label>
          <textarea
            {...register('bio')}
            rows={4}
            placeholder="Tell us about yourself..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          {errors.bio && (
            <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">Max 500 characters</p>
        </div>

        {/* Skills */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Skills & Expertise
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addSkill();
                }
              }}
              placeholder="Add a skill (e.g., Web Development)"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <button
              type="button"
              onClick={addSkill}
              className="btn-ghost"
            >
              Add
            </button>
          </div>
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium flex items-center space-x-2"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="text-blue-900 hover:text-red-600"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Press Enter or click Add to add skills
          </p>
        </div>

        {/* Help With */}
        <div>
          <label htmlFor="helpWith" className="block text-sm font-medium text-gray-700 mb-2">
            What can you help others with?
          </label>
          <textarea
            {...register('helpWith')}
            rows={3}
            placeholder="e.g., I can help with code reviews, design feedback, marketing strategy..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          {errors.helpWith && (
            <p className="mt-1 text-sm text-red-600">{errors.helpWith.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">Max 500 characters</p>
        </div>

        {/* Avatar URL */}
        <div>
          <label htmlFor="avatarUrl" className="block text-sm font-medium text-gray-700 mb-2">
            Avatar URL
          </label>
          <input
            {...register('avatarUrl')}
            type="url"
            placeholder="https://example.com/avatar.jpg"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          {errors.avatarUrl && (
            <p className="mt-1 text-sm text-red-600">{errors.avatarUrl.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Provide a direct link to your profile picture
          </p>
        </div>

        {/* Submit Buttons */}
        <div className="flex space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate(`/users/${user?.id}`)}
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
