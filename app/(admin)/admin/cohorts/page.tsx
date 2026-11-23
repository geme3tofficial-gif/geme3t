import type { Metadata } from "next";
import {
  CohortStatus,
  LearningMode,
  TeacherCohortApplicationStatus,
} from "@prisma/client";
import {
  reviewTeacherCohortApplication,
  saveCohort,
} from "@/app/(admin)/admin/actions";
import { CohortEditDialog } from "@/components/geme3t/cohort-edit-dialog";
import { requireAdmin } from "@/lib/admin-auth";
import { getPrismaClient } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Manage training cohorts",
};

const notices: Record<string, string> = {
  "saved-cohort": "Training cohort saved.",
  "duplicate-cohort": "That course already has a cohort with this name.",
  "invalid-course-selection": "Select an available course.",
  "invalid-cohort-name": "Enter a cohort name of 1 to 120 characters.",
  "invalid-cohort-start": "Enter a valid cohort start date and time.",
  "invalid-cohort-duration":
    "Enter a cohort duration of 1 to 100 weeks.",
  "invalid-cohort-seat-limit":
    "Leave the seat limit blank for unlimited seats, or enter a whole number from 1 to 100,000.",
  "invalid-cohort-format": "Choose Online, On-site, or Hybrid for the class format.",
  "invalid-cohort-whatsapp":
    "Enter a valid WhatsApp invite link from https://chat.whatsapp.com/ or leave it blank.",
  "invalid-cohort-status": "Choose a valid cohort status.",
  "invalid-cohort-id": "This cohort could not be found. Refresh the page and try again.",
  "invalid-teacher-assignment": "Choose valid teacher accounts and try again.",
  "invalid-teacher-application": "That teacher application could not be reviewed.",
  "teacher-application-already-reviewed":
    "That teacher application has already been reviewed.",
  "teacher-application-unavailable":
    "The cohort is no longer available for approval, or the application was already reviewed.",
  "teacher-application-approved":
    "Teacher application approved and course access granted.",
  "teacher-application-rejected": "Teacher application rejected.",
};

function dateTimeValue(value: Date | null) {
  return value?.toISOString().slice(0, 16) ?? "";
}

function CohortFields({
  cohort,
  courses,
  teachers,
  selectedTeacherIds = [],
}: {
  cohort?: {
    id: string;
    courseId: string;
    name: string;
    startsAt: Date;
    durationWeeks: number;
    seatLimit: number | null;
    status: CohortStatus;
    learningMode: LearningMode;
    whatsappGroupUrl: string | null;
  };
  courses: { id: string; title: string }[];
  teachers: { id: string; firstName: string; lastName: string; email: string | null }[];
  selectedTeacherIds?: string[];
}) {
  return (
    <>
      {cohort && <input name="id" type="hidden" value={cohort.id} />}
      <label>
        Course
        <select defaultValue={cohort?.courseId ?? ""} name="courseId" required>
          <option disabled value="">Choose a course</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>{course.title}</option>
          ))}
        </select>
      </label>
      <label>
        Cohort name
        <input defaultValue={cohort?.name} maxLength={120} name="name" required />
      </label>
      <label>
        Starts at (UTC)
        <input
          defaultValue={dateTimeValue(cohort?.startsAt ?? null)}
          name="startsAt"
          required
          type="datetime-local"
        />
      </label>
      <label>
        Duration (weeks)
        <input
          defaultValue={cohort?.durationWeeks ?? 12}
          max={100}
          min={1}
          name="durationWeeks"
          required
          type="number"
        />
      </label>
      <label>
        Seat limit (optional)
        <input
          defaultValue={cohort?.seatLimit ?? ""}
          max={100000}
          min={1}
          name="seatLimit"
          placeholder="Unlimited"
          type="number"
        />
      </label>
      <label>
        Class format
        <select
          defaultValue={cohort?.learningMode ?? LearningMode.ONLINE}
          name="learningMode"
          required
        >
          <option value={LearningMode.ONLINE}>Online</option>
          <option value={LearningMode.ONSITE}>On-site</option>
          <option value={LearningMode.HYBRID}>Hybrid</option>
        </select>
      </label>
      <label className="admin-form-wide">
        WhatsApp community group URL (optional)
        <input
          defaultValue={cohort?.whatsappGroupUrl ?? ""}
          maxLength={500}
          name="whatsappGroupUrl"
          placeholder="https://chat.whatsapp.com/..."
          type="url"
        />
      </label>
      <label>
        Cohort status
        <select defaultValue={cohort?.status ?? CohortStatus.PLANNED} name="status">
          <option value={CohortStatus.PLANNED}>Planned</option>
          <option value={CohortStatus.OPEN}>Open for applications</option>
          <option value={CohortStatus.IN_PROGRESS}>In progress</option>
          <option value={CohortStatus.COMPLETED}>Completed</option>
          <option value={CohortStatus.CANCELLED}>Cancelled</option>
        </select>
      </label>
      <p className="admin-schedule-hint admin-form-wide">
        Cohort end date is calculated from the start date and duration. A
        two-hour session is created for each week at the start date’s UTC
        weekday and time. Add or update individual sessions while the cohort is
        running. Set a seat limit to stop applications when full, or leave it
        blank for no limit.
      </p>
      <fieldset className="cohort-teacher-access admin-form-wide">
        <legend>Approve teachers to view and edit this course</legend>
        <p className="admin-schedule-hint">
          Selected teachers can edit this course’s modules and lessons. Save the
          cohort to apply access changes.
        </p>
        <div className="workspace-table-wrap">
          <table className="workspace-data-table cohort-teacher-table">
            <thead>
              <tr>
                <th scope="col">Approve</th>
                <th scope="col">Teacher</th>
                <th scope="col">Email</th>
                <th scope="col">Course access</th>
              </tr>
            </thead>
            <tbody>
              {teachers.length === 0 ? (
                <tr>
                  <td className="workspace-table-empty" colSpan={4}>
                    Create teacher accounts before granting course access.
                  </td>
                </tr>
              ) : (
                teachers.map((teacher) => {
                  const selected = selectedTeacherIds.includes(teacher.id);
                  return (
                    <tr key={teacher.id}>
                      <td>
                        <label className="workspace-table-checkbox">
                          <input
                            defaultChecked={selected}
                            name="teacherIds"
                            type="checkbox"
                            value={teacher.id}
                          />
                          <span className="visually-hidden">
                            Approve {teacher.firstName} {teacher.lastName}
                          </span>
                        </label>
                      </td>
                      <td>
                        <strong>{teacher.firstName} {teacher.lastName}</strong>
                      </td>
                      <td>{teacher.email ?? "—"}</td>
                      <td>
                        <span className={`workspace-status-pill${selected ? " is-approved" : ""}`}>
                          {selected ? "Approved" : "Not assigned"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </fieldset>
      <div className="admin-form-actions">
        <button className="button button--small" type="submit">
          {cohort ? "Save cohort and access" : "Add cohort and grant access"}
        </button>
      </div>
    </>
  );
}

export default async function AdminCohortsPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  await requireAdmin();
  const prisma = getPrismaClient();
  const [courses, cohorts, teachers, applications, query] = await Promise.all([
    prisma.course.findMany({
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    }),
    prisma.cohort.findMany({
      include: {
        course: { select: { title: true } },
        teachers: {
          include: {
            teacher: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
        _count: {
          select: {
            sessions: true,
            teacherApplications: {
              where: { status: TeacherCohortApplicationStatus.PENDING },
            },
            applications: {
              where: {
                status: { in: ["SUBMITTED", "UNDER_REVIEW", "ACCEPTED"] },
              },
            },
          },
        },
      },
      orderBy: [{ startsAt: "desc" }, { name: "asc" }],
    }),
    prisma.userProfile.findMany({
      where: { role: "TEACHER" },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: { id: true, firstName: true, lastName: true, email: true },
    }),
    prisma.teacherCohortApplication.findMany({
      where: { status: TeacherCohortApplicationStatus.PENDING },
      orderBy: { appliedAt: "asc" },
      select: {
        id: true,
        appliedAt: true,
        teacher: {
          select: { firstName: true, lastName: true, email: true },
        },
        cohort: {
          select: {
            name: true,
            startsAt: true,
            course: { select: { title: true } },
          },
        },
      },
    }),
    searchParams,
  ]);

  return (
    <>
      <div className="dashboard-welcome">
        <div>
          <span className="eyebrow">Admin tools · schedule</span>
          <h1>Training cohorts</h1>
          <p>Set course start and end dates, manage cohort status, and control the application start-date choices.</p>
        </div>
      </div>
      {query.notice && notices[query.notice] && (
        <p className="admin-notice" role="status">{notices[query.notice]}</p>
      )}
      {courses.length === 0 ? (
        <section className="dashboard-panel">
          <p className="campaign-empty">Add a course before creating a training cohort.</p>
        </section>
      ) : (
        <>
          <section className="dashboard-panel admin-editor-panel">
            <div className="workspace-panel-heading">
              <div>
                <h2>Add a cohort</h2>
                <p>
                  Set the cohort start and duration, create its weekly sessions, and
                  approve teachers who can manage the course.
                </p>
              </div>
            </div>
            <form action={saveCohort} className="admin-edit-form">
              <CohortFields courses={courses} teachers={teachers} />
            </form>
          </section>
          <section
            className="dashboard-panel courses-table-panel course-suggestions-panel"
            aria-label="Teacher cohort applications"
          >
            <div className="workspace-panel-heading">
              <div>
                <h2>Teacher applications</h2>
                <p>
                  Approving an application assigns the teacher to the cohort
                  and grants access to its published course.
                </p>
              </div>
              <span className="workspace-count">
                {applications.length} pending
              </span>
            </div>
            <div className="workspace-table-wrap">
              <table className="workspace-table course-suggestions-table">
                <thead>
                  <tr>
                    <th scope="col">Teacher</th>
                    <th scope="col">Cohort</th>
                    <th scope="col">Course</th>
                    <th scope="col">Applied</th>
                    <th scope="col"><span className="application-visually-hidden">Review actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {applications.length === 0 ? (
                    <tr>
                      <td className="courses-table-empty" colSpan={5}>
                        There are no teacher applications awaiting review.
                      </td>
                    </tr>
                  ) : (
                    applications.map((application) => {
                      const teacherName =
                        `${application.teacher.firstName} ${application.teacher.lastName}`.trim();
                      return (
                        <tr key={application.id}>
                          <td>
                            <strong>
                              {teacherName || application.teacher.email || "Teacher"}
                            </strong>
                            {teacherName && application.teacher.email && (
                              <span className="course-suggestion-meta">
                                {application.teacher.email}
                              </span>
                            )}
                          </td>
                          <td>
                            {application.cohort.name}
                            <span className="course-suggestion-meta">
                              {new Intl.DateTimeFormat("en", {
                                dateStyle: "medium",
                                timeZone: "UTC",
                              }).format(application.cohort.startsAt)}
                            </span>
                          </td>
                          <td>{application.cohort.course.title}</td>
                          <td>
                            {new Intl.DateTimeFormat("en", {
                              dateStyle: "medium",
                              timeZone: "UTC",
                            }).format(application.appliedAt)}
                          </td>
                          <td className="courses-table-actions">
                            <form action={reviewTeacherCohortApplication}>
                              <input name="id" type="hidden" value={application.id} />
                              <button
                                className="button button--small"
                                name="decision"
                                type="submit"
                                value="approve"
                              >
                                Approve
                              </button>
                              <button
                                className="course-suggestion-reject"
                                name="decision"
                                type="submit"
                                value="reject"
                              >
                                Reject
                              </button>
                            </form>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
          <section className="dashboard-panel admin-cohort-table-panel" aria-label="Training cohorts">
            <div className="workspace-panel-heading">
              <div>
                <h2>Scheduled cohorts</h2>
                <p>Review course dates, enrollment demand, and assigned teachers.</p>
              </div>
              <span className="workspace-count">{cohorts.length} cohorts</span>
            </div>
            {cohorts.length === 0 ? (
              <p className="campaign-empty">No cohorts have been scheduled yet.</p>
            ) : (
              <div className="workspace-table-wrap">
                <table className="workspace-data-table admin-cohort-table">
                  <thead>
                    <tr>
                      <th scope="col">Cohort</th>
                      <th scope="col">Course</th>
                      <th scope="col">Starts (UTC)</th>
                      <th scope="col">Duration</th>
                      <th scope="col">Status</th>
                      <th scope="col">Teachers</th>
                      <th scope="col">Teacher applicants</th>
                      <th scope="col">Applicants</th>
                      <th scope="col">Sessions</th>
                      <th scope="col">Capacity</th>
                      <th scope="col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cohorts.map((cohort) => (
                      <tr key={cohort.id}>
                        <th scope="row">{cohort.name}</th>
                        <td>{cohort.course.title}</td>
                        <td>
                          {new Intl.DateTimeFormat("en", {
                            dateStyle: "medium",
                            timeStyle: "short",
                            timeZone: "UTC",
                          }).format(cohort.startsAt)}
                        </td>
                        <td>{cohort.durationWeeks} weeks</td>
                        <td>
                          <span className={`workspace-status-pill is-${cohort.status.toLowerCase()}`}>
                            {cohort.status.replaceAll("_", " ").toLowerCase()}
                          </span>
                        </td>
                        <td>
                          {cohort.teachers.length === 0
                            ? <span className="cohort-unassigned">Unassigned</span>
                            : cohort.teachers
                                .map(
                                  ({ teacher }) =>
                                    `${teacher.firstName} ${teacher.lastName}`.trim(),
                                )
                                .join(", ")}
                        </td>
                        <td>{cohort._count.teacherApplications}</td>
                        <td>{cohort._count.applications}</td>
                        <td>{cohort._count.sessions}</td>
                        <td>
                          {cohort.seatLimit === null
                            ? "Unlimited"
                            : `${Math.max(0, cohort.seatLimit - cohort._count.applications)} / ${cohort.seatLimit} left`}
                        </td>
                        <td>
                          <CohortEditDialog cohortName={cohort.name}>
                            <form action={saveCohort} className="admin-edit-form">
                              <CohortFields
                                cohort={{
                                  id: cohort.id,
                                  courseId: cohort.courseId,
                                  name: cohort.name,
                                  startsAt: cohort.startsAt,
                                  durationWeeks: cohort.durationWeeks,
                                  seatLimit: cohort.seatLimit,
                                  status: cohort.status,
                                  learningMode: cohort.learningMode,
                                  whatsappGroupUrl: cohort.whatsappGroupUrl,
                                }}
                                courses={courses}
                                selectedTeacherIds={cohort.teachers.map(
                                  (assignment) => assignment.teacherId,
                                )}
                                teachers={teachers}
                              />
                            </form>
                          </CohortEditDialog>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}
