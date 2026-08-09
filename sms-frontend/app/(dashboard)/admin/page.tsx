'use client';

import { useEffect, useState } from 'react';
import { Users, BookMarked, FileText, ClipboardCheck, UserCheck, GraduationCap, Megaphone, Plus, Trash2, X } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { RequireRole } from '@/lib/auth/guards';
import PageHeader from '@/components/layout/PageHeader';
import StatCard from '@/components/dashboard/StatCard';
import type { AdminStats, Announcement } from '@/lib/types';
import { usersService } from '@/lib/api/users';
import { coursesService } from '@/lib/api/courses';
import { announcementsService } from '@/lib/api/announcements';
import { assignmentsService } from '@/lib/api/assignments';
import { formatRelative } from '@/lib/utils';
import type { Assignment } from '@/lib/types';
import AssignmentCalendar from '@/components/dashboard/AssignmentCalendar';

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

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isPostingAnnouncement, setIsPostingAnnouncement] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  const loadAnnouncements = async () => {
    try {
      const data = await announcementsService.getAll();
      setAnnouncements(data);
    } catch { }
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [users, courses, asg] = await Promise.all([
          usersService.getAll({ limit: 100 }),
          coursesService.getAll({ limit: 100 }),
          assignmentsService.getAll({ limit: 1000 }),
        ]);

        setAssignments(asg.data);

        setStats({
          totalUsers: users.totalCount,
          activeStudents: users.data.filter(u => u.role.toLowerCase() === 'student').length,
          activeTeachers: users.data.filter(u => u.role.toLowerCase() === 'teacher').length,
          totalCourses: courses.totalCount,
          totalAssignments: asg.totalCount,
          pendingSubmissions: 0
        });
      } catch (err) {
        console.error(err);
      }
    }
    loadData();
    loadAnnouncements();
  }, []);

  const handlePostAnnouncement = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    try {
      await announcementsService.create({ title: newTitle, content: newContent, isGlobal: true });
      setNewTitle('');
      setNewContent('');
      setIsPostingAnnouncement(false);
      loadAnnouncements();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      await announcementsService.delete(id);
      loadAnnouncements();
    } catch { }
  };

  return (
    <RequireRole roles={['admin']}>
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <PageHeader
          title={`Welcome back, ${user?.firstName}! 👋`}
          subtitle="Here's what's happening across the platform today."
          breadcrumbs={[{ label: 'Admin' }, { label: 'Dashboard' }]}
        />

        {/* Top Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
          <StatCard title="Total Users" value={stats.totalUsers} icon={Users} />
          <StatCard title="Students" value={stats.activeStudents} icon={GraduationCap} />
          <StatCard title="Teachers" value={stats.activeTeachers} icon={UserCheck} />
          <StatCard title="Total Courses" value={stats.totalCourses} icon={BookMarked} />
        </div>

        {/* Middle Section: Course Reports & Calendar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>


          {/* Course Reports Summary */}
          {/* <div className="card" style={{ padding: '1.5rem', gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={20} style={{ color: 'var(--color-info)' }} />
                Course Performance Reports
              </h2>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              //Dummy course reports for UI as requested 
              {[
                { name: 'Computer Science 101', students: 45, avgGrade: '82%' },
                { name: 'Advanced Mathematics', students: 32, avgGrade: '75%' },
                { name: 'Physics Mechanics', students: 28, avgGrade: '88%' }
              ].map((course, idx) => (
                <div key={idx} style={{ 
                  padding: '1.25rem', 
                  background: 'var(--color-surface-2)', 
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '1rem' }}>{course.name}</h3>
                    <div className="badge badge-info">{course.avgGrade} Avg</div>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                    <span><Users size={14} style={{ display: 'inline', marginRight: 4 }}/> {course.students} Students</span>
                  </div>
                  <button className="btn btn-ghost btn-sm" style={{ width: '100%', marginTop: '0.5rem', background: 'var(--color-surface)' }}>
                    <FileText size={14} /> Export PDF Report
                  </button>
                </div>
              ))}
            </div>
          </div> */}

          {/* Platform Announcements */}
          <div className="card" style={{ padding: '1.5rem', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Megaphone size={18} style={{ color: 'var(--color-primary)' }} />
                Platform Announcements
              </h2>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setIsPostingAnnouncement(v => !v)}
              >
                {isPostingAnnouncement ? <X size={14} /> : <Plus size={14} />}
                {isPostingAnnouncement ? 'Cancel' : 'Post Update'}
              </button>
            </div>

            {isPostingAnnouncement && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', border: '1px solid var(--color-border)' }}>
                <input
                  className="input"
                  placeholder="Announcement title..."
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                />
                <textarea
                  className="input"
                  placeholder="Write your announcement..."
                  rows={3}
                  style={{ resize: 'vertical' }}
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-primary btn-sm" onClick={handlePostAnnouncement}>
                    Post Announcement
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {announcements.length === 0 ? (
                <div className="empty-state" style={{ padding: '2rem 0' }}>
                  <Megaphone size={32} style={{ opacity: 0.3, margin: '0 auto 0.5rem' }} />
                  <p>No active announcements.</p>
                </div>
              ) : announcements.map(ann => (
                <div key={ann.id} style={{
                  padding: '1.25rem',
                  background: 'var(--color-surface-2)',
                  borderRadius: 'var(--radius-md)',
                  borderLeft: '4px solid var(--color-primary)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text)' }}>{ann.title}</p>
                    <button
                      className="btn btn-ghost btn-icon btn-sm"
                      style={{ color: 'var(--color-danger)', flexShrink: 0, marginTop: '-0.25rem', marginRight: '-0.25rem' }}
                      onClick={() => handleDeleteAnnouncement(ann.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{ann.content}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                    Posted by {ann.authorName} · {formatRelative(ann.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Calendar Section */}
          <div style={{ flex: 1 }}>
            <AssignmentCalendar assignments={assignments} role="admin" />
          </div>

        </div>
      </div>
    </RequireRole>
  );
}
