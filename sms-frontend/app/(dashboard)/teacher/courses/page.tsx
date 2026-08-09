'use client';

import { useEffect, useState } from 'react';
import { BookOpen, Users, FileText, ChevronRight, Archive } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { RequireRole } from '@/lib/auth/guards';
import PageHeader from '@/components/layout/PageHeader';
import { CourseStatusBadge } from '@/components/ui/Badge';
import { coursesService } from '@/lib/api/courses';
import { assignmentsService } from '@/lib/api/assignments';
import type { Course } from '@/lib/types';
import Link from 'next/link';

export default function TeacherCoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await coursesService.getAll({ limit: 100 });
        setCourses(res.data);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const handleArchive = async (courseId: string) => {
    if (!confirm('Archive this course? Students will no longer see it as active.')) return;
    await coursesService.update(courseId, { status: 'archived' });
    setCourses(prev => prev.map(c => c.id === courseId ? { ...c, status: 'archived' } : c));
  };

  return (
    <RequireRole roles={['teacher']}>
      <div className="animate-fade-in">
        <PageHeader
          title="My Courses"
          subtitle={`${courses.length} course workspaces`}
          breadcrumbs={[{ label: 'Teacher', href: '/teacher' }, { label: 'My Courses' }]}
        />

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 180, borderRadius: 'var(--radius-lg)' }} />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="card" style={{ padding: '4rem', textAlign: 'center' }}>
            <BookOpen size={48} style={{ color: 'var(--color-text-muted)', margin: '0 auto 1rem' }} />
            <p style={{ color: 'var(--color-text-muted)' }}>No courses assigned to you yet.</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
              Contact your admin to be assigned to a course.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {courses.map(c => (
              <div key={c.id} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{
                    padding: '0.25rem 0.6rem',
                    background: 'var(--color-primary-muted)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.75rem', fontWeight: 700,
                    color: 'var(--color-primary)', fontFamily: 'monospace',
                  }}>
                    {c.code}
                  </div>
                  <CourseStatusBadge status={c.status} />
                </div>

                <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-text)' }}>{c.title}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: 1.5, flex: 1 }}>
                  {c.description.length > 90 ? c.description.slice(0, 90) + '...' : c.description}
                </p>

                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Users size={13} /> {c.studentIds.length} students
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <Link
                    href={`/teacher/courses/${c.id}`}
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    Open Workspace <ChevronRight size={14} />
                  </Link>
                  {c.status !== 'archived' && (
                    <button
                      className="btn btn-ghost btn-icon btn-sm"
                      title="Archive course"
                      style={{ color: 'var(--color-warning)' }}
                      onClick={() => handleArchive(c.id)}
                    >
                      <Archive size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </RequireRole>
  );
}
