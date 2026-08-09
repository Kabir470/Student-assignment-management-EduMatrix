'use client';

import { useEffect, useState } from 'react';
import { BookOpen, Users, ChevronRight } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { RequireRole } from '@/lib/auth/guards';
import PageHeader from '@/components/layout/PageHeader';
import { CourseStatusBadge } from '@/components/ui/Badge';
import { coursesService } from '@/lib/api/courses';
import type { Course } from '@/lib/types';
import Link from 'next/link';

export default function StudentCoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await coursesService.getMyCourses({ limit: 100 });
        setCourses(res.data);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  return (
    <RequireRole roles={['student']}>
      <div className="animate-fade-in">
        <PageHeader
          title="My Courses"
          subtitle={`${courses.length} enrolled courses`}
          breadcrumbs={[{ label: 'Student', href: '/student' }, { label: 'My Courses' }]}
        />

        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 180, borderRadius: 'var(--radius-lg)' }} />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="card" style={{ padding: '4rem', textAlign: 'center' }}>
            <BookOpen size={48} style={{ color: 'var(--color-text-muted)', margin: '0 auto 1rem' }} />
            <p style={{ color: 'var(--color-text-muted)' }}>You are not enrolled in any courses yet.</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
              Your teacher or administrator will add you to a class.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
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
                    <Users size={13} /> Taught by {c.teacherName}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <Link
                    href={`/student/courses/${c.id}`}
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    Enter Classroom <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </RequireRole>
  );
}
