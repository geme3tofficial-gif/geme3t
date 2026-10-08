"use client";

import { createBrowserClient } from "@supabase/ssr";

function requiredEnvironmentVariable(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required to use Supabase Auth.`);
  }
  return value;
}

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    requiredEnvironmentVariable("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnvironmentVariable("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  );
}
