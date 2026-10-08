"use client";

import Link from "next/link";
import { useEffect } from "react";
import { toast } from "sonner";

export type AppError = Error & { digest?: string };

export function AppErrorScreen({
  error,
  retry,
  title = "This page didn't load",
  description = "An unexpected error stopped this page from loading. Try again, or return to the home page. If the problem continues, contact support.",
}: {
  error: AppError;
  retry: () => void;
  title?: string;
  description?: string;
}) {
  useEffect(() => {
    console.error("Application route failed to render.", error);
    toast.error(
      "This page couldn't be loaded. Please try again or return to the home page.",
      { id: error.digest ?? "route-render-error" },
    );
  }, [error]);

  return (
    <main
      style={{
        display: "grid",
        minHeight: "70vh",
        placeItems: "center",
        padding: "32px 20px",
        background: "#f7f9f8",
        color: "#18302d",
      }}
    >
      <section
        aria-labelledby="runtime-error-title"
        role="alert"
        style={{
          width: "min(100%, 560px)",
          border: "1px solid #e2e9e5",
          borderRadius: 20,
          padding: "clamp(24px, 5vw, 40px)",
          background: "#fff",
          boxShadow: "0 18px 60px rgba(18, 45, 37, 0.08)",
          textAlign: "center",
        }}
      >
        <p style={{ color: "#a63c38", fontWeight: 700 }}>A temporary setback</p>
        <h1 id="runtime-error-title" style={{ margin: "0 0 12px" }}>
          {title}
        </h1>
        <p style={{ color: "#596966", lineHeight: 1.6 }}>{description}</p>
        {error.digest && (
          <p style={{ color: "#788681", fontSize: 13 }}>
            Reference: {error.digest}
          </p>
        )}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 12,
            marginTop: 24,
          }}
        >
          <button
            onClick={retry}
            style={{
              border: 0,
              borderRadius: 999,
              padding: "12px 20px",
              background: "#b83e3b",
              color: "#fff",
              cursor: "pointer",
              font: "inherit",
              fontWeight: 700,
            }}
            type="button"
          >
            Try again
          </button>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              border: "1px solid #dce5e0",
              borderRadius: 999,
              padding: "12px 20px",
              color: "#18302d",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            Return home
          </Link>
        </div>
      </section>
    </main>
  );
}
