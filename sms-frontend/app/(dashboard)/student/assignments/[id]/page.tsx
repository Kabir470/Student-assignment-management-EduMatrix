'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Upload, Link as LinkIcon, FileText, CheckCircle, Clock, Star,
  MessageSquare, Send, RefreshCw, X, ChevronLeft, Download, Eye,
  Lightbulb, Paperclip, Trash2, AlertCircle, FileDown
} from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { RequireRole } from '@/lib/auth/guards';
import { assignmentsService } from '@/lib/api/assignments';
import { submissionsService } from '@/lib/api/submissions';
import { storageService } from '@/lib/api/storage';
import { viewSecureFile } from '@/lib/utils/storage';
import type { Assignment, Submission, SubmissionComment } from '@/lib/types';
import { formatDate, formatRelative, getDueDateCountdown, isPastDue, calculatePercentage, getSubmissionDisplayStatus, SUBMISSION_DISPLAY_STATUS_COLORS } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import AssignmentDiscussion from '@/components/dashboard/AssignmentDiscussion';
import Link from 'next/link';

interface SubmitForm {
  textContent: string;
  links: string;
}

export default function StudentAssignmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [comment, setComment] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [comments, setComments] = useState<SubmissionComment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const { register, handleSubmit, reset, setValue, watch } = useForm<SubmitForm>();
  const textContent = watch('textContent', '');

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

  const handleFileChange = (file: File | null) => {
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0] || null;
    handleFileChange(file);
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
    setSubmitSuccess(false);
  };

  const handlePostComment = async () => {
    if (!submission || !comment.trim()) return;
    setIsPostingComment(true);
    try {
      const c = await submissionsService.addComment(submission.id, comment.trim());
      setComments(prev => [...prev, c]);
      setComment('');
      setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } finally {
      setIsPostingComment(false);
    }
  };

  if (isLoading) {
    return (
      <RequireRole roles={['student']}>
        <div style={{ padding: '2rem' }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12, marginBottom: '1rem' }} />
          ))}
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
      ? '#10B981' : calculatePercentage(submission.grade, assignment.totalMarks) >= 50
        ? '#F59E0B' : '#EF4444'
    : '#4F46E5';

  const instructions = [
    'Read all the requirements carefully.',
    'Make sure your file is complete and correct.',
    'You can submit only one file.',
    'Click "Submit Assignment" button after uploading your final file.',
    allowLate ? 'Late submission will incur a penalty.' : 'Late submissions are NOT accepted.',
  ];

  return (
    <RequireRole roles={['student']}>
      <div className="animate-fade-in" style={{ padding: '2rem', width: '100%' }}>

        {/* Top Header Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            {/* Breadcrumb */}
            <p style={{ fontSize: '0.82rem', color: '#6B7280', marginBottom: '0.4rem' }}>
              <Link href="/student" style={{ color: '#6B7280', textDecoration: 'none' }}>Student</Link>
              {' > '}
              <Link href="/student/assignments" style={{ color: '#6B7280', textDecoration: 'none' }}>Assignments</Link>
              {' > '}
              <span style={{ color: '#1F2937' }}>Assignment Details</span>
            </p>

            {/* Title Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1F2937', lineHeight: 1 }}>{assignment.title}</h1>
              <span style={{
                background: 'rgba(99,102,241,0.1)', color: '#4F46E5', fontSize: '0.85rem',
                fontWeight: 700, padding: '4px 12px', borderRadius: '6px'
              }}>
                {assignment.courseName.split(' ').slice(0, 2).join(' ')}
              </span>
            </div>

            {/* Due date */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Clock size={14} /> Due: {formatDate(assignment.dueDate, 'MMM d, yyyy, h:mm a')}
              </span>
              <span style={{
                fontSize: '0.82rem', fontWeight: 700, color: isOverdue ? '#EF4444' : '#F59E0B',
                display: 'flex', alignItems: 'center', gap: '0.35rem'
              }}>
                <AlertCircle size={13} />
                {getDueDateCountdown(assignment.dueDate)}
              </span>
            </div>
          </div>

          <button
            onClick={() => router.push('/student/assignments')}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              background: '#ffffff', border: '1px solid #E5E7EB',
              borderRadius: '8px', padding: '0.5rem 1rem',
              fontWeight: 600, fontSize: '0.875rem', color: '#374151',
              cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
            className="hover:bg-gray-50"
          >
            <ChevronLeft size={16} /> Back to My Assignments
          </button>
        </div>

        {/* Three-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr_300px] gap-6 items-start">

          {/* ── LEFT: Assignment Details ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Assignment Details Card */}
            <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5' }}>
                  <FileText size={18} />
                </div>
                <h2 style={{ fontWeight: 800, fontSize: '1rem', color: '#1F2937' }}>Assignment Details</h2>
              </div>
              <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {[
                  { label: 'Course', value: assignment.courseName },
                  { label: 'Instructor', value: assignment.teacherName, bold: true },
                  { label: 'Total Marks', value: String(assignment.totalMarks) },
                  { label: 'Submission Type', value: 'Individual' },
                  { label: 'Allowed File Types', value: assignment.allowedFileTypes?.join(', ') || 'Any format' },
                  { label: 'Max File Size', value: `${assignment.maxFileSizeMb ?? 'Unlimited'} MB` },
                  { label: 'Late Submission', value: allowLate ? 'Allowed (penalty may apply)' : 'Not Allowed' },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: '0.875rem' }}>
                    <span style={{ color: '#6B7280', flexShrink: 0 }}>{row.label}</span>
                    <span style={{ color: '#1F2937', fontWeight: row.bold ? 700 : 500, textAlign: 'right' }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Description Card */}
            {assignment.description && (
              <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '1.25rem 1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <h3 style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1F2937', marginBottom: '0.6rem' }}>Description</h3>
                <p style={{ fontSize: '0.875rem', color: '#4B5563', lineHeight: 1.7 }}>{assignment.description}</p>
              </div>
            )}

            {/* Submission Status / Grade Card (if already submitted) */}
            {submission && !isEditing && (
              <div style={{
                background: submission.status === 'graded' ? 'rgba(16,185,129,0.05)' : '#ffffff',
                borderRadius: '12px',
                border: `1px solid ${submission.status === 'graded' ? 'rgba(16,185,129,0.3)' : '#E5E7EB'}`,
                padding: '1.25rem 1.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontWeight: 700, color: '#10B981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle size={16} /> Submission Received
                  </h3>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {(() => {
                      const ds = getSubmissionDisplayStatus(submission.status, submission.submittedAt, assignment.dueDate);
                      const { bg, color } = SUBMISSION_DISPLAY_STATUS_COLORS[ds];
                      return <span style={{ background: bg, color, padding: '4px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}>{ds}</span>;
                    })()}
                    {canEdit && (
                      <button
                        onClick={startEditing}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#F3F4F6', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '0.8rem', fontWeight: 600, color: '#374151', cursor: 'pointer' }}
                        className="hover:bg-gray-200"
                      >
                        <RefreshCw size={12} /> Update
                      </button>
                    )}
                  </div>
                </div>

                {submission.grade != null && (
                  <div style={{ background: `${gradeColor}15`, padding: '1rem', borderRadius: '10px', border: `1px solid ${gradeColor}30`, marginBottom: '1rem' }}>
                    <p style={{ fontWeight: 800, fontSize: '1.1rem', color: gradeColor }}>
                      Grade: {submission.grade} / {assignment.totalMarks} ({calculatePercentage(submission.grade, assignment.totalMarks)}%)
                    </p>
                    {submission.feedback && (
                      <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#4B5563', lineHeight: 1.6 }}>{submission.feedback}</p>
                    )}
                  </div>
                )}

                {submission.textContent && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9CA3AF', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Notes</p>
                    <p style={{ fontSize: '0.875rem', color: '#4B5563', lineHeight: 1.6, background: '#F8FAFC', padding: '0.75rem', borderRadius: '8px' }}>{submission.textContent}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── CENTER: Upload & Submit ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Upload Your Submission */}
            {(canSubmit || isEditing) && (
              <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5' }}>
                      <Upload size={18} />
                    </div>
                    <h2 style={{ fontWeight: 800, fontSize: '1rem', color: '#1F2937' }}>{isEditing ? 'Update Your Submission' : 'Upload Your Submission'}</h2>
                  </div>
                  {isEditing && (
                    <button onClick={() => setIsEditing(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: '0.85rem' }}>
                      <X size={14} /> Cancel
                    </button>
                  )}
                </div>

                <form onSubmit={handleSubmit(onSubmit)}>
                  <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    {/* Status messages */}
                    {isOverdue && allowLate && (
                      <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#D97706', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertCircle size={15} /> This assignment is past due. Late submission may be penalized.
                      </div>
                    )}
                    {submitSuccess && (
                      <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CheckCircle size={15} /> Submission received successfully!
                      </div>
                    )}
                    {submitError && (
                      <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <X size={15} /> {submitError}
                      </div>
                    )}

                    {/* File Drop Zone */}
                    <div
                      onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        border: `2px dashed ${isDragging ? '#4F46E5' : selectedFile ? '#10B981' : fileError ? '#EF4444' : '#D1D5DB'}`,
                        borderRadius: '10px',
                        padding: '2rem',
                        textAlign: 'center',
                        cursor: 'pointer',
                        background: isDragging ? 'rgba(99,102,241,0.05)' : selectedFile ? 'rgba(16,185,129,0.05)' : '#F8FAFC',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ width: 52, height: 52, borderRadius: '50%', background: isDragging ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.1)', margin: '0 auto 0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5' }}>
                        <Upload size={24} />
                      </div>
                      {selectedFile ? (
                        <div>
                          <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#10B981' }}>{selectedFile.name}</p>
                          <p style={{ fontSize: '0.78rem', color: '#6B7280', marginTop: '0.25rem' }}>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB · Click to change</p>
                        </div>
                      ) : (
                        <div>
                          <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#374151' }}>Drag & drop your file here</p>
                          <p style={{ fontSize: '0.82rem', color: '#9CA3AF', marginBottom: '0.75rem' }}>or</p>
                          <span style={{ background: '#4F46E5', color: '#fff', fontWeight: 700, fontSize: '0.85rem', padding: '8px 20px', borderRadius: '8px', display: 'inline-block' }}>Browse Files</span>
                          <p style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '0.75rem' }}>
                            Supported: {assignment.allowedFileTypes?.join(', ') || 'Any format'} &nbsp;|&nbsp; Max size: {assignment.maxFileSizeMb ?? 'Unlimited'} MB
                          </p>
                        </div>
                      )}
                      <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={e => handleFileChange(e.target.files?.[0] || null)} />
                    </div>
                    {fileError && <p style={{ color: '#EF4444', fontSize: '0.8rem', marginTop: '-0.75rem' }}>{fileError}</p>}

                    {/* Uploaded File display */}
                    {selectedFile && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ color: '#EF4444' }}><FileText size={22} fill="#FCA5A5" strokeWidth={1.5} /></div>
                          <div>
                            <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1F2937' }}>{selectedFile.name}</p>
                            <p style={{ fontSize: '0.75rem', color: '#6B7280' }}>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <button type="button" onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: 4 }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}

                    {/* Comment textarea */}
                    <div>
                      <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '0.5rem' }}>Add Comment (Optional)</label>
                      <textarea
                        placeholder="Add any notes for your instructor..."
                        style={{ width: '100%', borderRadius: '8px', border: '1px solid #D1D5DB', padding: '0.75rem', fontSize: '0.875rem', color: '#1F2937', resize: 'vertical', minHeight: 80, outline: 'none', boxSizing: 'border-box' }}
                        {...register('textContent')}
                        maxLength={500}
                      />
                      <p style={{ fontSize: '0.75rem', color: '#9CA3AF', textAlign: 'right', marginTop: '0.25rem' }}>{textContent.length} / 500</p>
                    </div>

                    {/* Links */}
                    <div>
                      <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '0.5rem' }}>
                        <LinkIcon size={13} style={{ display: 'inline', marginRight: 4 }} />
                        Links (one per line)
                      </label>
                      <textarea style={{ width: '100%', borderRadius: '8px', border: '1px solid #D1D5DB', padding: '0.75rem', fontSize: '0.875rem', color: '#1F2937', resize: 'vertical', minHeight: 56, outline: 'none', boxSizing: 'border-box' }} placeholder="https://github.com/..." {...register('links')} />
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                      <button
                        type="button"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', flex: 1, padding: '0.7rem', background: '#ffffff', border: '1px solid #D1D5DB', borderRadius: '8px', fontWeight: 600, fontSize: '0.875rem', color: '#374151', cursor: 'pointer' }}
                        className="hover:bg-gray-50"
                      >
                        <FileDown size={15} /> Save as Draft
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting || !!fileError}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', flex: 2, padding: '0.7rem', background: isSubmitting ? '#6B7280' : '#4F46E5', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.875rem', color: '#ffffff', cursor: isSubmitting ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(79,70,229,0.3)' }}
                        className="hover:bg-indigo-600"
                      >
                        <Send size={15} /> {isSubmitting ? 'Submitting...' : isEditing ? 'Update Submission' : 'Submit Assignment'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* If already submitted but can't edit - show current submission file */}
            {submission && !isEditing && submission.fileName && (
              <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '1.25rem 1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <h3 style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1F2937', marginBottom: '0.85rem' }}>Submitted File</h3>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '0.85rem 1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ color: '#EF4444' }}><FileText size={22} fill="#FCA5A5" strokeWidth={1.5} /></div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1F2937' }}>{submission.fileName}</p>
                      <p style={{ fontSize: '0.75rem', color: '#6B7280' }}>Submitted {submission.submittedAt ? formatDate(submission.submittedAt, 'MMM d, yyyy h:mm a') : ''}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {submission.fileUrl && (
                      <button onClick={() => viewSecureFile(submission.fileUrl!)} style={{ width: 34, height: 34, borderRadius: '6px', background: '#EEF2FF', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#4F46E5' }}>
                        <Eye size={16} />
                      </button>
                    )}
                    <button onClick={startEditing} style={{ width: 34, height: 34, borderRadius: '6px', background: '#F3F4F6', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#374151' }}>
                      <RefreshCw size={15} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Submission History Table */}
            {submission && (
              <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E5E7EB' }}>
                  <h3 style={{ fontWeight: 800, fontSize: '1rem', color: '#1F2937' }}>Submission History</h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', minWidth: '600px' }}>
                    <thead>
                      <tr>
                        {['Attempt', 'Submitted On', 'File', 'Size', 'Status', 'Marks', 'Feedback', 'Action'].map(h => (
                          <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: '#6B7280', borderBottom: '1px solid #E5E7EB', background: '#F8FAFC' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <td style={{ padding: '0.9rem 1rem', fontWeight: 700, color: '#1F2937' }}>1</td>
                        <td style={{ padding: '0.9rem 1rem', color: '#374151' }}>
                          {submission.submittedAt ? formatDate(submission.submittedAt, 'MMM d, yyyy, h:mm a') : '-'}
                        </td>
                        <td style={{ padding: '0.9rem 1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <FileText size={14} color="#EF4444" />
                            <span style={{ color: '#374151' }}>{submission.fileName || '-'}</span>
                          </div>
                        </td>
                        <td style={{ padding: '0.9rem 1rem', color: '#6B7280' }}>-</td>
                        <td style={{ padding: '0.9rem 1rem' }}>
                          <span style={{
                            background: submission.status === 'graded' ? 'rgba(16,185,129,0.15)' : submission.status === 'submitted' ? 'rgba(99,102,241,0.15)' : 'rgba(245,158,11,0.15)',
                            color: submission.status === 'graded' ? '#059669' : submission.status === 'submitted' ? '#4F46E5' : '#D97706',
                            padding: '3px 10px', borderRadius: '5px', fontSize: '0.8rem', fontWeight: 700, textTransform: 'capitalize'
                          }}>
                            {submission.status === 'submitted' ? 'Submitted' : submission.status}
                          </span>
                        </td>
                        <td style={{ padding: '0.9rem 1rem', color: '#374151', fontWeight: submission.grade != null ? 700 : 400 }}>
                          {submission.grade != null ? `${submission.grade} / ${assignment.totalMarks}` : '–'}
                        </td>
                        <td style={{ padding: '0.9rem 1rem', color: '#6B7280' }}>
                          {submission.feedback ? submission.feedback.substring(0, 30) + '…' : '–'}
                        </td>
                        <td style={{ padding: '0.9rem 1rem' }}>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {submission.fileUrl && (
                              <button onClick={() => viewSecureFile(submission.fileUrl!)} style={{ width: 30, height: 30, borderRadius: '6px', background: '#EEF2FF', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#4F46E5' }}>
                                <Eye size={14} />
                              </button>
                            )}
                            <button style={{ width: 30, height: 30, borderRadius: '6px', background: '#F0FDF4', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#10B981' }}>
                              <Download size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Instructions Card */}
            <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Lightbulb size={16} color="#F59E0B" />
                <h3 style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1F2937' }}>Instructions</h3>
              </div>
              <ul style={{ padding: '1rem 1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {instructions.map((inst, i) => (
                  <li key={i} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.82rem', color: '#4B5563', lineHeight: 1.5 }}>
                    <span style={{ color: '#9CA3AF', flexShrink: 0 }}>•</span>
                    {inst}
                  </li>
                ))}
              </ul>
            </div>

            {/* Reference Files Card
            {assignment.attachmentUrl && (
              <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Paperclip size={16} color="#6B7280" />
                  <h3 style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1F2937' }}>Reference Files</h3>
                </div>
                <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {[{ name: 'Assignment Guidelines.pdf', size: '512 KB', color: '#EF4444' }].map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={16} color={f.color} fill={`${f.color}33`} strokeWidth={1.5} />
                        <div>
                          <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1F2937' }}>{f.name}</p>
                          <p style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>{f.size}</p>
                        </div>
                      </div>
                      <a href={assignment.attachmentUrl!} target="_blank" rel="noreferrer" style={{ color: '#6B7280', display: 'flex', alignItems: 'center' }}>
                        <Download size={15} />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )} */}

            {/* Deadline Sidebar Card */}
            <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #E5E7EB' }}>
                <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>DEADLINE</p>
                <p style={{ fontSize: '1.4rem', fontWeight: 800, color: isOverdue ? '#EF4444' : '#1F2937', lineHeight: 1.2, marginTop: '0.25rem' }}>
                  {formatDate(assignment.dueDate, 'MMM d')}
                </p>
                <p style={{ fontSize: '0.8rem', color: '#6B7280' }}>{formatDate(assignment.dueDate, 'h:mm a, yyyy')}</p>
              </div>
              <div style={{ padding: '0.75rem 1.25rem' }}>
                <div style={{ background: isOverdue ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)', borderRadius: '6px', padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.82rem', fontWeight: 700, color: isOverdue ? '#EF4444' : '#D97706' }}>
                    {getDueDateCountdown(assignment.dueDate)}
                  </p>
                </div>
              </div>
            </div>



            {/* Class Discussion */}
            <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MessageSquare size={16} color="#4F46E5" />
                <h3 style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1F2937' }}>Class Comments</h3>
              </div>
              <div style={{ padding: '1rem 1.25rem' }}>
                <AssignmentDiscussion assignmentId={id} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </RequireRole>
  );
}
