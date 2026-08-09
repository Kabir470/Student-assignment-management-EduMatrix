'use client';

import { useEffect, useState } from 'react';
import { Star, FileText, MessageSquare, Search, Filter } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { RequireRole } from '@/lib/auth/guards';
import PageHeader from '@/components/layout/PageHeader';
import { SubmissionStatusBadge } from '@/components/ui/Badge';
import { submissionsService } from '@/lib/api/submissions';
import { assignmentsService } from '@/lib/api/assignments';
import type { Submission, Assignment } from '@/lib/types';
import { formatDate, formatRelative, calculatePercentage } from '@/lib/utils';

export default function StudentSubmissionsPage() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterCourse, setFilterCourse] = useState<string>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const [sRes, aRes] = await Promise.all([
        submissionsService.getMySubmissions({ limit: 100 }),
        assignmentsService.getMyAssignments({ limit: 100 }),
      ]);
      setSubmissions(sRes.data);
      setAssignments(aRes.data);
      setIsLoading(false);
    };
    load();
  }, [user]);

  const getAssignment = (id: string) => assignments.find(a => a.id === id);

  const graded = submissions.filter(s => s.status === 'graded');
  const avgGrade = graded.length > 0
    ? Math.round(graded.reduce((acc, s) => {
        const a = getAssignment(s.assignmentId);
        return acc + calculatePercentage(s.grade ?? 0, a?.totalMarks ?? 100);
      }, 0) / graded.length)
    : 0;

  // Extract unique course names
  const uniqueCourses = Array.from(new Set(submissions.map(s => s.courseName))).sort();

  // Apply filters
  const filteredSubmissions = submissions.filter(s => {
    if (filterCourse !== 'all' && s.courseName !== filterCourse) return false;
    if (search && !s.courseName.toLowerCase().includes(search.toLowerCase()) && !s.assignmentTitle.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <RequireRole roles={['student']}>
      <div className="animate-fade-in">
        <PageHeader
          title="My Submissions"
          subtitle={`${submissions.length} total submissions across all courses`}
          breadcrumbs={[{ label: 'Student', href: '/student' }, { label: 'My Submissions' }]}
        />

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={() => setFilterCourse('all')}
            style={{
              padding: '0.4rem 1rem',
              border: `1px solid ${filterCourse === 'all' ? 'var(--color-primary)' : 'var(--color-border)'}`,
              borderRadius: 'var(--radius-full)',
              background: filterCourse === 'all' ? 'var(--color-primary-muted)' : 'transparent',
              color: filterCourse === 'all' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            All Courses
          </button>
          
          {uniqueCourses.map(course => (
            <button
              key={course}
              onClick={() => setFilterCourse(course)}
              style={{
                padding: '0.4rem 1rem',
                border: `1px solid ${filterCourse === course ? 'var(--color-primary)' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-full)',
                background: filterCourse === course ? 'var(--color-primary-muted)' : 'transparent',
                color: filterCourse === course ? 'var(--color-primary)' : 'var(--color-text-muted)',
                fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
              }}
            >
              {course}
            </button>
          ))}
          
          <div className="input-wrapper" style={{ marginLeft: 'auto', width: '250px' }}>
            <Search size={15} className="input-icon" />
            <input 
              className="input" 
              style={{ paddingLeft: '2.25rem' }} 
              placeholder="Search course or assignment..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 110, borderRadius: 'var(--radius-lg)' }} />)}
          </div>
        ) : submissions.length === 0 ? (
          <div className="card" style={{ padding: '3rem' }}>
            <div className="empty-state">
              <FileText size={40} style={{ color: 'var(--color-text-muted)', opacity: 0.4 }} />
              <p>No submissions yet</p>
              <a href="/student/assignments" className="btn btn-primary btn-sm">Browse Assignments</a>
            </div>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="card" style={{ padding: '3rem' }}>
            <div className="empty-state">
              <Filter size={40} style={{ color: 'var(--color-text-muted)', opacity: 0.4 }} />
              <p>No submissions match your filters</p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredSubmissions.map(s => {
              const assignment = getAssignment(s.assignmentId);
              const pct = s.grade != null && assignment ? calculatePercentage(s.grade, assignment.totalMarks) : null;
              const gradeColor = pct != null ? pct >= 75 ? 'var(--color-success)' : pct >= 50 ? 'var(--color-warning)' : 'var(--color-danger)' : null;

              return (
                <div key={s.id} className="card" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.875rem' }}>
                    <div>
                      <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text)', marginBottom: '0.25rem' }}>{s.assignmentTitle}</h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        {s.courseName}
                        {s.submittedAt && <> · Submitted {formatRelative(s.submittedAt)}</>}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {pct != null && gradeColor && (
                        <div style={{
                          padding: '0.375rem 0.875rem',
                          background: `${gradeColor}18`,
                          border: `1px solid ${gradeColor}40`,
                          borderRadius: 'var(--radius-full)',
                          color: gradeColor, fontWeight: 700, fontSize: '0.875rem',
                        }}>
                          <Star size={12} style={{ display: 'inline', marginRight: 4 }} />
                          {s.grade}/{assignment?.totalMarks} ({pct}%)
                        </div>
                      )}
                      <SubmissionStatusBadge status={s.status} />
                    </div>
                  </div>

                  {pct != null && (
                    <div className="progress-bar" style={{ marginBottom: '1rem' }}>
                      <div className="progress-bar-fill" style={{ width: `${pct}%`, background: gradeColor ?? undefined }} />
                    </div>
                  )}

                  {s.textContent && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem', padding: '0.75rem', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)', lineHeight: 1.5 }}>
                      {s.textContent.slice(0, 200)}{s.textContent.length > 200 ? '...' : ''}
                    </p>
                  )}

                  {s.status === 'graded' && s.feedback && (
                    <div style={{ padding: '0.875rem', background: 'var(--color-success-muted)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16,185,129,0.2)' }}>
                      <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-success)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <MessageSquare size={11} style={{ display: 'inline', marginRight: 4 }} />Teacher Feedback
                      </p>
                      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{s.feedback}</p>
                    </div>
                  )}

                  {s.status !== 'graded' && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                      Awaiting review from your teacher...
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </RequireRole>
  );
}
