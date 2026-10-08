"use client";

import { useMemo, useState } from "react";
import { Fragment } from "react";

export type ApplicationRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: string;
  country: string;
  otherCountry: string | null;
  location: string;
  employmentStatus: string;
  educationLevel: string;
  scholarshipInterest: boolean;
  supportType: string;
  specializedFocus: string | null;
  specializedGoal: string | null;
  mentorSupport: string | null;
  scholarshipName: string | null;
  scholarshipSponsor: string | null;
  scholarshipPercent: number | null;
  scholarshipAmount: string | null;
  scholarshipCurrency: string | null;
  courseName: string;
  courseCategory: string | null;
  courseDurationWeeks: number | null;
  learningMode: string;
  cohortName: string | null;
  preferredStartDate: string | null;
  techExperience: string;
  jobPlacementSupport: boolean;
  termsAcceptedAt: string;
  status: string;
  submittedAt: string;
};

type SortKey =
  | "submittedAt"
  | "firstName"
  | "status"
  | "scholarshipName"
  | "courseName"
  | "learningMode"
  | "cohortName";

const columns: { key: SortKey; label: string }[] = [
  { key: "submittedAt", label: "Submitted" },
  { key: "firstName", label: "Applicant" },
  { key: "status", label: "Status" },
  { key: "scholarshipName", label: "Scholarship" },
  { key: "courseName", label: "Course" },
  { key: "learningMode", label: "Learning mode" },
  { key: "cohortName", label: "Cohort" },
];

function formatDate(value: string | null) {
  if (!value) return "Not provided";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(value));
}

function readable(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) =>
    letter.toUpperCase(),
  );
}

export function ApplicationTable({
  applications,
}: {
  applications: ApplicationRow[];
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [scholarship, setScholarship] = useState("ALL");
  const [course, setCourse] = useState("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("submittedAt");
  const [descending, setDescending] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const statuses = useMemo(
    () => [...new Set(applications.map((application) => application.status))].sort(),
    [applications],
  );
  const scholarships = useMemo(
    () =>
      [...new Set(applications.map((application) => application.scholarshipName).filter((name): name is string => Boolean(name)))].sort(),
    [applications],
  );
  const courses = useMemo(
    () => [...new Set(applications.map((application) => application.courseName))].sort(),
    [applications],
  );

  const visibleApplications = useMemo(() => {
    const term = search.trim().toLowerCase();
    return applications
      .filter((application) => {
        if (status !== "ALL" && application.status !== status) return false;
        if (scholarship !== "ALL" && application.scholarshipName !== scholarship) return false;
        if (course !== "ALL" && application.courseName !== course) return false;
        return (
          !term ||
          Object.values(application).some((value) =>
            String(value ?? "").toLowerCase().includes(term),
          )
        );
      })
      .sort((left, right) => {
        const first = String(left[sortKey] ?? "").toLowerCase();
        const second = String(right[sortKey] ?? "").toLowerCase();
        const comparison = first.localeCompare(second);
        return descending ? -comparison : comparison;
      });
  }, [applications, course, descending, scholarship, search, sortKey, status]);

  function changeSort(key: SortKey) {
    if (sortKey === key) {
      setDescending((current) => !current);
    } else {
      setSortKey(key);
      setDescending(key === "submittedAt");
    }
  }

  return (
    <section className="dashboard-panel applications-panel">
      <div className="workspace-panel-heading">
        <div>
          <h2>Applications</h2>
          <p>Review applicant details and the choices submitted with each application.</p>
        </div>
        <span className="application-count">{visibleApplications.length} shown</span>
      </div>
      <div className="application-table-tools">
        <label className="application-search">
          <span>Search applications</span>
          <input
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Name, email, phone, location…"
            type="search"
            value={search}
          />
        </label>
        <label>
          Status
          <select onChange={(event) => setStatus(event.target.value)} value={status}>
            <option value="ALL">All statuses</option>
            {statuses.map((option) => (
              <option key={option} value={option}>{readable(option)}</option>
            ))}
          </select>
        </label>
        <label>
          Scholarship
          <select
            onChange={(event) => setScholarship(event.target.value)}
            value={scholarship}
          >
            <option value="ALL">All scholarships</option>
            {scholarships.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>
        <label>
          Course
          <select onChange={(event) => setCourse(event.target.value)} value={course}>
            <option value="ALL">All courses</option>
            {courses.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>
      </div>
      {visibleApplications.length === 0 ? (
        <p className="campaign-empty application-table-empty">
          {applications.length === 0
            ? "No applications have been submitted yet."
            : "No applications match these filters."}
        </p>
      ) : (
        <div className="application-table-scroll">
          <table className="application-table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.key} scope="col">
                    <button
                      aria-label={`Sort by ${column.label}`}
                      onClick={() => changeSort(column.key)}
                      type="button"
                    >
                      {column.label}
                      {sortKey === column.key && (
                        <span aria-hidden="true">{descending ? " ↓" : " ↑"}</span>
                      )}
                    </button>
                  </th>
                ))}
                <th scope="col">Details</th>
              </tr>
            </thead>
            <tbody>
              {visibleApplications.map((application) => (
                <Fragment key={application.id}>
                  <tr className="application-table-row" key={application.id}>
                    <td>{formatDate(application.submittedAt)}</td>
                    <td>
                      <strong>{application.firstName} {application.lastName}</strong>
                      <span className="application-cell-secondary">{application.email}</span>
                    </td>
                    <td>
                      <span className={`application-status application-status--${application.status.toLowerCase()}`}>
                        {readable(application.status)}
                      </span>
                    </td>
                    <td>
                      {application.scholarshipInterest
                        ? application.scholarshipName ?? "Offer name not recorded"
                        : application.supportType === "SPECIALIZED_MENTORSHIP"
                          ? "Specialized training & mentorship"
                          : "Self-funded"}
                      {application.specializedFocus && (
                        <span className="application-cell-secondary">
                          {application.specializedFocus}
                        </span>
                      )}
                      {application.scholarshipPercent !== null && (
                        <span className="application-cell-secondary">
                          {application.scholarshipPercent}% tuition discount
                          {application.scholarshipAmount &&
                            ` · ${application.scholarshipCurrency ?? ""} ${application.scholarshipAmount} award`}
                        </span>
                      )}
                    </td>
                    <td>
                      {application.courseName}
                      {application.courseCategory && (
                        <span className="application-cell-secondary">
                          {application.courseCategory}
                        </span>
                      )}
                    </td>
                    <td>{readable(application.learningMode)}</td>
                    <td>{application.cohortName ?? formatDate(application.preferredStartDate)}</td>
                    <td>
                      <button
                        aria-expanded={expandedId === application.id}
                        className="application-details-toggle"
                        onClick={() => setExpandedId(
                          expandedId === application.id ? null : application.id,
                        )}
                        type="button"
                      >
                        {expandedId === application.id ? "Hide" : "View"}
                      </button>
                    </td>
                  </tr>
                  {expandedId === application.id && (
                    <tr className="application-details-row" key={`${application.id}-details`}>
                      <td colSpan={8}>
                        <dl className="application-details-grid">
                          <div><dt>Phone</dt><dd>{application.phone}</dd></div>
                          <div><dt>Gender</dt><dd>{application.gender}</dd></div>
                          <div><dt>Country</dt><dd>{application.otherCountry || application.country}</dd></div>
                          <div><dt>City / state</dt><dd>{application.location}</dd></div>
                          <div><dt>Employment</dt><dd>{application.employmentStatus}</dd></div>
                          <div><dt>Education</dt><dd>{application.educationLevel}</dd></div>
                          <div><dt>Course duration</dt><dd>{application.courseDurationWeeks ? `${application.courseDurationWeeks} weeks` : "Not recorded"}</dd></div>
                          <div><dt>Selected cohort</dt><dd>{application.cohortName ?? formatDate(application.preferredStartDate)}</dd></div>
                          <div><dt>Tech experience</dt><dd>{application.techExperience}</dd></div>
                          <div><dt>Job placement support</dt><dd>{application.jobPlacementSupport ? "Requested" : "Not requested"}</dd></div>
                          <div><dt>Scholarship sponsor</dt><dd>{application.scholarshipSponsor ?? "Not applicable"}</dd></div>
                          <div><dt>Fixed award</dt><dd>{application.scholarshipAmount ? `${application.scholarshipCurrency ?? ""} ${application.scholarshipAmount}` : "Not specified"}</dd></div>
                          {application.specializedGoal && <div><dt>Specialized training goal</dt><dd>{application.specializedGoal}</dd></div>}
                          {application.mentorSupport && <div><dt>Mentor support requested</dt><dd>{application.mentorSupport}</dd></div>}
                          <div><dt>Terms accepted</dt><dd>{formatDate(application.termsAcceptedAt)}</dd></div>
                        </dl>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
