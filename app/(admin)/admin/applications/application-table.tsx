"use client";

import { useMemo, useState } from "react";
import { Fragment } from "react";
import { zipSync, strToU8 } from "fflate";
import { toast } from "sonner";

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

function exportFields(application: ApplicationRow): [string, string][] {
  return [
    ["Application ID", application.id],
    ["Submitted", formatDate(application.submittedAt)],
    ["Status", readable(application.status)],
    ["First name", application.firstName],
    ["Last name", application.lastName],
    ["Email", application.email],
    ["Phone", application.phone],
    ["Gender", application.gender],
    ["Country", application.otherCountry || application.country],
    ["City / state", application.location],
    ["Employment status", application.employmentStatus],
    ["Education level", application.educationLevel],
    ["Support type", readable(application.supportType)],
    ["Scholarship interest", application.scholarshipInterest ? "Yes" : "No"],
    ["Scholarship", application.scholarshipName ?? "Not applicable"],
    ["Scholarship sponsor", application.scholarshipSponsor ?? "Not applicable"],
    ["Tuition discount", application.scholarshipPercent === null ? "Not specified" : `${application.scholarshipPercent}%`],
    ["Fixed award", application.scholarshipAmount ? `${application.scholarshipCurrency ?? ""} ${application.scholarshipAmount}`.trim() : "Not specified"],
    ["Course", application.courseName],
    ["Course category", application.courseCategory ?? "Not recorded"],
    ["Course duration", application.courseDurationWeeks ? `${application.courseDurationWeeks} weeks` : "Not recorded"],
    ["Learning mode", readable(application.learningMode)],
    ["Cohort", application.cohortName ?? "Not recorded"],
    ["Preferred start date", formatDate(application.preferredStartDate)],
    ["Tech experience", application.techExperience],
    ["Job placement support", application.jobPlacementSupport ? "Requested" : "Not requested"],
    ["Specialized focus", application.specializedFocus ?? "Not applicable"],
    ["Specialized goal", application.specializedGoal ?? "Not applicable"],
    ["Mentor support", application.mentorSupport ?? "Not applicable"],
    ["Terms accepted", formatDate(application.termsAcceptedAt)],
  ];
}

function xmlEscape(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
}

function excelColumn(index: number) {
  let column = "";
  for (let value = index + 1; value > 0; value = Math.floor((value - 1) / 26)) {
    column = String.fromCharCode(((value - 1) % 26) + 65) + column;
  }
  return column;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportFilename(extension: string) {
  return `geme3t-applications-${new Date().toISOString().slice(0, 10)}.${extension}`;
}

async function downloadExcel(applications: ApplicationRow[]) {
  const fields = applications.map(exportFields);
  const headers = fields[0]?.map(([label]) => label) ?? [];
  const rows = [
    headers,
    ...fields.map((application) => application.map(([, value]) => value)),
  ];
  const sheetRows = rows
    .map(
      (row, rowIndex) =>
        `<row r="${rowIndex + 1}">${row
          .map(
            (value, columnIndex) =>
              `<c r="${excelColumn(columnIndex)}${rowIndex + 1}" t="inlineStr"><is><t xml:space="preserve">${xmlEscape(value)}</t></is></c>`,
          )
          .join("")}</row>`,
    )
    .join("");
  const dimension = `A1:${excelColumn(Math.max(headers.length - 1, 0))}${rows.length}`;
  const workbook = zipSync({
    "[Content_Types].xml": strToU8(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
    ),
    "_rels/.rels": strToU8(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    ),
    "xl/workbook.xml": strToU8(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Applications" sheetId="1" r:id="rId1"/></sheets></workbook>',
    ),
    "xl/_rels/workbook.xml.rels": strToU8(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
    ),
    "xl/worksheets/sheet1.xml": strToU8(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="${dimension}"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="18"/><sheetData>${sheetRows}</sheetData></worksheet>`,
    ),
  });
  downloadBlob(
    new Blob([workbook], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    exportFilename("xlsx"),
  );
}

async function downloadDocx(applications: ApplicationRow[]) {
  const { Document, HeadingLevel, Packer, Paragraph, TextRun } = await import("docx");
  const children = [
    new Paragraph({
      text: "GEME3T Academy — Applicant Applications",
      heading: HeadingLevel.TITLE,
    }),
    new Paragraph(`${applications.length} applicant records · generated ${new Date().toLocaleDateString()}`),
  ];

  applications.forEach((application) => {
    children.push(
      new Paragraph({
        text: `${application.firstName} ${application.lastName}`,
        heading: HeadingLevel.HEADING_1,
      }),
    );
    for (const [label, value] of exportFields(application)) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${label}: `, bold: true }),
            new TextRun(value),
          ],
        }),
      );
    }
    children.push(new Paragraph(""));
  });

  const document = new Document({
    sections: [{ properties: {}, children }],
  });
  downloadBlob(
    await Packer.toBlob(document),
    exportFilename("docx"),
  );
}

async function downloadPdf(applications: ApplicationRow[]) {
  const { jsPDF } = await import("jspdf");
  const document = new jsPDF();
  const pageWidth = document.internal.pageSize.getWidth();
  const pageHeight = document.internal.pageSize.getHeight();
  const margin = 16;
  const lineHeight = 5;
  let y = 18;

  document.setFontSize(16);
  document.text("GEME3T Academy — Applicant Applications", margin, y);
  y += 8;
  document.setFontSize(9);
  document.text(
    `${applications.length} applicant records · generated ${new Date().toLocaleDateString()}`,
    margin,
    y,
  );
  y += 10;

  for (const application of applications) {
    const heading = `${application.firstName} ${application.lastName}`;
    if (y + 12 > pageHeight - margin) {
      document.addPage();
      y = margin;
    }
    document.setFontSize(12);
    document.setFont("helvetica", "bold");
    document.text(heading, margin, y);
    y += 7;
    document.setFontSize(9);
    document.setFont("helvetica", "normal");

    for (const [label, value] of exportFields(application)) {
      const lines = document.splitTextToSize(
        `${label}: ${value}`,
        pageWidth - margin * 2,
      ) as string[];
      if (y + lines.length * lineHeight > pageHeight - margin) {
        document.addPage();
        y = margin;
      }
      document.text(lines, margin, y);
      y += lines.length * lineHeight;
    }
    y += 5;
  }

  downloadBlob(
    document.output("blob"),
    exportFilename("pdf"),
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
  const [exporting, setExporting] = useState(false);

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

  async function handleExport(format: "docx" | "xlsx" | "pdf") {
    if (exporting || visibleApplications.length === 0) return;
    setExporting(true);
    try {
      if (format === "docx") await downloadDocx(visibleApplications);
      if (format === "xlsx") await downloadExcel(visibleApplications);
      if (format === "pdf") await downloadPdf(visibleApplications);
      toast.success(`Downloaded ${visibleApplications.length} applicant records.`);
    } catch (error) {
      console.error("Could not export applicant records.", error);
      toast.error("Could not create the download. Please try again.");
    } finally {
      setExporting(false);
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
      <div className="application-export-tools" aria-label="Download applicant list">
        <span>Download current results</span>
        <button
          className="button button--small button--light"
          disabled={exporting || visibleApplications.length === 0}
          onClick={() => void handleExport("docx")}
          type="button"
        >
          DOCX
        </button>
        <button
          className="button button--small button--light"
          disabled={exporting || visibleApplications.length === 0}
          onClick={() => void handleExport("xlsx")}
          type="button"
        >
          Excel
        </button>
        <button
          className="button button--small button--light"
          disabled={exporting || visibleApplications.length === 0}
          onClick={() => void handleExport("pdf")}
          type="button"
        >
          PDF
        </button>
        {exporting && <span className="application-export-status" role="status">Preparing download…</span>}
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
