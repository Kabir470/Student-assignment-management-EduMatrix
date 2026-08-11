# Steps to Create Users in EduTrack (Supabase Auth)

Since the application uses Supabase Authentication, passwords are managed by Supabase, and profile data is stored in the public `users` table. Follow these steps to set up accounts.

---

## 1. Creating the First Admin Account (Manual Setup)

Because registration is disabled publicly for security, the initial Admin account must be created manually.

### Step A: Create User in Supabase Auth
1. Go to your **Supabase Dashboard** -> **Authentication** -> **Users**.
2. Click **Add User** -> **Create User**.
3. Enter the email and password:
   - **Email:** `admin@edumatrix.com`
   - **Password:** `Admin@123456`
4. Toggle on **Auto-confirm User** so they don't need to verify via email.
5. Click **Save**.
6. Copy the newly generated **User ID (UUID)** for this user (e.g., `12925412-18cf-40f2-8ded-e29a9502addd`).

### Step B: Sync Profile to Public Database
1. Go to your **Supabase Dashboard** -> **SQL Editor**.
2. Create a new query and run the following script (replace `<UUID_FROM_STEP_A>` with the copied User ID):
   ```sql
   INSERT INTO users (id, email, first_name, last_name, role, is_active)
   VALUES (
       '<UUID_FROM_STEP_A>', 
       'admin@edumatrix.com', 
       'System', 
       'Admin', 
       'admin', 
       true
   )
   ON CONFLICT (id) DO UPDATE 
   SET email = EXCLUDED.email;
   ```

Now you can log in as Admin at `http://localhost:3000/login`.

---

## 2. Creating Teachers and Students (Automated Setup)

Once the Admin account is created, you **do not** need to use the Supabase dashboard to add other users. You can do it directly from the application UI.

1. Log in to the application as the **Admin** (`admin@edumatrix.com`).
2. Go to the **Users** management page.
3. Click **Add New User**.
4. Fill in the user details:
   - Name, Email, Password, and **Role** (either `Teacher` or `Student`).
5. Click **Submit**.

### Behind the Scenes:
- The backend automatically contacts Supabase's Admin API using the secure `Service Role Key` to register their authentication credentials.
- It retrieves the generated Supabase User ID.
- It inserts their profile record into the public `users` table with that exact ID, ensuring everything is fully synchronized automatically.
