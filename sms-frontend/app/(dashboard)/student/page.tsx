'use client';

import { useEffect, useState } from 'react';
import { FileText, ClipboardCheck, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { RequireRole } from '@/lib/auth/guards';
import PageHeader from '@/components/layout/PageHeader';
import StatCard from '@/components/dashboard/StatCard';
import { AssignmentStatusBadge, SubmissionStatusBadge } from '@/components/ui/Badge';
import { assignmentsService } from '@/lib/api/assignments';
import { submissionsService } from '@/lib/api/submissions';
import type { Assignment, Submission } from '@/lib/types';
import { formatDate, getDueDateCountdown, isPastDue, isDueSoon, calculatePercentage } from '@/lib/utils';
import Link from 'next/link';
import AssignmentCalendar from '@/components/dashboard/AssignmentCalendar';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const [res, sRes] = await Promise.all([
        assignmentsService.getMyAssignments({ limit: 100 }),
        submissionsService.getMySubmissions({ limit: 100 }),
      ]);
      setAssignments(res.data);
      setSubmissions(sRes.data);
      setIsLoading(false);
    };
    load();
  }, [user]);

  const submitted = submissions.filter(s => s.status !== 'pending').length;
  const graded = submissions.filter(s => s.status === 'graded');
  const pending = assignments.filter(a => !submissions.some(s => s.assignmentId === a.id)).length;
  const overdue = assignments.filter(a => isPastDue(a.dueDate) && !submissions.some(s => s.assignmentId === a.id)).length;


  const upcomingAssignments = assignments
    .filter(a => !isPastDue(a.dueDate))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 4);

  const recentSubmissions = [...submissions].sort((a, b) =>
    new Date(b.submittedAt ?? 0).getTime() - new Date(a.submittedAt ?? 0).getTime()
  ).slice(0, 4);

  return (
    <RequireRole roles={['student']}>
      <div className="animate-fade-in">
        <PageHeader
          title={`Hi, ${user?.firstName}! 🎓`}
          subtitle="Track your assignments and submissions below."
          breadcrumbs={[{ label: 'Student' }, { label: 'Dashboard' }]}
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 130, borderRadius: 'var(--radius-lg)' }} />)
          ) : (
            <>
              <Link href="/student/assignments" style={{ textDecoration: 'none' }}>
                <div className="card-hover"><StatCard title="Total Assignments" value={assignments.length} icon={FileText} variant="primary" /></div>
              </Link>
              <Link href="/student/assignments?filter=submitted" style={{ textDecoration: 'none' }}>
                <div className="card-hover"><StatCard title="Submitted" value={submitted} icon={ClipboardCheck} variant="success" /></div>
              </Link>
              <Link href="/student/assignments?filter=pending" style={{ textDecoration: 'none' }}>
                <div className="card-hover"><StatCard title="Pending" value={pending} icon={Clock} variant="warning" /></div>
              </Link>
              <Link href="/student/submissions" style={{ textDecoration: 'none' }}>
                <div className="card-hover"><StatCard title="Graded" value={graded.length} icon={CheckCircle} variant="primary" /></div>
              </Link>
              <Link href="/student/assignments?filter=overdue" style={{ textDecoration: 'none' }}>
                <div className="card-hover"><StatCard title="Overdue" value={overdue} icon={AlertCircle} variant="danger" /></div>
              </Link>
            </>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
          {/* Upcoming */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Upcoming Assignments</h2>
              <Link href="/student/assignments" style={{ fontSize: '0.8rem', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>
                View all →
              </Link>
            </div>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 70, borderRadius: 'var(--radius-md)', marginBottom: '0.75rem' }} />)
            ) : upcomingAssignments.length === 0 ? (
              <div className="empty-state"><p>No upcoming assignments 🎉</p></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {upcomingAssignments.map(a => {
                  const hasSubmitted = submissions.some(s => s.assignmentId === a.id);
                  const dueSoon = isDueSoon(a.dueDate);
                  return (
                    <Link key={a.id} href={`/student/assignments/${a.id}`} style={{ textDecoration: 'none' }}>
                      <div className="card" style={{ padding: '1rem', cursor: 'pointer', borderColor: dueSoon ? 'rgba(245,158,11,0.4)' : undefined }}>
                        <div className="flex-between" style={{ marginBottom: '0.375rem' }}>
                          <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text)' }}>{a.title}</p>
                          {hasSubmitted
                            ? <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>Submitted</span>
                            : dueSoon ? <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>Due Soon</span>
                            : null}
                        </div>
                        <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                          {a.courseName} · {getDueDateCountdown(a.dueDate)} · {a.totalMarks} marks
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Submissions */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Submission History</h2>
              <Link href="/student/submissions" style={{ fontSize: '0.8rem', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>
                View all →
              </Link>
            </div>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 70, borderRadius: 'var(--radius-md)', marginBottom: '0.75rem' }} />)
            ) : recentSubmissions.length === 0 ? (
              <div className="empty-state"><p>No submissions yet. Start working!</p></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {recentSubmissions.map(s => {
                  const a = assignments.find(a => a.id === s.assignmentId);
                  return (
                    <div key={s.id} style={{ padding: '1rem', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                      <div className="flex-between" style={{ marginBottom: '0.375rem' }}>
                        <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text)' }}>{s.assignmentTitle}</p>
                        <SubmissionStatusBadge status={s.status} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{s.courseName}</p>
                        {s.status === 'graded' && s.grade != null && a && (
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-success)' }}>
                            {s.grade}/{a.totalMarks} ({calculatePercentage(s.grade, a.totalMarks)}%)
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Calendar Section */}
          <div className="lg:col-span-1">
            <AssignmentCalendar assignments={assignments} role="student" />
          </div>
        </div>
      </div>
    </RequireRole>
  );
}
