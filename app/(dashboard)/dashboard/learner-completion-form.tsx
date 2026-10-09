"use client";

import { useActionState, useState } from "react";
import {
  completeLearnerProfile,
  type CompletionState,
} from "./actions";
import type { OnboardingFieldKey } from "@/lib/onboarding-fields";

type CompletionField = {
  key: OnboardingFieldKey;
  label: string;
  prompt: string;
  kind: "choice" | "text" | "cohort";
  options?: readonly (string | { label: string; value: string })[];
};

type CohortOption = { id: string; label: string };

const initialState: CompletionState = { error: null, message: null };

export function LearnerCompletionForm({
  fields,
  initialValues,
  cohorts,
}: {
  fields: CompletionField[];
  initialValues: Partial<Record<OnboardingFieldKey, string>>;
  cohorts: CohortOption[];
}) {
  const [state, action, isPending] = useActionState(
    completeLearnerProfile,
    initialState,
  );
  const [values, setValues] = useState(initialValues);

  function setValue(key: OnboardingFieldKey, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  const visibleFields = fields.filter(
    (field) =>
      field.key !== "otherCountry" || values.country === "Other",
  );

  return (
    <form action={action} className="learner-completion-form">
      {visibleFields.map((field) => (
        <label className="learner-completion-field" key={field.key}>
          <span>{field.prompt}</span>
          {field.kind === "cohort" ? (
            <select
              name={field.key}
              onChange={(event) => setValue(field.key, event.target.value)}
              required
              value={values[field.key] ?? ""}
            >
              <option value="">Choose an open cohort</option>
              {cohorts.map((cohort) => (
                <option key={cohort.id} value={cohort.id}>
                  {cohort.label}
                </option>
              ))}
            </select>
          ) : field.kind === "choice" ? (
            <select
              name={field.key}
              onChange={(event) => setValue(field.key, event.target.value)}
              required={field.key !== "otherCountry"}
              value={values[field.key] ?? ""}
            >
              <option value="">Choose an option</option>
              {field.options?.map((option) => {
                const value = typeof option === "string" ? option : option.value;
                const label = typeof option === "string" ? option : option.label;
                return (
                  <option key={value} value={value}>
                    {label}
                  </option>
                );
              })}
            </select>
          ) : (
            <input
              autoComplete={field.key === "otherCountry" ? "country-name" : undefined}
              maxLength={1000}
              name={field.key}
              onChange={(event) => setValue(field.key, event.target.value)}
              required={field.key !== "otherCountry" || values.country === "Other"}
              value={values[field.key] ?? ""}
            />
          )}
        </label>
      ))}
      {visibleFields.some((field) => field.key === "startDate") &&
        cohorts.length === 0 && (
          <p className="admin-form-error" role="status">
            No open cohorts are available for this course yet. The learning
            portal will stay locked until the academy opens a cohort.
          </p>
        )}
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
      <button className="button button--small" disabled={isPending} type="submit">
        {isPending ? "Saving profile…" : "Save profile and continue"}
      </button>
    </form>
  );
}
