import type { Metadata } from "next";
import { ScholarshipStatus } from "@prisma/client";
import {
  removeScholarship,
  saveOnboardingFieldSettings,
  saveScholarshipSettings,
  saveScholarship,
} from "@/app/(admin)/admin/actions";
import { requireAdmin } from "@/lib/admin-auth";
import { getPrismaClient } from "@/lib/prisma";
import {
  defaultOnboardingFieldSettings,
  onboardingAudiences,
  onboardingFieldDefinitions,
  isOnboardingAudience,
  isOnboardingFieldKey,
} from "@/lib/onboarding-fields";

export const metadata: Metadata = {
  title: "Manage scholarships",
};

const notices: Record<string, string> = {
  "saved-scholarship": "Scholarship offer saved.",
  "removed-scholarship": "Offer deactivated and removed from the application form.",
  "duplicate-scholarship": "An offer with that name already exists.",
  "invalid-scholarship": "Check the scholarship details and try again.",
  "scholarships-enabled": "Scholarship applications are now enabled.",
  "scholarships-disabled": "Scholarship questions are hidden from the application form.",
  "onboarding-fields-saved": "Onboarding fields updated. Applicants who skip a field will complete it before accessing the learning portal.",
};

function ScholarshipFields({
  scholarship,
}: {
  scholarship?: {
    id: string;
    name: string;
    sponsor: string | null;
    description: string | null;
    tuitionPercent: number | null;
    amount: string | null;
    currency: string;
    status: ScholarshipStatus;
  };
}) {
  return (
    <>
      {scholarship && (
        <input name="id" type="hidden" value={scholarship.id} />
      )}
      <label>
        Offer name
        <input
          defaultValue={scholarship?.name}
          maxLength={200}
          name="name"
          required
        />
      </label>
      <label>
        Sponsor
        <input
          defaultValue={scholarship?.sponsor ?? ""}
          maxLength={100}
          name="sponsor"
        />
      </label>
      <label>
        Tuition discount (% off)
        <input
          defaultValue={scholarship?.tuitionPercent ?? 50}
          max={100}
          min={0}
          name="tuitionPercent"
          required
          type="number"
        />
      </label>
      <label>
        Fixed award amount (optional)
        <input
          defaultValue={scholarship?.amount ?? ""}
          min={0}
          name="amount"
          step="0.01"
          type="number"
        />
      </label>
      <label>
        Currency
        <input
          defaultValue={scholarship?.currency ?? "NGN"}
          maxLength={3}
          minLength={3}
          name="currency"
          required
        />
      </label>
      <label>
        Offer status
        <select
          defaultValue={scholarship?.status ?? ScholarshipStatus.ACTIVE}
          name="status"
        >
          <option value={ScholarshipStatus.ACTIVE}>Active</option>
          <option value={ScholarshipStatus.INACTIVE}>Inactive</option>
        </select>
      </label>
      <label className="admin-form-wide">
        Description
        <textarea
          defaultValue={scholarship?.description ?? ""}
          maxLength={1000}
          name="description"
          rows={2}
        />
      </label>
      <div className="admin-form-actions">
        <button className="button button--small" type="submit">
          {scholarship ? "Save offer" : "Add offer"}
        </button>
      </div>
    </>
  );
}

export default async function AdminScholarshipsPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  await requireAdmin();
  const [scholarships, config, fieldRows, query] = await Promise.all([
    getPrismaClient().scholarship.findMany({
      orderBy: [{ status: "asc" }, { sponsor: "asc" }, { name: "asc" }],
    }),
    getPrismaClient().applicationConfig.findUnique({
      where: { id: 1 },
      select: { scholarshipsEnabled: true },
    }),
    getPrismaClient().onboardingFieldSetting.findMany(),
    searchParams,
  ]);
  const fieldSettings =
    fieldRows.length > 0
      ? fieldRows.flatMap(({ fieldKey, audiences }) =>
          isOnboardingFieldKey(fieldKey)
            ? [{ fieldKey, audiences: audiences.filter(isOnboardingAudience) }]
            : [],
        )
      : defaultOnboardingFieldSettings();

  return (
    <>
      <div className="dashboard-welcome">
        <div>
          <span className="eyebrow">Admin tools · tuition support</span>
          <h1>Scholarship offers</h1>
          <p>Create, update, and deactivate the offers applicants can choose from.</p>
        </div>
      </div>
      {query.notice && notices[query.notice] && (
        <p className="admin-notice" role="status">{notices[query.notice]}</p>
      )}
      <section className="dashboard-panel scholarship-switch-panel">
        <div>
          <h2>Scholarship applications</h2>
          <p>
            Turn this off to hide scholarship and sponsorship questions from
            onboarding. All existing offers remain saved.
          </p>
        </div>
        <form action={saveScholarshipSettings}>
          <label className="admin-toggle">
            <input
              defaultChecked={config?.scholarshipsEnabled ?? true}
              name="scholarshipsEnabled"
              type="checkbox"
            />
            <span>Accept scholarship applications</span>
          </label>
          <button className="button button--small" type="submit">
            Save setting
          </button>
        </form>
      </section>
      <section className="dashboard-panel admin-onboarding-settings">
        <div className="workspace-panel-heading">
          <div>
            <h2>Onboarding fields</h2>
            <p>
              Choose which extra questions appear for each enrollment type.
              Unselected questions are saved for profile completion before
              learning-portal access. Name, email, phone, course, and terms
              remain required for everyone.
            </p>
          </div>
        </div>
        <form action={saveOnboardingFieldSettings}>
          <div className="admin-onboarding-table">
            <div className="admin-onboarding-row admin-onboarding-row--header">
              <span>Field</span>
              {onboardingAudiences.map((audience) => (
                <span key={audience.value}>{audience.label}</span>
              ))}
            </div>
            {onboardingFieldDefinitions.map((field) => {
              const setting = fieldSettings.find(
                (candidate) => candidate.fieldKey === field.key,
              );
              return (
                <div className="admin-onboarding-row" key={field.key}>
                  <span>{field.label}</span>
                  {onboardingAudiences.map((audience) => {
                    const alwaysRequired =
                      field.key === "startDate" &&
                      audience.value === "SCHOLARSHIP";
                    const enabled =
                      alwaysRequired ||
                      setting?.audiences.includes(audience.value) === true;
                    return (
                      <label
                        className="admin-onboarding-checkbox"
                        key={audience.value}
                      >
                        <input
                          defaultChecked={enabled}
                          disabled={alwaysRequired}
                          name={field.key}
                          type="checkbox"
                          value={audience.value}
                        />
                        <span className="application-visually-hidden">
                          {field.label} for {audience.label}
                          {alwaysRequired ? " (always required)" : ""}
                        </span>
                        {alwaysRequired && <small>Required</small>}
                      </label>
                    );
                  })}
                </div>
              );
            })}
          </div>
          <div className="admin-form-actions">
            <button className="button button--small" type="submit">
              Save onboarding fields
            </button>
          </div>
        </form>
      </section>
      <section className="dashboard-panel admin-editor-panel">
        <div className="workspace-panel-heading">
          <div>
            <h2>Add an offer</h2>
            <p>Set a percentage discount from 0% to 100%, or include a fixed award amount.</p>
          </div>
        </div>
        <form action={saveScholarship} className="admin-edit-form">
          <ScholarshipFields />
        </form>
      </section>
      <section className="admin-record-list" aria-label="Scholarship offers">
        {scholarships.map((scholarship) => (
          <article className="dashboard-panel admin-editor-panel" key={scholarship.id}>
            <div className="workspace-panel-heading">
              <div>
                <h2>{scholarship.name}</h2>
                <p>
                  {scholarship.sponsor ?? "No sponsor"} · {scholarship.tuitionPercent ?? 0}% off · {scholarship.status.toLowerCase()}
                </p>
              </div>
              <form action={removeScholarship}>
                <input name="id" type="hidden" value={scholarship.id} />
                <button
                  className="button button--small button--light"
                  disabled={scholarship.status === ScholarshipStatus.INACTIVE}
                  type="submit"
                >
                  Deactivate
                </button>
              </form>
            </div>
            <form action={saveScholarship} className="admin-edit-form">
              <ScholarshipFields
                scholarship={{
                  ...scholarship,
                  amount: scholarship.amount?.toString() ?? null,
                }}
              />
            </form>
          </article>
        ))}
      </section>
    </>
  );
}
