'use client';

import { useEffect, useState } from 'react';
import { Users, BookMarked, FileText, Upload, Plus, Users as UsersIcon, BookOpen, Settings, ChevronDown, CheckCircle, UserCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { RequireRole } from '@/lib/auth/guards';
import type { AdminStats } from '@/lib/types';
import { usersService } from '@/lib/api/users';
import { coursesService } from '@/lib/api/courses';
import { assignmentsService } from '@/lib/api/assignments';
import { submissionsService } from '@/lib/api/submissions';
import { formatDate } from '@/lib/utils';
import type { Assignment, Course, Submission, User } from '@/lib/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Link from 'next/link';

export default function AdminDashboard() {
  const { user } = useAuth();

  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeStudents: 0,
    activeTeachers: 0,
    totalCourses: 0,
    totalAssignments: 0,
    pendingSubmissions: 0
  });

  const [usersList, setUsersList] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [usersData, coursesData, asg, subs] = await Promise.all([
          usersService.getAll({ limit: 100 }),
          coursesService.getAll({ limit: 100 }),
          assignmentsService.getAll({ limit: 1000 }),
          submissionsService.getAll({ limit: 5000 })
        ]);

        setUsersList(usersData.data);
        setAssignments(asg.data);
        setCourses(coursesData.data);
        setSubmissions(subs.data);

        setStats({
          totalUsers: usersData.totalCount,
          activeStudents: usersData.data.filter(u => u.role.toLowerCase() === 'student').length,
          activeTeachers: usersData.data.filter(u => u.role.toLowerCase() === 'teacher').length,
          totalCourses: coursesData.totalCount,
          totalAssignments: asg.totalCount,
          pendingSubmissions: subs.data.filter(s => s.status === 'pending').length
        });
      } catch (err) {
        console.error(err);
      }
    }
    loadData();
  }, []);

  // --- Chart Data Processing ---
  const PIE_COLORS = ['#3B82F6', '#F59E0B', '#EF4444'];
  const submittedCount = submissions.filter(s => s.status === 'submitted' || s.status === 'graded').length;
  const pendingCount = submissions.filter(s => s.status === 'pending').length;
  const lateCount = submissions.filter(s => s.status === 'late').length;

  const submissionStatusData = [
    { name: 'Submitted', value: submittedCount },
    { name: 'Pending', value: pendingCount },
    { name: 'Late', value: lateCount },
  ];

  // Generate last 10 days for line chart
  const last10Days = Array.from({length: 9}).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (8 - i));
    return d.toISOString().split('T')[0];
  });
  
  const lineChartData = last10Days.map(dateStr => {
    const daySubs = submissions.filter(s => s.submittedAt?.startsWith(dateStr) || s.createdAt?.startsWith(dateStr));
    return {
      name: new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      Submitted: daySubs.filter(s => s.status === 'submitted' || s.status === 'graded').length,
      Pending: daySubs.filter(s => s.status === 'pending').length,
      Late: daySubs.filter(s => s.status === 'late').length
    };
  });

  // --- Tables Data Processing ---
  const recentUsers = [...usersList].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 4);
  
  const upcomingAssignments = [...assignments]
    .filter(a => new Date(a.dueDate).getTime() > new Date().getTime())
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 4);

  const recentSubmissions = [...submissions]
    .sort((a, b) => new Date(b.submittedAt || b.createdAt).getTime() - new Date(a.submittedAt || a.createdAt).getTime())
    .slice(0, 4);

  return (
    <RequireRole roles={['admin']}>
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%' }}>
        
        {/* Header */}
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.25rem' }}>
            Welcome back, {user?.firstName} 👋
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
            Here's what's happening with your system today.
          </p>
        </div>

        {/* 4 KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
          <KPICard title="Total Users" value={stats.totalUsers} subtitle="Students, Teachers & Admins" icon={<Users size={24} color="#6366F1" />} bg="#EEF2FF" />
          <KPICard title="Classes / Courses" value={stats.totalCourses} subtitle="Total classes created" icon={<BookMarked size={24} color="#3B82F6" />} bg="#EFF6FF" />
          <KPICard title="Assignments" value={stats.totalAssignments} subtitle="Total assignments" icon={<FileText size={24} color="#10B981" />} bg="#ECFDF5" />
          <KPICard title="Submissions" value={submissions.length} subtitle="Total submissions" icon={<Upload size={24} color="#EF4444" />} bg="#FEF2F2" />
        </div>

        {/* Charts Row */}
        <div className="charts-row" style={{ display: 'grid', gap: '1.5rem', alignItems: 'stretch' }}>
          
          {/* Line Chart */}
          <div className="card" style={{ padding: '1.5rem', gridColumn: 'span 1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 style={{ fontWeight: 600, color: 'var(--color-text)' }}>Submissions Overview</h3>
              <select style={{ fontSize: '0.85rem', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'transparent' }}>
                <option>This Month</option>
              </select>
            </div>
            <div style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="Submitted" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="Pending" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="Late" stroke="#EF4444" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Doughnut Chart */}
          <div className="card" style={{ padding: '1.5rem', gridColumn: 'span 1' }}>
            <h3 style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: '1.5rem' }}>Submissions by Status</h3>
            <div style={{ display: 'flex', alignItems: 'center', height: 250 }}>
              <div style={{ flex: 1, height: '100%', position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={submissionStatusData} innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value" stroke="none">
                      {submissionStatusData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)' }}>{submissions.length}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Total</div>
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', paddingLeft: '1rem' }}>
                {submissionStatusData.map((d, i) => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: PIE_COLORS[i] }} />
                      <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>{d.name}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      {d.value} ({submissions.length ? Math.round((d.value / submissions.length) * 100) : 0}%)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card" style={{ padding: '1.5rem', gridColumn: 'span 1' }}>
            <h3 style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: '1.5rem' }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Link href="/admin/users" style={{ textDecoration: 'none' }}>
                <div className="quick-action-btn">
                  <div className="qa-icon" style={{ color: '#6366F1', background: '#EEF2FF' }}><UsersIcon size={18} /></div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--color-text)' }}>Add New User</span>
                </div>
              </Link>
              <Link href="/admin/courses" style={{ textDecoration: 'none' }}>
                <div className="quick-action-btn">
                  <div className="qa-icon" style={{ color: '#3B82F6', background: '#EFF6FF' }}><BookOpen size={18} /></div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--color-text)' }}>Create New Class</span>
                </div>
              </Link>
              <Link href="/admin/courses" style={{ textDecoration: 'none' }}>
                <div className="quick-action-btn">
                  <div className="qa-icon" style={{ color: '#10B981', background: '#ECFDF5' }}><FileText size={18} /></div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--color-text)' }}>Create New Subject</span>
                </div>
              </Link>
              <Link href="/admin/users" style={{ textDecoration: 'none' }}>
                <div className="quick-action-btn">
                  <div className="qa-icon" style={{ color: '#F59E0B', background: '#FFFBEB' }}><UserCheck size={18} /></div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--color-text)' }}>Assign Teacher</span>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Tables Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          
          {/* Recent Users */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
              <h3 style={{ fontWeight: 600, color: 'var(--color-text)' }}>Recent Users</h3>
              <Link href="/admin/users" style={{ fontSize: '0.85rem', color: '#6366F1', fontWeight: 500, textDecoration: 'none' }}>View All</Link>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem', minWidth: 280 }}>
                <thead>
                  <tr style={{ color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)' }}>
                    <th style={{ padding: '0.75rem 0', fontWeight: 500 }}>Name</th>
                    <th style={{ padding: '0.75rem 0', fontWeight: 500 }}>Role</th>
                    <th style={{ padding: '0.75rem 0', fontWeight: 500 }}>Joined On</th>
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.length === 0 && <tr><td colSpan={3} style={{ padding: '1rem 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>No users found</td></tr>}
                  {recentUsers.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--color-surface-3)' }}>
                      <td style={{ padding: '0.75rem 0', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#EEF2FF', color: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.7rem', flexShrink: 0 }}>
                          {u.firstName[0]}
                        </div>
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }}>{u.firstName} {u.lastName}</span>
                      </td>
                      <td style={{ padding: '0.75rem 0', color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>{u.role}</td>
                      <td style={{ padding: '0.75rem 0', color: 'var(--color-text-secondary)' }}>{formatDate(u.createdAt, 'MMM d, yyyy')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Upcoming Assignments */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
              <h3 style={{ fontWeight: 600, color: 'var(--color-text)' }}>Upcoming Assignments</h3>
              <Link href="/admin/assignments" style={{ fontSize: '0.85rem', color: '#6366F1', fontWeight: 500, textDecoration: 'none' }}>View All</Link>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem', minWidth: 280 }}>
                <thead>
                  <tr style={{ color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)' }}>
                    <th style={{ padding: '0.75rem 0', fontWeight: 500 }}>Assignment</th>
                    <th style={{ padding: '0.75rem 0', fontWeight: 500 }}>Class / Course</th>
                    <th style={{ padding: '0.75rem 0', fontWeight: 500 }}>Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingAssignments.length === 0 && <tr><td colSpan={3} style={{ padding: '1rem 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>No upcoming assignments</td></tr>}
                  {upcomingAssignments.map(a => (
                    <tr key={a.id} style={{ borderBottom: '1px solid var(--color-surface-3)' }}>
                      <td style={{ padding: '0.75rem 0', color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>{a.title}</td>
                      <td style={{ padding: '0.75rem 0', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }}>{a.courseName}</td>
                      <td style={{ padding: '0.75rem 0', color: 'var(--color-text-secondary)' }}>{formatDate(a.dueDate, 'MMM d, yyyy')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Submissions */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
              <h3 style={{ fontWeight: 600, color: 'var(--color-text)' }}>Recent Submissions</h3>
              <Link href="/admin/reports" style={{ fontSize: '0.85rem', color: '#6366F1', fontWeight: 500, textDecoration: 'none' }}>View All</Link>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem', minWidth: 280 }}>
                <thead>
                  <tr style={{ color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)' }}>
                    <th style={{ padding: '0.75rem 0', fontWeight: 500 }}>Assignment</th>
                    <th style={{ padding: '0.75rem 0', fontWeight: 500 }}>Submitted By</th>
                    <th style={{ padding: '0.75rem 0', fontWeight: 500 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSubmissions.length === 0 && <tr><td colSpan={3} style={{ padding: '1rem 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>No recent submissions</td></tr>}
                  {recentSubmissions.map(s => {
                    const asg = assignments.find(x => x.id === s.assignmentId);
                    return (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--color-surface-3)' }}>
                      <td style={{ padding: '0.75rem 0', color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }}>{asg?.title || 'Unknown'}</td>
                      <td style={{ padding: '0.75rem 0', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '90px' }}>{s.studentName}</td>
                      <td style={{ padding: '0.75rem 0' }}>
                        <span style={{ 
                          padding: '0.2rem 0.5rem', borderRadius: 12, fontSize: '0.7rem', fontWeight: 600,
                          backgroundColor: s.status === 'submitted' ? '#ECFDF5' : s.status === 'late' ? '#FEF2F2' : '#FFFBEB',
                          color: s.status === 'submitted' ? '#10B981' : s.status === 'late' ? '#EF4444' : '#F59E0B'
                        }}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer / System Summary */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <h4 style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '1rem', marginBottom: '0.5rem' }}>System Summary</h4>
          </div>
          <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                <UsersIcon size={14} /> Active Users
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)', display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                {stats.totalUsers}
                <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 500 }}>Online now</span>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                <BookOpen size={14} /> Total Courses
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)', display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                {stats.totalCourses}
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Running</span>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                <CheckCircle size={14} color="#10B981" /> System Status
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: '#10B981', marginTop: '0.5rem' }}>
                All Systems Operational
              </div>
            </div>
          </div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .quick-action-btn {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.75rem 1rem;
          border: 1px solid #E5E7EB;
          border-radius: 0.5rem;
          transition: all 0.2s;
        }
        .quick-action-btn:hover {
          border-color: #6366F1;
          background: #F9FAFB;
        }
        .qa-icon {
          width: 32px;
          height: 32px;
          border-radius: 0.375rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .charts-row {
          grid-template-columns: 1fr 1fr 280px;
        }
        @media (max-width: 1200px) {
          .charts-row {
            grid-template-columns: 1fr 1fr;
          }
          .charts-row > div:nth-child(3) {
            grid-column: span 2;
          }
        }
        @media (max-width: 768px) {
          .charts-row {
            grid-template-columns: 1fr;
          }
          .charts-row > div:nth-child(3) {
            grid-column: span 1;
          }
        }
      `}} />
    </RequireRole>
  );
}

function KPICard({ title, value, subtitle, icon, bg }: any) {
  return (
    <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: '0.5rem', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {icon}
            </div>
            <span style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text)' }}>{value}</span>
          </div>
          <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginTop: '0.75rem' }}>{title}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{subtitle}</span>
        </div>
      </div>
    </div>
  );
}
