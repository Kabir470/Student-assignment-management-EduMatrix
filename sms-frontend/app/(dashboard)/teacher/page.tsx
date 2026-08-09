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
import type { Assignment, Submission } from '@/lib/types';
import { formatDate, isPastDue, getAssignmentDisplayStatus, ASSIGNMENT_DISPLAY_STATUS_COLORS, getSubmissionDisplayStatus, SUBMISSION_DISPLAY_STATUS_COLORS } from '@/lib/utils';
import Link from 'next/link';
import AssignmentCalendar from '@/components/dashboard/AssignmentCalendar';

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
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="18" fontWeight="800" fill="#1F2937">{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="10" fill="#6B7280">Total</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {[
          { label: 'Submitted', val: submitted, pct: submittedPct, color: '#4F46E5' },
          { label: 'Pending', val: pending, pct: pendingPct, color: '#F59E0B' },
          { label: 'Graded', val: graded, pct: gradedPct, color: '#10B981' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#374151' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: l.color, flexShrink: 0, display: 'inline-block' }} />
            <span style={{ color: '#6B7280' }}>{l.label}</span>
            <span style={{ fontWeight: 700, color: '#1F2937', marginLeft: 'auto' }}>{l.val} ({Math.round(l.pct)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
const VARIANTS: Record<string, { bg: string; iconBg: string; iconColor: string }> = {
  primary: { bg: '#EEF2FF', iconBg: 'rgba(99,102,241,0.15)', iconColor: '#4F46E5' },
  success: { bg: '#ECFDF5', iconBg: 'rgba(16,185,129,0.15)', iconColor: '#059669' },
  warning: { bg: '#FFFBEB', iconBg: 'rgba(245,158,11,0.15)', iconColor: '#D97706' },
  purple: { bg: '#F5F3FF', iconBg: 'rgba(139,92,246,0.15)', iconColor: '#7C3AED' },
  blue: { bg: '#EFF6FF', iconBg: 'rgba(59,130,246,0.15)', iconColor: '#2563EB' },
};

function StatCard({ title, value, subtitle, icon: Icon, variant = 'primary' }: {
  title: string; value: string | number; subtitle?: string;
  icon: React.ElementType; variant?: string;
}) {
  const v = VARIANTS[variant] || VARIANTS.primary;
  return (
    <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', transition: 'box-shadow 0.2s' }} className="card-hover">
      <div style={{ width: 50, height: 50, borderRadius: '12px', background: v.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: v.iconColor, flexShrink: 0 }}>
        <Icon size={24} strokeWidth={2} />
      </div>
      <div>
        <p style={{ fontSize: '1.7rem', fontWeight: 800, color: '#1F2937', lineHeight: 1 }}>{value}</p>
        <p style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1F2937', marginTop: '0.2rem' }}>{title}</p>
        {subtitle && <p style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '0.15rem' }}>{subtitle}</p>}
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

  useEffect(() => {
    async function loadData() {
      try {
        const [aRes, sRes] = await Promise.all([
          assignmentsService.getAll({ limit: 100 }),
          submissionsService.getAll({ limit: 100 }),
        ]);
        setAssignments(aRes.data);
        setSubmissions(sRes.data);
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
  // "submitted" = awaiting grade, "late" = late & awaiting grade, "graded" = done
  const submittedCount = submissions.filter(s => s.status === 'submitted').length;
  const pendingCount = submissions.filter(s => s.status === 'submitted' || s.status === 'late').length;
  const gradedCount = graded;

  const icons = [Database, FileText, Cpu, Code, FlaskConical];
  const colors = ['rgba(99,102,241,0.12)', 'rgba(16,185,129,0.12)', 'rgba(245,158,11,0.12)', 'rgba(56,189,248,0.12)', 'rgba(239,68,68,0.12)'];
  const iconColors = ['#4F46E5', '#10B981', '#F59E0B', '#0EA5E9', '#EF4444'];

  return (
    <RequireRole roles={['teacher']}>
      <div className="animate-fade-in" style={{ padding: 'clamp(1rem, 4vw, 2rem)', width: '100%', boxSizing: 'border-box' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1F2937', lineHeight: 1 }}>
              Welcome back, {user?.firstName}! 👋
            </h1>
            <p style={{ fontSize: '0.9rem', color: '#6B7280', marginTop: '0.35rem' }}>
              Here's an overview of your assignments and classes.
            </p>
          </div>
          <Link href="/teacher/assignments?action=new" style={{ textDecoration: 'none' }}>
            <button style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: '#4F46E5', color: '#fff', border: 'none',
              borderRadius: '10px', padding: '0.65rem 1.25rem',
              fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(79,70,229,0.35)',
            }}>
              <Plus size={16} /> Create Assignment
            </button>
          </Link>
        </div>

        {/* ── 5 Stat Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4" style={{ marginBottom: '1.75rem' }}>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 100, borderRadius: 12 }} />
            ))
          ) : (
            <>
              <StatCard title="Total Assignments" value={totalAssignments} subtitle="All your assignments" icon={FileText} variant="primary" />
              <StatCard title="Submitted" value={totalSubmissions} subtitle="Total submissions" icon={ClipboardCheck} variant="success" />
              <StatCard title="Pending" value={pendingGrade} subtitle="Awaiting submissions" icon={Clock} variant="warning" />
              <StatCard title="Graded" value={gradedCount} subtitle="Total graded submissions" icon={CheckCircle} variant="blue" />
              <StatCard title="Average Score" value={`${avgScore}%`} subtitle="Across all assignments" icon={BarChart2} variant="purple" />
            </>
          )}
        </div>

        {/* ── Main Grid: Left 2/3, Right 1/3 ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT: Recent Assignments Table ── */}
          <div className="lg:col-span-2" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Recent Assignments */}
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid #E5E7EB' }}>
                <h2 style={{ fontWeight: 800, fontSize: '1rem', color: '#1F2937' }}>Recent Assignments</h2>
                <Link href="/teacher/assignments" style={{ textDecoration: 'none', fontSize: '0.85rem', color: '#4F46E5', fontWeight: 600 }}>
                  View All Assignments →
                </Link>
              </div>

              {isLoading ? (
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 60, borderRadius: 8 }} />)}
                </div>
              ) : recentAssignments.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#9CA3AF' }}>No assignments yet. Create your first!</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                    <thead>
                      <tr>
                        {['Assignment Title', 'Class', 'Due Date', 'Submissions', 'Status', 'Action'].map(h => (
                          <th key={h} style={{ padding: '0.9rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: '#9CA3AF', borderBottom: '1px solid #E5E7EB', background: 'transparent', textTransform: 'none', letterSpacing: 0 }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recentAssignments.map((a, index) => {
                        const assignmentSubs = submissions.filter(s => s.assignmentId === a.id);
                        const subCount = assignmentSubs.length;
                        const totalStudents = 32; // approximate; ideally from course enrollment
                        const subPct = Math.round((subCount / Math.max(totalStudents, 1)) * 100);
                        const displayStatus = getAssignmentDisplayStatus(a.status, a.dueDate);
                        const { bg: statusBg, color: statusColor } = ASSIGNMENT_DISPLAY_STATUS_COLORS[displayStatus];

                        const IconComp = icons[index % icons.length];
                        const bg = colors[index % colors.length];
                        const color = iconColors[index % iconColors.length];

                        return (
                          <tr key={a.id} style={{ borderBottom: '1px solid #F3F4F6' }} className="hover:bg-slate-50 transition-colors">
                            <td style={{ padding: '1.1rem 1rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ width: 40, height: 40, borderRadius: '10px', background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <IconComp size={18} strokeWidth={2.5} />
                                </div>
                                <div>
                                  <p style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1F2937', marginBottom: '0.1rem' }}>{a.title}</p>
                                  <p style={{ fontSize: '0.78rem', color: '#9CA3AF' }} className="truncate max-w-[180px]">{a.description || a.courseName}</p>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '1.1rem 1rem' }}>
                              <p style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1F2937' }}>
                                {a.courseName.split(' ').slice(0, 2).join(' ')}
                              </p>
                              <p style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>
                                {a.courseName.split(' ').slice(2).join(' ') || 'Section A'}
                              </p>
                            </td>
                            <td style={{ padding: '1.1rem 1rem' }}>
                              <p style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1F2937' }}>
                                {new Date(a.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                              <p style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>
                                {new Date(a.dueDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                              </p>
                            </td>
                            <td style={{ padding: '1.1rem 1rem', minWidth: 130 }}>
                              <p style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1F2937', marginBottom: '0.35rem' }}>
                                {subCount} / {totalStudents}
                              </p>
                              <div style={{ height: 6, background: '#E5E7EB', borderRadius: 3, overflow: 'hidden' }}>
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
                                    background: '#fff', border: '1px solid #E5E7EB',
                                    borderRadius: '9999px', padding: '5px 18px',
                                    fontSize: '0.82rem', fontWeight: 600, color: '#374151',
                                    cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                  }} className="hover:bg-gray-50">
                                    View
                                  </button>
                                </Link>
                                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: '4px', display: 'flex', alignItems: 'center' }}>
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
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid #E5E7EB' }}>
                <h2 style={{ fontWeight: 800, fontSize: '1rem', color: '#1F2937' }}>Recent Submissions</h2>
                <Link href="/teacher/assignments" style={{ textDecoration: 'none', fontSize: '0.85rem', color: '#4F46E5', fontWeight: 600 }}>
                  View All Submissions
                </Link>
              </div>
              {isLoading ? (
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 52, borderRadius: 8 }} />)}
                </div>
              ) : recentSubmissions.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#9CA3AF' }}>No submissions yet</div>
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
                      borderBottom: i < recentSubmissions.length - 1 ? '1px solid #F3F4F6' : 'none'
                    }}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(99,102,241,0.1)', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <User size={18} />
                        </div>
                        <div>
                          <Link href={`/teacher/assignments/${s.assignmentId}`} style={{ textDecoration: 'none' }}>
                            <p style={{ fontWeight: 600, color: '#1F2937', marginBottom: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              {s.studentName} <span style={{ fontSize: '0.75rem', color: '#9CA3AF', fontWeight: 400 }}>on</span> {s.assignmentTitle}
                            </p>
                          </Link>
                          <p style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>{s.assignmentTitle || 'Assignment'}</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ background: submBg, color: submColor, padding: '4px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}>
                              {statusKey}
                            </span>
                        {subDate && (
                          <span style={{ fontSize: '0.78rem', color: '#9CA3AF', whiteSpace: 'nowrap' }}>
                            {subDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {subDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          </span>
                        )}
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          <Link href={`/teacher/submissions`} style={{ textDecoration: 'none' }}>
                            <button style={{ width: 30, height: 30, borderRadius: '6px', background: '#EEF2FF', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#4F46E5' }}>
                              <Eye size={14} />
                            </button>
                          </Link>
                          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: '4px', display: 'flex', alignItems: 'center' }}>
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
          <div className="lg:col-span-1" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Submission Overview Donut */}
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '1.25rem 1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <BarChart2 size={16} color="#6B7280" />
                <h2 style={{ fontWeight: 800, fontSize: '1rem', color: '#1F2937' }}>Submission Overview</h2>
              </div>
              {isLoading ? (
                <div className="skeleton" style={{ height: 140, borderRadius: 8 }} />
              ) : (
                <>
                  <p style={{ fontSize: '0.78rem', color: '#9CA3AF', marginBottom: '0.5rem' }}>Total Submissions</p>
                  <p style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1F2937', marginBottom: '1rem' }}>{totalSubmissions}</p>
                  <DonutChart submitted={submittedCount} pending={pendingCount} graded={gradedCount} />
                </>
              )}
            </div>

            {/* Calendar — replacing Upcoming Deadlines */}
            <AssignmentCalendar assignments={assignments} role="teacher" />
          </div>
        </div>
      </div>
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
