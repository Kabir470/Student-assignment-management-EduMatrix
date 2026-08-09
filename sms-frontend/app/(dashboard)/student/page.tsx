'use client';

import { useEffect, useState } from 'react';
import { FileText, ClipboardCheck, Clock, CheckCircle, AlertCircle, Database, Cpu, Code, FlaskConical, ChevronRight, ChevronLeft, Calendar, MessageSquare } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { RequireRole } from '@/lib/auth/guards';
import PageHeader from '@/components/layout/PageHeader';
import StatCard from '@/components/dashboard/StatCard';
import { AssignmentStatusBadge, SubmissionStatusBadge } from '@/components/ui/Badge';
import { assignmentsService } from '@/lib/api/assignments';
import { submissionsService } from '@/lib/api/submissions';
import type { Assignment, Submission } from '@/lib/types';
import { formatDate, getDueDateCountdown, isPastDue, isDueSoon, calculatePercentage, getSubmissionDisplayStatus, SUBMISSION_DISPLAY_STATUS_COLORS } from '@/lib/utils';
import Link from 'next/link';
import AssignmentCalendar from '@/components/dashboard/AssignmentCalendar';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'graded' | 'pending' | 'late'>('all');

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Main Column */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Stat Cards - Left */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 130, borderRadius: 'var(--radius-lg)' }} />)
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
                  <Link href="/student/assignments?filter=overdue" style={{ textDecoration: 'none' }}>
                    <div className="card-hover"><StatCard title="Overdue" value={overdue} icon={AlertCircle} variant="danger" /></div>
                  </Link>
                </>
              )}
            </div>

            {/* Unified My Assignments with Tabs */}
            <div style={{ background: 'var(--color-surface)', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
              
              {/* Top Bar with Tabs */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 1.5rem', borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', gap: '2rem' }}>
                  {(['all', 'graded', 'pending', 'late'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      style={{
                        padding: '1.25rem 0',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: activeTab === tab ? '2px solid #4F46E5' : '2px solid transparent',
                        color: activeTab === tab ? '#4F46E5' : 'var(--color-text-muted)',
                        fontWeight: activeTab === tab ? 700 : 600,
                        fontSize: '0.95rem',
                        cursor: 'pointer',
                        textTransform: 'capitalize',
                        transition: 'all 0.2s'
                      }}
                    >
                      {tab === 'all' ? 'All Submissions' : tab}
                    </button>
                  ))}
                </div>

                <button style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                  padding: '0.5rem 1rem', borderRadius: '8px',
                  color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '0.85rem',
                  cursor: 'pointer'
                }}>
                  <Calendar size={14} /> Semester: All <ChevronRight size={14} style={{ transform: 'rotate(90deg)' }} />
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                {isLoading ? (
                  <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 60, borderRadius: '8px' }} />)}
                  </div>
                ) : assignments.length === 0 ? (
                  <div className="empty-state" style={{ padding: '3rem' }}><p>No assignments yet 🎉</p></div>
                ) : (
                  <table style={{ width: '100%', minWidth: '900px', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ background: 'transparent', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'none', padding: '1rem 1.5rem', textAlign: 'left' }}>Assignment</th>
                        <th style={{ background: 'transparent', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'none', padding: '1rem 1rem', textAlign: 'left' }}>Course</th>
                        <th style={{ background: 'transparent', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'none', padding: '1rem 1rem', textAlign: 'left' }}>Submitted On</th>
                        <th style={{ background: 'transparent', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'none', padding: '1rem 1rem', textAlign: 'left' }}>Deadline</th>
                        <th style={{ background: 'transparent', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'none', padding: '1rem 1rem', textAlign: 'left' }}>Status</th>
                        <th style={{ background: 'transparent', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'none', padding: '1rem 1rem', textAlign: 'center' }}>Marks</th>
                        <th style={{ background: 'transparent', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'none', padding: '1rem 1rem', textAlign: 'center' }}>Feedback</th>
                        <th style={{ background: 'transparent', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'none', padding: '1rem 1.5rem', textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const filtered = assignments.filter(a => {
                          const sub = submissions.find(s => s.assignmentId === a.id);
                          const isLate = sub?.submittedAt ? new Date(sub.submittedAt) > new Date(a.dueDate) : isPastDue(a.dueDate);
                          
                          if (activeTab === 'all') return true;
                          if (activeTab === 'graded' && sub?.status === 'graded') return true;
                          if (activeTab === 'pending' && (!sub || sub.status !== 'graded')) return true;
                          if (activeTab === 'late' && isLate) return true;
                          return false;
                        }).slice(0, 5);
                        
                        if (filtered.length === 0) {
                          return (
                            <tr>
                              <td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                No assignments found for this tab.
                              </td>
                            </tr>
                          );
                        }

                        return filtered.map((a, index) => {
                          const sub = submissions.find(s => s.assignmentId === a.id);

                          // Use centralized status helper
                          const displayStatus = getSubmissionDisplayStatus(
                            sub?.status,
                            sub?.submittedAt,
                            a.dueDate
                          );
                          const { bg: badgeBg, color: badgeColor } = SUBMISSION_DISPLAY_STATUS_COLORS[displayStatus];
                          const statusText = displayStatus;

                          const pct = sub?.grade != null ? Math.round((sub.grade / a.totalMarks) * 100) : null;
                          const pctColor = pct != null ? pct >= 80 ? '#10B981' : pct >= 60 ? '#F59E0B' : '#EF4444' : 'var(--color-text-muted)';

                          const icons = [Database, FileText, Cpu, Code, FlaskConical];
                          const colors = ['rgba(99,102,241,0.1)', 'rgba(16,185,129,0.1)', 'rgba(245,158,11,0.1)', 'rgba(56,189,248,0.1)', 'rgba(239,68,68,0.1)'];
                          const iconColors = ['#4F46E5', '#10B981', '#F59E0B', '#0EA5E9', '#EF4444'];
                          
                          const IconComp = icons[index % icons.length];
                          const bg = colors[index % colors.length];
                          const color = iconColors[index % iconColors.length];
                          
                          const due = new Date(a.dueDate);
                          const subDate = sub?.submittedAt ? new Date(sub.submittedAt) : null;

                          return (
                            <tr key={a.id} style={{ background: 'transparent', borderBottom: '1px solid var(--color-surface-3)' }} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                              <td style={{ padding: '1.2rem 1.5rem' }}>
                                <div className="flex items-center gap-4">
                                  <div style={{ width: 44, height: 44, borderRadius: '12px', background: bg, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <IconComp size={22} strokeWidth={2.5} />
                                  </div>
                                  <div>
                                    <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)', marginBottom: '0.15rem' }}>{a.title}</p>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }} className="truncate max-w-[220px]">{a.description || 'No description'}</p>
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: '1.2rem 1rem' }}>
                                <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)', marginBottom: '0.15rem' }}>{a.courseName.split(' ')[0]}</p>
                                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{a.courseName.substring(a.courseName.indexOf(' ') + 1) || a.courseName}</p>
                              </td>
                              <td style={{ padding: '1.2rem 1rem' }}>
                                {subDate ? (
                                  <>
                                    <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)', marginBottom: '0.15rem' }}>{subDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{subDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p>
                                  </>
                                ) : (
                                  <p style={{ color: 'var(--color-text-muted)' }}>-</p>
                                )}
                              </td>
                              <td style={{ padding: '1.2rem 1rem' }}>
                                <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)', marginBottom: '0.15rem' }}>{due.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}></p>
                              </td>
                              <td style={{ padding: '1.2rem 1rem' }}>
                                <span style={{ 
                                  background: badgeBg, 
                                  color: badgeColor, 
                                  padding: '6px 14px', 
                                  borderRadius: '6px', 
                                  fontSize: '0.85rem', 
                                  fontWeight: 600,
                                  display: 'inline-block'
                                }}>
                                  {statusText}
                                </span>
                              </td>
                              <td style={{ padding: '1.2rem 1rem', textAlign: 'center' }}>
                                {sub?.status === 'graded' && sub.grade != null ? (
                                  <div>
                                    <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)' }}>{sub.grade} / {a.totalMarks}</p>
                                    <p style={{ fontSize: '0.85rem', color: pctColor, fontWeight: 600 }}>({pct}%)</p>
                                  </div>
                                ) : (
                                  <p style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>—</p>
                                )}
                              </td>
                              <td style={{ padding: '1.2rem 1rem', textAlign: 'center' }}>
                                {sub?.feedback ? (
                                  <MessageSquare size={18} color="#4F46E5" style={{ margin: '0 auto' }} />
                                ) : (
                                  <MessageSquare size={18} color="var(--color-text-muted)" style={{ margin: '0 auto' }} />
                                )}
                              </td>
                              <td style={{ padding: '1.2rem 1.5rem', textAlign: 'center' }}>
                                <Link href={`/student/assignments/${a.id}`} style={{ textDecoration: 'none' }}>
                                  <button style={{ 
                                    background: 'var(--color-surface)', 
                                    border: '1px solid var(--color-border)', 
                                    color: 'var(--color-text-secondary)', 
                                    borderRadius: '9999px', 
                                    padding: '6px 20px', 
                                    fontSize: '0.85rem', 
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                    transition: 'all 0.2s'
                                  }}
                                  className="hover:bg-gray-50"
                                  >
                                    View
                                  </button>
                                </Link>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                )}
              </div>
              {/* Optional footer for "View All" link if on dashboard */}
              <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'center' }}>
                <Link href="/student/submissions" style={{ fontSize: '0.85rem', color: '#4F46E5', textDecoration: 'none', fontWeight: 600 }}>
                  View All Activity →
                </Link>
              </div>
            </div>
          </div>
          
          {/* Right Side Column */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <AssignmentCalendar assignments={assignments} role="student" />
          </div>
        </div>
      </div>
    </RequireRole>
  );
}
