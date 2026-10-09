"use client";

import { useActionState } from "react";
import {
  requestLearnerSignIn,
  type LearnerSignInState,
} from "./actions";

const initialState: LearnerSignInState = { message: null, error: null };

export function LearnerSignInForm({
  email,
  isConfigured,
}: {
  email: string;
  isConfigured: boolean;
}) {
  const [state, action, isPending] = useActionState(
    requestLearnerSignIn,
    initialState,
  );

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
        {isPending ? "Sending link…" : "Email me a secure sign-in link"}
      </button>
    </form>
  );
}
