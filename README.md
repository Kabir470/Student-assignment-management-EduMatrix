# EduMatrix —AI Powered Assignment & Submission Management System
# Project is live on [https://edumatrix.turtledevs.com](https://edumatrix.turtledevs.com)

EduMatrix is a full-stack, role-based Assignment & Submission Management System built for schools and colleges. It streamlines assignment creation, student submissions, grading, feedback, and analytics across three primary roles: **Admin**, **Teacher**, and **Student**.

---

## 📌 Table of Contents
- [Main Features](#-main-features)
- [Technology Stack](#-technology-stack)
- [Demo Credentials](#-demo-credentials)
- [Project Structure](#-project-structure)
- [Setup & Running Instructions](#-setup--running-instructions)
  - [Prerequisites](#1-prerequisites)
  - [Environment Variables](#2-environment-variables)
  - [Database Setup](#3-database-setup)
  - [Running Frontend & Backend (Docker Compose)](#4-running-frontend--backend-via-docker-compose)
  - [Running Manually](#5-running-manually)
- [Running Unit Tests](#-running-unit-tests)
- [Assumptions](#-assumptions)
- [Known Limitations](#-known-limitations)
- [Screenshots](#-screenshots)

---

## 🚀 Main Features

### 👑 Admin Portal
- **User Management**: Create, update, and remove Admin, Teacher, and Student accounts.
- **Course & Subject Management**: Create courses, assign subjects, and assign teachers to specific courses.
- **Analytics & System Summaries**: View high-level metrics, active assignments, total submissions, and platform statistics.

### 👩‍🏫 Teacher Portal
- **Assignment Builder**: Create, edit, publish, or save assignments as drafts with deadlines and maximum marks.
- **AI Assignment Generator**: AI assistant powered by Gemini API to generate comprehensive, structured assignments from natural language prompts.
- **Submission Grading & Feedback**: View student submissions, grade work against total marks, and provide custom feedback.

### 🎓 Student Portal
- **Class/Course Assignments**: View assignments specifically assigned to enrolled courses.
- **Submission Management**: Upload answer files and text responses before the deadline.
- **Grades & Feedback View**: Track submission status (Submitted, Late, Graded), view marks awarded, and read teacher feedback.

---

## 💻 Technology Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, TailwindCSS, Lucide Icons, Recharts.
- **Backend**: ASP.NET Core 9 Web API, C#, Entity Framework Core.
- **Database**: PostgreSQL (Dockerized).
- **Authentication**: Supabase Auth (JWT & Role-based claims).
- **AI Integration**: Google Generative AI (Gemini Flash API).
- **Testing**: xUnit, Moq, Microsoft.NET.Test.Sdk.
- **API Documentation**: Swagger / OpenAPI (`/swagger`).
- **Containerization**: Docker & Docker Compose.

---

## 🔑 Demo Credentials

| Role | Email | Password | Access / Notes |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@edumatrix.com` | `Admin@123456` | Full platform control |
| **Teacher** | `farhad@tc.com` | `123456` | Course & assignment management |
| **Student** | `sk@st.com` | `123456` | Submission & grade viewing |

*(Note: Public registration is disabled by default for security. The initial admin is provisioned directly via database insert SQL script provided in `Database-files/`).*

---

## 📂 Project Structure

```
Student Management System/
├── Database-files/               # SQL schema, migration & seed queries
│   ├── database-query.sql        # Full database tables and relationships
│   ├── add users query.sql       # Initial admin & user seed data
│   └── add users steps.md        # DB seeding walkthrough
├── Project-info/                 # Requirements & specification PDFs
├── projects picture/             # Application screenshots (Admin, Teacher, Student)
├── sms-backend/                  # ASP.NET Core Web API Backend
│   ├── src/
│   │   ├── EduMatrix.API/        # Web API controllers & middleware
│   │   ├── EduMatrix.Application/# Business logic, DTOs & services
│   │   ├── EduMatrix.Domain/     # Entities, Enums & Interfaces
│   │   └── EduMatrix.Infrastructure/ # EF Core DB Context & Repositories
│   ├── tests/
│   │   └── EduMatrix.Tests/      # xUnit automated unit test suite
│   ├── Dockerfile
│   └── EduMatrix.sln
├── sms-frontend/                 # Next.js Frontend Application
│   ├── app/                      # App router pages & layouts
│   ├── components/               # UI components (Admin, Teacher, Student, Layout)
│   ├── lib/                      # API services, Auth context, utilities
│   └── Dockerfile
├── Steps to build.md             # Quick start setup guide
├── docker-compose.yml            # Docker containerization orchestrator
└── README.md                     # Project documentation
```

---

## 🛠️ Setup & Running Instructions

### 1. Prerequisites
- **Docker Desktop** (v20+) AND/OR **Node.js (v18+)** & **.NET 9 SDK**.

### 2. Environment Variables
Ensure `.env` files exist in both `sms-backend` and `sms-frontend` folders:
- **`sms-backend/.env`**:
  ```env
  Database__ConnectionString=Host=postgres;Port=5432;Database=EduMatrixDb;Username=postgres;Password=postgres
  Supabase__Url=YOUR_SUPABASE_URL
  Supabase__Key=YOUR_SUPABASE_KEY
  ```
- **`sms-frontend/.env`**:
  ```env
  NEXT_PUBLIC_API_URL=http://localhost:8080/api
  NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_KEY
  GEMINI_API_KEY=YOUR_GEMINI_API_KEY
  ```

### 3. Database Setup
1. Execute `Database-files/database-query.sql` in your PostgreSQL database (or Supabase SQL Editor).
2. Execute `Database-files/add users query.sql` to seed the initial Admin, Teacher, and Student demo accounts.

### 4. Running Frontend & Backend (via Docker Compose)
From the root directory, run:
```bash
docker compose up --build
```
- **Frontend App**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: `http://localhost:8080`
- **Swagger API Docs**: [http://localhost:8080/swagger](http://localhost:8080/swagger)

### 5. Running Manually

#### Backend:
```bash
cd sms-backend
dotnet run --project src/EduMatrix.API/EduMatrix.API.csproj
```
*(Available at `http://localhost:5000` & Swagger at `http://localhost:5000/swagger`)*

#### Frontend:
```bash
cd sms-frontend
npm install
npm run dev
```
*(Available at `http://localhost:3000`)*

---

## 🧪 Running Unit Tests

Automated xUnit tests cover business rules (late submission flags, assignment publishing authorization, course ownership checks):

```bash
cd sms-backend
dotnet test
```

---

## 🧠 Assumptions

1. **User Provisioning**: For security in educational institutions, public registration is restricted. Administrators create and assign users to specific roles.
2. **Submission Deadlines**: Submissions attempted past the due date are flagged as **Late** if `allowLateSubmissions` is enabled on the assignment.
3. **File Attachments**: File attachments use mock/cloud storage URLs for demonstration purposes.

---

## ⚠️ Known Limitations

1. **AI Chat Storage**: AI assignment generation prompts are processed in-session. Persistence of historical chat logs across browser restarts is planned for a future release.
2. **Third-Party OAuth**: Social login options (Google/Microsoft) are hidden in UI until single-sign-on integration is configured.

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
