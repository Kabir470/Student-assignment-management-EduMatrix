'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, Users, UserPlus, X, UserMinus, BookOpen } from 'lucide-react';
import { RequireRole } from '@/lib/auth/guards';
import PageHeader from '@/components/layout/PageHeader';
import { CourseStatusBadge } from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { coursesService } from '@/lib/api/courses';
import { usersService } from '@/lib/api/users';
import type { Course, User, EnrolledStudent } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  title: z.string().min(3, 'Required'),
  code: z.string().min(2, 'Required'),
  description: z.string().min(10, 'Required'),
  teacherId: z.string().min(1, 'Select a teacher'),
  status: z.enum(['active', 'inactive', 'archived']),
});
type FormData = z.infer<typeof schema>;

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Course | null>(null);

  // Manage Students state
  const [manageStudentsCourse, setManageStudentsCourse] = useState<Course | null>(null);
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([]);
  const [allStudents, setAllStudents] = useState<User[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'active' },
  });

  const loadData = async () => {
    setIsLoading(true);
    const [coursesRes, teachersRes] = await Promise.all([
      coursesService.getAll({ search }),
      usersService.getAll({ role: 'teacher' }),
    ]);
    setCourses(coursesRes.data);
    setTotal(coursesRes.totalCount);
    setTeachers(teachersRes.data);
    setIsLoading(false);
  };

  useEffect(() => { loadData(); }, [search]);

  const openCreate = () => { setEditCourse(null); reset({ status: 'active' }); setIsModalOpen(true); };
  const openEdit = (c: Course) => {
    setEditCourse(c);
    setValue('title', c.title); setValue('code', c.code); setValue('description', c.description);
    setValue('teacherId', c.teacherId); setValue('status', c.status);
    setIsModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    const teacher = teachers.find(t => t.id === data.teacherId);
    const teacherName = teacher ? `${teacher.firstName} ${teacher.lastName}` : '';
    if (editCourse) {
      await coursesService.update(editCourse.id, { ...data, teacherName });
    } else {
      await coursesService.create({ ...data, teacherName, studentIds: [] });
    }
    setIsModalOpen(false);
    loadData();
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    await coursesService.delete(deleteConfirm.id);
    setDeleteConfirm(null);
    loadData();
  };

  const openManageStudents = async (c: Course) => {
    setManageStudentsCourse(c);
    setIsLoadingStudents(true);
    setStudentSearch('');
    try {
      const [enrolled, students] = await Promise.all([
        coursesService.getEnrolledStudents(c.id),
        usersService.getAll({ role: 'student', limit: 200 }),
      ]);
      setEnrolledStudents(enrolled);
      setAllStudents(students.data);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const handleEnroll = async (studentId: string) => {
    if (!manageStudentsCourse) return;
    try {
      await coursesService.enrollStudent(manageStudentsCourse.id, studentId);
      const updated = await coursesService.getEnrolledStudents(manageStudentsCourse.id);
      setEnrolledStudents(updated);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleRemove = async (studentId: string) => {
    if (!manageStudentsCourse) return;
    await coursesService.removeStudent(manageStudentsCourse.id, studentId);
    setEnrolledStudents(prev => prev.filter(s => s.id !== studentId));
  };

  const filteredStudents = allStudents.filter(s => {
    const q = studentSearch.toLowerCase();
    const name = `${s.firstName} ${s.lastName}`.toLowerCase();
    return !q || name.includes(q) || s.email.toLowerCase().includes(q);
  });

  const isEnrolled = (studentId: string) => enrolledStudents.some(s => s.id === studentId);

  return (
    <RequireRole roles={['admin']}>
      <div className="animate-fade-in">
        <PageHeader
          title="Course Management"
          subtitle={`${total} courses in the system`}
          breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Courses' }]}
          actions={
            <button className="btn btn-primary" onClick={openCreate} id="create-course-btn">
              <Plus size={16} /> Add Course
            </button>
          }
        />

        <div style={{ marginBottom: '1.25rem' }}>
          <div className="input-wrapper" style={{ maxWidth: 360 }}>
            <Search size={16} className="input-icon" />
            <input className="input" style={{ paddingLeft: '2.5rem' }} placeholder="Search courses..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {/* Course Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 200, borderRadius: 'var(--radius-lg)' }} />
            ))
          ) : courses.length === 0 ? (
            <div className="card" style={{ padding: '3rem', textAlign: 'center', gridColumn: '1/-1' }}>
              <p style={{ color: 'var(--color-text-muted)' }}>No courses found</p>
            </div>
          ) : courses.map(c => (
            <div key={c.id} className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{
                  padding: '0.25rem 0.6rem', background: 'var(--color-primary-muted)',
                  borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 700,
                  color: 'var(--color-primary)', fontFamily: 'monospace',
                }}>
                  {c.code}
                </div>
                <CourseStatusBadge status={c.status} />
              </div>
              <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text)' }}>{c.title}</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: 1.5, flex: 1 }}>
                {c.description.length > 80 ? c.description.slice(0, 80) + '...' : c.description}
              </p>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Users size={13} />
                <span>{c.studentIds.length} students</span>
                <span>·</span>
                <span>{c.teacherName}</span>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => openManageStudents(c)}
                >
                  <UserPlus size={13} /> Manage Students
                </button>
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(c)}><Edit2 size={14} /></button>
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setDeleteConfirm(c)} style={{ color: 'var(--color-danger)' }}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>

        {/* Create / Edit Modal */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editCourse ? 'Edit Course' : 'Add New Course'} size="lg"
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit(onSubmit)}>
                {editCourse ? 'Save Changes' : 'Create Course'}
              </button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Course Title</label>
                <input className={`input ${errors.title ? 'input-error' : ''}`} placeholder="e.g. Introduction to Computer Science" {...register('title')} />
                {errors.title && <p className="form-error">{errors.title.message}</p>}
              </div>
              <div className="form-group">
                <label className="form-label">Course Code</label>
                <input className={`input ${errors.code ? 'input-error' : ''}`} placeholder="CS101" {...register('code')} />
                {errors.code && <p className="form-error">{errors.code.message}</p>}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea rows={3} className={`input ${errors.description ? 'input-error' : ''}`} placeholder="Course description..." style={{ resize: 'vertical' }} {...register('description')} />
              {errors.description && <p className="form-error">{errors.description.message}</p>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Assigned Teacher</label>
                <select className={`input ${errors.teacherId ? 'input-error' : ''}`} {...register('teacherId')}>
                  <option value="">Select teacher</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}
                </select>
                {errors.teacherId && <p className="form-error">{errors.teacherId.message}</p>}
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="input" {...register('status')}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          </div>
        </Modal>

        {/* Manage Students Modal */}
        <Modal
          isOpen={!!manageStudentsCourse}
          onClose={() => setManageStudentsCourse(null)}
          title={`Manage Students — ${manageStudentsCourse?.title}`}
          size="lg"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Enrolled students */}
            <div>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.75rem' }}>
                Enrolled Students ({enrolledStudents.length})
              </h3>
              {enrolledStudents.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', padding: '0.75rem', textAlign: 'center' }}>No students enrolled yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: 180, overflowY: 'auto' }}>
                  {enrolledStudents.map(s => (
                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)' }}>
                      <div>
                        <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)' }}>{s.firstName} {s.lastName}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{s.email}</p>
                      </div>
                      <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => handleRemove(s.id)}>
                        <UserMinus size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add students */}
            <div>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.75rem' }}>
                Add Students
              </h3>
              <div className="input-wrapper" style={{ marginBottom: '0.75rem' }}>
                <Search size={14} className="input-icon" />
                <input className="input" style={{ paddingLeft: '2.25rem' }} placeholder="Search students..." value={studentSearch} onChange={e => setStudentSearch(e.target.value)} />
              </div>
              {isLoadingStudents ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>Loading...</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: 220, overflowY: 'auto' }}>
                  {filteredStudents.map(s => {
                    const enrolled = isEnrolled(s.id);
                    return (
                      <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)', opacity: enrolled ? 0.5 : 1 }}>
                        <div>
                          <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)' }}>{s.firstName} {s.lastName}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{s.email}</p>
                        </div>
                        <button
                          className={`btn btn-sm ${enrolled ? 'btn-secondary' : 'btn-primary'}`}
                          disabled={enrolled}
                          onClick={() => handleEnroll(s.id)}
                        >
                          {enrolled ? 'Enrolled' : <><UserPlus size={12} /> Add</>}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </Modal>

        {/* Delete Confirm */}
        <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Course?" size="sm"
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete Course</button>
            </>
          }
        >
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Delete <strong style={{ color: 'var(--color-text)' }}>{deleteConfirm?.title}</strong>? All assignments and submissions associated with this course will be permanently deleted.
          </p>
        </Modal>
      </div>
    </RequireRole>
  );
}
