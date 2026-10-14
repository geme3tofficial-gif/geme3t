"use client";

import { useActionState } from "react";
import { requestLearnerPasswordReset, requestLearnerPasswordSetup } from "./actions";
import type { LearnerSignInState } from "./actions";

const initialState: LearnerSignInState = { message: null, error: null };

export function LearnerPasswordLinkForm({
  email,
  isConfigured,
  mode,
}: {
  email: string;
  isConfigured: boolean;
  mode: "reset" | "setup";
}) {
  const actionFunction =
    mode === "reset"
      ? requestLearnerPasswordReset
      : requestLearnerPasswordSetup;
  const [state, action, isPending] = useActionState(
    actionFunction,
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
        {isPending
          ? "Sending email…"
          : mode === "reset"
            ? "Send password reset link"
            : "Email me a secure setup link"}
      </button>
    </form>
  );
}
