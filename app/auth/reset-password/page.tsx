import type { Metadata } from "next";
import Link from "next/link";
import { completeLearnerPasswordReset } from "@/app/(auth)/dashboard/sign-in/password-callback-actions";

export const metadata: Metadata = {
  title: "Verify student password link",
};

export default async function LearnerPasswordResetCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; error?: string }>;
}) {
  const query = await searchParams;

  return (
    <main className="admin-sign-in-page">
      <section className="admin-sign-in-card">
        <span className="eyebrow">Secure student account</span>
        <h1>Verify your email</h1>
        {query.code ? (
          <>
            <p>Continue to securely set or reset your student password.</p>
            <form action={completeLearnerPasswordReset}>
              <input name="code" type="hidden" value={query.code} />
              <button className="button" type="submit">
                Continue
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="admin-form-error" role="alert">
              This password link is invalid or expired. Request a new one.
            </p>
            <Link className="button" href="/dashboard/reset-password">
              Request a new password link
            </Link>
          </>
        )}
      </section>
    </main>
  );
}
