'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Star } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import type { Submission, SubmissionGradeInput } from '@/lib/types';
import { formatDate, calculatePercentage } from '@/lib/utils';
import { SubmissionStatusBadge } from '@/components/ui/Badge';

const schema = z.object({
  grade: z.coerce.number().min(0, 'Grade must be 0 or more'),
  feedback: z.string().min(1, 'Feedback is required'),
});

interface GradeModalProps {
  submission: Submission | null;
  totalMarks: number;
  isOpen: boolean;
  onClose: () => void;
  onGrade: (id: string, data: SubmissionGradeInput) => Promise<void>;
}

export default function GradeModal({ submission, totalMarks, isOpen, onClose, onGrade }: GradeModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<SubmissionGradeInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema.refine(d => d.grade <= totalMarks, {
      message: `Grade cannot exceed ${totalMarks}`,
      path: ['grade'],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    })) as any,
    defaultValues: { grade: submission?.grade ?? 0, feedback: submission?.feedback ?? '' },
  });

  const gradeValue = watch('grade') ?? 0;
  const pct = calculatePercentage(gradeValue, totalMarks);

  const onSubmit = async (data: SubmissionGradeInput) => {
    if (!submission) return;
    setIsSubmitting(true);
    try {
      await onGrade(submission.id, data);
      reset();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!submission) return null;

  const gradeColor = pct >= 75 ? 'var(--color-success)' : pct >= 50 ? 'var(--color-warning)' : 'var(--color-danger)';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Grade Submission"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Grade'}
          </button>
        </>
      }
    >
      {/* Student info */}
      <div style={{
        padding: '1rem', background: 'var(--color-surface-2)',
        borderRadius: 'var(--radius-md)', marginBottom: '1.25rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <p style={{ fontWeight: 600, color: 'var(--color-text)' }}>{submission.studentName}</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{submission.studentEmail}</p>
          {submission.submittedAt && (
            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
              Submitted {formatDate(submission.submittedAt, 'MMM d, yyyy h:mm a')}
            </p>
          )}
        </div>
        <SubmissionStatusBadge status={submission.status} />
      </div>

      {/* Submission content */}
      {submission.textContent && (
        <div style={{ marginBottom: '1.25rem' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>STUDENT NOTES</p>
          <div style={{
            padding: '0.875rem', background: 'var(--color-surface-2)',
            borderRadius: 'var(--radius-md)', fontSize: '0.875rem',
            color: 'var(--color-text-secondary)', lineHeight: 1.6,
            maxHeight: 120, overflowY: 'auto',
          }}>
            {submission.textContent}
          </div>
        </div>
      )}

      <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Grade input with live preview */}
        <div className="form-group">
          <label className="form-label" htmlFor="grade-input">
            Grade <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>out of {totalMarks}</span>
          </label>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <input
              id="grade-input"
              type="number"
              min={0}
              max={totalMarks}
              className={`input ${errors.grade ? 'input-error' : ''}`}
              style={{ flex: 1 }}
              {...register('grade')}
            />
            {/* Live grade pill */}
            <div style={{
              padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)',
              background: `${gradeColor}18`, border: `1px solid ${gradeColor}40`,
              color: gradeColor, fontWeight: 700, fontSize: '0.875rem',
              flexShrink: 0, minWidth: 70, textAlign: 'center',
            }}>
              {pct}%
            </div>
          </div>
          {/* Progress bar */}
          <div className="progress-bar" style={{ marginTop: '0.5rem' }}>
            <div className="progress-bar-fill" style={{ width: `${pct}%`, background: gradeColor }} />
          </div>
          {errors.grade && <p className="form-error">{errors.grade.message}</p>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="feedback-input">Feedback</label>
          <textarea
            id="feedback-input"
            className={`input ${errors.feedback ? 'input-error' : ''}`}
            rows={4}
            placeholder="Provide constructive feedback for the student..."
            style={{ resize: 'vertical' }}
            {...register('feedback')}
          />
          {errors.feedback && <p className="form-error">{errors.feedback.message}</p>}
        </div>
      </form>
    </Modal>
  );
}
