'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Users, FileText, ClipboardCheck, UserPlus, UserMinus, Search, Plus, Globe, Archive, Edit2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { RequireRole } from '@/lib/auth/guards';
import { useAuth } from '@/lib/auth/context';
import PageHeader from '@/components/layout/PageHeader';
import Modal from '@/components/ui/Modal';
import { AssignmentStatusBadge, SubmissionStatusBadge } from '@/components/ui/Badge';
import AssignmentForm from '@/components/assignments/AssignmentForm';
import { coursesService } from '@/lib/api/courses';
import { assignmentsService } from '@/lib/api/assignments';
import { submissionsService } from '@/lib/api/submissions';
import { usersService } from '@/lib/api/users';
import type { Course, Assignment, Submission, EnrolledStudent, User, AssignmentCreateInput } from '@/lib/types';
import { formatDate, isPastDue } from '@/lib/utils';

type Tab = 'students' | 'assignments' | 'submissions';

export default function TeacherCourseWorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('assignments');
  const [isLoading, setIsLoading] = useState(true);

  // Students tab
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([]);
  const [allStudents, setAllStudents] = useState<User[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [showAddStudent, setShowAddStudent] = useState(false);

  // Assignments tab
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isAssignmentFormOpen, setIsAssignmentFormOpen] = useState(false);
  const [editAssignment, setEditAssignment] = useState<Assignment | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Assignment | null>(null);

  // Submissions tab
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  useEffect(() => {
    async function loadAll() {
      try {
        const [courseRes, enrolledRes, assignmentsRes, submissionsRes] = await Promise.all([
          coursesService.getById(id),
          coursesService.getEnrolledStudents(id),
          assignmentsService.getAll({ courseId: id, limit: 100 }),
          submissionsService.getAll({ limit: 100 }),
        ]);
        setCourse(courseRes);
        setEnrolledStudents(enrolledRes);
        setAssignments(assignmentsRes.data.filter(a => a.courseId === id));
        setSubmissions(submissionsRes.data.filter(s =>
          assignmentsRes.data.some(a => a.id === s.assignmentId && a.courseId === id)
        ));
      } finally {
        setIsLoading(false);
      }
    }
    loadAll();
  }, [id]);

  const loadAllStudents = async () => {
    const res = await usersService.getAll({ role: 'student', limit: 200 });
    setAllStudents(res.data);
  };

  const handleEnroll = async (studentId: string) => {
    await coursesService.enrollStudent(id, studentId);
    const updated = await coursesService.getEnrolledStudents(id);
    setEnrolledStudents(updated);
  };

  const handleRemove = async (studentId: string) => {
    await coursesService.removeStudent(id, studentId);
    setEnrolledStudents(prev => prev.filter(s => s.id !== studentId));
  };

  const isEnrolled = (sid: string) => enrolledStudents.some(s => s.id === sid);

  const handleAssignmentSubmit = async (data: Omit<AssignmentCreateInput, 'teacherId' | 'teacherName' | 'courseName'>) => {
    if (!user || !course) return;
    const payload = { ...data, courseId: id, teacherId: user.id, teacherName: `${user.firstName} ${user.lastName}`, courseName: course.title };
    if (editAssignment) {
      await assignmentsService.update(editAssignment.id, data);
    } else {
      await assignmentsService.create(payload);
    }
    const res = await assignmentsService.getAll({ courseId: id, limit: 100 });
    setAssignments(res.data.filter(a => a.courseId === id));
  };

  const handleDeleteAssignment = async () => {
    if (!deleteConfirm) return;
    await assignmentsService.delete(deleteConfirm.id);
    setDeleteConfirm(null);
    setAssignments(prev => prev.filter(a => a.id !== deleteConfirm.id));
  };

  const filteredAddStudents = allStudents.filter(s => {
    const q = studentSearch.trim().toLowerCase();
    if (!q || q.length < 2) return false;
    return `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
  });

  if (isLoading) {
    return (
      <RequireRole roles={['teacher']}>
        <div className="animate-fade-in">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 80, borderRadius: 'var(--radius-md)', marginBottom: '1rem' }} />
          ))}
        </div>
      </RequireRole>
    );
  }

  if (!course) {
    return <RequireRole roles={['teacher']}><p>Course not found.</p></RequireRole>;
  }

  return (
    <RequireRole roles={['teacher']}>
      <div className="animate-fade-in">
        <PageHeader
          title={course.title}
          subtitle={`${course.code} · ${course.status.charAt(0).toUpperCase() + course.status.slice(1)}`}
          breadcrumbs={[
            { label: 'Teacher', href: '/teacher' },
            { label: 'My Courses', href: '/teacher/courses' },
            { label: course.title }
          ]}
        />

        <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '1px solid var(--color-border)', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '2px' }}>
          {([
            { id: 'students', label: 'Students', icon: Users, count: enrolledStudents.length },
            { id: 'assignments', label: 'Assignments', icon: FileText, count: assignments.length },
            { id: 'submissions', label: 'Submissions', icon: ClipboardCheck, count: submissions.length },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.6rem 1rem',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '0.875rem', fontWeight: activeTab === tab.id ? 700 : 500,
                color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                borderBottom: activeTab === tab.id ? '2px solid var(--color-primary)' : '2px solid transparent',
                marginBottom: -1,
                transition: 'all 0.15s',
              }}
            >
              <tab.icon size={15} />
              {tab.label}
              {tab.count !== null && (
                <span style={{
                  padding: '0.1rem 0.4rem',
                  background: activeTab === tab.id ? 'var(--color-primary-muted)' : 'var(--color-surface-2)',
                  color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700,
                }}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={async () => { await loadAllStudents(); setShowAddStudent(true); }}
              >
                <UserPlus size={14} /> Add Student
              </button>
            </div>

            {enrolledStudents.length === 0 ? (
              <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                <Users size={40} style={{ color: 'var(--color-text-muted)', margin: '0 auto 1rem' }} />
                <p style={{ color: 'var(--color-text-muted)' }}>No students enrolled in this course yet.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrolledStudents.map(s => (
                      <tr key={s.id}>
                        <td>
                          <p style={{ fontWeight: 500, color: 'var(--color-text)' }}>{s.firstName} {s.lastName}</p>
                        </td>
                        <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>{s.email}</td>
                        <td>
                          <span style={{
                            fontSize: '0.75rem', fontWeight: 600,
                            color: s.isActive ? 'var(--color-success)' : 'var(--color-danger)',
                            background: s.isActive ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
                            padding: '0.2rem 0.5rem', borderRadius: '999px',
                          }}>
                            {s.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => handleRemove(s.id)}>
                            <UserMinus size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Assignments Tab */}
        {activeTab === 'assignments' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
              <button className="btn btn-primary btn-sm" onClick={() => { setEditAssignment(null); setIsAssignmentFormOpen(true); }}>
                <Plus size={14} /> New Assignment
              </button>
            </div>

            {assignments.length === 0 ? (
              <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                <FileText size={40} style={{ color: 'var(--color-text-muted)', margin: '0 auto 1rem' }} />
                <p style={{ color: 'var(--color-text-muted)' }}>No assignments yet. Create your first one!</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr><th>Assignment</th><th>Due Date</th><th>Marks</th><th>Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {assignments.map(a => (
                      <tr key={a.id}>
                        <td>
                          <p style={{ fontWeight: 600, color: 'var(--color-text)' }}>{a.title}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{a.description.slice(0, 50)}...</p>
                        </td>
                        <td style={{ fontSize: '0.85rem', color: isPastDue(a.dueDate) && a.status === 'published' ? 'var(--color-danger)' : 'var(--color-text-secondary)' }}>
                          {formatDate(a.dueDate)}
                        </td>
                        <td><span style={{ fontWeight: 600 }}>{a.totalMarks}</span></td>
                        <td><AssignmentStatusBadge status={a.status} /></td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.3rem' }}>
                            <Link href={`/teacher/assignments/${a.id}`} className="btn btn-ghost btn-icon btn-sm" title="View Submissions">
                              <ClipboardCheck size={13} />
                            </Link>
                            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { setEditAssignment(a); setIsAssignmentFormOpen(true); }}><Edit2 size={13} /></button>
                            {a.status === 'draft' && (
                              <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--color-success)' }} onClick={async () => { await assignmentsService.publish(a.id); setAssignments(prev => prev.map(x => x.id === a.id ? { ...x, status: 'published' } : x)); }}><Globe size={13} /></button>
                            )}
                            <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => setDeleteConfirm(a)}><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <AssignmentForm
              isOpen={isAssignmentFormOpen}
              onClose={() => setIsAssignmentFormOpen(false)}
              onSubmit={handleAssignmentSubmit}
              assignment={editAssignment}
              courses={course ? [course] : []}
              defaultCourseId={id}
            />

            <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Assignment?" size="sm"
              footer={<>
                <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                <button className="btn btn-danger" onClick={handleDeleteAssignment}>Delete</button>
              </>}
            >
              <p style={{ color: 'var(--color-text-secondary)' }}>Delete <strong>{deleteConfirm?.title}</strong>? All submissions will be lost.</p>
            </Modal>
          </div>
        )}

        {/* Submissions Tab */}
        {activeTab === 'submissions' && (
          <div>
            {submissions.length === 0 ? (
              <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                <ClipboardCheck size={40} style={{ color: 'var(--color-text-muted)', margin: '0 auto 1rem' }} />
                <p style={{ color: 'var(--color-text-muted)' }}>No submissions yet for this course.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr><th>Student</th><th>Assignment</th><th>Submitted</th><th>Grade</th><th>Status</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {submissions.map(s => {
                      const assignment = assignments.find(a => a.id === s.assignmentId);
                      return (
                        <tr key={s.id}>
                          <td>
                            <p style={{ fontWeight: 500, color: 'var(--color-text)' }}>{s.studentName}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{s.studentEmail}</p>
                          </td>
                          <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>{s.assignmentTitle}</td>
                          <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>{s.submittedAt ? formatDate(s.submittedAt) : '—'}</td>
                          <td>
                            {s.grade != null && assignment
                              ? <span style={{ fontWeight: 700, color: 'var(--color-success)' }}>{s.grade}/{assignment.totalMarks}</span>
                              : <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                            }
                          </td>
                          <td><SubmissionStatusBadge status={s.status} /></td>
                          <td>
                            <Link href={`/teacher/assignments/${s.assignmentId}`} className="btn btn-primary btn-sm">
                              Grade
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Add Student Modal */}
        <Modal
          isOpen={showAddStudent}
          onClose={() => { setShowAddStudent(false); setStudentSearch(''); }}
          title="Add Students to Course"
          size="md"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="input-wrapper">
              <Search size={14} className="input-icon" />
              <input className="input" style={{ paddingLeft: '2.25rem' }} placeholder="Type a name or email to invite a student..." value={studentSearch} onChange={e => setStudentSearch(e.target.value)} />
            </div>
            
            {studentSearch.trim().length < 2 && (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                <p>Type at least 2 characters to search for a student.</p>
              </div>
            )}
            
            <div style={{ maxHeight: 360, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {filteredAddStudents.length === 0 && studentSearch.trim().length >= 2 ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                  No students found matching "{studentSearch}"
                </div>
              ) : filteredAddStudents.map(s => {
                const enrolled = isEnrolled(s.id);
                return (
                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)', opacity: enrolled ? 0.6 : 1 }}>
                    <div>
                      <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text)' }}>{s.firstName} {s.lastName}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{s.email}</p>
                    </div>
                    <button
                      className={`btn btn-sm ${enrolled ? 'btn-secondary' : 'btn-primary'}`}
                      disabled={enrolled}
                      onClick={() => handleEnroll(s.id)}
                    >
                      {enrolled ? 'Added' : <><UserPlus size={12} /> Add</>}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </Modal>
      </div>
    </RequireRole>
  );
}
