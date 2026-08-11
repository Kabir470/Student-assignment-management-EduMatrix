-- ============================================================
-- EduMatrix Database Schema
-- Database: Supabase PostgreSQL
-- Project: EduMatrix — Assignment & Submission Management System
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Enums ──────────────────────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'student');
CREATE TYPE course_status AS ENUM ('active', 'inactive', 'archived');
CREATE TYPE assignment_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE submission_status AS ENUM ('pending', 'submitted', 'late', 'graded', 'returned');

-- ─── Users ───────────────────────────────────────────────────────────────────

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    role            user_role NOT NULL DEFAULT 'student',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    institutional_id VARCHAR(50) UNIQUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ─── Refresh Tokens ───────────────────────────────────────────────────────────

CREATE TABLE refresh_tokens (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token           VARCHAR(500) NOT NULL UNIQUE,
    expires_at      TIMESTAMPTZ NOT NULL,
    is_revoked      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);

-- ─── Courses ─────────────────────────────────────────────────────────────────

CREATE TABLE courses (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title           VARCHAR(255) NOT NULL,
    code            VARCHAR(20) NOT NULL UNIQUE,
    description     TEXT,
    teacher_id      UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status          course_status NOT NULL DEFAULT 'active',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_courses_teacher_id ON courses(teacher_id);
CREATE INDEX idx_courses_code ON courses(code);

-- ─── Course Enrollments (Student ↔ Course) ────────────────────────────────────

CREATE TABLE course_enrollments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id       UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    student_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    enrolled_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(course_id, student_id)
);

CREATE INDEX idx_enrollments_course_id ON course_enrollments(course_id);
CREATE INDEX idx_enrollments_student_id ON course_enrollments(student_id);

-- ─── Assignments ──────────────────────────────────────────────────────────────

CREATE TABLE assignments (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title               VARCHAR(255) NOT NULL,
    description         TEXT NOT NULL,
    course_id           UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    teacher_id          UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status              assignment_status NOT NULL DEFAULT 'draft',
    due_date            TIMESTAMPTZ NOT NULL,
    total_marks         INTEGER NOT NULL DEFAULT 100 CHECK (total_marks > 0 AND total_marks <= 1000),
    allowed_file_types  VARCHAR(200),   -- comma-separated: "pdf,docx,zip"
    max_file_size_mb    INTEGER,
    attachment_url      VARCHAR(500),
    allow_late_submissions BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_assignments_course_id ON assignments(course_id);
CREATE INDEX idx_assignments_teacher_id ON assignments(teacher_id);
CREATE INDEX idx_assignments_status ON assignments(status);
CREATE INDEX idx_assignments_due_date ON assignments(due_date);

-- ─── Submissions ──────────────────────────────────────────────────────────────

CREATE TABLE submissions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id   UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status          submission_status NOT NULL DEFAULT 'submitted',
    submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    text_content    TEXT,
    file_url        VARCHAR(500),
    file_name       VARCHAR(255),
    links           TEXT,               -- JSON array stored as text: ["https://..."]
    grade           NUMERIC(6,2),
    feedback        TEXT,
    graded_at       TIMESTAMPTZ,
    graded_by_id    UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(assignment_id, student_id)   -- one submission per student per assignment
);

CREATE INDEX idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX idx_submissions_student_id ON submissions(student_id);
CREATE INDEX idx_submissions_status ON submissions(status);

-- ─── Announcements ────────────────────────────────────────────────────────────

CREATE TABLE announcements (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title           VARCHAR(255) NOT NULL,
    content         TEXT NOT NULL,
    author_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_global       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_announcements_author_id ON announcements(author_id);

-- ─── Submission Comments ──────────────────────────────────────────────────────

CREATE TABLE submission_comments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id   UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    author_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    author_name     VARCHAR(200) NOT NULL,
    author_role     VARCHAR(50) NOT NULL,
    content         TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_submission_comments_submission_id ON submission_comments(submission_id);

-- ─── Course Discussions ───────────────────────────────────────────────────────

CREATE TABLE course_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE course_post_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES course_posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Assignment Discussions ───────────────────────────────────────────────────

CREATE TABLE assignment_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE assignment_post_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES assignment_posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Triggers: auto-update updated_at ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_courses_updated_at
    BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_assignments_updated_at
    BEFORE UPDATE ON assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_submissions_updated_at
    BEFORE UPDATE ON submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_announcements_updated_at
    BEFORE UPDATE ON announcements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_submission_comments_updated_at
    BEFORE UPDATE ON submission_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── Seed: Default Admin User ─────────────────────────────────────────────────
-- Password: Admin@123456  (BCrypt hash — change after first login!)
-- Hash generated with BCrypt cost factor 12

INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active)
VALUES (
    uuid_generate_v4(),
    'admin@edumatrix.com',
    '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'System',
    'Admin',
    'admin',
    TRUE
) ON CONFLICT (email) DO NOTHING;

-- ─── Useful Views ─────────────────────────────────────────────────────────────

-- Full assignment details with course + teacher info
CREATE OR REPLACE VIEW vw_assignment_details AS
SELECT
    a.id,
    a.title,
    a.description,
    a.status,
    a.due_date,
    a.total_marks,
    a.allowed_file_types,
    a.max_file_size_mb,
    a.attachment_url,
    a.created_at,
    a.updated_at,
    c.id AS course_id,
    c.title AS course_name,
    c.code AS course_code,
    u.id AS teacher_id,
    u.first_name || ' ' || u.last_name AS teacher_name,
    u.email AS teacher_email
FROM assignments a
JOIN courses c ON a.course_id = c.id
JOIN users u ON a.teacher_id = u.id;

-- Full submission details with student + assignment info
CREATE OR REPLACE VIEW vw_submission_details AS
SELECT
    s.id,
    s.status,
    s.submitted_at,
    s.text_content,
    s.file_url,
    s.file_name,
    s.links,
    s.grade,
    s.feedback,
    s.graded_at,
    s.created_at,
    s.updated_at,
    a.id AS assignment_id,
    a.title AS assignment_title,
    a.total_marks,
    a.due_date,
    c.id AS course_id,
    c.title AS course_name,
    st.id AS student_id,
    st.first_name || ' ' || st.last_name AS student_name,
    st.email AS student_email,
    gb.first_name || ' ' || gb.last_name AS graded_by_name,
    s.graded_by_id
FROM submissions s
JOIN assignments a ON s.assignment_id = a.id
JOIN courses c ON a.course_id = c.id
JOIN users st ON s.student_id = st.id
LEFT JOIN users gb ON s.graded_by_id = gb.id;
