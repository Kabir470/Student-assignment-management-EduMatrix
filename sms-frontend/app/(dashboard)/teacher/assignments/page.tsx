'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, Archive, Globe, Eye, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { RequireRole } from '@/lib/auth/guards';
import PageHeader from '@/components/layout/PageHeader';
import { AssignmentStatusBadge } from '@/components/ui/Badge';
import AssignmentForm from '@/components/assignments/AssignmentForm';
import AiAssignmentModal from '@/components/assignments/AiAssignmentModal';
import Modal from '@/components/ui/Modal';
import { assignmentsService } from '@/lib/api/assignments';
import { coursesService } from '@/lib/api/courses';
import type { Assignment, AssignmentCreateInput, Course } from '@/lib/types';
import { formatDate, isPastDue, getAssignmentDisplayStatus, ASSIGNMENT_DISPLAY_STATUS_COLORS } from '@/lib/utils';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

export default function TeacherAssignmentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [editAssignment, setEditAssignment] = useState<Assignment | null>(null);
  const [aiDraft, setAiDraft] = useState<Partial<AssignmentCreateInput> | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Assignment | null>(null);

  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [aRes, cRes] = await Promise.all([
        assignmentsService.getAll({ search, status: statusFilter === 'all' ? undefined : statusFilter }),
        coursesService.getAll(),
      ]);
      setAssignments(aRes.data);
      setCourses(cRes.data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [search, statusFilter, user]);

  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'new_ai') {
      const stored = localStorage.getItem('aiDraft');
      if (stored) {
        try {
          const draftData = JSON.parse(stored);
          setAiDraft(draftData);
          setIsFormOpen(true);
          localStorage.removeItem('aiDraft');
          router.replace('/teacher/assignments');
        } catch (e) {
          console.error("Failed to parse AI draft from localStorage");
        }
      }
    } else if (action === 'new') {
      openCreate();
      router.replace('/teacher/assignments');
    }
  }, [searchParams, router]);

  const openCreate = () => { setEditAssignment(null); setAiDraft(null); setIsFormOpen(true); };
  const openEdit = (a: Assignment) => { setEditAssignment(a); setIsFormOpen(true); };

  const handleFormSubmit = async (data: AssignmentCreateInput) => {
    if (!user) return;

    if (editAssignment) {
      await assignmentsService.update(editAssignment.id, data);
    } else {
      await assignmentsService.create(data);
    }
    loadData();
    setIsFormOpen(false);
  };

  const stripHtml = (html: string) => {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, '');
  };

  const handlePublish = async (a: Assignment) => {
    await assignmentsService.publish(a.id);
    loadData();
  };

  const handleArchive = async (a: Assignment) => {
    await assignmentsService.archive(a.id);
    loadData();
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    await assignmentsService.delete(deleteConfirm.id);
    setDeleteConfirm(null);
    loadData();
  };

  const coursesMap = new Map<string, string>();
  assignments.forEach(a => coursesMap.set(a.courseId, a.courseName));
  const uniqueCourses = Array.from(coursesMap.entries()).map(([id, name]) => ({ id, name }));

  const filteredAssignments = assignments.filter(a => {
    if (courseFilter !== 'all' && a.courseId !== courseFilter) return false;
    return true;
  });

  return (
    <RequireRole roles={['teacher']}>
      <div className="animate-fade-in">
        <PageHeader
          title="My Assignments"
          subtitle={`${assignments.length} assignments`}
          breadcrumbs={[{ label: 'Teacher', href: '/teacher' }, { label: 'Assignments' }]}
          actions={
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
              <button className="btn btn-primary" onClick={openCreate} id="create-assignment-btn">
                <Plus size={16} /> New Assignment
              </button>
            </div>
          }
        />

        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <div className="input-wrapper" style={{ flex: 1, minWidth: 200 }}>
            <Search size={16} className="input-icon" />
            <input className="input" style={{ paddingLeft: '2.5rem' }} placeholder="Search assignments..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input" style={{ width: 160 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Active / Closed</option>
            <option value="archived">Archived</option>
          </select>
        </div>

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

        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 800 }}>
              <thead style={{ background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)' }}>
                <tr>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 700, fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assignment</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 700, fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Course</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 700, fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Due Date</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 700, fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Marks</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 700, fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 700, fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody style={{ background: 'var(--color-surface)' }}>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--color-surface-3)' }}>{Array.from({ length: 6 }).map((_, j) => <td key={j} style={{ padding: '1.25rem 1.5rem' }}><div className="skeleton" style={{ height: 16, borderRadius: 4 }} /></td>)}</tr>
                  ))
                ) : filteredAssignments.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--color-text-secondary)', fontWeight: 600 }}>No assignments found. Create your first!</td></tr>
                ) : filteredAssignments.map(a => (
                  <tr 
                    key={a.id} 
                    onClick={() => router.push(`/teacher/assignments/${a.id}`)}
                    style={{ borderBottom: '1px solid var(--color-surface-3)', cursor: 'pointer' }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)' }}>{a.title}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                          {stripHtml(a.description).slice(0, 60)}
                          {stripHtml(a.description).length > 60 ? '...' : ''}
                        </p>
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>{a.courseName}</span>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem' }}>
                      {(() => {
                        const ds = getAssignmentDisplayStatus(a.status, a.dueDate);
                        return <span style={{ fontSize: '0.85rem', fontWeight: 500, color: ds === 'Closed' ? '#EF4444' : 'var(--color-text-secondary)' }}>{formatDate(a.dueDate, 'MMM d, yyyy')}</span>;
                      })()}
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem' }}><span style={{ fontWeight: 700, color: 'var(--color-text)' }}>{a.totalMarks}</span></td>
                    <td style={{ padding: '1.25rem 1.5rem' }}><AssignmentStatusBadge status={a.status} dueDate={a.dueDate} /></td>
                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
                        <button className="btn btn-ghost btn-icon btn-sm hover:bg-gray-200" onClick={() => openEdit(a)} title="Edit" style={{ color: 'var(--color-text-secondary)' }}><Edit2 size={16} /></button>
                        {a.status === 'draft' && (
                          <button className="btn btn-ghost btn-icon btn-sm hover:bg-green-100" onClick={() => handlePublish(a)} title="Publish" style={{ color: '#059669' }}>
                            <Globe size={16} />
                          </button>
                        )}
                        {a.status === 'published' && (
                          <button className="btn btn-ghost btn-icon btn-sm hover:bg-yellow-100" onClick={() => handleArchive(a)} title="Archive" style={{ color: '#D97706' }}>
                            <Archive size={16} />
                          </button>
                        )}
                        <button className="btn btn-ghost btn-icon btn-sm hover:bg-red-100" onClick={() => setDeleteConfirm(a)} title="Delete" style={{ color: '#EF4444' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <AssignmentForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleFormSubmit}
          assignment={editAssignment}
          initialDraft={aiDraft}
          courses={courses}
        />

        <AiAssignmentModal 
          isOpen={isAiModalOpen} 
          onClose={() => setIsAiModalOpen(false)} 
          courses={courses}
          onApprove={(data) => {
            setIsAiModalOpen(false);
            setAiDraft(data);
            setIsFormOpen(true);
          }} 
        />

        <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Assignment?" size="sm"
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
            </>
          }
        >
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Delete <strong style={{ color: 'var(--color-text)' }}>{deleteConfirm?.title}</strong>? All associated submissions will be lost.
          </p>
        </Modal>
      </div>
    </RequireRole>
  );
}
