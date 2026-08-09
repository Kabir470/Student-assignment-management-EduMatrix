'use client';

import { useEffect, useState, useRef } from 'react';
import { BarChart3, CheckCircle, Clock, AlertCircle, BookOpen, Download, X, User } from 'lucide-react';
import { RequireRole } from '@/lib/auth/guards';
import PageHeader from '@/components/layout/PageHeader';
import StatCard from '@/components/dashboard/StatCard';
import { calculatePercentage } from '@/lib/utils';
import type { Course, Assignment, Submission, User as UserType } from '@/lib/types';
import { coursesService } from '@/lib/api/courses';
import { assignmentsService } from '@/lib/api/assignments';
import { submissionsService } from '@/lib/api/submissions';
import { usersService } from '@/lib/api/users';

export default function AdminReportsPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [students, setStudents] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedCourse, setSelectedCourse] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [cRes, aRes, sRes, uRes] = await Promise.all([
          coursesService.getAll({ limit: 100 }),
          assignmentsService.getAll({ limit: 1000 }),
          submissionsService.getAll({ limit: 5000 }),
          usersService.getAll({ limit: 1000 })
        ]);
        setCourses(cRes.data);
        setAssignments(aRes.data);
        setSubmissions(sRes.data);
        setStudents(uRes.data.filter(u => u.role.toLowerCase() === 'student'));
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const graded = submissions.filter(s => s.status === 'graded');
  const submitted = submissions.filter(s => s.status === 'submitted' || s.status === 'graded' || s.status === 'late');
  
  let globalTotalMaxMarks = 0;
  let globalTotalAchieved = 0;
  graded.forEach(s => {
    const a = assignments.find(a => a.id === s.assignmentId);
    if (a && s.grade != null) {
      globalTotalMaxMarks += a.totalMarks;
      globalTotalAchieved += s.grade;
    }
  });
  const avgGrade = globalTotalMaxMarks > 0 ? Math.round((globalTotalAchieved / globalTotalMaxMarks) * 100) : 0;

  const courseStats = courses.map(c => {
    const courseAssignments = assignments.filter(a => a.courseId === c.id);
    const courseSubmissions = submissions.filter(s => s.courseId === c.id);
    const gradedSubs = courseSubmissions.filter(s => s.status === 'graded');
    
    let totalMaxMarks = 0;
    let totalAchieved = 0;
    gradedSubs.forEach(s => {
      const a = courseAssignments.find(a => a.id === s.assignmentId);
      if (a && s.grade != null) {
        totalMaxMarks += a.totalMarks;
        totalAchieved += s.grade;
      }
    });

    const avgGradePct = totalMaxMarks > 0 ? Math.round((totalAchieved / totalMaxMarks) * 100) : 0;

    return { 
      course: c, 
      assignments: courseAssignments, 
      submissions: courseSubmissions, 
      graded: gradedSubs.length, 
      avgGradePct 
    };
  });

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <RequireRole roles={['admin']}>
      <div className="animate-fade-in print-container">
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            body * { visibility: hidden; }
            .print-area, .print-area * { visibility: visible; }
            .print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 2rem; background: white; }
            .no-print { display: none !important; }
            .modal-overlay { background: transparent !important; align-items: flex-start; }
            .modal-content { box-shadow: none !important; border: none !important; max-width: 100% !important; margin: 0 !important; }
          }
        `}} />

        <div className="no-print">
          <PageHeader
            title="Reports & Analytics"
            subtitle="Submission and grading insights across all courses"
            breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Reports' }]}
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
            <StatCard title="Total Submissions" value={submissions.length} icon={BarChart3} variant="primary" />
            <StatCard title="Graded" value={graded.length} icon={CheckCircle} variant="success" />
            <StatCard title="Pending Review" value={submitted.length - graded.length} icon={Clock} variant="warning" />
            <StatCard title="Avg. Grade" value={`${avgGrade}%`} icon={AlertCircle} variant="success" />
          </div>

          <div className="card" style={{ marginBottom: '2rem' }}>
            <div style={{ padding: '1.5rem 1.5rem 0 1.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Course Performance</h2>
            </div>
            
            <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                <thead>
                  <tr style={{ background: 'var(--color-surface-2)', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
                    <th style={{ textAlign: 'left', padding: '0.75rem 1.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Course</th>
                    <th style={{ textAlign: 'center', padding: '0.75rem 1rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Assignments</th>
                    <th style={{ textAlign: 'center', padding: '0.75rem 1rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Submissions</th>
                    <th style={{ textAlign: 'center', padding: '0.75rem 1rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Graded</th>
                    <th style={{ textAlign: 'center', padding: '0.75rem 1rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Students</th>
                    <th style={{ textAlign: 'right', padding: '0.75rem 1.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Avg. Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '2rem' }}>
                        <div className="skeleton" style={{ height: '100px', borderRadius: 'var(--radius-md)' }} />
                      </td>
                    </tr>
                  ) : courseStats.map((cm, i) => (
                    <tr 
                      key={cm.course.id} 
                      className="hover-row"
                      style={{ borderBottom: i === courseStats.length - 1 ? 'none' : '1px solid var(--color-border)', cursor: 'pointer', transition: 'background 0.2s' }}
                      onClick={() => setSelectedCourse(cm)}
                    >
                      <td style={{ padding: '1.25rem 1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'var(--color-primary-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', flexShrink: 0 }}>
                            <BookOpen size={22} />
                          </div>
                          <div>
                            <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)', marginBottom: '0.2rem' }}>{cm.course.title}</p>
                            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{cm.course.code.toLowerCase()} • {cm.course.teacherName.toLowerCase()}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 700, fontSize: '0.95rem' }}>{cm.assignments.length}</td>
                      <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 700, fontSize: '0.95rem' }}>{cm.submissions.length}</td>
                      <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 700, fontSize: '0.95rem' }}>{cm.graded}</td>
                      <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 700, fontSize: '0.95rem' }}>{cm.course.studentIds?.length || 0}</td>
                      <td style={{ padding: '1rem 1.5rem', width: '220px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <span style={{ fontWeight: 800, fontSize: '1rem' }}>{cm.avgGradePct}%</span>
                          </div>
                          <div style={{ height: '6px', background: 'var(--color-border)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${cm.avgGradePct}%`, background: 'var(--color-primary)', borderRadius: '3px' }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!isLoading && courseStats.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        No course data available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1rem' }}>ⓘ</span> Click on a course to view detailed student reports. Data is updated real-time.
              </div>
            </div>
          </div>
        </div>

        {/* Modal for Course Report */}
        {selectedCourse && (
          <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            padding: '2rem'
          }}>
            <div className="card print-area modal-content" style={{
              width: '100%', maxWidth: '90vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column',
              background: 'var(--color-surface)', position: 'relative'
            }}>
              <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{selectedCourse.course.title} — Student Report</h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>{selectedCourse.course.code} · Instructor: {selectedCourse.course.teacherName}</p>
                </div>
                <div className="no-print" style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={handleExportPDF} className="btn btn-primary btn-sm" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <Download size={16} /> Export PDF
                  </button>
                  <button onClick={() => setSelectedCourse(null)} className="btn btn-ghost btn-icon">
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div style={{ padding: '1.5rem', overflow: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ padding: '1rem', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Enrolled</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem' }}>{selectedCourse.course.studentIds?.length || 0}</p>
                  </div>
                  <div style={{ padding: '1rem', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Assignments</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem' }}>{selectedCourse.assignments.length}</p>
                  </div>
                  <div style={{ padding: '1rem', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Course Average</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem' }}>{selectedCourse.avgGradePct}%</p>
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: `${300 + (selectedCourse.assignments.length * 100)}px` }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                        <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)', position: 'sticky', left: 0, background: 'var(--color-surface)', zIndex: 1 }}>Student Name</th>
                        
                        {/* Assignment Columns */}
                        {selectedCourse.assignments.sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).map((a: any) => (
                          <th key={a.id} style={{ textAlign: 'center', padding: '0.75rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                              <span style={{ maxWidth: '100px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={a.title}>{a.title}</span>
                              <span style={{ fontSize: '0.7rem', fontWeight: 400 }}>{new Date(a.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                              <span style={{ fontSize: '0.7rem', fontWeight: 400, color: 'var(--color-primary)' }}>{a.totalMarks} pts</span>
                            </div>
                          </th>
                        ))}
                        
                        <th style={{ textAlign: 'right', padding: '0.75rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)', position: 'sticky', right: 0, background: 'var(--color-surface)', zIndex: 1 }}>Avg. Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedCourse.course.studentIds || []).map((studentId: string) => {
                        const studentUser = students.find(s => s.id === studentId);
                        const studentName = studentUser ? `${studentUser.firstName} ${studentUser.lastName}` : 'Unknown Student';
                        
                        const studentSubs = selectedCourse.submissions.filter((s: any) => s.studentId === studentId);
                        
                        const studentGradedSubs = studentSubs.filter((s: any) => s.status === 'graded');
                        let studentMaxMarks = 0;
                        let studentAchieved = 0;
                        studentGradedSubs.forEach((s: any) => {
                          const a = selectedCourse.assignments.find((a: any) => a.id === s.assignmentId);
                          if (a && s.grade != null) {
                            studentMaxMarks += a.totalMarks;
                            studentAchieved += s.grade;
                          }
                        });
                        const studentAvg = studentMaxMarks > 0 ? Math.round((studentAchieved / studentMaxMarks) * 100) : 0;

                        return (
                          <tr key={studentId} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 0.2s' }} className="hover-row">
                            <td style={{ padding: '1rem 0.75rem', position: 'sticky', left: 0, background: 'inherit', zIndex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
                                  <User size={16} />
                                </div>
                                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{studentName}</span>
                              </div>
                            </td>
                            
                            {selectedCourse.assignments.map((a: any) => {
                              const sub = studentSubs.find((s: any) => s.assignmentId === a.id);
                              
                              let cellContent = <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>-</span>;
                              let cellBg = 'transparent';
                              
                              if (sub) {
                                if (sub.status === 'graded' && sub.grade != null) {
                                  cellContent = <span style={{ fontWeight: 600, color: 'var(--color-success)' }}>{sub.grade}</span>;
                                  cellBg = 'rgba(16, 185, 129, 0.05)';
                                } else if (sub.status === 'submitted') {
                                  cellContent = <span style={{ fontSize: '0.8rem', color: 'var(--color-warning)' }}>Pending</span>;
                                } else if (sub.status === 'late') {
                                  cellContent = <span style={{ fontSize: '0.8rem', color: 'var(--color-danger)' }}>Late</span>;
                                }
                              } else {
                                // Missing if past due
                                if (new Date(a.dueDate) < new Date()) {
                                  cellContent = <span style={{ fontSize: '0.8rem', color: 'var(--color-danger)' }}>Missing</span>;
                                  cellBg = 'rgba(244, 63, 94, 0.05)';
                                }
                              }
                              
                              return (
                                <td key={a.id} style={{ padding: '1rem 0.75rem', textAlign: 'center', background: cellBg, borderLeft: '1px solid var(--color-border)', borderRight: '1px solid var(--color-border)' }}>
                                  {cellContent}
                                </td>
                              );
                            })}
                            
                            <td style={{ padding: '1rem 0.75rem', textAlign: 'right', fontWeight: 700, position: 'sticky', right: 0, background: 'inherit', zIndex: 1 }}>
                              {studentAvg}%
                            </td>
                          </tr>
                        );
                      })}
                      {(!selectedCourse.course.studentIds || selectedCourse.course.studentIds.length === 0) && (
                        <tr>
                          <td colSpan={selectedCourse.assignments.length + 2} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>No students enrolled in this course.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </RequireRole>
  );
}
