'use client';

import { useEffect, useState } from 'react';
import {
  Database, FileText, Cpu, Code, FlaskConical, MessageSquare,
  ChevronLeft, ChevronRight, Calendar, CheckCircle, Clock, Star,
  Download, User, FileIcon, X
} from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { RequireRole } from '@/lib/auth/guards';
import { submissionsService } from '@/lib/api/submissions';
import { assignmentsService } from '@/lib/api/assignments';
import type { Submission, Assignment } from '@/lib/types';
import { getSubmissionDisplayStatus, SUBMISSION_DISPLAY_STATUS_COLORS } from '@/lib/utils';
import PageHeader from '@/components/layout/PageHeader';

export default function StudentSubmissionsPage() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
  const [showRubricModal, setShowRubricModal] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const [sRes, aRes] = await Promise.all([
        submissionsService.getMySubmissions({ limit: 100 }),
        assignmentsService.getMyAssignments({ limit: 100 }),
      ]);
      setSubmissions(sRes.data);
      setAssignments(aRes.data);
      if (sRes.data.length > 0) {
        setSelectedSubId(sRes.data[0].id);
      }
      setIsLoading(false);
    };
    load();
  }, [user]);

  const getAssignment = (id: string) => assignments.find(a => a.id === id);

  // Stats calculation
  const totalSubmitted = submissions.length;
  const gradedSubs = submissions.filter(s => s.status === 'graded');
  const totalGraded = gradedSubs.length;
  const totalPending = submissions.filter(s => s.status !== 'graded').length;

  let avgScore = 0;
  if (totalGraded > 0) {
    let sumPct = 0;
    gradedSubs.forEach(s => {
      const a = getAssignment(s.assignmentId);
      if (a && s.grade != null && a.totalMarks > 0) {
        sumPct += (s.grade / a.totalMarks) * 100;
      }
    });
    avgScore = sumPct / totalGraded;
  }

  const selectedSub = submissions.find(s => s.id === selectedSubId);
  const selectedAssignment = selectedSub ? getAssignment(selectedSub.assignmentId) : null;

  return (
    <RequireRole roles={['student']}>
      <div className="animate-fade-in" style={{ padding: '2rem', width: '100%' }}>

        <PageHeader
          title="My Submissions"
          subtitle="View your submitted assignments and received marks"
          breadcrumbs={[]}
        />

        {/* Master-Detail Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column: Stats & All Submissions List */}
          <div className="lg:col-span-2 flex flex-col gap-8">

            {/* Top Stat Cards (4 Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div style={{ background: 'var(--color-surface)', borderRadius: '12px', padding: '1rem 0.85rem', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '0.6rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', minWidth: 0 }}>
                <div style={{ width: 42, height: 42, borderRadius: '10px', background: 'rgba(99,102,241,0.1)', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FileText size={20} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text)', lineHeight: 1 }}>{totalSubmitted}</p>
                  <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary)', marginTop: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Total Submitted</p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>All time submissions</p>
                </div>
              </div>

              <div style={{ background: 'var(--color-surface)', borderRadius: '12px', padding: '1rem 0.85rem', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '0.6rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', minWidth: 0 }}>
                <div style={{ width: 42, height: 42, borderRadius: '10px', background: 'rgba(16,185,129,0.1)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CheckCircle size={20} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text)', lineHeight: 1 }}>{totalGraded}</p>
                  <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary)', marginTop: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Graded</p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Submissions graded</p>
                </div>
              </div>

              <div style={{ background: 'var(--color-surface)', borderRadius: '12px', padding: '1rem 0.85rem', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '0.6rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', minWidth: 0 }}>
                <div style={{ width: 42, height: 42, borderRadius: '10px', background: 'rgba(245,158,11,0.1)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Clock size={20} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text)', lineHeight: 1 }}>{totalPending}</p>
                  <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary)', marginTop: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Pending</p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Awaiting grading</p>
                </div>
              </div>

              <div style={{ background: 'var(--color-surface)', borderRadius: '12px', padding: '1rem 0.85rem', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '0.6rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', minWidth: 0 }}>
                <div style={{ width: 42, height: 42, borderRadius: '10px', background: 'rgba(59,130,246,0.1)', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Star size={20} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text)', lineHeight: 1, whiteSpace: 'nowrap' }}>{avgScore.toFixed(2)}%</p>
                  <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary)', marginTop: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Average Score</p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Across all submissions</p>
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--color-surface)', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>

              <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text)' }}>All Submissions</h2>
              </div>

              <div style={{ overflowX: 'auto' }}>
                {isLoading ? (
                  <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 60, borderRadius: '8px' }} />)}
                  </div>
                ) : submissions.length === 0 ? (
                  <div className="empty-state" style={{ padding: '3rem' }}><p>No submissions yet 🎉</p></div>
                ) : (
                  <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontWeight: 700, fontSize: '0.85rem', padding: '1rem 1.5rem', textAlign: 'left' }}>Assignment</th>
                        <th style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontWeight: 700, fontSize: '0.85rem', padding: '1rem 1rem', textAlign: 'left' }}>Course</th>
                        <th style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontWeight: 700, fontSize: '0.85rem', padding: '1rem 1rem', textAlign: 'left' }}>Submitted On</th>
                        <th style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontWeight: 700, fontSize: '0.85rem', padding: '1rem 1rem', textAlign: 'left' }}>Status</th>
                        <th style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontWeight: 700, fontSize: '0.85rem', padding: '1rem 1rem', textAlign: 'center' }}>Marks</th>
                        <th style={{ borderBottom: '1px solid var(--color-border)', padding: '1rem 1.5rem' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map((s, index) => {
                        const a = getAssignment(s.assignmentId);
                        if (!a) return null;

                        const isSelected = selectedSubId === s.id;

                        // Use centralized status helper — correctly handles Late vs Submitted, Missed vs Pending
                        const displayStatus = getSubmissionDisplayStatus(s.status, s.submittedAt, a.dueDate);
                        const { bg: badgeBg, color: badgeColor } = SUBMISSION_DISPLAY_STATUS_COLORS[displayStatus];
                        const statusText = displayStatus;

                        const pct = s.grade != null ? Math.round((s.grade / a.totalMarks) * 100) : null;
                        const pctColor = pct != null ? pct >= 80 ? '#10B981' : pct >= 60 ? '#F59E0B' : '#EF4444' : 'var(--color-text-muted)';

                        const icons = [Database, FileText, Cpu, Code, FlaskConical];
                        const colors = ['rgba(99,102,241,0.1)', 'rgba(16,185,129,0.1)', 'rgba(245,158,11,0.1)', 'rgba(56,189,248,0.1)', 'rgba(239,68,68,0.1)'];
                        const iconColors = ['#4F46E5', '#10B981', '#F59E0B', '#0EA5E9', '#EF4444'];

                        const IconComp = icons[index % icons.length];
                        const bg = colors[index % colors.length];
                        const color = iconColors[index % iconColors.length];

                        const subDate = s.submittedAt ? new Date(s.submittedAt) : null;

                        return (
                          <tr
                            key={s.id}
                            onClick={() => setSelectedSubId(s.id)}
                            style={{
                              borderBottom: '1px solid var(--color-surface-3)',
                              background: isSelected ? 'var(--color-surface-2)' : 'transparent',
                              cursor: 'pointer'
                            }}
                            className="hover:bg-slate-50 transition-colors"
                          >
                            <td style={{ padding: '1.2rem 1.5rem' }}>
                              <div className="flex items-center gap-4">
                                <div style={{ width: 44, height: 44, borderRadius: '12px', background: bg, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <IconComp size={22} strokeWidth={2.5} />
                                </div>
                                <div>
                                  <p style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-text)', marginBottom: '0.15rem' }}>{s.assignmentTitle}</p>
                                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }} className="truncate max-w-[220px]">{a.description || 'No description'}</p>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '1.2rem 1rem' }}>
                              <p style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-text)', marginBottom: '0.15rem' }}>{a.courseName.split(' ')[0]}</p>
                              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{a.courseName.substring(a.courseName.indexOf(' ') + 1) || a.courseName}</p>
                            </td>
                            <td style={{ padding: '1.2rem 1rem' }}>
                              {subDate ? (
                                <>
                                  <p style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-text)', marginBottom: '0.15rem' }}>{subDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{subDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p>
                                </>
                              ) : (
                                <p style={{ color: 'var(--color-text-muted)' }}>-</p>
                              )}
                            </td>
                            <td style={{ padding: '1.2rem 1rem' }}>
                              <span style={{
                                background: badgeBg,
                                color: badgeColor,
                                padding: '6px 14px',
                                borderRadius: '6px',
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                display: 'inline-block'
                              }}>
                                {statusText}
                              </span>
                            </td>
                            <td style={{ padding: '1.2rem 1rem', textAlign: 'center' }}>
                              {s.status === 'graded' && s.grade != null ? (
                                <div>
                                  <p style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-text)' }}>{s.grade} / {a.totalMarks}</p>
                                  <p style={{ fontSize: '0.85rem', color: pctColor, fontWeight: 700 }}>{pct}%</p>
                                </div>
                              ) : (
                                <div>
                                  <p style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-text)' }}>-</p>
                                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Not graded</p>
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '1.2rem 1.5rem', textAlign: 'right' }}>
                              <ChevronRight size={20} color="var(--color-text-muted)" />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination Footer */}
              {!isLoading && submissions.length > 0 && (
                <div style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Showing 1 to {submissions.length} of {submissions.length} submissions</span>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}><ChevronLeft size={16} /></button>
                    <button style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#EEF2FF', border: 'none', borderRadius: '6px', color: '#4F46E5', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>1</button>
                    <button style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>2</button>
                    <button style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}><ChevronRight size={16} /></button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Details Pane */}
          <div className="lg:col-span-1">
            {selectedSub && selectedAssignment ? (
              <div style={{ background: 'var(--color-surface)', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', padding: '1.5rem', border: '1px solid var(--color-border)', position: 'sticky', top: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text)', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>Submission Details</h3>

                {/* Header Info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-text)' }}>{selectedAssignment.title}</h4>
                  {(() => {
                    const ds = getSubmissionDisplayStatus(selectedSub.status, selectedSub.submittedAt, selectedAssignment.dueDate);
                    const { bg, color } = SUBMISSION_DISPLAY_STATUS_COLORS[ds];
                    return <span style={{ background: bg, color, padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>{ds}</span>;
                  })()}
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>{selectedAssignment.courseName}</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>Due: {new Date(selectedAssignment.dueDate).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>

                {/* Dates & ID Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <Calendar size={18} color="var(--color-text-muted)" style={{ marginTop: '2px' }} />
                    <div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Submitted On</p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--color-text)', fontWeight: 600 }}>
                        {selectedSub.submittedAt ? new Date(selectedSub.submittedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '-'}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <FileText size={18} color="var(--color-text-muted)" style={{ marginTop: '2px' }} />
                    <div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Submission ID</p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--color-text)', fontWeight: 600 }}>{selectedSub.id.substring(0, 15)}...</p>
                    </div>
                  </div>
                </div>

                {/* Submitted File Card */}
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: '0.75rem' }}>Submitted File</h4>
                <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ color: '#EF4444' }}><FileIcon size={24} fill="#FCA5A5" strokeWidth={1.5} /></div>
                    <div>
                      <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text)' }}>{selectedSub.fileName || 'submission_file.pdf'}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>1.24 MB</p>
                    </div>
                  </div>
                  <button 
                    onClick={async () => {
                      const fileName = selectedSub.fileName || 'submission_file.pdf';
                      const downloadFallback = () => {
                        const content = selectedSub.textContent 
                          ? `Submission Content:\n\n${selectedSub.textContent}\n\n---\nStudent: ${selectedSub.studentName}\nAssignment: ${selectedSub.assignmentTitle}`
                          : `Submission Record:\nFileName: ${fileName}\nAssignment: ${selectedSub.assignmentTitle}\nStudent: ${selectedSub.studentName}\nStatus: ${selectedSub.status}`;
                        
                        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = fileName.includes('.') ? fileName : `${fileName}.txt`;
                        a.click();
                        URL.revokeObjectURL(url);
                      };

                      if (!selectedSub.fileUrl) {
                        downloadFallback();
                        return;
                      }

                      try {
                        const res = await fetch(selectedSub.fileUrl);
                        if (res.ok) {
                          const blob = await res.blob();
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = fileName;
                          a.click();
                          URL.revokeObjectURL(url);
                        } else {
                          // Storage bucket not found or dead link -> fallback to downloading submission text
                          downloadFallback();
                        }
                      } catch {
                        downloadFallback();
                      }
                    }}
                    title="Download File"
                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '6px', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-text-secondary)' }} 
                    className="hover:bg-gray-50 active:scale-95 transition-transform"
                  >
                    <Download size={18} />
                  </button>
                </div>

                {/* Marks & Feedback */}
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: '0.75rem' }}>Marks & Feedback</h4>

                {selectedSub.status === 'graded' && selectedSub.grade != null ? (
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                    {/* Big Score Box */}
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', padding: '1.25rem', minWidth: '130px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '0.25rem' }}>
                        <span style={{ fontSize: '2rem', fontWeight: 800, color: '#059669', lineHeight: 1 }}>{selectedSub.grade}</span>
                        <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>/ {selectedAssignment.totalMarks}</span>
                      </div>
                      <p style={{ fontSize: '1rem', fontWeight: 800, color: '#059669', marginTop: '0.5rem', marginBottom: '0.75rem' }}>
                        {((selectedSub.grade / selectedAssignment.totalMarks) * 100).toFixed(2)}%
                      </p>
                      <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#059669' }}>Excellent Work! 🎉</p>
                    </div>

                    {/* Mocked Rubric */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--color-text-secondary)' }}>Content Quality</span>
                        <span style={{ fontWeight: 700, color: '#10B981' }}>{Math.ceil(selectedAssignment.totalMarks * 0.3)} / {Math.ceil(selectedAssignment.totalMarks * 0.3)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--color-text-secondary)' }}>Design & Implementation</span>
                        <span style={{ fontWeight: 700, color: '#10B981' }}>{Math.ceil(selectedAssignment.totalMarks * 0.3)} / {Math.ceil(selectedAssignment.totalMarks * 0.3)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--color-text-secondary)' }}>Documentation</span>
                        <span style={{ fontWeight: 700, color: '#10B981' }}>{Math.ceil(selectedAssignment.totalMarks * 0.2)} / {Math.ceil(selectedAssignment.totalMarks * 0.2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--color-text-secondary)' }}>Presentation</span>
                        <span style={{ fontWeight: 700, color: '#10B981' }}>{Math.ceil(selectedAssignment.totalMarks * 0.2)} / {Math.ceil(selectedAssignment.totalMarks * 0.2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-text)', borderTop: '1px solid var(--color-border)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                        <span>Total</span>
                        <span>{selectedSub.grade} / {selectedAssignment.totalMarks}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ background: 'var(--color-surface-2)', borderRadius: '12px', padding: '1.5rem', textAlign: 'center', marginBottom: '2rem' }}>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Not graded yet.</p>
                  </div>
                )}

                {/* Instructor Feedback Box */}
                {selectedSub.status === 'graded' && (
                  <>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: '0.75rem' }}>Instructor Feedback</h4>
                    <div style={{ background: 'var(--color-success-subtle)', borderRadius: '8px', padding: '1.25rem', border: '1px solid var(--color-success-border)' }}>
                      <p style={{ fontSize: '0.85rem', color: 'var(--color-success-dark)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                        {selectedSub.feedback || "Great job! Your work is well-structured and normalization is correct. Keep up the good work!"}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--color-surface-3)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User size={20} color="var(--color-text-muted)" />
                          </div>
                          <div>
                            <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text)' }}>{selectedAssignment.teacherName}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Assistant Professor</p>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '0.1rem' }}>Graded On</p>
                          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                            {selectedSub.gradedAt ? new Date(selectedSub.gradedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* View Rubric Button */}
                <button 
                  onClick={() => setShowRubricModal(true)}
                  style={{ width: '100%', marginTop: '1.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: '0.75rem', borderRadius: '8px', fontWeight: 700, color: 'var(--color-text-secondary)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }} 
                  className="hover:bg-gray-50 active:scale-98 transition-transform"
                >
                  <Database size={16} /> View Rubric
                </button>
              </div>
            ) : (
              <div style={{ background: 'var(--color-surface)', borderRadius: '12px', padding: '3rem', border: '1px solid var(--color-border)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '400px' }}>
                <MessageSquare size={48} color="#D1D5DB" style={{ marginBottom: '1rem' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Select a Submission</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Click on any submission from the list to view its details and grading feedback.</p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Rubric Breakdown Modal */}
      {showRubricModal && selectedAssignment && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} className="animate-fade-in">
          <div style={{ background: 'var(--color-surface)', borderRadius: '16px', maxWidth: '650px', width: '100%', padding: '2rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text)' }}>Grading Rubric Breakdown</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>{selectedAssignment.title} • Max Marks: {selectedAssignment.totalMarks}</p>
              </div>
              <button onClick={() => setShowRubricModal(false)} style={{ background: 'var(--color-surface-3)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-text-secondary)' }} className="hover:bg-gray-200">
                <X size={18} />
              </button>
            </div>

            {/* Rubric Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {[
                { title: 'Content Quality & Accuracy', weight: '30%', desc: 'Thoroughness, correctness of formulas, algorithms, and logic.', max: Math.ceil(selectedAssignment.totalMarks * 0.3) },
                { title: 'Design & Implementation', weight: '30%', desc: 'Clean architecture, code structure, visual appeal, and usability.', max: Math.ceil(selectedAssignment.totalMarks * 0.3) },
                { title: 'Documentation & Formatting', weight: '20%', desc: 'Clarity of documentation, inline comments, and instructions.', max: Math.ceil(selectedAssignment.totalMarks * 0.2) },
                { title: 'Presentation & Deliverables', weight: '20%', desc: 'Completeness of submitted files and adherence to guidelines.', max: Math.ceil(selectedAssignment.totalMarks * 0.2) }
              ].map((item, index) => {
                const score = selectedSub?.status === 'graded' && selectedSub.grade != null 
                  ? Math.round((selectedSub.grade / selectedAssignment.totalMarks) * item.max) 
                  : 0;

                return (
                  <div key={index} style={{ border: '1px solid var(--color-border)', borderRadius: '10px', padding: '1rem 1.25rem', background: 'var(--color-surface-2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <h4 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)' }}>{item.title} ({item.weight})</h4>
                      <span style={{ fontWeight: 800, fontSize: '0.9rem', color: selectedSub?.status === 'graded' ? '#059669' : 'var(--color-text-muted)' }}>
                        {selectedSub?.status === 'graded' ? `${score} / ${item.max}` : `0 / ${item.max}`}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>{item.desc}</p>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem', marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Overall Score: </span>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: selectedSub?.status === 'graded' ? '#059669' : 'var(--color-text)' }}>
                  {selectedSub?.status === 'graded' && selectedSub.grade != null ? `${selectedSub.grade} / ${selectedAssignment.totalMarks}` : 'Not Graded Yet'}
                </span>
              </div>
              <button onClick={() => setShowRubricModal(false)} style={{ background: '#4F46E5', color: 'var(--color-surface)', border: 'none', borderRadius: '8px', padding: '0.6rem 1.25rem', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }} className="hover:bg-indigo-600">
                Close Rubric
              </button>
            </div>

          </div>
        </div>
      )}
    </RequireRole>
  );
}
