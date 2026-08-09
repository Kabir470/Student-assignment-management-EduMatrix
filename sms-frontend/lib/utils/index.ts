import { format, formatDistanceToNow, isAfter, isBefore, parseISO } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';

// ─── Class Names ──────────────────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

// ─── Date Helpers ─────────────────────────────────────────────────────────────

export function formatDate(date: string | Date, fmt = 'MMM d, yyyy'): string {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, fmt);
  } catch {
    return 'Invalid date';
  }
}

export function formatDateTime(date: string | Date): string {
  return formatDate(date, 'MMM d, yyyy h:mm a');
}

export function formatRelative(date: string | Date): string {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return 'Unknown time';
  }
}

export function isPastDue(dueDate: string): boolean {
  try {
    return isAfter(new Date(), parseISO(dueDate));
  } catch {
    return false;
  }
}

export function isDueSoon(dueDate: string, withinHours = 48): boolean {
  try {
    const due = parseISO(dueDate);
    const cutoff = new Date(Date.now() + withinHours * 60 * 60 * 1000);
    return isAfter(cutoff, due) && isBefore(new Date(), due);
  } catch {
    return false;
  }
}

export function getDueDateCountdown(dueDate: string): string {
  if (isPastDue(dueDate)) return 'Overdue';
  return `Due ${formatRelative(dueDate)}`;
}

// ─── String Helpers ───────────────────────────────────────────────────────────

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function getFullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`;
}

export function truncate(str: string, maxLength = 100): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}...`;
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// ─── Number Helpers ───────────────────────────────────────────────────────────

export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

export function formatGrade(grade: number, totalMarks: number): string {
  const pct = calculatePercentage(grade, totalMarks);
  return `${grade}/${totalMarks} (${pct}%)`;
}

export function getGradeColor(percentage: number): string {
  if (percentage >= 90) return 'emerald';
  if (percentage >= 75) return 'blue';
  if (percentage >= 60) return 'yellow';
  if (percentage >= 40) return 'orange';
  return 'red';
}

// ─── ID Generator (for mock data) ─────────────────────────────────────────────

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ─── File Helpers ─────────────────────────────────────────────────────────────

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() ?? '';
}

// ─── URL Helpers ─────────────────────────────────────────────────────────────

export function getDashboardPath(role: string): string {
  switch (role) {
    case 'admin': return '/admin';
    case 'teacher': return '/teacher';
    case 'student': return '/student';
    default: return '/login';
  }
}

// ─── Status Display Helpers ───────────────────────────────────────────────────
// Single source of truth for human-readable statuses used across all panels.

/**
 * Derives the effective display state of an assignment.
 * - draft     → "Draft" (saved, not yet published)
 * - published → "Active" (accepting submissions) OR "Closed" (past due, no more submissions)
 * - archived  → "Archived"
 */
export type AssignmentDisplayStatus = 'Draft' | 'Active' | 'Closed' | 'Archived';

export function getAssignmentDisplayStatus(status: string, dueDate: string): AssignmentDisplayStatus {
  if (status === 'draft') return 'Draft';
  if (status === 'archived') return 'Archived';
  // published
  if (isPastDue(dueDate)) return 'Closed';
  return 'Active';
}

export const ASSIGNMENT_DISPLAY_STATUS_COLORS: Record<AssignmentDisplayStatus, { bg: string; color: string }> = {
  Draft:    { bg: 'rgba(107,114,128,0.12)', color: '#6B7280' },
  Active:   { bg: 'rgba(16,185,129,0.12)',  color: '#059669' },
  Closed:   { bg: 'rgba(239,68,68,0.12)',   color: '#DC2626' },
  Archived: { bg: 'rgba(245,158,11,0.12)',  color: '#D97706' },
};

/**
 * Derives the display state of a submission.
 * - submitted + on time  → "Submitted"
 * - submitted + late     → "Late"
 * - graded               → "Graded"
 * - returned             → "Returned"
 * - no submission + overdue assignment → "Missed"
 * - no submission + active assignment  → "Pending"
 */
export type SubmissionDisplayStatus = 'Submitted' | 'Late' | 'Graded' | 'Returned' | 'Pending' | 'Missed';

export function getSubmissionDisplayStatus(
  submissionStatus: string | null | undefined,
  submittedAt: string | null | undefined,
  dueDate: string
): SubmissionDisplayStatus {
  if (!submissionStatus || submissionStatus === 'pending') {
    return isPastDue(dueDate) ? 'Missed' : 'Pending';
  }
  if (submissionStatus === 'graded') return 'Graded';
  if (submissionStatus === 'returned') return 'Returned';
  // submitted or late
  if (submittedAt && isPastDue(dueDate) && new Date(submittedAt) > new Date(dueDate)) return 'Late';
  if (submissionStatus === 'late') return 'Late';
  return 'Submitted';
}

export const SUBMISSION_DISPLAY_STATUS_COLORS: Record<SubmissionDisplayStatus, { bg: string; color: string }> = {
  Submitted: { bg: 'rgba(79,70,229,0.12)',   color: '#4F46E5' },
  Late:      { bg: 'rgba(239,68,68,0.12)',   color: '#DC2626' },
  Graded:    { bg: 'rgba(16,185,129,0.12)',  color: '#059669' },
  Returned:  { bg: 'rgba(139,92,246,0.12)',  color: '#7C3AED' },
  Pending:   { bg: 'rgba(245,158,11,0.12)',  color: '#D97706' },
  Missed:    { bg: 'rgba(239,68,68,0.12)',   color: '#DC2626' },
};
