import type { Metadata } from "next";
import Link from "next/link";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { LearnerPasswordLinkForm } from "../sign-in/password-link-form";

export const metadata: Metadata = {
  title: "Reset student password",
};

export default async function ResetLearnerPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const [config, query] = await Promise.all([
    Promise.resolve(getSupabasePublicConfig()),
    searchParams,
  ]);

  return (
    <main className="admin-sign-in-page">
      <section className="admin-sign-in-card">
        <span className="eyebrow">Student account</span>
        <h1>Reset your password</h1>
        <p>
          Enter the email address from your application. If there is a student
          account for it, we’ll email a secure password reset link.
        </p>
        {!config && (
          <p className="admin-form-error" role="alert">
            Student sign-in is not configured. Please contact the academy.
          </p>
        )}
        <LearnerPasswordLinkForm
          email={query.email ?? ""}
          isConfigured={Boolean(config)}
          mode="reset"
        />
        <p className="account-admin-link">
          First time here?{" "}
          <Link
            href={`/dashboard/setup-password${query.email ? `?email=${encodeURIComponent(query.email)}` : ""}`}
          >
            Set up your student password
          </Link>
        </p>
        <p className="account-admin-link">
          <Link href="/dashboard/sign-in">Back to student sign in</Link>
        </p>
      </section>
    </main>
  );
}
