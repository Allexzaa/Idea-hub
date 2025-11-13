import { useState } from 'react';
import { Attachment, deleteAttachment, formatFileSize, getFileIcon } from '../services/attachment.service';
import { useAuthStore } from '../store/authStore';

interface AttachmentListProps {
  attachments: Attachment[];
  onDelete?: (attachmentId: string) => void;
}

export default function AttachmentList({ attachments, onDelete }: AttachmentListProps) {
  const { user } = useAuthStore();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (attachmentId: string) => {
    if (!confirm('Are you sure you want to delete this attachment?')) return;

    try {
      setDeletingId(attachmentId);
      await deleteAttachment(attachmentId);
      if (onDelete) {
        onDelete(attachmentId);
      }
    } catch (err) {
      alert('Failed to delete attachment');
    } finally {
      setDeletingId(null);
    }
  };

  const isImage = (fileType: string | null): boolean => {
    return fileType?.startsWith('image/') || false;
  };

  const getFullUrl = (fileUrl: string): string => {
    // If URL is relative, prepend API base URL
    if (fileUrl.startsWith('/uploads')) {
      return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${fileUrl}`;
    }
    return fileUrl;
  };

  if (attachments.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-gray-700">Attachments</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className="border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors"
          >
            {isImage(attachment.fileType) ? (
              <a
                href={getFullUrl(attachment.fileUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <img
                  src={getFullUrl(attachment.fileUrl)}
                  alt={attachment.fileName}
                  className="w-full h-32 object-cover rounded mb-2"
                />
              </a>
            ) : (
              <div className="flex items-center justify-center h-32 bg-gray-100 rounded mb-2">
                <span className="text-5xl">{getFileIcon(attachment.fileType)}</span>
              </div>
            )}

            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <a
                  href={getFullUrl(attachment.fileUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-gray-900 hover:text-primary truncate block"
                  title={attachment.fileName}
                >
                  {attachment.fileName}
                </a>
                <p className="text-xs text-gray-500 mt-1">
                  {formatFileSize(attachment.fileSize)} • by {attachment.userName}
                </p>
              </div>

              {user?.id === attachment.userId && onDelete && (
                <button
                  onClick={() => handleDelete(attachment.id)}
                  disabled={deletingId === attachment.id}
                  className="ml-2 text-gray-400 hover:text-red-600 disabled:opacity-50"
                  title="Delete attachment"
                >
                  {deletingId === attachment.id ? (
                    <svg
                      className="animate-spin h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  )}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
