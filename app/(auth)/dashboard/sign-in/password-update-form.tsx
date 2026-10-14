"use client";

import { useActionState } from "react";
import {
  updateLearnerPassword,
  type PasswordUpdateState,
} from "./password-update-actions";

const initialState: PasswordUpdateState = { error: null };

export function LearnerPasswordUpdateForm() {
  const [state, action, isPending] = useActionState(
    updateLearnerPassword,
    initialState,
  );

  return (
    <form action={action} className="admin-sign-in-form">
      <label>
        New password
        <input
          autoComplete="new-password"
          disabled={isPending}
          minLength={12}
          name="password"
          required
          type="password"
        />
      </label>
      <label>
        Confirm new password
        <input
          autoComplete="new-password"
          disabled={isPending}
          minLength={12}
          name="confirmPassword"
          required
          type="password"
        />
      </label>
      {state.error && (
        <p className="admin-form-error" role="alert">
          {state.error}
        </p>
      )}
      <button className="button" disabled={isPending} type="submit">
        {isPending ? "Saving password…" : "Save new password"}
      </button>
    </form>
  );
}
