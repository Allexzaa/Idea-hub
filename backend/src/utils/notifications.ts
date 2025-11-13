import { createNotification, NotificationType } from '../models/notification.model';
import { io } from '../index';

/**
 * Send a notification to a user and emit via Socket.io
 */
export const sendNotification = async (data: {
  userId: string;
  type: NotificationType;
  actorId?: string | null;
  actorName?: string | null;
  ideaId?: string;
  commentId?: string;
  relatedId?: string;
  relatedTitle?: string;
  message?: string;
  metadata?: Record<string, any>;
}): Promise<void> => {
  try {
    // Create notification in database
    const notification = await createNotification(data);

    // Emit real-time notification via Socket.io
    io.to(`user:${data.userId}`).emit('notification', {
      id: notification.id,
      type: notification.type,
      message: notification.message,
      ideaId: notification.idea_id,
      commentId: notification.comment_id,
      isRead: notification.is_read,
      createdAt: notification.created_at,
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    // Don't throw - notifications should not break main functionality
  }
};

/**
 * Send spark notification
 */
export const sendSparkNotification = async (
  ideaCreatorId: string,
  sparkerUserId: string,
  sparkerUsername: string,
  ideaId: string,
  ideaTitle: string
): Promise<void> => {
  // Don't notify yourself
  if (ideaCreatorId === sparkerUserId) return;

  await sendNotification({
    userId: ideaCreatorId,
    type: 'spark',
    actorId: sparkerUserId,
    ideaId,
    message: `${sparkerUsername} sparked your idea "${ideaTitle}"`,
  });
};

/**
 * Send nurture notification
 */
export const sendNurtureNotification = async (
  ideaCreatorId: string,
  nurturerUserId: string,
  nurturerUsername: string,
  ideaId: string,
  ideaTitle: string,
  nurtureMessage?: string
): Promise<void> => {
  // Don't notify yourself
  if (ideaCreatorId === nurturerUserId) return;

  const message = nurtureMessage
    ? `${nurturerUsername} wants to help with "${ideaTitle}": ${nurtureMessage}`
    : `${nurturerUsername} wants to help with your idea "${ideaTitle}"`;

  await sendNotification({
    userId: ideaCreatorId,
    type: 'nurture',
    actorId: nurturerUserId,
    ideaId,
    message,
  });
};

/**
 * Send comment notification
 */
export const sendCommentNotification = async (
  ideaCreatorId: string,
  commenterUserId: string,
  commenterUsername: string,
  ideaId: string,
  ideaTitle: string,
  commentId: string,
  isReply: boolean = false
): Promise<void> => {
  // Don't notify yourself
  if (ideaCreatorId === commenterUserId) return;

  const message = isReply
    ? `${commenterUsername} replied to a comment on "${ideaTitle}"`
    : `${commenterUsername} commented on your idea "${ideaTitle}"`;

  await sendNotification({
    userId: ideaCreatorId,
    type: 'comment',
    actorId: commenterUserId,
    ideaId,
    commentId,
    message,
  });
};

/**
 * Send helpful comment notification
 */
export const sendHelpfulCommentNotification = async (
  commentAuthorId: string,
  markerUserId: string,
  markerUsername: string,
  ideaId: string,
  ideaTitle: string,
  commentId: string
): Promise<void> => {
  // Don't notify yourself
  if (commentAuthorId === markerUserId) return;

  await sendNotification({
    userId: commentAuthorId,
    type: 'helpful_comment',
    actorId: markerUserId,
    ideaId,
    commentId,
    message: `${markerUsername} found your comment helpful on "${ideaTitle}"`,
  });
};

/**
 * Send message notification
 */
export const sendMessageNotification = async (
  recipientId: string,
  senderId: string,
  senderUsername: string,
  messagePreview: string
): Promise<void> => {
  const preview = messagePreview.length > 50
    ? messagePreview.substring(0, 50) + '...'
    : messagePreview;

  await sendNotification({
    userId: recipientId,
    type: 'message',
    actorId: senderId,
    message: `${senderUsername}: ${preview}`,
  });
};

/**
 * Send investment received notification
 */
export const sendInvestmentNotification = async (
  campaignCreatorId: string,
  investorUserId: string | null,
  investorUsername: string | null,
  campaignId: string,
  campaignTitle: string,
  amount: number,
  currency: string
): Promise<void> => {
  // Don't notify yourself
  if (investorUserId && campaignCreatorId === investorUserId) return;

  const investorName = investorUsername || 'Someone';
  const message = `${investorName} invested ${currency} ${amount} in your campaign "${campaignTitle}"`;

  await sendNotification({
    userId: campaignCreatorId,
    type: 'investment_received',
    actorId: investorUserId,
    actorName: investorName,
    relatedId: campaignId,
    relatedTitle: campaignTitle,
    message,
    metadata: { amount: amount.toString(), currency },
  });
};

/**
 * Send campaign funded notification
 */
export const sendCampaignFundedNotification = async (
  campaignCreatorId: string,
  campaignId: string,
  campaignTitle: string
): Promise<void> => {
  await sendNotification({
    userId: campaignCreatorId,
    type: 'campaign_funded',
    actorId: null,
    actorName: null,
    relatedId: campaignId,
    relatedTitle: campaignTitle,
    message: `Your campaign "${campaignTitle}" has reached its funding goal! 🎉`,
  });
};
