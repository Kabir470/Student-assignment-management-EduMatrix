'use client';

import { useEffect, useState } from 'react';
import { FileText, ClipboardCheck, Clock, Users } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { RequireRole } from '@/lib/auth/guards';
import PageHeader from '@/components/layout/PageHeader';
import StatCard from '@/components/dashboard/StatCard';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import { AssignmentStatusBadge, SubmissionStatusBadge } from '@/components/ui/Badge';
import { formatDate, getDueDateCountdown, isPastDue } from '@/lib/utils';
import { assignmentsService } from '@/lib/api/assignments';
import { submissionsService } from '@/lib/api/submissions';
import type { Assignment, Submission } from '@/lib/types';
import Link from 'next/link';
import AssignmentCalendar from '@/components/dashboard/AssignmentCalendar';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState({
    activeAssignments: 0,
    submissionsToGrade: 0,
    totalStudents: 0,
    avgClassGrade: 0
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [aRes, sRes] = await Promise.all([
          assignmentsService.getAll({ limit: 100 }),
          submissionsService.getAll({ limit: 100 }),
        ]);
        
        setAssignments(aRes.data);
        setSubmissions(sRes.data);
        
        const toGrade = sRes.data.filter(s => s.status === 'submitted' || s.status === 'late').length;
        const uniqueStudents = new Set(sRes.data.map(s => s.studentId)).size;
        setStats({
          activeAssignments: aRes.data.filter(a => a.status === 'published').length,
          submissionsToGrade: toGrade,
          totalStudents: uniqueStudents,
          avgClassGrade: 85
        });
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const myAssignments = assignments.slice(0, 4);
  const recentSubmissions = submissions.slice(0, 5);

  return (
    <RequireRole roles={['teacher']}>
      <div className="animate-fade-in">
        <PageHeader
          title={`Hello, ${user?.firstName}! 👋`}
          subtitle="Here's an overview of your assignments and student submissions."
          breadcrumbs={[{ label: 'Teacher' }, { label: 'Dashboard' }]}
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 130, borderRadius: 'var(--radius-lg)' }} />
            ))
          ) : (
            <>
              <StatCard title="My Assignments" value={stats.activeAssignments} icon={FileText} variant="primary" />
              <StatCard title="Pending Reviews" value={stats.submissionsToGrade} subtitle="Awaiting grading" icon={ClipboardCheck} variant="warning" />
              <StatCard title="Total Submissions" value={submissions.length} icon={Clock} variant="success" />
              <StatCard title="Students" value={stats.totalStudents} icon={Users} variant="primary" />
            </>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
          {/* My Assignments */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Recent Assignments</h2>
              <Link href="/teacher/assignments" style={{ fontSize: '0.8rem', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>
                View all →
              </Link>
            </div>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 'var(--radius-md)', marginBottom: '0.75rem' }} />)
            ) : myAssignments.length === 0 ? (
              <div className="empty-state"><p>No assignments yet. Create your first!</p></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {myAssignments.map(a => (
                  <Link key={a.id} href={`/teacher/assignments/${a.id}`} style={{ textDecoration: 'none' }}>
                    <div className="card" style={{ padding: '1rem', cursor: 'pointer' }}>
                      <div className="flex-between" style={{ marginBottom: '0.375rem' }}>
                        <p style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '0.9rem' }}>{a.title}</p>
                        <AssignmentStatusBadge status={a.status} />
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                        {a.courseName} · Due {formatDate(a.dueDate)}
                        {isPastDue(a.dueDate) && a.status === 'published' && <span style={{ color: 'var(--color-danger)', marginLeft: '0.25rem' }}>· OVERDUE</span>}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent Submissions */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Recent Submissions</h2>
              <Link href="/teacher/submissions" style={{ fontSize: '0.8rem', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>
                View all →
              </Link>
            </div>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 56, borderRadius: 'var(--radius-md)', marginBottom: '0.5rem' }} />)
            ) : recentSubmissions.length === 0 ? (
              <div className="empty-state"><p>No submissions yet</p></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {recentSubmissions.map(s => (
                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)' }}>
                    <div>
                      <p style={{ fontWeight: 500, fontSize: '0.85rem', color: 'var(--color-text)' }}>{s.studentName}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{s.assignmentTitle}</p>
                    </div>
                    <SubmissionStatusBadge status={s.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Calendar Section */}
          <div className="lg:col-span-1">
            <AssignmentCalendar assignments={assignments} role="teacher" />
          </div>
        </div>
      </div>
    </RequireRole>
  );
}
