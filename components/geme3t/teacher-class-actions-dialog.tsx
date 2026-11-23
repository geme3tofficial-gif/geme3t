"use client";

import { useId, useRef } from "react";
import {
  startTeacherClassSession,
  validateAttendance,
} from "@/app/(teacher)/teacher/actions";

type Learner = {
  id: string;
  name: string;
  email: string | null;
  whatsappNumber: string | null;
};

type Session = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  status: string;
  meetingUrl: string | null;
  location: string | null;
  attendance: {
    id: string;
    status: string;
    enrollmentId: string;
  }[];
};

type CourseModule = { id: string; title: string };

export function TeacherClassActionsDialog({
  cohortId,
  cohortName,
  courseId,
  courseTitle,
  learners,
  modules,
  sessions,
}: {
  cohortId: string;
  cohortName: string;
  courseId: string;
  courseTitle: string;
  learners: Learner[];
  modules: CourseModule[];
  sessions: Session[];
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const activeSession = sessions.find(
    (session) =>
      session.status === "SCHEDULED" &&
      new Date(session.startsAt) <= new Date() &&
      new Date(session.endsAt) > new Date(),
  );
  const upcomingSession = sessions
    .filter(
      (session) =>
        session.status === "SCHEDULED" &&
        new Date(session.startsAt) > new Date(),
    )
    .sort((left, right) => left.startsAt.localeCompare(right.startsAt))[0];
  const messagingSession = activeSession ?? upcomingSession;

  function whatsappLink(learner: Learner, session: Session | undefined) {
    if (!learner.whatsappNumber || !session) return null;
    const sessionTiming =
      session.status === "COMPLETED"
        ? "has ended"
        : activeSession
          ? "is in progress"
          : `is scheduled for ${new Intl.DateTimeFormat("en", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(new Date(session.startsAt))}`;
    const details = [
      `Hello ${learner.name || "there"},`,
      `Your ${courseTitle} class "${session.title}" ${sessionTiming}.`,
      session.meetingUrl ? `Join here: ${session.meetingUrl}` : null,
      session.location ? `Location: ${session.location}` : null,
    ].filter(Boolean);
    return `https://wa.me/${learner.whatsappNumber}?text=${encodeURIComponent(details.join("\n"))}`;
  }

  return (
    <>
      <button
        aria-haspopup="dialog"
        className="button button--small"
        onClick={() => dialogRef.current?.showModal()}
        type="button"
      >
        Class actions
      </button>
      <dialog
        aria-labelledby={titleId}
        className="cohort-edit-dialog teacher-class-actions-dialog"
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
        ref={dialogRef}
      >
        <div className="cohort-edit-dialog-panel">
          <header className="cohort-edit-dialog-header">
            <div>
              <span>{courseTitle}</span>
              <h2 id={titleId}>{cohortName}</h2>
            </div>
            <button
              aria-label="Close class actions"
              className="cohort-edit-dialog-close"
              onClick={() => dialogRef.current?.close()}
              type="button"
            >
              <span aria-hidden="true">×</span>
            </button>
          </header>
          <div className="cohort-edit-dialog-content teacher-class-actions-content">
            <section>
              <h3>Learners and WhatsApp messages</h3>
              <p>
                Choose a learner to open a pre-filled WhatsApp message. Review
                and send each message in WhatsApp; messages are not sent
                automatically.
              </p>
              {learners.length ? (
                <ul className="teacher-class-dialog-learners">
                  {learners.map((learner) => {
                    const href = whatsappLink(learner, messagingSession);
                    return (
                      <li key={learner.id}>
                        <div>
                          <strong>{learner.name || learner.email || "Learner"}</strong>
                          {learner.email && <span>{learner.email}</span>}
                        </div>
                        {href ? (
                          <a
                            className="button button--small button--light"
                            href={href}
                            rel="noreferrer"
                            target="_blank"
                          >
                            Message on WhatsApp
                          </a>
                        ) : (
                          <span className="workspace-status-pill">
                            {!learner.whatsappNumber
                              ? "No valid phone number"
                              : "No active or upcoming session"}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="campaign-empty">No active learners are enrolled.</p>
              )}
            </section>

            <section>
              <h3>Class session</h3>
              {activeSession ? (
                <div className="teacher-active-session">
                  <p>Session in progress: {activeSession.title}</p>
                  {activeSession.location && <span>Location: {activeSession.location}</span>}
                  {activeSession.meetingUrl && (
                    <a
                      className="text-link"
                      href={activeSession.meetingUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Open session link
                    </a>
                  )}
                  <p>
                    Share the session link with learners using the WhatsApp
                    actions above.
                  </p>
                </div>
              ) : (
                <form action={startTeacherClassSession} className="teacher-start-session-form">
                  <input name="cohortId" type="hidden" value={cohortId} />
                  <label>
                    Session title
                    <input
                      defaultValue={`${courseTitle} class session`}
                      maxLength={160}
                      name="title"
                      required
                    />
                  </label>
                  <label>
                    Module
                    <select defaultValue="" name="moduleId">
                      <option value="">No module</option>
                      {modules.map((courseModule) => (
                        <option key={courseModule.id} value={courseModule.id}>
                          {courseModule.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Duration
                    <select defaultValue="60" name="durationMinutes">
                      <option value="30">30 minutes</option>
                      <option value="60">1 hour</option>
                      <option value="90">1.5 hours</option>
                      <option value="120">2 hours</option>
                    </select>
                  </label>
                  <label>
                    Location (optional)
                    <input maxLength={200} name="location" />
                  </label>
                  <label>
                    Meeting URL (optional)
                    <input maxLength={500} name="meetingUrl" type="url" />
                  </label>
                  <button className="button button--small" type="submit">
                    Start class session
                  </button>
                </form>
              )}
            </section>

            <section>
              <h3>Validate attendance</h3>
              <p>
                Learners can submit attendance after a session ends. Confirm
                each pending submission here; approved attendance appears in
                the learner&apos;s course session list.
              </p>
              {sessions.filter((session) => session.status === "COMPLETED").length ? (
                <div className="teacher-class-attendance-sessions">
                  {sessions
                    .filter((session) => session.status === "COMPLETED")
                    .map((session) => (
                      <section key={session.id}>
                        <h4>{session.title}</h4>
                        {learners.map((learner) => {
                          const record = session.attendance.find(
                            (item) => item.enrollmentId === learner.id,
                          );
                          if (!record) {
                            return (
                              <div className="learner-session-row" key={learner.id}>
                                <span>{learner.name || learner.email || "Learner"}</span>
                                <span className="workspace-status-pill">Attendance not submitted</span>
                              </div>
                            );
                          }
                          return (
                            <div className="learner-session-row" key={record.id}>
                              <span>{learner.name || learner.email || "Learner"}</span>
                              {record.status === "PENDING" ? (
                                <div className="teacher-roll-call-actions">
                                  <form action={validateAttendance}>
                                    <input name="attendanceId" type="hidden" value={record.id} />
                                    <input name="decision" type="hidden" value="PRESENT" />
                                    <input name="returnTo" type="hidden" value="teacher-classes" />
                                    <button className="button button--small" type="submit">
                                      Validate present
                                    </button>
                                  </form>
                                  <form action={validateAttendance}>
                                    <input name="attendanceId" type="hidden" value={record.id} />
                                    <input name="decision" type="hidden" value="ABSENT" />
                                    <input name="returnTo" type="hidden" value="teacher-classes" />
                                    <button className="course-suggestion-reject" type="submit">
                                      Mark absent
                                    </button>
                                  </form>
                                </div>
                              ) : (
                                <span
                                  className={`workspace-status-pill is-${record.status.toLowerCase()}`}
                                >
                                  {record.status.toLowerCase()}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </section>
                    ))}
                </div>
              ) : (
                <p className="campaign-empty">
                  Completed sessions and learner attendance submissions will
                  appear here.
                </p>
              )}
            </section>

            <div className="teacher-class-dialog-footer">
              <a className="text-link" href={`/teacher/courses/${courseId}/preview`}>
                Preview course
              </a>
              <a className="text-link" href={`/teacher/courses/${courseId}`}>
                Manage course sessions and content
              </a>
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}
