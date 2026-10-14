import type { Metadata } from "next";
import Link from "next/link";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { LearnerSignInForm } from "./learner-sign-in-form";

export const metadata: Metadata = {
  title: "Learner sign in",
};

export default async function LearnerSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; error?: string }>;
}) {
  const [config, query] = await Promise.all([
    Promise.resolve(getSupabasePublicConfig()),
    searchParams,
  ]);

  return (
    <main className="admin-sign-in-page">
      <section className="admin-sign-in-card">
        <span className="eyebrow">Your GEME3T learner space</span>
        <h1>Sign in to your dashboard</h1>
        <p>
          Sign in with the email address you used on your application and your
          student password.
        </p>
        {query.error === "application-required" && (
          <p className="admin-form-notice" role="status">
            We couldn’t link this sign-in to an application. Use the email
            address you used to enroll.
          </p>
        )}
        {(query.error === "link-invalid" || query.error === "link-failed") && (
          <p className="admin-form-notice" role="status">
            That sign-in link could not be used. Request a fresh password
            setup link or reset your password.
          </p>
        )}
        {!config && (
          <p className="admin-form-error" role="alert">
            Secure learner sign-in is not configured. Please contact the
            academy.
          </p>
        )}
        <LearnerSignInForm
          email={query.email ?? ""}
          isConfigured={Boolean(config)}
        />
        <p className="account-admin-link">
          Teacher? <Link href="/teacher/sign-in">Sign in to the teacher workspace</Link>
        </p>
        <p className="account-admin-link">
          <Link href="/sign-in">Back to account options</Link>
        </p>
      </section>
    </main>
  );
}
