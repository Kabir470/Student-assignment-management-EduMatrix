// ─── Enums ─────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'teacher' | 'student';

export type AssignmentStatus = 'draft' | 'published' | 'archived';

export type SubmissionStatus = 'pending' | 'submitted' | 'late' | 'graded' | 'returned';

export type CourseStatus = 'active' | 'inactive' | 'archived';

// ─── User ───────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  institutionalId?: string;
  avatarUrl?: string;
  enrolledCourseIds?: string[]; // for students
  teachingCourseIds?: string[]; // for teachers
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export type UserCreateInput = Omit<User, 'id' | 'createdAt' | 'updatedAt'> & {
  password: string;
  institutionalId?: string;
};

export type UserUpdateInput = Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'role'>>;

// ─── Course ─────────────────────────────────────────────────────────────────

export interface Course {
  id: string;
  title: string;
  code: string;
  description: string;
  teacherId: string;
  teacherName: string;
  studentIds: string[];
  status: CourseStatus;
  createdAt: string;
  updatedAt: string;
}

export type CourseCreateInput = Omit<Course, 'id' | 'createdAt' | 'updatedAt'>;
export type CourseUpdateInput = Partial<Omit<Course, 'id' | 'createdAt' | 'updatedAt'>>;

// ─── Assignment ─────────────────────────────────────────────────────────────

export interface Assignment {
  id: string;
  title: string;
  description: string;
  courseId: string;
  courseName: string;
  teacherId: string;
  teacherName: string;
  status: AssignmentStatus;
  dueDate: string;
  totalMarks: number;
  allowedFileTypes?: string[];
  maxFileSizeMb?: number;
  attachmentUrl?: string;
  allowLateSubmissions: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AssignmentCreateInput = Omit<Assignment, 'id' | 'createdAt' | 'updatedAt' | 'teacherId' | 'teacherName' | 'courseName'>;
export type AssignmentUpdateInput = Partial<Omit<Assignment, 'id' | 'createdAt' | 'updatedAt'>>;

// ─── Submission ──────────────────────────────────────────────────────────────

export interface Submission {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  courseId: string;
  courseName: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  status: SubmissionStatus;
  submittedAt?: string;
  textContent?: string;
  fileUrl?: string;
  fileName?: string;
  links?: string[];
  grade?: number;
  feedback?: string;
  gradedAt?: string;
  gradedById?: string;
  createdAt: string;
  updatedAt: string;
}

export type SubmissionCreateInput = Pick<Submission, 'assignmentId' | 'textContent' | 'links'> & {
  file?: File;
};

export type SubmissionGradeInput = {
  grade: number;
  feedback: string;
};

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatarUrl?: string;
  token: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

// ─── API Response Shapes ──────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  statusCode: number;
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export interface AdminStats {
  totalUsers: number;
  totalCourses: number;
  totalAssignments: number;
  pendingSubmissions: number;
  activeStudents: number;
  activeTeachers: number;
}

export interface TeacherStats {
  myAssignments: number;
  pendingReviews: number;
  gradedToday: number;
  totalStudents: number;
}

export interface StudentStats {
  totalAssignments: number;
  submitted: number;
  pending: number;
  graded: number;
  overdue: number;
  averageGrade: number;
}

// ─── Activity Feed ────────────────────────────────────────────────────────────

export interface ActivityItem {
  id: string;
  type: 'submission' | 'assignment' | 'grading' | 'user' | 'course';
  message: string;
  timestamp: string;
  userId?: string;
  userName?: string;
  entityId?: string;
}

// ─── Table / UI Helpers ───────────────────────────────────────────────────────

export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  render?: (value: unknown, row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

// ─── Announcement ─────────────────────────────────────────────────────────────

export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  isGlobal: boolean;
  createdAt: string;
}

// ─── Submission Comment ───────────────────────────────────────────────────────

export interface SubmissionComment {
  id: string;
  submissionId: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  content: string;
  createdAt: string;
}

// ─── Enrolled Student ─────────────────────────────────────────────────────────

export interface EnrolledStudent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
}

// ─── Assignment Post ──────────────────────────────────────────────────────────

export interface AssignmentPostComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  content: string;
  createdAt: string;
}

export interface AssignmentPost {
  id: string;
  assignmentId: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  content: string;
  createdAt: string;
  comments: AssignmentPostComment[];
}
