import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { LearnerPasswordUpdateForm } from "../../sign-in/password-update-form";
import { getLearnerSession } from "@/lib/learner-auth";

export const metadata: Metadata = {
  title: "Choose a new student password",
};

export default async function UpdateLearnerPasswordPage() {
  const session = await getLearnerSession();
  if (
    !session?.user ||
    session.profile?.role !== UserRole.STUDENT ||
    !session.profile.applications.some(
      (application) =>
        application.email.toLowerCase() === session.user.email?.toLowerCase(),
    )
  ) {
    redirect("/dashboard/sign-in?error=link-invalid");
  }

  return (
    <main className="admin-sign-in-page">
      <section className="admin-sign-in-card">
        <span className="eyebrow">Student account</span>
        <h1>Choose a new password</h1>
        <p>
          Choose a password with at least 12 characters. You’ll use it the next
          time you sign in.
        </p>
        <LearnerPasswordUpdateForm />
      </section>
    </main>
  );
}
