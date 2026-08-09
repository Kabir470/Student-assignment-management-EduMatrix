'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { FileText, ClipboardCheck, Clock, Info, MessageSquare, Maximize2, BarChart2, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { RequireRole } from '@/lib/auth/guards';
import { useAuth } from '@/lib/auth/context';
import PageHeader from '@/components/layout/PageHeader';
import { AssignmentStatusBadge, SubmissionStatusBadge } from '@/components/ui/Badge';
import { coursesService } from '@/lib/api/courses';
import { assignmentsService } from '@/lib/api/assignments';
import { submissionsService } from '@/lib/api/submissions';
import type { Course, Assignment, Submission } from '@/lib/types';
import { formatDate, isPastDue, isDueSoon, getDueDateCountdown } from '@/lib/utils';

export default function StudentCourseWorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPerformanceExpanded, setIsPerformanceExpanded] = useState(false);

  useEffect(() => {
    async function loadAll() {
      try {
        const [courseRes, assignmentsRes, submissionsRes] = await Promise.all([
          coursesService.getById(id),
          assignmentsService.getMyAssignments({ courseId: id, limit: 100 }),
          submissionsService.getMySubmissions({ limit: 100 }),
        ]);
        setCourse(courseRes);
        // Only show published assignments to students
        const published = assignmentsRes.data.filter(a => a.courseId === id && a.status !== 'draft');
        setAssignments(published);
        setSubmissions(submissionsRes.data.filter(s =>
          published.some(a => a.id === s.assignmentId)
        ));
      } finally {
        setIsLoading(false);
      }
    }
    loadAll();
  }, [id]);

  if (isLoading) {
    return (
      <RequireRole roles={['student']}>
        <div className="animate-fade-in">
          <div className="skeleton" style={{ height: 120, borderRadius: 'var(--radius-lg)', marginBottom: '1.5rem' }} />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 80, borderRadius: 'var(--radius-md)', marginBottom: '1rem' }} />
          ))}
        </div>
      </RequireRole>
    );
  }

  if (!course) {
    return <RequireRole roles={['student']}><p>Course not found.</p></RequireRole>;
  }

  // Sort assignments: upcoming first, then past due
  const sortedAssignments = [...assignments].sort((a, b) => {
    const aPast = isPastDue(a.dueDate);
    const bPast = isPastDue(b.dueDate);
    if (aPast && !bPast) return 1;
    if (!aPast && bPast) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  return (
    <RequireRole roles={['student']}>
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Workspace Banner */}
        <div style={{
          background: 'var(--gradient-primary)',
          borderRadius: 'var(--radius-lg)',
          padding: '2.5rem 2rem',
          color: 'white',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>{course.title}</h1>
            <p style={{ fontSize: '1.1rem', opacity: 0.9 }}>{course.code} · Taught by {course.teacherName}</p>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Recent Assignments */}
          <div className="lg:col-span-2">
            <div className="card" style={{ padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={18} style={{ color: 'var(--color-primary)' }} /> Classwork
              </h2>

              {sortedAssignments.length === 0 ? (
                <div className="empty-state">
                  <p>No assignments posted yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {sortedAssignments.map(a => {
                    const submission = submissions.find(s => s.assignmentId === a.id);
                    const isLate = isPastDue(a.dueDate);
                    const dueSoon = isDueSoon(a.dueDate);

                    return (
                      <Link key={a.id} href={`/student/assignments/${a.id}`} style={{ textDecoration: 'none' }}>
                        <div className="card card-hover" style={{ 
                          padding: '1.25rem', 
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: '0.75rem',
                          borderLeft: submission ? '4px solid var(--color-success)' : isLate ? '4px solid var(--color-danger)' : dueSoon ? '4px solid var(--color-warning)' : '4px solid var(--color-primary)'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <h3 style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--color-text)' }}>{a.title}</h3>
                            {submission ? (
                              <SubmissionStatusBadge status={submission.status} />
                            ) : (
                              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: isLate ? 'var(--color-danger)' : 'var(--color-text-secondary)' }}>
                                {isLate ? 'Missing' : 'Assigned'}
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <Clock size={14} /> 
                              {isLate ? `Due ${formatDate(a.dueDate)}` : `Due ${getDueDateCountdown(a.dueDate)}`}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <ClipboardCheck size={14} /> {a.totalMarks} points
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="card" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Info size={16} /> Course Details
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                {course.description}
              </p>
            </div>
            
            <div className="card" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem' }}>Your Progress</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Completed</span>
                <span style={{ fontWeight: 600 }}>{submissions.length} / {assignments.length}</span>
              </div>
              <div style={{ width: '100%', height: 6, background: 'var(--color-surface-2)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ 
                  height: '100%', 
                  background: 'var(--color-primary)', 
                  width: `${assignments.length ? (submissions.length / assignments.length) * 100 : 0}%`,
                  transition: 'width 0.5s ease'
                }} />
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <BarChart2 size={16} style={{ color: 'var(--color-primary)' }} /> Performance Metrics
                </h3>
                <button 
                  onClick={() => setIsPerformanceExpanded(!isPerformanceExpanded)}
                  style={{ 
                    background: 'transparent', 
                    border: 'none', 
                    cursor: 'pointer',
                    color: 'var(--color-text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0
                  }}
                  title={isPerformanceExpanded ? "Collapse" : "Expand"}
                >
                  {isPerformanceExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              {(() => {
                const gradedSubmissions = submissions.filter(s => s.status === 'graded');
                if (gradedSubmissions.length === 0) {
                  return <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>No graded assignments yet.</p>;
                }

                const totalObtainedMarks = gradedSubmissions.reduce((acc, curr) => acc + (curr.grade || 0), 0);
                const totalGradedPossibleMarks = assignments
                  .filter(a => gradedSubmissions.some(s => s.assignmentId === a.id))
                  .reduce((acc, curr) => acc + (curr.totalMarks || 0), 0);
                
                const percentage = totalGradedPossibleMarks > 0 
                  ? Math.round((totalObtainedMarks / totalGradedPossibleMarks) * 100) 
                  : 0;

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text)', lineHeight: 1 }}>{percentage}%</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>Average Grade</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                          {totalObtainedMarks} <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>/ {totalGradedPossibleMarks} pts</span>
                        </span>
                      </div>
                    </div>

                    {isPerformanceExpanded && (
                      <div className="animate-fade-in" style={{ 
                        marginTop: '0.5rem', 
                        paddingTop: '1rem', 
                        borderTop: '1px solid var(--color-border)',
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '0.75rem' 
                      }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Graded Assignments Breakdown
                        </p>
                        {gradedSubmissions.map(sub => {
                          const assignment = assignments.find(a => a.id === sub.assignmentId);
                          if (!assignment) return null;
                          return (
                            <div key={sub.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                              <span style={{ color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                                {assignment.title}
                              </span>
                              <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                                {sub.grade} <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 400 }}>/ {assignment.totalMarks}</span>
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </RequireRole>
  );
}
