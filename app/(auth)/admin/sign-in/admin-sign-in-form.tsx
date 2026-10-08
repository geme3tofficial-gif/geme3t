"use client";

import { useActionState } from "react";
import { signInAdmin, type AdminSignInState } from "./actions";

const initialState: AdminSignInState = { error: null };

export function AdminSignInForm({
  isConfigured,
}: {
  isConfigured: boolean;
}) {
  const [state, action, isPending] = useActionState(signInAdmin, initialState);

  return (
    <form action={action} className="admin-sign-in-form">
      <label>
        Email address
        <input
          autoComplete="username"
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
      <button
        className="button"
        disabled={!isConfigured || isPending}
        type="submit"
      >
        {isPending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
