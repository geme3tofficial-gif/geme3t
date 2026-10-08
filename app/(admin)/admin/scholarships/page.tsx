import type { Metadata } from "next";
import { ScholarshipStatus } from "@prisma/client";
import {
  removeScholarship,
  saveScholarship,
} from "@/app/(admin)/admin/actions";
import { requireAdmin } from "@/lib/admin-auth";
import { getPrismaClient } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Manage scholarships",
};

const notices: Record<string, string> = {
  "saved-scholarship": "Scholarship offer saved.",
  "removed-scholarship": "Offer deactivated and removed from the application form.",
  "duplicate-scholarship": "An offer with that name already exists.",
  "invalid-scholarship": "Check the scholarship details and try again.",
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
  const [scholarships, query] = await Promise.all([
    getPrismaClient().scholarship.findMany({
      orderBy: [{ status: "asc" }, { sponsor: "asc" }, { name: "asc" }],
    }),
    searchParams,
  ]);

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
