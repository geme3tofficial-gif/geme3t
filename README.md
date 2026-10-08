# GEME3T

GEME3T is a Next.js application using Supabase Auth and Prisma with Supabase
Postgres.

## Local setup

1. Create a Supabase project.
2. Copy `.env.example` to `.env` and fill in the project URL, publishable
   (or anon) key, pooled database URL, and direct database URL. Never commit
   `.env.local` or expose database credentials in browser code.
3. Install dependencies with `npm install`. The postinstall script generates the
   Prisma client.
4. Apply the checked-in schema and Auth trigger migrations to your development
   database with `npm run db:migrate`.
5. Start the app with `npm run dev`.

`DATABASE_URL` should use Supabase's transaction pooler for the application.
`DIRECT_URL` should use the direct database connection for Prisma migrations.
The schema defines profiles and roles, courses and scholarships, applications,
cohorts and teaching assignments, enrollments, modules and lessons, learner
progress, live sessions, and promotions. It intentionally has no seed script or
fabricated learner, teacher, course-progress, schedule, or campaign records.

Prisma is intended for server-side use only. Check Supabase Auth and the
`user_profiles.role` on the server before adding database reads or writes to
protected workspace routes. Row-level security is enabled on every application
table; no public Supabase Data API policies are created. The Auth trigger always
creates a `STUDENT` profile and ignores role values in user metadata.

The public scholarship application is saved to `scholarship_applications` by a
server action after the applicant accepts the terms. Submissions are unavailable
until Supabase is configured and the migrations have been applied; the form
reports that state rather than creating a local or email-only submission.
