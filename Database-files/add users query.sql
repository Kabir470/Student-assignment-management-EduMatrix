-- ============================================================
-- EduMatrix: Add Users Manual SQL Queries
-- ============================================================
-- Execute these queries in your Supabase SQL Editor to manually add users.
-- The password hash provided below corresponds to the password: Admin@123456
-- Make sure to change passwords via the application later if a change password feature is added.

-- 1. Add an Administrator
INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active)
VALUES (
    uuid_generate_v4(),
    'admin@edumatrix.com',
    '$2a$11$NmOi5aeQsmil1g1QSEV25.naDY3PiT8bajE9ostqVHlxHjviN54Wy', -- Admin@123456
    'System',
    'Admin',
    'admin',
    TRUE
) ON CONFLICT (email) DO NOTHING;

/*
============================================================
 STEPS TO EXECUTE IN SUPABASE:
============================================================
 1. Go to your Supabase Project Dashboard (https://app.supabase.com)
 2. Click on the "SQL Editor" on the left navigation menu.
 3. Click "+ New query".
 4. Copy and paste the queries above into the editor.
 5. Click the "RUN" button (or press Cmd+Enter / Ctrl+Enter).
 6. The users will now be inserted into your database.
 7. You can now log into EduMatrix using 'admin@edumatrix.com' and password 'Admin@123456'.
*/
