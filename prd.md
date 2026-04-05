Here's your complete, copy-paste ready prompt — tailored specifically for **Neon (PostgreSQL)** and **Vercel**:

---

## 📋 Full Prompt — Student Testing Platform

---

> **Build a full-stack Student Examination Web Application** using **Next.js 14 (App Router)**, deployed on **Vercel**, with **Neon (serverless PostgreSQL)** as the database.
>
> ---
>
> ### 🔐 Authentication
>
> - Two roles: **Student** and **Teacher/Admin**
> - Students log in using their **Admission Number (AdmNo)** as both their username and default password
> - Password is hashed using **bcryptjs** before storing
> - On first login, optionally prompt the student to set a new password
> - Teacher logs in with email + password
> - Use **NextAuth.js (credentials provider)** or **custom JWT** stored in HTTP-only cookies
> - Protect all routes — redirect unauthenticated users to `/login`
>
> ---
>
> ### 🗄️ Database — Neon (PostgreSQL via Prisma ORM)
>
> Use **Prisma** as the ORM connected to **Neon's serverless PostgreSQL**.
> Connection string goes in `.env` as `DATABASE_URL`.
>
> **Schema:**
>
> ```prisma
> model Student {
>   admno      String   @id
>   name       String
>   class      String
>   section    String
>   password   String
>   createdAt  DateTime @default(now())
>   results    Result[]
> }
>
> model Teacher {
>   id        String   @id @default(cuid())
>   name      String
>   email     String   @unique
>   password  String
>   tests     Test[]
> }
>
> model Test {
>   id          String     @id @default(cuid())
>   title       String
>   subject     String
>   class       String
>   section     String
>   duration    Int        // in minutes
>   startTime   DateTime?
>   endTime     DateTime?
>   isActive    Boolean    @default(false)
>   createdBy   String
>   teacher     Teacher    @relation(fields: [createdBy], references: [id])
>   questions   Question[]
>   results     Result[]
>   createdAt   DateTime   @default(now())
> }
>
> model Question {
>   id             String   @id @default(cuid())
>   testId         String
>   test           Test     @relation(fields: [testId], references: [id])
>   questionText   String
>   questionType   String   // "mcq" | "fill" | "truefalse" | "jumbled" | "match" | "short"
>   options        Json?    // for MCQ, match pairs, etc.
>   correctAnswer  String
>   marks          Int      @default(1)
>   order          Int
> }
>
> model Result {
>   id           String   @id @default(cuid())
>   admno        String
>   testId       String
>   student      Student  @relation(fields: [admno], references: [admno])
>   test         Test     @relation(fields: [testId], references: [id])
>   answers      Json     // { questionId: studentAnswer }
>   score        Int
>   totalMarks   Int
>   timeTaken    Int      // in seconds
>   submittedAt  DateTime @default(now())
> }
> ```
>
> Run `prisma migrate dev` locally, and `prisma migrate deploy` on Vercel build.
>
> ---
>
> ### 📝 Question Types — All Added by Teacher
>
> | Type | How It Works |
> |---|---|
> | **MCQ** | 4 options, teacher marks one correct |
> | **Fill in the Blank** | Sentence with `___`; student types answer |
> | **True / False** | Two buttons — True or False |
> | **Jumbled Word** | Teacher gives a word; app scrambles it; student rearranges tiles |
> | **Match the Following** | Two columns; student drags or selects to match |
> | **Short Answer** | Student types a paragraph/sentence; teacher reviews OR keyword auto-match |
>
> Store all question data in the `options` JSON field — for example:
> - MCQ: `{ "a": "Paris", "b": "London", "c": "Berlin", "d": "Rome" }`
> - Match: `{ "pairs": [["Capital of France", "Paris"], ["Capital of Germany", "Berlin"]] }`
> - Jumbled: `{ "word": "ELEPHANT" }` — app scrambles it on render
>
> ---
>
> ### 🧑‍🏫 Teacher / Admin Panel — Pages & Features
>
> **`/admin/dashboard`**
> - Overview cards: total students, total tests, recent submissions
> - Quick links to create test, view results
> - Bar/line charts: average scores per test, class performance (use **Recharts**)
>
> **`/admin/tests`**
> - List all tests with status (active/inactive), class, subject, date
> - Activate / deactivate toggle
> - Delete test
>
> **`/admin/tests/create`** and **`/admin/tests/[id]/edit`**
> - Form: test title, subject, class, section, duration, start/end time
> - After saving test, add questions one by one:
>   - Select question type from dropdown
>   - Dynamic form appears based on type
>   - Set marks per question
>   - Reorder questions via drag-and-drop
> - Preview test before publishing
>
> **`/admin/students`**
> - Table of all students (AdmNo, Name, Class, Section)
> - Add student individually
> - **Bulk upload via CSV** (fields: AdmNo, Name, Class, Section) — use `papaparse` to parse
> - Reset any student's password back to their AdmNo
> - Delete student
>
> **`/admin/results/[testId]`**
> - Table of all student submissions: name, AdmNo, score, time taken, submitted at
> - Click any student row to see their full answer sheet
> - Show correct vs wrong per question
> - Export results as **CSV** (use `json2csv` or manual CSV string generation)
> - Show class average, highest score, lowest score, pass/fail count
>
> **Notifications:**
> - When a student submits a test, store a notification in DB and show a badge/alert in teacher dashboard (use polling every 30s or Supabase Realtime — but since we're on Neon, use simple polling)
>
> ---
>
> ### 👨‍🎓 Student Panel — Pages & Features
>
> **`/student/dashboard`**
> - Welcome message with student name
> - List of **available tests** (active, within time window, not yet attempted)
> - List of **completed tests** with score summary
>
> **`/student/test/[id]`** — The Test Page
> - Show instructions screen before starting (title, subject, duration, number of questions)
> - "Start Test" button starts the countdown timer
> - Timer displayed prominently (turns red under 5 minutes)
> - **Auto-submit** when timer reaches 0
> - Each question rendered based on type:
>   - **MCQ** → Radio button options
>   - **Fill in the Blank** → Inline `<input>` inside the sentence
>   - **True/False** → Two large toggle buttons
>   - **Jumbled Word** → Draggable letter tiles (use `react-beautiful-dnd` or CSS drag)
>   - **Match the Following** → Dropdown selects on the right column to match left
>   - **Short Answer** → `<textarea>` with character counter
> - Side panel: question number grid — color coded (answered = green, skipped = orange, current = blue)
> - "Mark for Review" flag per question
> - Confirm dialog before final submit
> - Prevent tab switching — warn student if they leave the tab (use `visibilitychange` event)
>
> **`/student/results/[id]`** — Post-Test Result
> - Score card: X / Y marks, percentage, pass/fail
> - Time taken
> - Per-question breakdown:
>   - Show student's answer vs correct answer
>   - Green tick for correct, red cross for wrong
> - Short answers shown as "Pending review" until teacher grades
>
> **`/student/performance`** — Performance Dashboard
> - All past test results in a table (test name, date, score, percentage)
> - Line chart: score trend over time
> - Subject-wise average score (bar chart)
> - Rank in class (if teacher has enabled it for that test)
> - Motivational badge/message based on average score
>
> ---
>
> ### 🎨 UI / UX Design Requirements
>
> - **Mobile-first**, fully responsive (works on phones, tablets, desktops)
> - Use **Tailwind CSS** throughout
> - **Student theme**: soft white background, teal/cyan primary, rounded cards, friendly typography
> - **Teacher theme**: deep navy sidebar, amber/orange accents, data-dense tables
> - Use **`Geist`** or **`Plus Jakarta Sans`** as the font (import from Google Fonts)
> - Skeleton loaders while data is fetching
> - Toast notifications for success/error (use `react-hot-toast` or `sonner`)
> - Smooth page transitions
> - Empty states with illustrations when no data
>
> ---
>
> ### ⚙️ Full Tech Stack
>
> | Layer | Tool |
> |---|---|
> | Framework | Next.js 14 (App Router) |
> | Language | TypeScript |
> | Styling | Tailwind CSS |
> | Database | **Neon — Serverless PostgreSQL** |
> | ORM | **Prisma** |
> | Auth | NextAuth.js (Credentials Provider) |
> | Charts | Recharts |
> | CSV Upload | papaparse |
> | CSV Export | manual CSV string or json2csv |
> | Drag & Drop | react-beautiful-dnd |
> | Notifications | react-hot-toast or sonner |
> | Deployment | **Vercel** |
>
> ---
>
> ### 🌐 Environment Variables (set in Vercel dashboard)
>
> ```env
> DATABASE_URL=           # Neon connection string (pooled)
> DIRECT_URL=             # Neon direct connection string (for Prisma migrate)
> NEXTAUTH_SECRET=        # random secret string
> NEXTAUTH_URL=           # your Vercel deployment URL
> ```
>
> In `prisma/schema.prisma`, set:
> ```prisma
> datasource db {
>   provider  = "postgresql"
>   url       = env("DATABASE_URL")
>   directUrl = env("DIRECT_URL")
> }
> ```
>
> ---
>
> ### 📁 Suggested Folder Structure
>
> ```
> /app
>   /login
>   /student
>     /dashboard
>     /test/[id]
>     /results/[id]
>     /performance
>   /admin
>     /dashboard
>     /tests
>     /tests/create
>     /tests/[id]/edit
>     /students
>     /results/[testId]
> /components
>   /questions       ← one component per question type
>   /ui              ← shared buttons, cards, modals
>   /charts          ← recharts wrappers
> /lib
>   prisma.ts        ← Prisma client singleton
>   auth.ts          ← NextAuth config
>   utils.ts
> /prisma
>   schema.prisma
>   migrations/
> ```
>
> ---
>
> ### 🔨 Build Order (follow this sequence)
>
> 1. Set up Next.js 14 + Tailwind + TypeScript + Prisma + Neon connection
> 2. Define and migrate the full Prisma schema
> 3. Build authentication (NextAuth, login page, protected routes)
> 4. Build teacher: student management + CSV upload
> 5. Build teacher: test creation + question builder (all 6 types)
> 6. Build student: test-taking page with timer + all question type UIs
> 7. Build auto-grading logic + result storage on submit
> 8. Build teacher: results viewer + CSV export
> 9. Build student: results page + performance dashboard
> 10. Add charts, notifications, polish, and deploy to Vercel

---

### 🟢 Quick Notes Before You Use This Prompt

- **Neon setup**: Go to [neon.tech](https://neon.tech), create a free project, copy the **pooled connection string** as `DATABASE_URL` and the **direct connection string** as `DIRECT_URL` — both go into Vercel's environment variables.
- If the AI tool you're using has a **token/character limit**, break the prompt into 3 parts: ① Schema + Auth, ② Teacher Panel, ③ Student Panel + Performance.
- Ask the AI to **build and test one page at a time**, starting with login and the Prisma schema.