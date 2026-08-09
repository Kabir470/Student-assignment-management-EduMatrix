'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { Upload, Link as LinkIcon, FileText, CheckCircle, Clock, Star, MessageSquare, Send, RefreshCw, X } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { RequireRole } from '@/lib/auth/guards';
import PageHeader from '@/components/layout/PageHeader';
import { AssignmentStatusBadge, SubmissionStatusBadge } from '@/components/ui/Badge';
import { assignmentsService } from '@/lib/api/assignments';
import { submissionsService } from '@/lib/api/submissions';
import { storageService } from '@/lib/api/storage';
import { viewSecureFile } from '@/lib/utils/storage';
import type { Assignment, Submission, SubmissionComment } from '@/lib/types';
import { formatDate, formatRelative, getDueDateCountdown, isPastDue, calculatePercentage } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import AssignmentDiscussion from '@/components/dashboard/AssignmentDiscussion';

interface SubmitForm {
  textContent: string;
  links: string;
}

// Removed custom Supabase upload function as we now use storageService

export default function StudentAssignmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Comments
  const [comments, setComments] = useState<SubmissionComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<SubmitForm>();

  const load = async () => {
    if (!user) return;
    setIsLoading(true);
    const [a, sub] = await Promise.all([
      assignmentsService.getById(id),
      submissionsService.getByStudentAndAssignment(user.id, id),
    ]);
    setAssignment(a);
    setSubmission(sub);
    if (sub) {
      const cmts = await submissionsService.getComments(sub.id);
      setComments(cmts);
    }
    setIsLoading(false);
  };

  useEffect(() => { load(); }, [id, user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setFileError('');
    if (file) {
      if (assignment?.maxFileSizeMb && file.size > assignment.maxFileSizeMb * 1024 * 1024) {
        setFileError(`File size must be under ${assignment.maxFileSizeMb}MB.`);
        setSelectedFile(null);
        return;
      }
    }
    setSelectedFile(file);
  };

  const onSubmit = async (data: SubmitForm) => {
    if (!user || !assignment) return;
    setIsSubmitting(true);
    try {
      let fileUrl = '';
      let fileName = '';
      if (selectedFile) {
        const uploadResult = await storageService.uploadFile(selectedFile);
        fileUrl = uploadResult.url;
        fileName = selectedFile.name;
      }

      const links = data.links ? data.links.split('\n').filter(l => l.trim()) : [];
      const payload = {
        assignmentId: assignment.id,
        textContent: data.textContent,
        links,
        fileUrl: fileUrl || undefined,
        fileName: fileName || undefined,
      };

      if (isEditing && submission) {
        await submissionsService.updateSubmission(submission.id, payload);
      } else {
        await submissionsService.create(payload);
      }

      setSubmitSuccess(true);
      setIsEditing(false);
      reset();
      setSelectedFile(null);
      setSubmitError('');
      await load();
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit assignment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = () => {
    if (!submission) return;
    setValue('textContent', submission.textContent ?? '');
    setValue('links', (submission.links ?? []).join('\n'));
    setIsEditing(true);
  };

  const handlePostComment = async () => {
    if (!submission || !newComment.trim()) return;
    setIsPostingComment(true);
    try {
      const comment = await submissionsService.addComment(submission.id, newComment.trim());
      setComments(prev => [...prev, comment]);
      setNewComment('');
      setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } finally {
      setIsPostingComment(false);
    }
  };

  if (isLoading) {
    return (
      <RequireRole roles={['student']}>
        <div className="animate-fade-in">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 'var(--radius-md)', marginBottom: '1rem' }} />)}
        </div>
      </RequireRole>
    );
  }

  if (!assignment) return <RequireRole roles={['student']}><p>Assignment not found.</p></RequireRole>;

  const isOverdue = isPastDue(assignment.dueDate);
  const allowLate = assignment.allowLateSubmissions;
  const canSubmit = !submission && (!isOverdue || allowLate) && assignment.status === 'published';
  const canEdit = submission && (!isOverdue || allowLate) && submission.status !== 'graded' && submission.status !== 'returned';
  const gradeColor = submission?.grade != null
    ? calculatePercentage(submission.grade, assignment.totalMarks) >= 75
      ? 'var(--color-success)' : calculatePercentage(submission.grade, assignment.totalMarks) >= 50
        ? 'var(--color-warning)' : 'var(--color-danger)'
    : 'var(--color-primary)';

  return (
    <RequireRole roles={['student']}>
      <div className="animate-fade-in">
        <PageHeader
          title={assignment.title}
          breadcrumbs={[{ label: 'Student', href: '/student' }, { label: 'Assignments', href: '/student/assignments' }, { label: assignment.title }]}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>
          {/* Left: Assignment Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Info card */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <AssignmentStatusBadge status={assignment.status} />
                <span style={{ fontSize: '0.8rem', color: isOverdue ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>
                  <Clock size={13} style={{ display: 'inline', marginRight: 4 }} />
                  {getDueDateCountdown(assignment.dueDate)} ({formatDate(assignment.dueDate, 'MMM d, yyyy h:mm a')})
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  <Star size={13} style={{ display: 'inline', marginRight: 4 }} />
                  {assignment.totalMarks} marks total
                </span>
              </div>
              <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>{assignment.description}</p>
              
              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ padding: '0.6rem 0.75rem', background: 'var(--color-primary-muted)', borderRadius: 'var(--radius-md)' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 500 }}>
                    📎 Accepted: Any file format · Max size: {assignment.maxFileSizeMb ?? 'Unlimited'} MB
                  </p>
                </div>
                {assignment.attachmentUrl && (
                  <div style={{ padding: '0.6rem 0.75rem', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={16} style={{ color: 'var(--color-text-muted)' }} />
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Teacher Attachment:</span>
                    <a href={assignment.attachmentUrl} target="_blank" rel="noreferrer" className="btn btn-link" style={{ fontSize: '0.85rem', padding: 0, height: 'auto', minHeight: 0 }}>
                      View / Download
                    </a>
                  </div>
                )}
                {!allowLate && (
                  <div style={{ padding: '0.6rem 0.75rem', background: 'var(--color-danger-muted)', borderRadius: 'var(--radius-md)' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-danger)', fontWeight: 500 }}>
                      ⚠️ Late submissions are not accepted for this assignment.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Submission or form */}
            {submission && !isEditing ? (
              <div className="card" style={{ padding: '1.5rem', borderColor: 'rgba(16,185,129,0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontWeight: 700, color: 'var(--color-success)' }}>
                    <CheckCircle size={16} style={{ display: 'inline', marginRight: 6 }} />
                    Submission Received
                  </h3>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <SubmissionStatusBadge status={submission.status} />
                    {canEdit && (
                      <button className="btn btn-ghost btn-sm" onClick={startEditing}>
                        <RefreshCw size={13} /> Update
                      </button>
                    )}
                  </div>
                </div>

                {submission.textContent && (
                  <div style={{ marginBottom: '1rem' }}>
                    <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>YOUR NOTES</p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, padding: '0.75rem', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)' }}>
                      {submission.textContent}
                    </p>
                  </div>
                )}

                {submission.fileName && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                    <FileText size={14} style={{ color: 'var(--color-danger)' }} />
                    {submission.fileUrl ? (
                      <button 
                        onClick={() => viewSecureFile(submission.fileUrl!)} 
                        className="btn btn-link" 
                        style={{ color: 'var(--color-primary)', textDecoration: 'underline', padding: 0, height: 'auto', minHeight: 0 }}
                      >
                        {submission.fileName}
                      </button>
                    ) : (
                      <span style={{ color: 'var(--color-info)' }}>{submission.fileName}</span>
                    )}
                  </div>
                )}

                {/* Feedback section */}
                {submission.status === 'graded' && submission.grade != null && (
                  <div style={{ marginTop: '1rem', padding: '1.25rem', background: `${gradeColor}10`, borderRadius: 'var(--radius-md)', border: `1px solid ${gradeColor}30` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <p style={{ fontWeight: 700, fontSize: '1.1rem', color: gradeColor }}>
                        Grade: {submission.grade}/{assignment.totalMarks} ({calculatePercentage(submission.grade, assignment.totalMarks)}%)
                      </p>
                      <div className="progress-bar" style={{ width: 120 }}>
                        <div className="progress-bar-fill" style={{ width: `${calculatePercentage(submission.grade, assignment.totalMarks)}%`, background: gradeColor }} />
                      </div>
                    </div>
                    {submission.feedback && (
                      <div style={{ padding: '0.75rem', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)', marginTop: '0.5rem' }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '0.3rem' }}>TEACHER FEEDBACK</p>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{submission.feedback}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (canSubmit || isEditing) ? (
              <div className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h3 style={{ fontWeight: 700 }}>{isEditing ? 'Update Your Submission' : 'Submit Your Work'}</h3>
                  {isEditing && <button className="btn btn-ghost btn-sm" onClick={() => setIsEditing(false)}><X size={13} /> Cancel</button>}
                </div>
                {isOverdue && !isEditing && (
                  <div style={{ padding: '0.75rem 1rem', background: 'var(--color-danger-muted)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 'var(--radius-md)', color: 'var(--color-danger)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                    ⚠️ This assignment is past due. Late submissions may be penalized.
                  </div>
                )}
                {submitSuccess && (
                  <div style={{ padding: '0.75rem 1rem', background: 'var(--color-success-muted)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 'var(--radius-md)', color: 'var(--color-success)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                    ✅ {isEditing ? 'Submission updated!' : 'Submission received successfully!'}
                  </div>
                )}
                {submitError && (
                  <div style={{ padding: '0.75rem 1rem', background: 'var(--color-danger-muted)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 'var(--radius-md)', color: 'var(--color-danger)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                    ❌ {submitError}
                  </div>
                )}
                <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="notes">Notes / Explanation</label>
                    <textarea id="notes" className="input" rows={4} placeholder="Describe your work or add any notes..." style={{ resize: 'vertical' }} {...register('textContent')} />
                  </div>

                  {/* PDF upload */}
                  <div className="form-group">
                    <label className="form-label">PDF Attachment</label>
                    <div
                      style={{
                        border: `2px dashed ${selectedFile ? 'var(--color-success)' : fileError ? 'var(--color-danger)' : 'var(--color-border)'}`,
                        borderRadius: 'var(--radius-md)',
                        padding: '1.5rem',
                        textAlign: 'center',
                        cursor: 'pointer',
                        background: selectedFile ? 'var(--color-success-muted)' : 'var(--color-surface-2)',
                      }}
                      onClick={() => document.getElementById('pdf-input')?.click()}
                    >
                      {selectedFile ? (
                        <div>
                          <FileText size={24} style={{ color: 'var(--color-danger)', margin: '0 auto 0.5rem' }} />
                          <p style={{ fontSize: '0.875rem', color: 'var(--color-success)', fontWeight: 600 }}>{selectedFile.name}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      ) : (
                        <div>
                          <Upload size={24} style={{ color: 'var(--color-text-muted)', margin: '0 auto 0.5rem' }} />
                          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Click to select a file</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Max size: {assignment.maxFileSizeMb ?? 'Unlimited'} MB</p>
                        </div>
                      )}
                      <input id="pdf-input" type="file" style={{ display: 'none' }} onChange={handleFileChange} />
                    </div>
                    {fileError && <p style={{ color: 'var(--color-danger)', fontSize: '0.8rem', marginTop: '0.25rem' }}>{fileError}</p>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <LinkIcon size={13} style={{ display: 'inline', marginRight: 4 }} />
                      Links (one per line)
                    </label>
                    <textarea className="input" rows={2} placeholder="https://github.com/..." {...register('links')} />
                  </div>

                  <button type="submit" className="btn btn-primary btn-lg" disabled={isSubmitting || !!fileError}>
                    {isSubmitting ? 'Submitting...' : isEditing ? 'Update Submission' : 'Submit Assignment'}
                  </button>
                </form>
              </div>
            ) : null}

            {/* Comments Section */}
            {submission && (
              <div className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <MessageSquare size={16} style={{ color: 'var(--color-primary)' }} />
                  <h3 style={{ fontWeight: 700, fontSize: '0.95rem' }}>Comments ({comments.length})</h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem', maxHeight: 300, overflowY: 'auto' }}>
                  {comments.length === 0 ? (
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem 0' }}>No comments yet. Start the conversation!</p>
                  ) : comments.map(c => (
                    <div key={c.id} style={{
                      padding: '0.75rem',
                      background: c.authorRole === 'teacher' ? 'rgba(99,102,241,0.08)' : 'var(--color-surface-2)',
                      borderRadius: 'var(--radius-md)',
                      borderLeft: c.authorRole === 'teacher' ? '3px solid var(--color-primary)' : '3px solid var(--color-border)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.8rem', color: c.authorRole === 'teacher' ? 'var(--color-primary)' : 'var(--color-text)' }}>
                          {c.authorName} {c.authorRole === 'teacher' && '(Teacher)'}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{formatRelative(c.createdAt)}</span>
                      </div>
                      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{c.content}</p>
                    </div>
                  ))}
                  <div ref={commentsEndRef} />
                </div>

                {/* Add comment */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    className="input"
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePostComment(); } }}
                    style={{ flex: 1 }}
                  />
                  <button className="btn btn-primary" onClick={handlePostComment} disabled={isPostingComment || !newComment.trim()}>
                    <Send size={14} />
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Right sidebar: deadline countdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="card" style={{ padding: '1.25rem', textAlign: 'center', borderColor: isOverdue ? 'rgba(244,63,94,0.4)' : 'var(--color-border)' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Deadline</p>
              <p style={{ fontSize: '1.25rem', fontWeight: 800, color: isOverdue ? 'var(--color-danger)' : 'var(--color-text)' }}>
                {formatDate(assignment.dueDate, 'MMM d')}
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{formatDate(assignment.dueDate, 'h:mm a, yyyy')}</p>
              <div style={{ marginTop: '0.75rem', padding: '0.5rem', borderRadius: 'var(--radius-sm)', background: isOverdue ? 'var(--color-danger-muted)' : 'var(--color-warning-muted)' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 600, color: isOverdue ? 'var(--color-danger)' : 'var(--color-warning)' }}>
                  {getDueDateCountdown(assignment.dueDate)}
                </p>
              </div>
            </div>

            <div className="card" style={{ padding: '1.25rem' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>Details</p>
              {[
                { label: 'Teacher', value: assignment.teacherName },
                { label: 'Course', value: assignment.courseName },
                { label: 'Total Marks', value: String(assignment.totalMarks) },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>{row.label}</span>
                  <span style={{ color: 'var(--color-text)', fontWeight: 500 }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Class Comments (Stream) */}
            <div style={{ marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <MessageSquare size={18} style={{ color: 'var(--color-primary)' }} />
                <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>Class Comments</h3>
              </div>
              <AssignmentDiscussion assignmentId={id} />
            </div>
          </div>
        </div>
      </div>
    </RequireRole>
  );
}
