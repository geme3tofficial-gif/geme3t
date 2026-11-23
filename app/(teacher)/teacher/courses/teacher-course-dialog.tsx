"use client";

import { useEffect, useId, useRef } from "react";
import { applyToTeachCohort } from "@/app/(admin)/admin/actions";

type TeacherCourse = {
  id: string;
  title: string;
  category: string;
  description: string;
  durationWeeks: number;
  modules: {
    id: string;
    title: string;
    description: string | null;
    _count: { lessons: number };
  }[];
  cohorts: {
    id: string;
    name: string;
    startsAt: Date;
    status: string;
    teacherApplications: { status: string }[];
  }[];
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(date);
}

export function TeacherCourseDialog({
  course,
  initiallyOpen,
}: {
  course: TeacherCourse;
  initiallyOpen: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (initiallyOpen && !dialogRef.current?.open) {
      dialogRef.current?.showModal();
    }
  }, [initiallyOpen]);

  return (
    <>
      <button
        aria-haspopup="dialog"
        className="text-link"
        onClick={() => dialogRef.current?.showModal()}
        type="button"
      >
        View course
      </button>
      <dialog
        aria-labelledby={titleId}
        className="course-module-dialog teacher-course-dialog"
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            event.currentTarget.close();
          }
        }}
        ref={dialogRef}
      >
        <div className="course-module-dialog-panel">
          <header className="course-module-dialog-header">
            <div>
              <span>{course.category} · {course.durationWeeks} weeks</span>
              <h2 id={titleId}>{course.title}</h2>
            </div>
            <button
              aria-label={`Close ${course.title} details`}
              className="course-module-dialog-close"
              onClick={() => dialogRef.current?.close()}
              type="button"
            >
              <span aria-hidden="true">×</span>
            </button>
          </header>
          <div className="course-module-dialog-content teacher-course-dialog-content">
            <section>
              <h3>Course overview</h3>
              <p>{course.description}</p>
            </section>

            <section>
              <h3>Course modules</h3>
              {course.modules.length === 0 ? (
                <p>Course modules have not been added yet.</p>
              ) : (
                <ol className="teacher-course-dialog-modules">
                  {course.modules.map((module, index) => (
                    <li key={module.id}>
                      <strong>
                        Module {index + 1}: {module.title}
                      </strong>
                      <span>
                        {module._count.lessons}{" "}
                        {module._count.lessons === 1 ? "lesson" : "lessons"}
                      </span>
                      {module.description ? <p>{module.description}</p> : null}
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <section>
              <h3>Teaching opportunities</h3>
              <p>
                Express interest in a cohort to ask an administrator for
                approval. Course and learner-management access is only granted
                after approval.
              </p>
              {course.cohorts.length === 0 ? (
                <p className="campaign-empty">
                  No future cohort is currently accepting teaching requests.
                </p>
              ) : (
                <ul className="teacher-course-dialog-cohorts">
                  {course.cohorts.map((cohort) => {
                    const application = cohort.teacherApplications[0];
                    return (
                      <li key={cohort.id}>
                        <div>
                          <strong>{cohort.name}</strong>
                          <span>
                            Starts {formatDate(cohort.startsAt)} ·{" "}
                            {cohort.status.toLowerCase()}
                          </span>
                        </div>
                        {application?.status === "PENDING" ? (
                          <span className="workspace-status-pill">
                            Interest pending admin review
                          </span>
                        ) : application?.status === "APPROVED" ? (
                          <span className="workspace-status-pill is-approved">
                            Approved
                          </span>
                        ) : (
                          <form action={applyToTeachCohort}>
                            <input
                              name="cohortId"
                              type="hidden"
                              value={cohort.id}
                            />
                            <input
                              name="returnPath"
                              type="hidden"
                              value="/teacher/courses"
                            />
                            <input
                              name="returnCourseId"
                              type="hidden"
                              value={course.id}
                            />
                            <button
                              className="button button--small"
                              type="submit"
                            >
                              Request assignment
                            </button>
                          </form>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        </div>
      </dialog>
    </>
  );
}
