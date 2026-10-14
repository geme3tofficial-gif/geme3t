"use client";

import { useId, useRef, type ReactNode } from "react";

export function CohortEditDialog({
  cohortName,
  children,
}: {
  cohortName: string;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  return (
    <>
      <button
        aria-haspopup="dialog"
        className="button button--small button--light"
        onClick={() => dialogRef.current?.showModal()}
        type="button"
      >
        Edit cohort
      </button>
      <dialog
        aria-labelledby={titleId}
        className="cohort-edit-dialog"
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            event.currentTarget.close();
          }
        }}
        ref={dialogRef}
      >
        <div className="cohort-edit-dialog-panel">
          <header className="cohort-edit-dialog-header">
            <div>
              <span>Edit training cohort</span>
              <h2 id={titleId}>{cohortName}</h2>
            </div>
            <button
              aria-label="Close cohort editor"
              className="cohort-edit-dialog-close"
              onClick={() => dialogRef.current?.close()}
              type="button"
            >
              <span aria-hidden="true">×</span>
            </button>
          </header>
          <div className="cohort-edit-dialog-content">{children}</div>
        </div>
      </dialog>
    </>
  );
}
