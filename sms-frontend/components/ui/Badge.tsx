import type { AssignmentStatus, SubmissionStatus, CourseStatus, UserRole } from '@/lib/types';
import {
  getAssignmentDisplayStatus,
  getSubmissionDisplayStatus,
  ASSIGNMENT_DISPLAY_STATUS_COLORS,
  SUBMISSION_DISPLAY_STATUS_COLORS,
} from '@/lib/utils';

type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'neutral';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
}

export function Badge({ children, variant = 'neutral', dot }: BadgeProps) {
  return (
    <span className={`badge badge-${variant}`}>
      {dot && (
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
      )}
      {children}
    </span>
  );
}

// ─── Inline Status Pill (used in new dashboard tables) ───────────────────────

export function StatusPill({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <span style={{ background: bg, color, padding: '4px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, display: 'inline-block' }}>
      {label}
    </span>
  );
}

// ─── Assignment Status Badge ─────────────────────────────────────────────────
// Shows the EFFECTIVE status: Draft / Active / Closed / Archived
// Requires both the DB status and the dueDate to derive the real state.

export function AssignmentStatusBadge({ status, dueDate }: { status: AssignmentStatus; dueDate?: string }) {
  // Fallback to legacy simple variant when dueDate not supplied (backwards compat)
  if (!dueDate) {
    const LEGACY: Record<AssignmentStatus, { label: string; variant: BadgeVariant }> = {
      draft:     { label: 'Draft',     variant: 'neutral'  },
      published: { label: 'Published', variant: 'success'  },
      archived:  { label: 'Archived',  variant: 'warning'  },
    };
    const { label, variant } = LEGACY[status];
    return <Badge variant={variant} dot>{label}</Badge>;
  }

  const display = getAssignmentDisplayStatus(status, dueDate);
  const { bg, color } = ASSIGNMENT_DISPLAY_STATUS_COLORS[display];
  return <StatusPill label={display} bg={bg} color={color} />;
}

// ─── Submission Status Badge ─────────────────────────────────────────────────
// Shows the EFFECTIVE status: Submitted / Late / Graded / Returned / Pending / Missed
// Requires submittedAt and dueDate to correctly determine Late vs Submitted.

export function SubmissionStatusBadge({
  status,
  submittedAt,
  dueDate,
}: {
  status: SubmissionStatus;
  submittedAt?: string | null;
  dueDate?: string;
}) {
  if (!dueDate) {
    // Fallback: legacy simple colour map
    const LEGACY: Record<SubmissionStatus, { label: string; variant: BadgeVariant }> = {
      pending:   { label: 'Pending',   variant: 'neutral' },
      submitted: { label: 'Submitted', variant: 'info'    },
      late:      { label: 'Late',      variant: 'warning' },
      graded:    { label: 'Graded',    variant: 'success' },
      returned:  { label: 'Returned',  variant: 'purple'  },
    };
    const { label, variant } = LEGACY[status];
    return <Badge variant={variant} dot>{label}</Badge>;
  }

  const display = getSubmissionDisplayStatus(status, submittedAt, dueDate);
  const { bg, color } = SUBMISSION_DISPLAY_STATUS_COLORS[display];
  return <StatusPill label={display} bg={bg} color={color} />;
}

// ─── Course / Role Badges ─────────────────────────────────────────────────────

const COURSE_STATUS_MAP: Record<CourseStatus, { label: string; variant: BadgeVariant }> = {
  active:   { label: 'Active',   variant: 'success' },
  inactive: { label: 'Inactive', variant: 'neutral' },
  archived: { label: 'Archived', variant: 'warning' },
};

const ROLE_MAP: Record<UserRole, { label: string; variant: BadgeVariant }> = {
  admin:   { label: 'Admin',   variant: 'purple' },
  teacher: { label: 'Teacher', variant: 'info'   },
  student: { label: 'Student', variant: 'success' },
};

export function CourseStatusBadge({ status }: { status: CourseStatus }) {
  const { label, variant } = COURSE_STATUS_MAP[status];
  return <Badge variant={variant} dot>{label}</Badge>;
}

export function RoleBadge({ role }: { role: UserRole }) {
  const { label, variant } = ROLE_MAP[role];
  return <Badge variant={variant}>{label}</Badge>;
}
