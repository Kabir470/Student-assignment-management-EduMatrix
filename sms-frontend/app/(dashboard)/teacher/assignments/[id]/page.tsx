'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import { formatDate, formatRelative, calculatePercentage, getInitials, getSubmissionDisplayStatus, SUBMISSION_DISPLAY_STATUS_COLORS } from '@/lib/utils';
import { MessageSquare } from 'lucide-react';
import AssignmentDiscussion from '@/components/dashboard/AssignmentDiscussion';

export default function TeacherAssignmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [gradeTarget, setGradeTarget] = useState<Submission | null>(null);

  useEffect(() => {
    if (id === 'new') {
      router.replace('/teacher/assignments?action=new');
    }
  }, [id, router]);

  const load = async () => {
    if (id === 'new') return;
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          
          <div style={{ background: '#ffffff', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }} className="transition-shadow hover:shadow-md">
            <p style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Assignment Info</p>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <AssignmentStatusBadge status={assignment.status} dueDate={assignment.dueDate} />
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1F2937' }}>{assignment.totalMarks} Marks</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: 'auto' }}>
              <Clock size={13} /> Due: {formatDate(assignment.dueDate, 'MMM d, yyyy h:mm a')}
            </p>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }} className="transition-shadow hover:shadow-md">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <p style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Total Submissions</p>
              <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1F2937', lineHeight: 1 }}>{submissions.length}</p>
            </div>
            <div style={{ width: 40, height: 40, background: '#F3F4F6', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4B5563' }}>
              <Users size={20} />
            </div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '12px', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(245, 158, 11, 0.05)' }} className="transition-shadow hover:shadow-md">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <p style={{ fontSize: '0.75rem', color: '#D97706', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Needs Grading</p>
              <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#D97706', lineHeight: 1 }}>{pendingCount}</p>
            </div>
            <div style={{ width: 40, height: 40, background: 'rgba(245, 158, 11, 0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}>
              <Clock size={20} />
            </div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '12px', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(16, 185, 129, 0.05)' }} className="transition-shadow hover:shadow-md">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <p style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Graded</p>
              <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#059669', lineHeight: 1 }}>{gradedCount}</p>
            </div>
            <div style={{ width: 40, height: 40, background: 'rgba(16, 185, 129, 0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
              <CheckCircle size={20} />
            </div>
          </div>
        </div>

        {/* Submissions Data Table */}
        <div style={{ background: '#ffffff', border: '1px solid #E5E7EB', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid #F3F4F6' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1F2937' }}>Student Submissions Tracker</h3>
            <p style={{ fontSize: '0.85rem', color: '#6B7280', marginTop: '0.25rem' }}>Review attachments and provide grades for student submissions.</p>
          </div>

          {submissions.length === 0 ? (
            <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
              <FileText size={48} style={{ color: '#D1D5DB', margin: '0 auto 1rem' }} />
              <p style={{ color: '#4B5563', fontWeight: 600 }}>No students have submitted yet.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 800 }}>
                <thead style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                  <tr>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: 700, fontSize: '0.75rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Student</th>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: 700, fontSize: '0.75rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Submission Status</th>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: 700, fontSize: '0.75rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date Submitted</th>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: 700, fontSize: '0.75rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Attachment</th>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: 700, fontSize: '0.75rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Grade & Action</th>
                  </tr>
                </thead>
                <tbody style={{ background: '#ffffff' }}>
                  {submissions.map((s, index) => (
                    <tr key={s.id} style={{ borderBottom: '1px solid #F3F4F6' }} className="hover:bg-gray-50 transition-colors">
                      
                      {/* Student Info */}
                      <td style={{ padding: '1.25rem 1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>
                            {getInitials(s.studentName.split(' ')[0], s.studentName.split(' ')[1] ?? '')}
                          </div>
                          <div>
                            <p style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1F2937' }}>{s.studentName}</p>
                            <p style={{ fontSize: '0.75rem', color: '#6B7280' }}>{s.studentEmail}</p>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '1.25rem 1.5rem' }}>
                        {(() => {
                          const ds = getSubmissionDisplayStatus(s.status, s.submittedAt, assignment.dueDate);
                          const { bg, color } = SUBMISSION_DISPLAY_STATUS_COLORS[ds];
                          return <span style={{ background: bg, color, padding: '4px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>{ds}</span>;
                        })()}
                      </td>

                      {/* Date */}
                      <td style={{ padding: '1.25rem 1.5rem', fontSize: '0.85rem', color: '#4B5563' }}>
                        {s.submittedAt ? formatDate(s.submittedAt, 'MMM d, yyyy h:mm a') : '-'}
                      </td>

                      {/* Attachment */}
                      <td style={{ padding: '1.25rem 1.5rem' }}>
                        {s.fileUrl ? (
                          <button 
                            onClick={() => viewSecureFile(s.fileUrl!)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#4F46E5', background: 'rgba(99,102,241,0.1)', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                            className="hover:bg-indigo-100 transition-colors"
                          >
                            <FileText size={14} />
                            View File
                            <ExternalLink size={12} style={{ opacity: 0.5 }} />
                          </button>
                        ) : s.fileName ? (
                          <span style={{ fontSize: '0.85rem', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <FileText size={14} /> {s.fileName} (No file)
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.85rem', color: '#9CA3AF' }}>No attachment</span>
                        )}
                      </td>

                      {/* Grade & Action */}
                      <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1.25rem' }}>
                          {s.status === 'graded' && s.grade != null && (
                            <div style={{ textAlign: 'right' }}>
                              <p style={{ fontWeight: 800, color: '#059669', fontSize: '0.95rem' }}>
                                {s.grade} / {assignment.totalMarks}
                              </p>
                              <p style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: 600 }}>
                                {calculatePercentage(s.grade, assignment.totalMarks)}%
                              </p>
                            </div>
                          )}
                          <button
                            onClick={() => setGradeTarget(s)}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#ffffff', border: '1px solid #E5E7EB', color: '#374151', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <Star size={14} style={{ color: s.status === 'graded' ? '#F59E0B' : '#6B7280' }} /> 
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
