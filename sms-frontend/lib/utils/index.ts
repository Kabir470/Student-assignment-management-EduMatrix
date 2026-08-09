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
