import type { Metadata } from "next";
import Link from "next/link";
import { completeLearnerSignIn } from "./actions";

export const metadata: Metadata = {
  title: "Confirm learner sign in",
};

export default async function LearnerAuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;

  return (
    <main className="admin-sign-in-page">
      <section className="admin-sign-in-card">
        <span className="eyebrow">Secure learner access</span>
        <h1>Confirm your sign in</h1>
        <p>
          Continue to securely connect your account with your GEME3T
          application.
        </p>
        {code ? (
          <form action={completeLearnerSignIn}>
            <input name="code" type="hidden" value={code} />
            <button className="button" type="submit">
              Continue to my dashboard
            </button>
          </form>
        ) : (
          <>
            <p className="admin-form-error" role="alert">
              This sign-in link is invalid or expired. Request a new one.
            </p>
            <Link className="button" href="/dashboard/sign-in">
              Request a new link
            </Link>
          </>
        )}
      </section>
    </main>
  );
}
