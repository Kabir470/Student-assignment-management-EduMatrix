'use client';

import { useEffect, useState, useRef } from 'react';
import {
  FileText, ClipboardCheck, Clock, CheckCircle, BarChart2,
  Database, Cpu, Code, FlaskConical, MoreVertical, Plus, Eye, User
} from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { RequireRole } from '@/lib/auth/guards';
import { assignmentsService } from '@/lib/api/assignments';
import { submissionsService } from '@/lib/api/submissions';
import { coursesService } from '@/lib/api/courses';
import type { Assignment, Submission, Course } from '@/lib/types';
import { formatDate, isPastDue, getAssignmentDisplayStatus, ASSIGNMENT_DISPLAY_STATUS_COLORS, getSubmissionDisplayStatus, SUBMISSION_DISPLAY_STATUS_COLORS } from '@/lib/utils';
import Link from 'next/link';
import AssignmentCalendar from '@/components/dashboard/AssignmentCalendar';
import AiAssignmentModal from '@/components/assignments/AiAssignmentModal';
import { Sparkles } from 'lucide-react';

// ─── Mini Donut Chart ────────────────────────────────────────────────────────
function DonutChart({ submitted, pending, graded }: { submitted: number; pending: number; graded: number }) {
  const total = submitted + pending + graded || 1;
  const submittedPct = (submitted / total) * 100;
  const pendingPct = (pending / total) * 100;
  const gradedPct = (graded / total) * 100;

  const R = 56;
  const cx = 70;
  const cy = 70;
  const stroke = 22;
  const circumference = 2 * Math.PI * R;

  const segments = [
    { pct: submittedPct, color: '#4F46E5', label: 'Submitted', offset: 0 },
    { pct: pendingPct, color: '#f50b0bff', label: 'Pending', offset: submittedPct },
    { pct: gradedPct, color: '#10B981', label: 'Graded', offset: submittedPct + pendingPct },
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
      <svg width={140} height={140} viewBox="0 0 140 140">
        {segments.map((seg, i) => (
          <circle
            key={i}
            cx={cx} cy={cy} r={R}
            fill="none"
            stroke={seg.color}
            strokeWidth={stroke}
            strokeDasharray={`${(seg.pct / 100) * circumference} ${circumference}`}
            strokeDashoffset={-(seg.offset / 100) * circumference}
            strokeLinecap="butt"
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: 'all 0.4s ease' }}
          />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="18" fontWeight="800" fill="var(--color-text)">{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="10" fill="var(--color-text-muted)">Total</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {[
          { label: 'Submitted', val: submitted, pct: submittedPct, color: '#4F46E5' },
          { label: 'Pending', val: pending, pct: pendingPct, color: '#F59E0B' },
          { label: 'Graded', val: graded, pct: gradedPct, color: '#10B981' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: l.color, flexShrink: 0, display: 'inline-block' }} />
            <span style={{ color: 'var(--color-text-muted)' }}>{l.label}</span>
            <span style={{ fontWeight: 700, color: 'var(--color-text)', marginLeft: 'auto' }}>{l.val} ({Math.round(l.pct)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
const VARIANTS: Record<string, { bg: string; iconBg: string; iconColor: string }> = {
  primary: { bg: 'var(--color-primary-light)', iconBg: 'var(--color-primary-alpha)', iconColor: 'var(--color-primary)' },
  success: { bg: 'var(--color-success-light)', iconBg: 'var(--color-success-alpha)', iconColor: 'var(--color-success)' },
  warning: { bg: 'var(--color-warning-light)', iconBg: 'var(--color-warning-alpha)', iconColor: 'var(--color-warning)' },
  purple: { bg: 'var(--color-accent-light)', iconBg: 'var(--color-accent-alpha)', iconColor: 'var(--color-accent)' },
  blue: { bg: 'var(--color-info-light)', iconBg: 'var(--color-info-alpha)', iconColor: 'var(--color-info)' },
};

function StatCard({ title, value, subtitle, icon: Icon, variant = 'primary' }: {
  title: string; value: string | number; subtitle?: string;
  icon: React.ElementType; variant?: string;
}) {
  const v = VARIANTS[variant] || VARIANTS.primary;
  return (
    <div style={{ background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', transition: 'box-shadow 0.2s' }} className="card-hover">
      <div style={{ width: 50, height: 50, borderRadius: '12px', background: v.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: v.iconColor, flexShrink: 0 }}>
        <Icon size={24} strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-2xl xl:text-3xl font-extrabold text-[color:var(--color-text)] leading-none truncate">{value}</p>
        <p className="text-xs sm:text-sm font-bold text-[color:var(--color-text)] mt-1 truncate">{title}</p>
        {subtitle && <p className="text-[10px] sm:text-xs text-[color:var(--color-text-muted)] mt-0.5 truncate">{subtitle}</p>}
      </div>
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export default function TeacherDashboard() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [aRes, sRes, cRes] = await Promise.all([
          assignmentsService.getAll({ limit: 100 }),
          submissionsService.getAll({ limit: 100 }),
          coursesService.getAll({ limit: 100 })
        ]);
        setAssignments(aRes.data);
        setSubmissions(sRes.data);
        setCourses(cRes.data);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Derived stats
  const totalAssignments = assignments.length;
  const totalSubmissions = submissions.length;
  const pendingGrade = submissions.filter(s => s.status === 'submitted' || s.status === 'late').length;
  const graded = submissions.filter(s => s.status === 'graded').length;

  // Average score across graded submissions
  const gradedWithScore = submissions.filter(s => s.grade != null);
  const avgScore = gradedWithScore.length > 0
    ? Math.round(gradedWithScore.reduce((acc, s) => acc + calculatePercentage(s.grade!, findTotalMarks(assignments, s.assignmentId)), 0) / gradedWithScore.length)
    : 0;

  const recentAssignments = assignments.slice(0, 5);
  const recentSubmissions = submissions
    .slice()
    .sort((a, b) => new Date(b.submittedAt ?? 0).getTime() - new Date(a.submittedAt ?? 0).getTime())
    .slice(0, 4);

  // Submission overview breakdown
  const totalExpectedSubmissions = assignments.reduce((acc, a) => {
    const course = courses.find(c => c.id === a.courseId);
    return acc + (course?.studentIds?.length || 0);
  }, 0);
  
  const submittedCount = submissions.filter(s => s.status === 'submitted' || s.status === 'late').length;
  const gradedCount = submissions.filter(s => s.status === 'graded').length;
  const pendingCount = Math.max(0, totalExpectedSubmissions - (submittedCount + gradedCount));

  const icons = [Database, FileText, Cpu, Code, FlaskConical];
  const colors = ['rgba(99,102,241,0.12)', 'rgba(16,185,129,0.12)', 'rgba(245,158,11,0.12)', 'rgba(56,189,248,0.12)', 'rgba(239,68,68,0.12)'];
  const iconColors = ['#4F46E5', '#10B981', '#F59E0B', '#0EA5E9', '#EF4444'];

  return (
    <RequireRole roles={['teacher']}>
      <div className="animate-fade-in" style={{ width: '100%', minHeight: 'calc(100vh - 64px)' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[color:var(--color-text)] leading-tight">
              Welcome back, {user?.firstName}! 👋
            </h1>
            <p className="text-sm sm:text-base text-[color:var(--color-text-muted)] mt-1.5">
              Here's an overview of your assignments and classes.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button 
              onClick={() => setIsAiModalOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', color: 'white', border: 'none',
                borderRadius: '10px', padding: '0.65rem 1.25rem',
                fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(168, 85, 247, 0.35)',
              }}>
              <Sparkles size={16} /> Generate with AI
            </button>
            <Link href="/teacher/assignments?action=new" style={{ textDecoration: 'none' }}>
              <button style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                background: '#4F46E5', color: 'var(--color-surface)', border: 'none',
                borderRadius: '10px', padding: '0.65rem 1.25rem',
                fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(79,70,229,0.35)',
              }}>
                <Plus size={16} /> Create Assignment
              </button>
            </Link>
          </div>
        </div>

        {/* ── Main Grid: Left 2/3, Right 1/3 ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT: Recent Assignments Table ── */}
          <div className="lg:col-span-2" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* ── 3 Stat Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-4">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 100, borderRadius: 12 }} />
                ))
              ) : (
                <>
                  <StatCard title="Submitted" value={`${totalSubmissions} / ${totalExpectedSubmissions}`} subtitle="Total expected submissions" icon={ClipboardCheck} variant="success" />
                  <StatCard title="Pending Marks" value={pendingGrade} subtitle="Assigned to grade" icon={Clock} variant="warning" />
                  <StatCard title="Average Score" value={`${avgScore}%`} subtitle="Across all assignments" icon={BarChart2} variant="purple" />
                </>
              )}
            </div>

            {/* Recent Assignments */}
            <div style={{ background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>
                <h2 style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-text)' }}>Recent Assignments</h2>
                <Link href="/teacher/assignments" style={{ textDecoration: 'none', fontSize: '0.85rem', color: '#4F46E5', fontWeight: 600 }}>
                  View All Assignments →
                </Link>
              </div>

              {isLoading ? (
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 60, borderRadius: 8 }} />)}
                </div>
              ) : recentAssignments.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>No assignments yet. Create your first!</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                    <thead>
                      <tr>
                        {['Assignment Title', 'Class', 'Due Date', 'Submissions', 'Status', 'Action'].map(h => (
                          <th key={h} style={{ padding: '0.9rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)', background: 'transparent', textTransform: 'none', letterSpacing: 0 }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recentAssignments.map((a, index) => {
                        const assignmentSubs = submissions.filter(s => s.assignmentId === a.id);
                        const subCount = assignmentSubs.length;
                        const course = courses.find(c => c.id === a.courseId);
                        const totalStudents = course?.studentIds?.length || 0;
                        const subPct = Math.round((subCount / Math.max(totalStudents, 1)) * 100);
                        const displayStatus = getAssignmentDisplayStatus(a.status, a.dueDate);
                        const { bg: statusBg, color: statusColor } = ASSIGNMENT_DISPLAY_STATUS_COLORS[displayStatus];

                        const IconComp = icons[index % icons.length];
                        const bg = colors[index % colors.length];
                        const color = iconColors[index % iconColors.length];

                        return (
                          <tr key={a.id} style={{ borderBottom: '1px solid var(--color-surface-3)' }} className="hover:bg-slate-50 transition-colors">
                            <td style={{ padding: '1.1rem 1rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ width: 40, height: 40, borderRadius: '10px', background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <IconComp size={18} strokeWidth={2.5} />
                                </div>
                                <div>
                                  <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text)', marginBottom: '0.1rem' }}>{a.title}</p>
                                  <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }} className="truncate max-w-[180px]">{a.description || a.courseName}</p>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '1.1rem 1rem' }}>
                              <p style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-text)' }}>
                                {a.courseName.split(' ').slice(0, 2).join(' ')}
                              </p>
                              <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                                {a.courseName.split(' ').slice(2).join(' ') || 'Section A'}
                              </p>
                            </td>
                            <td style={{ padding: '1.1rem 1rem' }}>
                              <p style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-text)' }}>
                                {new Date(a.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                              <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                                {new Date(a.dueDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                              </p>
                            </td>
                            <td style={{ padding: '1.1rem 1rem', minWidth: 130 }}>
                              <p style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-text)', marginBottom: '0.35rem' }}>
                                {subCount} / {totalStudents}
                              </p>
                              <div style={{ height: 6, background: 'var(--color-border)', borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{
                                  height: '100%', borderRadius: 3,
                                  width: `${Math.min(subPct, 100)}%`,
                                  background: subPct > 70 ? '#10B981' : subPct > 40 ? '#F59E0B' : '#EF4444',
                                  transition: 'width 0.6s ease'
                                }} />
                              </div>
                            </td>
                            <td style={{ padding: '1.1rem 1rem' }}>
                              <span style={{ background: statusBg, color: statusColor, padding: '4px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}>
                                {displayStatus}
                              </span>
                            </td>
                            <td style={{ padding: '1.1rem 1rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <Link href={`/teacher/assignments/${a.id}`} style={{ textDecoration: 'none' }}>
                                  <button style={{
                                    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                                    borderRadius: '9999px', padding: '5px 18px',
                                    fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)',
                                    cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                  }} className="hover:bg-gray-50">
                                    View
                                  </button>
                                </Link>
                                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '4px', display: 'flex', alignItems: 'center' }}>
                                  <MoreVertical size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Recent Submissions */}
            <div style={{ background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>
                <h2 style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-text)' }}>Recent Submissions</h2>
                <Link href="/teacher/assignments" style={{ textDecoration: 'none', fontSize: '0.85rem', color: '#4F46E5', fontWeight: 600 }}>
                  View All Submissions
                </Link>
              </div>
              {isLoading ? (
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 52, borderRadius: 8 }} />)}
                </div>
              ) : recentSubmissions.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>No submissions yet</div>
              ) : (
                recentSubmissions.map((s, i) => {
                  const subDate = s.submittedAt ? new Date(s.submittedAt) : null;
                  // Map DB status → display label + color directly (dueDate not available here)
                  type SKey = 'Submitted' | 'Late' | 'Graded' | 'Returned' | 'Pending';
                  const statusKey: SKey = s.status === 'graded' ? 'Graded' : s.status === 'returned' ? 'Returned' : s.status === 'late' ? 'Late' : s.status === 'pending' ? 'Pending' : 'Submitted';
                  const submBg = SUBMISSION_DISPLAY_STATUS_COLORS[statusKey].bg;
                  const submColor = SUBMISSION_DISPLAY_STATUS_COLORS[statusKey].color;
                  return (
                    <div key={s.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '1rem 1.5rem',
                      borderBottom: i < recentSubmissions.length - 1 ? '1px solid var(--color-surface-3)' : 'none'
                    }}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(99,102,241,0.1)', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <User size={18} />
                        </div>
                        <div>
                          <Link href={`/teacher/assignments/${s.assignmentId}`} style={{ textDecoration: 'none' }}>
                            <p style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              {s.studentName} <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 400 }}>on</span> {s.assignmentTitle}
                            </p>
                          </Link>
                          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{s.assignmentTitle || 'Assignment'}</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ background: submBg, color: submColor, padding: '4px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}>
                          {statusKey}
                        </span>
                        {subDate && (
                          <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                            {subDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {subDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          </span>
                        )}
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          <Link href={`/teacher/submissions`} style={{ textDecoration: 'none' }}>
                            <button style={{ width: 30, height: 30, borderRadius: '6px', background: '#EEF2FF', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#4F46E5' }}>
                              <Eye size={14} />
                            </button>
                          </Link>
                          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '4px', display: 'flex', alignItems: 'center' }}>
                            <MoreVertical size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ── RIGHT: Submission Overview + Calendar ── */}
          <div className="lg:col-span-1" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: 'max-content' }}>

            {/* Submission Overview Donut */}
            <div style={{ background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', padding: '1.25rem 1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', height: 'max-content' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <BarChart2 size={16} color="var(--color-text-muted)" />
                <h2 style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-text)' }}>Submission Overview</h2>
              </div>
              {isLoading ? (
                <div className="skeleton" style={{ height: 140, borderRadius: 8 }} />
              ) : (
                <>
                  <DonutChart submitted={submittedCount} pending={pendingCount} graded={gradedCount} />
                </>
              )}
            </div>

            {/* Calendar — replacing Upcoming Deadlines */}
            <AssignmentCalendar assignments={assignments} role="teacher" />
          </div>
        </div>
      </div>
      <AiAssignmentModal 
        isOpen={isAiModalOpen} 
        onClose={() => setIsAiModalOpen(false)} 
        courses={courses}
        onApprove={(data) => {
          setIsAiModalOpen(false);
          localStorage.setItem('aiDraft', JSON.stringify(data));
          window.location.href = '/teacher/assignments?action=new_ai';
        }} 
      />
    </RequireRole>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function findTotalMarks(assignments: Assignment[], assignmentId: string): number {
  return assignments.find(a => a.id === assignmentId)?.totalMarks ?? 100;
}

function calculatePercentage(grade: number, total: number): number {
  if (!total) return 0;
  return Math.round((grade / total) * 100);
}
