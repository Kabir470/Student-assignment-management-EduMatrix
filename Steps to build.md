# EduMatrix — Assignment & Submission Management System

Welcome to EduMatrix! This project is a comprehensive student assignment and submission management system built with Next.js and Supabase.

## Setup Instructions

### 1. Prerequisites
- Node.js (v18+)
- A Supabase Project (for PostgreSQL database and Authentication)

### 2. Environment Variables
In the `sms-frontend` folder, create a `.env.local` file based on `.env.example` (or rename it) and populate it with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup (Fulfilling the Evaluator's Requirements)
To set up the database and schema without manually creating tables, follow these steps:
1. Go to your **Supabase Dashboard** -> **SQL Editor**.
2. Open the file `Database-files/database-query.sql` from this repository.
3. Paste its contents into the SQL Editor and click **Run**. This will automatically create all necessary tables, enums, and foreign keys.

### 4. Seeding Sample Data & Users
To set up the initial admin user and sample data, please refer to the detailed instructions in:
- `Database-files/add users steps.md`
- `Database-files/add users query.sql`

Once the initial admin is created, you can log in and create subsequent teachers and students directly from the application's Admin UI.

### 5. Running the Application

You can run this application easily using Docker or manually via Node.js/ASP.NET.

**Option A: Using Docker (Recommended)**
Ensure you have Docker and Docker Compose installed.
1. Make sure you have `.env` files in both the `sms-frontend` and `sms-backend` directories.
2. From the root directory, run:
   ```bash
   docker-compose up --build
   ```
3. The frontend will be available at [http://localhost:3000](http://localhost:3000) and the backend API at `http://localhost:8080`.
4. **Interactive Swagger API Documentation**: You can view and test all RESTful API endpoints interactively via Swagger UI at [http://localhost:8080/swagger](http://localhost:8080/swagger) (or `http://localhost:5000/swagger` when running backend locally via `dotnet run`).

**Option B: Running Manually (Frontend only)**
1. Navigate to the frontend directory: `cd sms-frontend`
2. Install dependencies: `npm install`
3. Run the development server: `npm run dev`
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Running Unit Tests
To run the automated backend unit tests covering business rules, authorization, and submission workflows:
```bash
cd sms-backend
dotnet test
```
