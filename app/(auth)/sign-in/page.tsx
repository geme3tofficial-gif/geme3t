import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function SignInPage() {
  return (
    <main className="admin-sign-in-page">
      <section className="account-sign-in-page">
        <span className="eyebrow">GEME3T Academy</span>
        <h1>Choose your sign-in</h1>
        <p>Choose the workspace for your account.</p>
        <div className="account-sign-in-options">
          <article className="account-sign-in-option">
            <span aria-hidden="true" className="feature-icon">♙</span>
            <h2>Student</h2>
            <p>Use the email address from your application. We’ll send you a secure sign-in link.</p>
            <Link className="button" href="/dashboard/sign-in">
              Student sign in
            </Link>
          </article>
          <article className="account-sign-in-option">
            <span aria-hidden="true" className="feature-icon">♧</span>
            <h2>Teacher</h2>
            <p>Sign in with the email and password provided for your teacher account.</p>
            <Link className="button" href="/teacher/sign-in">
              Teacher sign in
            </Link>
          </article>
        </div>
        <p className="account-admin-link">
          Administrator? <Link href="/admin/sign-in">Sign in to the admin workspace</Link>
        </p>
      </section>
    </main>
  );
}
