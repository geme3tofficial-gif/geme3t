"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signInLearner, type LearnerSignInState } from "./actions";

const initialState: LearnerSignInState = { message: null, error: null };

export function LearnerSignInForm({
  email,
  isConfigured,
}: {
  email: string;
  isConfigured: boolean;
}) {
  const [state, action, isPending] = useActionState(signInLearner, initialState);

  return (
    <form action={action} className="admin-sign-in-form">
      <label>
        Application email
        <input
          autoComplete="email"
          defaultValue={email}
          disabled={!isConfigured || isPending}
          name="email"
          required
          type="email"
        />
      </label>
      <label>
        Password
        <input
          autoComplete="current-password"
          disabled={!isConfigured || isPending}
          name="password"
          required
          type="password"
        />
      </label>
      {state.error && (
        <p className="admin-form-error" role="alert">
          {state.error}
        </p>
      )}
      {state.message && (
        <p className="admin-form-notice" role="status">
          {state.message}
        </p>
      )}
      <button
        className="button"
        disabled={!isConfigured || isPending}
        type="submit"
      >
        {isPending ? "Signing in…" : "Sign in"}
      </button>
      <p className="account-admin-link">
        <Link href={`/dashboard/reset-password${email ? `?email=${encodeURIComponent(email)}` : ""}`}>
          Forgot your password?
        </Link>
      </p>
      <p className="account-admin-link">
        First time here?{" "}
        <Link href={`/dashboard/setup-password${email ? `?email=${encodeURIComponent(email)}` : ""}`}>
          Set up your password
        </Link>
      </p>
    </form>
  );
}
