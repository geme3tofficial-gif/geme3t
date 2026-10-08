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

Administrators sign in at `/admin/sign-in`. Course and scholarship changes are
saved to Postgres; published courses and active scholarship offers feed the
public catalogue and application form. Submitted applications retain the
scholarship percentage and any fixed award amount selected at submission time.

The admin seed creates and confirms a Supabase Auth user only when the configured
email does not already exist. It does not change an existing user's password;
it promotes the matching database profile to `ADMIN`. Keep the Supabase secret
or service-role key and admin password in `.env` only.

The demo-user seed creates confirmed Auth accounts and matching teacher/student
profiles using `teacher.demo@geme3t.example.com` and
`student.demo@geme3t.example.com` by default. Override them with
`DUMMY_TEACHER_EMAIL` and `DUMMY_STUDENT_EMAIL` if needed. It does not create
applications, enrollments, or other fake activity; repeated runs preserve the
passwords for the managed demo users.

The public course catalogue and application choices load from the database.
Configure Supabase, apply the migrations, and run the seed before serving those
pages. Application submissions are saved to `scholarship_applications` by a
server action after the applicant accepts the terms; the action reports when
database submission is unavailable rather than creating a local or email-only
submission.
