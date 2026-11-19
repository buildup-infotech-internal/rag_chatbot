'use client';

import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Check, Loader2 } from 'lucide-react';
import { submitFeedback } from '@/services/feedback-service';
import { FeedbackRating } from '@/types/feedback';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

interface FeedbackDialogProps {
  messageId?: number | null;
  existingRating?: FeedbackRating | null;
  existingComment?: string | null;
  onFeedbackSaved?: (rating: FeedbackRating, comment?: string) => void;
}

export function FeedbackDialog({
  messageId,
  existingRating = null,
  existingComment = '',
  onFeedbackSaved,
}: FeedbackDialogProps) {
  const { addToast } = useToast();
  const [currentRating, setCurrentRating] = useState<FeedbackRating | null>(existingRating);
  const [isOpenComment, setIsOpenComment] = useState(false);
  const [commentText, setCommentText] = useState(existingComment || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // If there's no backend message ID yet, feedback cannot be submitted
  const canSubmit = typeof messageId === 'number' && messageId > 0;

  const handleRate = async (rating: FeedbackRating) => {
    if (!canSubmit) {
      addToast({
        type: 'info',
        title: 'Please wait',
        message: 'This response is still finalizing. Feedback can be given once saved.',
      });
      return;
    }

    if (currentRating === rating && !isOpenComment) {
      // Open comment drawer if clicked again
      setIsOpenComment(true);
      return;
    }

    setCurrentRating(rating);
    setIsSubmitting(true);

    try {
      const res = await submitFeedback({
        message_id: messageId,
        rating,
        comment: commentText.trim() || undefined,
      });

      setIsSubmitted(true);
      if (onFeedbackSaved) {
        onFeedbackSaved(rating, commentText.trim() || undefined);
      }

      addToast({
        type: 'success',
        title: res.updated_existing ? 'Feedback updated' : 'Thank you!',
        message: rating === 1 ? 'Glad this answer was helpful!' : 'We will work on improving this answer.',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not submit feedback.';
      addToast({
        type: 'error',
        title: 'Feedback submission failed',
        message: msg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || currentRating === null) return;

    setIsSubmitting(true);
    try {
      await submitFeedback({
        message_id: messageId,
        rating: currentRating,
        comment: commentText.trim() || undefined,
      });

      setIsSubmitted(true);
      setIsOpenComment(false);

      if (onFeedbackSaved) {
        onFeedbackSaved(currentRating, commentText.trim() || undefined);
      }

      addToast({
        type: 'success',
        title: 'Comment saved',
        message: 'Your additional feedback has been recorded.',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not save comment.';
      addToast({
        type: 'error',
        title: 'Comment submission failed',
        message: msg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 mt-2">
      <div className="flex items-center gap-1.5 text-xs text-neutral-500">
        <span className="text-[11px] font-medium mr-1">Was this helpful?</span>

        {/* Thumbs Up Button */}
        <button
          onClick={() => handleRate(1)}
          disabled={isSubmitting}
          aria-label="Good response"
          className={cn(
            'inline-flex items-center justify-center h-7 w-7 rounded-md transition-colors',
            currentRating === 1
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
              : 'hover:bg-neutral-100 text-neutral-500 hover:text-neutral-800 dark:hover:bg-neutral-800 dark:hover:text-neutral-200'
          )}
          title="Helpful answer"
        >
          <ThumbsUp className="h-3.5 w-3.5" />
        </button>

        {/* Thumbs Down Button */}
        <button
          onClick={() => handleRate(-1)}
          disabled={isSubmitting}
          aria-label="Poor response"
          className={cn(
            'inline-flex items-center justify-center h-7 w-7 rounded-md transition-colors',
            currentRating === -1
              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
              : 'hover:bg-neutral-100 text-neutral-500 hover:text-neutral-800 dark:hover:bg-neutral-800 dark:hover:text-neutral-200'
          )}
          title="Unhelpful or inaccurate answer"
        >
          <ThumbsDown className="h-3.5 w-3.5" />
        </button>

        {currentRating !== null && !isOpenComment && (
          <button
            onClick={() => setIsOpenComment(true)}
            className="text-[11px] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 underline ml-1"
          >
            {commentText ? 'Edit comment' : 'Add comment'}
          </button>
        )}

        {isSubmitting && <Loader2 className="h-3 w-3 animate-spin text-neutral-400 ml-1" />}
        {isSubmitted && !isSubmitting && (
          <span className="inline-flex items-center text-[10px] text-emerald-600 font-medium ml-1 gap-0.5">
            <Check className="h-3 w-3" /> Recorded
          </span>
        )}
      </div>

      {/* Optional feedback comment expander */}
      {isOpenComment && (
        <form onSubmit={handleCommentSubmit} className="mt-2 flex flex-col gap-2 max-w-md animate-in fade-in-50">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Tell us what was missing, incorrect, or helpful (optional)..."
            rows={2}
            maxLength={5000}
            className="w-full text-xs rounded-lg border border-neutral-300 p-2 text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsOpenComment(false)}
              className="px-2.5 py-1 text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-3 py-1 text-xs font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Submit comment'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
