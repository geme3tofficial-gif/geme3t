import type { Metadata } from "next";
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
          We’ll email a secure sign-in link to the address you used for your
          application. Use it to complete your profile and access your learner
          space.
        </p>
        {query.error === "application-required" && (
          <p className="admin-form-notice" role="status">
            We couldn’t link this sign-in to an application. Request a link
            using the same email address you used to enroll.
          </p>
        )}
        {(query.error === "link-invalid" || query.error === "link-failed") && (
          <p className="admin-form-notice" role="status">
            That sign-in link could not be used. Request a fresh link with the
            email address from your application.
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
      </section>
    </main>
  );
}
