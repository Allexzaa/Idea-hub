import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import {
  getComments,
  createComment,
  updateComment,
  deleteComment,
  toggleHelpful,
  Comment,
} from '../services/comment.service';

interface CommentsProps {
  ideaId: string;
  onCommentCountChange?: (count: number) => void;
}

export default function Comments({ ideaId, onCommentCountChange }: CommentsProps) {
  const { user, isAuthenticated } = useAuthStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    loadComments();
  }, [ideaId]);

  const loadComments = async () => {
    try {
      setIsLoading(true);
      const data = await getComments(ideaId);
      setComments(data);
      if (onCommentCountChange) {
        onCommentCountChange(data.length);
      }
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !isAuthenticated) return;

    setIsSubmitting(true);
    try {
      await createComment(ideaId, {
        content: newComment,
        parentCommentId: replyTo || undefined,
      });
      setNewComment('');
      setReplyTo(null);
      await loadComments();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      await updateComment(commentId, editContent);
      setEditingId(null);
      setEditContent('');
      await loadComments();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update comment');
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;

    try {
      await deleteComment(commentId);
      await loadComments();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete comment');
    }
  };

  const handleToggleHelpful = async (commentId: string) => {
    if (!isAuthenticated) return;

    try {
      const result = await toggleHelpful(commentId);
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? {
                ...c,
                isHelpful: result.helpful,
                helpfulCount: result.helpful
                  ? c.helpfulCount + 1
                  : c.helpfulCount - 1,
              }
            : c
        )
      );
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to mark helpful');
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const renderComment = (comment: Comment, isReply = false) => {
    const isOwner = user?.id === comment.user.id;
    const isEditing = editingId === comment.id;

    return (
      <div
        key={comment.id}
        className={`${isReply ? 'ml-12 mt-4' : 'mt-4'} ${
          isReply ? 'border-l-2 border-gray-200 pl-4' : ''
        }`}
      >
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
            {comment.user.fullName?.[0] || comment.user.username[0]}
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900">
                {comment.user.fullName || comment.user.username}
              </span>
              <span className="text-xs text-gray-500">
                @{comment.user.username}
              </span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-500">
                {formatTimeAgo(comment.createdAt)}
              </span>
              {comment.isEdited && (
                <span className="text-xs text-gray-400">(edited)</span>
              )}
            </div>

            {isEditing ? (
              <div className="mt-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={2}
                />
                <div className="flex space-x-2 mt-2">
                  <button
                    onClick={() => handleEdit(comment.id)}
                    className="text-sm px-3 py-1 bg-primary text-white rounded-lg hover:bg-primary/90"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setEditContent('');
                    }}
                    className="text-sm px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="mt-1 text-gray-700">{comment.content}</p>
                <div className="flex items-center space-x-4 mt-2">
                  {isAuthenticated && (
                    <button
                      onClick={() => handleToggleHelpful(comment.id)}
                      className={`text-sm flex items-center space-x-1 ${
                        comment.isHelpful
                          ? 'text-secondary font-medium'
                          : 'text-gray-500 hover:text-secondary'
                      }`}
                    >
                      <span>⭐</span>
                      <span>
                        Helpful {comment.helpfulCount > 0 && `(${comment.helpfulCount})`}
                      </span>
                    </button>
                  )}
                  {isAuthenticated && !isReply && (
                    <button
                      onClick={() => setReplyTo(comment.id)}
                      className="text-sm text-gray-500 hover:text-primary"
                    >
                      Reply
                    </button>
                  )}
                  {isOwner && (
                    <>
                      <button
                        onClick={() => {
                          setEditingId(comment.id);
                          setEditContent(comment.content);
                        }}
                        className="text-sm text-gray-500 hover:text-primary"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="text-sm text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Replies */}
        {comments
          .filter((c) => c.parentCommentId === comment.id)
          .map((reply) => renderComment(reply, true))}

        {/* Reply Form */}
        {replyTo === comment.id && (
          <div className="ml-11 mt-3">
            <form onSubmit={handleSubmit} className="space-y-2">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={`Reply to ${comment.user.fullName || comment.user.username}...`}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                rows={2}
              />
              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !newComment.trim()}
                  className="text-sm px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  {isSubmitting ? 'Posting...' : 'Reply'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReplyTo(null);
                    setNewComment('');
                  }}
                  className="text-sm px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading comments...</p>
      </div>
    );
  }

  const topLevelComments = comments.filter((c) => !c.parentCommentId);

  return (
    <div className="space-y-6">
      {/* Add Comment Form */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            rows={3}
          />
          <button
            type="submit"
            disabled={isSubmitting || !newComment.trim()}
            className="btn-primary disabled:opacity-50"
          >
            {isSubmitting ? 'Posting...' : 'Post Comment'}
          </button>
        </form>
      ) : (
        <p className="text-gray-600">Sign in to comment</p>
      )}

      {/* Comments List */}
      <div className="space-y-1">
        {topLevelComments.length === 0 ? (
          <p className="text-gray-600 text-center py-8">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          topLevelComments.map((comment) => renderComment(comment))
        )}
      </div>
    </div>
  );
}
