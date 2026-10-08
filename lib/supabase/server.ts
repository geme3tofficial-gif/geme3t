import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function requiredEnvironmentVariable(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required to use Supabase Auth.`);
  }
  return value;
}

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    requiredEnvironmentVariable("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnvironmentVariable("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        },
      },
    },
  );
}
