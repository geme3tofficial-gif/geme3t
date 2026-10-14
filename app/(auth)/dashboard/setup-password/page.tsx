import type { Metadata } from "next";
import Link from "next/link";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { LearnerPasswordLinkForm } from "../sign-in/password-link-form";

export const metadata: Metadata = {
  title: "Set up student password",
};

export default async function SetupLearnerPasswordPage({
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
        <h1>Set up your password</h1>
        <p>
          If you haven’t signed in before, enter the email address from your
          application. We’ll verify your email before you choose a password.
        </p>
        {!config && (
          <p className="admin-form-error" role="alert">
            Student sign-in is not configured. Please contact the academy.
          </p>
        )}
        <LearnerPasswordLinkForm
          email={query.email ?? ""}
          isConfigured={Boolean(config)}
          mode="setup"
        />
        <p className="account-admin-link">
          Already set a password?{" "}
          <Link
            href={`/dashboard/reset-password${query.email ? `?email=${encodeURIComponent(query.email)}` : ""}`}
          >
            Reset it
          </Link>
        </p>
        <p className="account-admin-link">
          <Link href="/dashboard/sign-in">Back to student sign in</Link>
        </p>
      </section>
    </main>
  );
}
