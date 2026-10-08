"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicConfig } from "./config";

export function createSupabaseBrowserClient() {
  const config = getSupabasePublicConfig();
  if (!config) {
    throw new Error(
      "Set NEXT_PUBLIC_SUPABASE_URL and either NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY to use Supabase Auth.",
    );
  }
  return createBrowserClient(config.url, config.key);
}
