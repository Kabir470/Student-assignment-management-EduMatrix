# EduMatrix - Assignment Management System

EduMatrix is a comprehensive, full-stack Assignment Management System designed to streamline the workflow between administrators, teachers, and students. Built with a modern tech stack, it provides role-based access control, real-time analytics, and AI-powered tools to enhance the educational experience.

## 🚀 Features
- **Role-Based Access Control**: Distinct portals and permissions for Admins, Teachers, and Students.
- **AI-Powered Assignment Generation**: Teachers can draft comprehensive assignments conversationally using the Gemini AI API.
- **Course & User Management**: Admins can manage courses, assign teachers, and manage platform users securely.
- **Rich Analytics & Dashboards**: Visual dashboards with KPI metrics, charts (Recharts), and system summaries tailored to each role.
- **Dark Mode Support**: Full platform support for seamless toggling between light and dark themes.
- **Containerized Architecture**: Fully Dockerized backend, frontend, and database for reliable and reproducible deployments.

## 💻 Tech Stack
- **Frontend**: Next.js 14 (App Router), React, TypeScript, TailwindCSS, Lucide Icons, Recharts.
- **Backend**: ASP.NET Core 8 Web API, C#, Entity Framework Core.
- **Database**: PostgreSQL.
- **Authentication**: Supabase Auth (JWT).
- **AI Integration**: Google Generative AI (Gemini).

## 🔑 Demo Accounts
You can test the application using the following default demo credentials:

| Role    | Email | Password |
| -------- | ------- |------- |
| **Admin**  | `admin@edumatrix.com`    | `Admin@123456` |
| **Teacher** | `farhad@tc.com`     | `123456` |
| **Student**    | `sk@st.com`    | `123456` |

*(Note: Public registration is disabled by default; new users must be provisioned by an Admin).*

---

## 📸 Screenshots

### Admin Panel

#### Admin Dashboard
![Admin Dashboard](./projects%20picture/Admin/admin_dashboard.png)

#### User Management
![Admin User Management](./projects%20picture/Admin/admin_user_management.png)

#### Course Management
![Admin Course Management](./projects%20picture/Admin/admin_course_management.png)

#### Reports & Analytics
![Admin Reports](./projects%20picture/Admin/admin_report_and_analytics.png)

### Teacher Panel

#### Teacher Dashboard
![Teacher Dashboard](./projects%20picture/Teacher/teacher_dashboard.png)

#### Create Assignment
![Teacher Create Assignment](./projects%20picture/Teacher/teacher_create_assgn.png)

#### AI Assignment Chat Generation
![AI Generation Step 1](./projects%20picture/Teacher/teacher_ai_chat_1.png)
![AI Generation Step 2](./projects%20picture/Teacher/teacher_ai_chat_2.png)
![AI Generation Step 3](./projects%20picture/Teacher/teacher_ai_chat_3.png)
![AI Generation Step 4](./projects%20picture/Teacher/teacher_ai_chat-4.png)

### Student Panel

#### Student Dashboard
![Student Dashboard](./projects%20picture/Student/student_dashboard.png)

#### My Assignments
![Student My Assignments](./projects%20picture/Student/student_my_assignment.png)

#### Assignment Upload
![Student Assignment Upload](./projects%20picture/Student/Student_assgn_upload.png)

#### My Submissions
![Student My Submissions](./projects%20picture/Student/student_my_submisions.png)

---

## 🛠️ How to Build & Run
For detailed instructions on how to set up the environment variables and run this project via Docker Compose, please refer to the **[Steps to build.md](./Steps%20to%20build.md)** file included in the repository.
