'use client';

import { useEffect, useState } from 'react';
import { Search, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { RequireRole } from '@/lib/auth/guards';
import PageHeader from '@/components/layout/PageHeader';
import { assignmentsService } from '@/lib/api/assignments';
import { submissionsService } from '@/lib/api/submissions';
import type { Assignment, Submission } from '@/lib/types';
import { formatDate, getDueDateCountdown, isPastDue, isDueSoon } from '@/lib/utils';
import Link from 'next/link';

export default function StudentAssignmentsPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted' | 'overdue'>('all');

  useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam === 'pending' || filterParam === 'submitted' || filterParam === 'overdue') {
      setFilter(filterParam);
    }
  }, [searchParams]);

  const updateFilter = (newFilter: typeof filter) => {
    setFilter(newFilter);
    const params = new URLSearchParams(searchParams.toString());
    if (newFilter !== 'all') {
      params.set('filter', newFilter);
    } else {
      params.delete('filter');
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

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

  const getSubmission = (assignmentId: string) => submissions.find(s => s.assignmentId === assignmentId);

  const stripHtml = (html: string) => {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ');
  };

  const filtered = assignments.filter(a => {
    if (search && !a.title.toLowerCase().includes(search.toLowerCase()) && !a.courseName.toLowerCase().includes(search.toLowerCase())) return false;
    const sub = getSubmission(a.id);
    if (filter === 'pending') return !sub && !isPastDue(a.dueDate);
    if (filter === 'submitted') return !!sub;
    if (filter === 'overdue') return !sub && isPastDue(a.dueDate);
    return true;
  });

  const pendingCount = assignments.filter(a => !getSubmission(a.id) && !isPastDue(a.dueDate)).length;
  const submittedCount = assignments.filter(a => !!getSubmission(a.id)).length;
  const overdueCount = assignments.filter(a => !getSubmission(a.id) && isPastDue(a.dueDate)).length;

  return (
    <RequireRole roles={['student']}>
      <div className="animate-fade-in">
        <PageHeader
          title="My Assignments"
          subtitle={`${assignments.length} assignments across all your courses`}
          breadcrumbs={[{ label: 'Student', href: '/student' }, { label: 'Assignments' }]}
        />

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: `All (${assignments.length})`, color: 'var(--color-primary)' },
            { key: 'pending', label: `Pending (${pendingCount})`, color: 'var(--color-warning)' },
            { key: 'submitted', label: `Submitted (${submittedCount})`, color: 'var(--color-success)' },
            { key: 'overdue', label: `Overdue (${overdueCount})`, color: 'var(--color-danger)' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => updateFilter(tab.key as typeof filter)}
              style={{
                padding: '0.4rem 1rem',
                border: `1px solid ${filter === tab.key ? tab.color : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-full)',
                background: filter === tab.key ? `${tab.color}18` : 'transparent',
                color: filter === tab.key ? tab.color : 'var(--color-text-muted)',
                fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer',
                fontFamily: 'var(--font-sans)', transition: 'all var(--transition-fast)',
              }}
            >
              {tab.label}
            </button>
          ))}
          <div className="input-wrapper" style={{ marginLeft: 'auto' }}>
            <Search size={15} className="input-icon" />
            <input className="input" style={{ paddingLeft: '2.25rem', width: 200 }} placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {/* Assignments Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 180, borderRadius: 'var(--radius-lg)' }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card" style={{ padding: '3rem' }}>
            <div className="empty-state">
              <CheckCircle size={40} style={{ color: 'var(--color-success)', opacity: 0.5 }} />
              <p>No assignments in this category</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(a => {
              const sub = getSubmission(a.id);
              const isOverdue = isPastDue(a.dueDate) && !sub;
              const dueSoon = isDueSoon(a.dueDate) && !sub;

              return (
                <Link key={a.id} href={`/student/assignments/${a.id}`} style={{ textDecoration: 'none' }}>
                  <div className="card card-hover" style={{
                    padding: '1.25rem', cursor: 'pointer',
                    borderColor: isOverdue ? 'rgba(244,63,94,0.4)' : dueSoon ? 'rgba(245,158,11,0.4)' : undefined,
                  }}>
                    {/* Top row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <span style={{
                        fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em',
                        color: 'var(--color-primary)', textTransform: 'uppercase',
                      }}>
                        {a.courseName}
                      </span>
                      {isOverdue ? (
                        <span className="text-xs text-gray-400">{a.teacherName}</span>
                      ) : dueSoon ? (
                        <span className="badge badge-warning"><Clock size={10} /> Due Soon</span>
                      ) : sub ? (
                        <span className="badge badge-success"><CheckCircle size={10} /> Submitted</span>
                      ) : null}
                    </div>

                    <h3 style={{ fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.5rem', fontSize: '0.975rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</h3>
                    <p style={{ 
                      fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1rem', lineHeight: 1.5,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', wordBreak: 'break-word'
                    }}>
                      {stripHtml(a.description)}
                    </p>

                    <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                      <span style={{ color: isOverdue ? 'var(--color-danger)' : dueSoon ? 'var(--color-warning)' : undefined }}>
                        {getDueDateCountdown(a.dueDate)}
                      </span>
                      <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{a.totalMarks} marks</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </RequireRole>
  );
}
