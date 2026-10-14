import type { Metadata } from "next";
import Link from "next/link";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { TeacherSignInForm } from "./teacher-sign-in-form";

export const metadata: Metadata = {
  title: "Teacher sign in",
};

export default async function TeacherSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [config, query] = await Promise.all([
    Promise.resolve(getSupabasePublicConfig()),
    searchParams,
  ]);

  return (
    <main className="admin-sign-in-page">
      <section className="admin-sign-in-card">
        <span className="eyebrow">GEME3T teaching workspace</span>
        <h1>Teacher sign in</h1>
        <p>Sign in with the email address and password for your teacher account.</p>
        {query.error === "teacher-required" && (
          <p className="admin-form-notice" role="status">
            Sign in with an account assigned the teacher role to continue.
          </p>
        )}
        {!config && (
          <p className="admin-form-error" role="alert">
            Supabase Auth is not configured. Please contact the academy.
          </p>
        )}
        <TeacherSignInForm isConfigured={Boolean(config)} />
        <p className="account-admin-link">
          Student? <Link href="/dashboard/sign-in">Sign in with your application email</Link>
        </p>
        <p className="account-admin-link">
          <Link href="/sign-in">Back to account options</Link>
        </p>
      </section>
    </main>
  );
}
