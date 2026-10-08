import type { Metadata } from "next";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { AdminSignInForm } from "./admin-sign-in-form";

export const metadata: Metadata = {
  title: "Admin sign in",
};

export default async function AdminSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const config = getSupabasePublicConfig();
  const query = await searchParams;

  return (
    <main className="admin-sign-in-page">
      <section className="admin-sign-in-card">
        <span className="eyebrow">Secure workspace access</span>
        <h1>Admin sign in</h1>
        <p>Sign in with your administrator account to manage courses, scholarships, and applications.</p>
        {query.error === "admin-required" && (
          <p className="admin-form-notice" role="status">
            Sign in with an account assigned the administrator role to continue.
          </p>
        )}
        {!config && (
          <p className="admin-form-error" role="alert">
            Supabase Auth is not configured. Set NEXT_PUBLIC_SUPABASE_URL and
            NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env, then restart the
            development server.
          </p>
        )}
        <AdminSignInForm isConfigured={Boolean(config)} />
      </section>
    </main>
  );
}
