import type { AssignmentStatus, SubmissionStatus, CourseStatus, UserRole } from '@/lib/types';

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

// ─── Semantic badge helpers ───────────────────────────────────────────────────

const ASSIGNMENT_STATUS_MAP: Record<AssignmentStatus, { label: string; variant: BadgeVariant }> = {
  draft: { label: 'Draft', variant: 'neutral' },
  published: { label: 'Published', variant: 'success' },
  archived: { label: 'Archived', variant: 'warning' },
};

const SUBMISSION_STATUS_MAP: Record<SubmissionStatus, { label: string; variant: BadgeVariant }> = {
  pending: { label: 'Pending', variant: 'neutral' },
  submitted: { label: 'Submitted', variant: 'info' },
  late: { label: 'Late', variant: 'warning' },
  graded: { label: 'Graded', variant: 'success' },
  returned: { label: 'Returned', variant: 'purple' },
};

const COURSE_STATUS_MAP: Record<CourseStatus, { label: string; variant: BadgeVariant }> = {
  active: { label: 'Active', variant: 'success' },
  inactive: { label: 'Inactive', variant: 'neutral' },
  archived: { label: 'Archived', variant: 'warning' },
};

const ROLE_MAP: Record<UserRole, { label: string; variant: BadgeVariant }> = {
  admin: { label: 'Admin', variant: 'purple' },
  teacher: { label: 'Teacher', variant: 'info' },
  student: { label: 'Student', variant: 'success' },
};

export function AssignmentStatusBadge({ status }: { status: AssignmentStatus }) {
  const { label, variant } = ASSIGNMENT_STATUS_MAP[status];
  return <Badge variant={variant} dot>{label}</Badge>;
}

export function SubmissionStatusBadge({ status }: { status: SubmissionStatus }) {
  const { label, variant } = SUBMISSION_STATUS_MAP[status];
  return <Badge variant={variant} dot>{label}</Badge>;
}

export function CourseStatusBadge({ status }: { status: CourseStatus }) {
  const { label, variant } = COURSE_STATUS_MAP[status];
  return <Badge variant={variant} dot>{label}</Badge>;
}

export function RoleBadge({ role }: { role: UserRole }) {
  const { label, variant } = ROLE_MAP[role];
  return <Badge variant={variant}>{label}</Badge>;
}
