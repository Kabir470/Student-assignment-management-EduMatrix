'use client';

import { useEffect, useState } from 'react';
import { Search, Star } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { RequireRole } from '@/lib/auth/guards';
import PageHeader from '@/components/layout/PageHeader';
import { SubmissionStatusBadge } from '@/components/ui/Badge';
import GradeModal from '@/components/submissions/GradeModal';
import { submissionsService } from '@/lib/api/submissions';
import { assignmentsService } from '@/lib/api/assignments';
import type { Submission, Assignment, SubmissionGradeInput } from '@/lib/types';
import { formatDate, formatRelative, calculatePercentage, getInitials } from '@/lib/utils';
import Link from 'next/link';

export default function TeacherSubmissionsPage() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [myAssignments, setMyAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [gradeTarget, setGradeTarget] = useState<Submission | null>(null);

  const load = async () => {
    if (!user) return;
    setIsLoading(true);
    const aRes = await assignmentsService.getAll({ teacherId: user.id });
    setMyAssignments(aRes.data);
    const allSubs = await Promise.all(
      aRes.data.map(a => submissionsService.getAll({ assignmentId: a.id }))
    );
    const combined = allSubs.flatMap(r => r.data);
    setSubmissions(combined);
    setIsLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const getAssignment = (id: string) => myAssignments.find(a => a.id === id);

  const filtered = submissions.filter(s => {
    if (courseFilter !== 'all' && s.courseId !== courseFilter && getAssignment(s.assignmentId)?.courseId !== courseFilter) return false;
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return s.studentName.toLowerCase().includes(q) || s.assignmentTitle.toLowerCase().includes(q);
    }
    return true;
  });

  const handleGrade = async (submissionId: string, data: SubmissionGradeInput) => {
    if (!user) return;
    await submissionsService.grade(submissionId, data);
    load();
  };

  const coursesMap = new Map<string, string>();
  myAssignments.forEach(a => coursesMap.set(a.courseId, a.courseName));
  const uniqueCourses = Array.from(coursesMap.entries()).map(([id, name]) => ({ id, name }));

  return (
    <RequireRole roles={['teacher']}>
      <div className="animate-fade-in">
        <PageHeader
          title="All Submissions"
          subtitle={`${filtered.length} submissions found`}
          breadcrumbs={[{ label: 'Teacher', href: '/teacher' }, { label: 'Submissions' }]}
        />

        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
          <div className="input-wrapper" style={{ flex: 1, minWidth: 200 }}>
            <Search size={16} className="input-icon" />
            <input className="input" style={{ paddingLeft: '2.5rem' }} placeholder="Search student or assignment..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input" style={{ width: 180 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="submitted">Submitted</option>
            <option value="late">Late</option>
            <option value="graded">Graded</option>
          </select>
        </div>

        {/* Course Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          <button 
            className={`btn btn-sm ${courseFilter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setCourseFilter('all')}
            style={{ borderRadius: 'var(--radius-full)' }}
          >
            All Courses
          </button>
          {uniqueCourses.map(course => (
            <button 
              key={course.id}
              className={`btn btn-sm ${courseFilter === course.id ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setCourseFilter(course.id)}
              style={{ borderRadius: 'var(--radius-full)', whiteSpace: 'nowrap' }}
            >
              {course.name}
            </button>
          ))}
        </div>

        <div className="table-wrapper">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Assignment</th>
                <th>Submitted At</th>
                <th>Grade</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 6 }).map((_, j) => <td key={j}><div className="skeleton" style={{ height: 16, borderRadius: 4 }} /></td>)}</tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6}><div className="empty-state"><p>No submissions found</p></div></td></tr>
              ) : filtered.map(s => {
                const assignment = getAssignment(s.assignmentId);
                return (
                  <tr key={s.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="avatar avatar-sm" style={{ background: 'var(--gradient-primary)' }}>
                          {getInitials(s.studentName.split(' ')[0], s.studentName.split(' ')[1] ?? '')}
                        </div>
                        <div>
                          <p style={{ fontWeight: 500, color: 'var(--color-text)' }}>{s.studentName}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{s.studentEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Link href={`/teacher/assignments/${s.assignmentId}`} style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500, fontSize: '0.875rem' }}>
                        {s.assignmentTitle}
                      </Link>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{s.courseName}</p>
                    </td>
                    <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                      {s.submittedAt ? formatDate(s.submittedAt, 'MMM d, h:mm a') : '—'}
                    </td>
                    <td>
                      {s.grade != null && assignment ? (
                        <span style={{ fontWeight: 700, color: 'var(--color-success)' }}>
                          {s.grade}/{assignment.totalMarks} ({calculatePercentage(s.grade, assignment.totalMarks)}%)
                        </span>
                      ) : <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                    </td>
                    <td><SubmissionStatusBadge status={s.status} /></td>
                    <td>
                      <button className="btn btn-primary btn-sm" onClick={() => setGradeTarget(s)}>
                        <Star size={12} /> {s.status === 'graded' ? 'Re-grade' : 'Grade'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </div>

        <GradeModal
          submission={gradeTarget}
          totalMarks={getAssignment(gradeTarget?.assignmentId ?? '')?.totalMarks ?? 100}
          isOpen={!!gradeTarget}
          onClose={() => setGradeTarget(null)}
          onGrade={handleGrade}
        />
      </div>
    </RequireRole>
  );
}
