'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, Archive, Globe, Eye } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { RequireRole } from '@/lib/auth/guards';
import PageHeader from '@/components/layout/PageHeader';
import { AssignmentStatusBadge } from '@/components/ui/Badge';
import AssignmentForm from '@/components/assignments/AssignmentForm';
import Modal from '@/components/ui/Modal';
import { assignmentsService } from '@/lib/api/assignments';
import { coursesService } from '@/lib/api/courses';
import type { Assignment, AssignmentCreateInput, Course } from '@/lib/types';
import { formatDate, isPastDue } from '@/lib/utils';
import Link from 'next/link';

export default function TeacherAssignmentsPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editAssignment, setEditAssignment] = useState<Assignment | null>(null);
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

  const openCreate = () => { setEditAssignment(null); setIsFormOpen(true); };
  const openEdit = (a: Assignment) => { setEditAssignment(a); setIsFormOpen(true); };

  const handleFormSubmit = async (data: Omit<AssignmentCreateInput, 'teacherId' | 'teacherName' | 'courseName'>) => {
    if (!user) return;
    const course = courses.find(c => c.id === data.courseId);
    const payload: Parameters<typeof assignmentsService.create>[0] = {
      ...data,
      teacherId: user.id,
      teacherName: `${user.firstName} ${user.lastName}`,
      courseName: course?.title ?? '',
    };
    if (editAssignment) {
      await assignmentsService.update(editAssignment.id, data);
    } else {
      await assignmentsService.create(payload);
    }
    loadData();
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

  return (
    <RequireRole roles={['teacher']}>
      <div className="animate-fade-in">
        <PageHeader
          title="My Assignments"
          subtitle={`${assignments.length} assignments`}
          breadcrumbs={[{ label: 'Teacher', href: '/teacher' }, { label: 'Assignments' }]}
          actions={
            <button className="btn btn-primary" onClick={openCreate} id="create-assignment-btn">
              <Plus size={16} /> New Assignment
            </button>
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
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="table-wrapper">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Assignment</th>
                <th>Course</th>
                <th>Due Date</th>
                <th>Marks</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 6 }).map((_, j) => <td key={j}><div className="skeleton" style={{ height: 16, borderRadius: 4 }} /></td>)}</tr>
                ))
              ) : assignments.length === 0 ? (
                <tr><td colSpan={6}><div className="empty-state"><p>No assignments found. Create your first!</p></div></td></tr>
              ) : assignments.map(a => (
                <tr key={a.id}>
                  <td>
                    <div>
                      <p style={{ fontWeight: 600, color: 'var(--color-text)' }}>{a.title}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{a.description.slice(0, 50)}...</p>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>{a.courseName}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.85rem', color: isPastDue(a.dueDate) && a.status === 'published' ? 'var(--color-danger)' : 'var(--color-text-secondary)' }}>
                      {formatDate(a.dueDate)}
                    </span>
                  </td>
                  <td><span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{a.totalMarks}</span></td>
                  <td><AssignmentStatusBadge status={a.status} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <Link href={`/teacher/assignments/${a.id}`} className="btn btn-ghost btn-icon btn-sm" title="View Submissions">
                        <Eye size={14} />
                      </Link>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(a)} title="Edit"><Edit2 size={14} /></button>
                      {a.status === 'draft' && (
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handlePublish(a)} title="Publish" style={{ color: 'var(--color-success)' }}>
                          <Globe size={14} />
                        </button>
                      )}
                      {a.status === 'published' && (
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleArchive(a)} title="Archive" style={{ color: 'var(--color-warning)' }}>
                          <Archive size={14} />
                        </button>
                      )}
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setDeleteConfirm(a)} title="Delete" style={{ color: 'var(--color-danger)' }}>
                        <Trash2 size={14} />
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
          courses={courses}
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
