'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { FileText, Star, Clock, CheckCircle, Users, ExternalLink } from 'lucide-react';
import { RequireRole } from '@/lib/auth/guards';
import { useAuth } from '@/lib/auth/context';
import PageHeader from '@/components/layout/PageHeader';
import { SubmissionStatusBadge, AssignmentStatusBadge } from '@/components/ui/Badge';
import GradeModal from '@/components/submissions/GradeModal';
import { assignmentsService } from '@/lib/api/assignments';
import { submissionsService } from '@/lib/api/submissions';
import { viewSecureFile } from '@/lib/utils/storage';
import type { Assignment, Submission, SubmissionGradeInput } from '@/lib/types';
import { formatDate, formatRelative, calculatePercentage, getInitials } from '@/lib/utils';
import { MessageSquare } from 'lucide-react';
import AssignmentDiscussion from '@/components/dashboard/AssignmentDiscussion';

export default function TeacherAssignmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [gradeTarget, setGradeTarget] = useState<Submission | null>(null);

  const load = async () => {
    setIsLoading(true);
    const [a, sRes] = await Promise.all([
      assignmentsService.getById(id),
      submissionsService.getAll({ assignmentId: id }),
    ]);
    setAssignment(a);
    setSubmissions(sRes.data);
    setIsLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const handleGrade = async (submissionId: string, data: SubmissionGradeInput) => {
    if (!user) return;
    await submissionsService.grade(submissionId, data);
    load();
  };

  const gradedCount = submissions.filter(s => s.status === 'graded').length;
  const pendingCount = submissions.filter(s => s.status === 'submitted' || s.status === 'late').length;

  if (isLoading) {
    return (
      <RequireRole roles={['teacher']}>
        <div className="animate-fade-in">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 'var(--radius-md)', marginBottom: '1rem' }} />)}
        </div>
      </RequireRole>
    );
  }

  if (!assignment) {
    return <RequireRole roles={['teacher']}><p>Assignment not found.</p></RequireRole>;
  }

  return (
    <RequireRole roles={['teacher']}>
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <PageHeader
          title={assignment.title}
          breadcrumbs={[
            { label: 'Teacher', href: '/teacher' },
            { label: 'Assignments', href: '/teacher/assignments' },
            { label: assignment.title }
          ]}
        />

        {/* Dashboard Metrics Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          
          <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Assignment Info</p>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <AssignmentStatusBadge status={assignment.status} />
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{assignment.totalMarks} Marks</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Clock size={14} /> Due: {formatDate(assignment.dueDate, 'MMM d, yyyy h:mm a')}
            </p>
          </div>

          <div className="card" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total Submissions</p>
              <p style={{ fontSize: '2rem', fontWeight: 800 }}>{submissions.length}</p>
            </div>
            <div style={{ padding: '1rem', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-full)' }}>
              <Users size={24} style={{ color: 'var(--color-text-secondary)' }} />
            </div>
          </div>

          <div className="card" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderColor: 'rgba(245,158,11,0.2)' }}>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Needs Grading</p>
              <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-warning)' }}>{pendingCount}</p>
            </div>
            <div style={{ padding: '1rem', background: 'var(--color-warning-muted)', borderRadius: 'var(--radius-full)' }}>
              <Clock size={24} style={{ color: 'var(--color-warning)' }} />
            </div>
          </div>

          <div className="card" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderColor: 'rgba(16,185,129,0.2)' }}>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Graded</p>
              <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-success)' }}>{gradedCount}</p>
            </div>
            <div style={{ padding: '1rem', background: 'var(--color-success-muted)', borderRadius: 'var(--radius-full)' }}>
              <CheckCircle size={24} style={{ color: 'var(--color-success)' }} />
            </div>
          </div>
        </div>

        {/* Submissions Data Table */}
        <div className="card">
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Student Submissions Tracker</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Review attachments and provide grades for student submissions.</p>
          </div>

          {submissions.length === 0 ? (
            <div className="empty-state" style={{ padding: '3rem' }}>
              <FileText size={36} style={{ color: 'var(--color-text-muted)', opacity: 0.5 }} />
              <p>No students have submitted yet.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: 'var(--color-surface-2)', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>
                  <tr>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Student</th>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Submission Status</th>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Date Submitted</th>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>Attachment</th>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: 600, textAlign: 'right' }}>Grade & Action</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((s, index) => (
                    <tr key={s.id} style={{ borderTop: '1px solid var(--color-border)', background: index % 2 === 0 ? 'transparent' : 'var(--color-surface-2)' }}>
                      
                      {/* Student Info */}
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div className="avatar avatar-sm" style={{ background: 'var(--gradient-primary)' }}>
                            {getInitials(s.studentName.split(' ')[0], s.studentName.split(' ')[1] ?? '')}
                          </div>
                          <div>
                            <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{s.studentName}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{s.studentEmail}</p>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <SubmissionStatusBadge status={s.status} />
                      </td>

                      {/* Date */}
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                        {s.submittedAt ? formatDate(s.submittedAt, 'MMM d, yyyy h:mm a') : '-'}
                      </td>

                      {/* Attachment (Fixing the PDF view issue) */}
                      <td style={{ padding: '1rem 1.5rem' }}>
                        {s.fileUrl ? (
                          <button 
                            onClick={() => viewSecureFile(s.fileUrl!)}
                            className="btn btn-ghost btn-sm"
                            style={{ display: 'inline-flex', gap: '0.5rem', color: 'var(--color-primary)', background: 'var(--color-primary-muted)' }}
                          >
                            <FileText size={14} />
                            View File
                            <ExternalLink size={12} style={{ opacity: 0.5 }} />
                          </button>
                        ) : s.fileName ? (
                          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <FileText size={14} /> {s.fileName} (No file)
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>No attachment</span>
                        )}
                      </td>

                      {/* Grade & Action */}
                      <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1rem' }}>
                          {s.status === 'graded' && s.grade != null && (
                            <div style={{ textAlign: 'right' }}>
                              <p style={{ fontWeight: 700, color: 'var(--color-success)', fontSize: '0.95rem' }}>
                                {s.grade} / {assignment.totalMarks}
                              </p>
                              <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                                {calculatePercentage(s.grade, assignment.totalMarks)}%
                              </p>
                            </div>
                          )}
                          <button
                            className={`btn btn-sm ${s.status === 'graded' ? 'btn-secondary' : 'btn-primary'}`}
                            onClick={() => setGradeTarget(s)}
                          >
                            <Star size={14} style={{ marginRight: '0.25rem' }} /> 
                            {s.status === 'graded' ? 'Edit Grade' : 'Grade Now'}
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Class Comments (Stream) */}
        <div style={{ marginTop: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <MessageSquare size={18} style={{ color: 'var(--color-primary)' }} />
            <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>Class Comments</h3>
          </div>
          <AssignmentDiscussion assignmentId={id} />
        </div>

        <GradeModal
          submission={gradeTarget}
          totalMarks={assignment.totalMarks}
          isOpen={!!gradeTarget}
          onClose={() => setGradeTarget(null)}
          onGrade={handleGrade}
        />
      </div>
    </RequireRole>
  );
}
