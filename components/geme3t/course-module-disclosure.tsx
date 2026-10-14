"use client";

import { useRef, type ReactNode } from "react";

type CourseModuleDisclosureProps = {
  accessLabel: string;
  children: ReactNode;
  lessonCount: number;
  mode?: "accordion" | "modal";
  moduleId: string;
  moduleNumber: number;
  title: string;
};

export function CourseModuleDisclosure({
  accessLabel,
  children,
  lessonCount,
  mode = "accordion",
  moduleId,
  moduleNumber,
  title,
}: CourseModuleDisclosureProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingId = `course-module-dialog-heading-${moduleId}`;
  const lessonLabel = `${lessonCount} ${lessonCount === 1 ? "lesson" : "lessons"}`;

  return (
    <div className="course-module-entry">
      {mode === "modal" ? (
        <>
          <article className="course-module-card course-module-modal-card">
            <button
              aria-haspopup="dialog"
              aria-labelledby={`${headingId}-trigger`}
              className="course-module-modal-trigger"
              onClick={() => dialogRef.current?.showModal()}
              type="button"
            >
              <span className="course-module-accordion-title">
                <span>Module {moduleNumber}</span>
                <strong id={`${headingId}-trigger`}>{title}</strong>
              </span>
              <span className="course-module-lesson-count">{lessonLabel}</span>
              <span className="course-module-access-badge">{accessLabel}</span>
              <span className="course-module-modal-open-label">Edit module</span>
            </button>
          </article>
          <dialog
            aria-labelledby={headingId}
            className="course-module-dialog"
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
                  <span>Module {moduleNumber}</span>
                  <h2 id={headingId}>{title}</h2>
                </div>
                <button
                  aria-label="Close module editor"
                  className="course-module-dialog-close"
                  onClick={() => dialogRef.current?.close()}
                  type="button"
                >
                  <span aria-hidden="true">×</span>
                </button>
              </header>
              <div className="course-module-dialog-content">
                <div className="course-module-accordion-content">{children}</div>
              </div>
            </div>
          </dialog>
        </>
      ) : (
        <details
          className="course-module-card course-module-accordion"
          id={`module-${moduleId}`}
        >
          <summary className="course-module-accordion-summary">
            <div className="course-module-accordion-title">
              <span>Module {moduleNumber}</span>
              <h3>{title}</h3>
            </div>
            <span className="course-module-lesson-count">{lessonLabel}</span>
            <strong className="course-module-access-badge">{accessLabel}</strong>
          </summary>
          <div className="course-module-accordion-content">{children}</div>
        </details>
      )}
    </div>
  );
}
