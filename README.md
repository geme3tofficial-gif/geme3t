# GEME3T

GEME3T is a Next.js application using Supabase Auth and Prisma with Supabase
Postgres.

## Local setup

1. Create a Supabase project.
2. Copy `.env.example` to `.env` and fill in the project URL, publishable
   key (or legacy anon key), pooled database URL, and direct database URL. Never commit
   `.env.local` or expose database credentials in browser code.
3. Install dependencies with `npm install`. The postinstall script generates the
   Prisma client.
4. Apply the checked-in schema and Auth trigger migrations to your development
   database with `npm run db:migrate`.
5. Populate the public course catalogue and current scholarship offers with
   `npm run db:seed`. The seed is repeatable and does not create fake applicants.
   Populate the published course module outlines with `npm run db:seed:curricula`;
   this only adds curricula to courses that do not already have modules.
6. Set `SUPABASE_SECRET_KEY` (or `SUPABASE_SERVICE_ROLE_KEY`) and `ADMIN_EMAIL`
   in `.env`. Set `ADMIN_PASSWORD` to a unique password of at least 12 characters
   only if creating a new Auth user, then run `npm run db:seed:admin`.
7. Optionally create demo teacher and student sign-ins with
   `npm run db:seed:demo-users`. It generates separate random passwords and
   prints each newly created account's password once; save them securely.
8. Start the app with `npm run dev`.

`DATABASE_URL` should use Supabase's transaction pooler for the application.
`DIRECT_URL` should use the direct database connection for Prisma migrations.
The schema defines profiles and roles, courses and scholarships, applications,
cohorts and teaching assignments, enrollments, modules and lessons, learner
progress, live sessions, and promotions. The seed data is in
`lib/catalog-data.json`; it initializes the current public courses and scholarship
offers without creating fabricated application records.

Prisma is intended for server-side use only. Check Supabase Auth and the
`user_profiles.role` on the server before adding database reads or writes to
protected workspace routes. Row-level security is enabled on every application
table; no public Supabase Data API policies are created. The Auth trigger always
creates a `STUDENT` profile and ignores role values in user metadata.

To grant an existing Supabase Auth account admin access, promote its matching
profile from the Supabase SQL editor:

```sql
UPDATE public.user_profiles
SET role = 'ADMIN'
WHERE email = 'admin@example.com';
```

To make an existing Auth account a teacher, promote its profile in the same
way:

```sql
UPDATE public.user_profiles
SET role = 'TEACHER'
WHERE email = 'teacher@example.com';
```

Administrators sign in at `/admin/sign-in`. Course and scholarship changes are
saved to Postgres; published courses and active scholarship offers feed the
public catalogue and application form. Submitted applications retain the
scholarship percentage and any fixed award amount selected at submission time.
Each applicant email can only be used for one application (case-insensitive);
the admissions page can download its current filtered results as DOCX, Excel
(.xlsx), or PDF.
Applicants select from the complete international country calling-code list;
phone numbers are validated and stored in E.164 format.
Course images selected from the admin form are validated and uploaded to a
public `course-images` Supabase Storage bucket using the server-only
`SUPABASE_SERVICE_ROLE_KEY`.
Courses can be enabled for Free Tech Bootcamp applications from their admin
editor. Course modules can be added, ordered, and assigned access groups:
Free Tech Bootcamp, paid learners, promo access, or all enrolled learners.
Modules with no access group selected remain locked. The application form only
offers bootcamp-enabled courses to applicants who choose the Free Tech Bootcamp
path.

The admin seed creates and confirms a Supabase Auth user only when the configured
email does not already exist. It does not change an existing user's password;
it promotes the matching database profile to `ADMIN`. Keep the Supabase secret
or service-role key and admin password in `.env` only.

The demo-user seed creates confirmed Auth accounts and matching teacher/student
profiles using `teacher.demo@geme3t.example.com` and
`student.demo@geme3t.example.com` by default. Override them with
`DUMMY_TEACHER_EMAIL` and `DUMMY_STUDENT_EMAIL` if needed. It generates random
passwords unless `DUMMY_TEACHER_PASSWORD` or `DUMMY_STUDENT_PASSWORD` is set;
configured passwords must be at least 12 characters and are never printed.
Existing managed demo users keep their passwords unless a password is explicitly
configured. To also create a clearly labeled, withdrawn test application for the
student account, set `DUMMY_STUDENT_APPLICATION=true`. The seed leaves existing
applications unchanged and creates no enrollments.

The public course catalogue and application choices load from the database.
Configure Supabase, apply the migrations, and run the seed before serving those
pages. Application submissions are saved to `scholarship_applications` by a
server action after the applicant accepts the terms; the action reports when
database submission is unavailable rather than creating a local or email-only
submission.

Teacher course access is managed in **Admin → Cohorts**. Choose teacher accounts
in the cohort form and save; those assignments grant access to edit and preview
the cohort's course. Teacher course lists, class lists, learner lists, and
upcoming sessions are read from `cohort_teaching_assignments`, `cohorts`,
`enrollments`, and `live_sessions`. Administrator learner and teacher listings
read `user_profiles` and their related enrollments or teaching assignments.
Create or promote teacher profiles before assigning them; the Auth trigger
creates new profiles with the `STUDENT` role by default.

Teachers can submit course proposals from **Teacher → Course content**, choosing
an existing published-course category or entering a new one. Proposals remain
private until an administrator approves them in **Admin → Courses**; approval
publishes the course in the shared catalogue but does not grant teaching access.
Administrators manage upcoming cohorts in **Admin → Cohorts**. Teachers see
future cohorts for published courses on their dashboard, including cohort dates,
assigned teachers, teacher-application counts, and scheduled sessions. A teacher
must apply to a cohort and receive administrator approval before they can edit
its course content. Applications are reviewed in **Admin → Cohorts**.

Administrators can configure optional onboarding fields by audience in
**Admin → Scholarships → Onboarding fields**. Applicants who skip a configured profile field receive a secure email sign-in
link after submitting; they must complete the deferred fields in `/dashboard`
before `/lms-redirect` opens the learner portal. Students sign in with their
application email and password at `/dashboard/sign-in`; first-time students can
set a password at `/dashboard/setup-password`, and returning students can reset
one at `/dashboard/reset-password`. Configure Supabase Auth's redirect URL
allow-list to include `/auth/callback` and `/auth/reset-password` on each
deployed site.
