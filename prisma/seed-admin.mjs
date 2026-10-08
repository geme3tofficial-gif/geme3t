import { createClient } from "@supabase/supabase-js";
import { PrismaClient, UserRole } from "@prisma/client";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const adminKey =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD;

function validateConfiguration() {
  const missing = [];
  if (!supabaseUrl) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!adminKey) {
    missing.push("SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY");
  }
  if (!adminEmail) missing.push("ADMIN_EMAIL");

  if (missing.length > 0) {
    throw new Error(
      `Admin seeding requires these .env values: ${missing.join(", ")}.`,
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
    throw new Error("ADMIN_EMAIL must be a valid email address.");
  }
}

async function findAuthUser(supabase, email) {
  const perPage = 1000;
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) {
      throw new Error(`Could not list Supabase Auth users: ${error.message}`);
    }

    const user = data.users.find(
      (candidate) => candidate.email?.toLowerCase() === email,
    );
    if (user) return user;
    if (data.users.length < perPage) return null;
  }
}

async function main() {
  validateConfiguration();

  const supabase = createClient(supabaseUrl, adminKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
  const prisma = new PrismaClient();

  try {
    let user = await findAuthUser(supabase, adminEmail);

    if (!user) {
      if (!adminPassword || adminPassword.length < 12) {
        throw new Error(
          "A new admin account needs ADMIN_PASSWORD set to a unique password of at least 12 characters.",
        );
      }

      const { data, error } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          first_name: process.env.ADMIN_FIRST_NAME?.trim() || "GEME3T",
          last_name: process.env.ADMIN_LAST_NAME?.trim() || "Admin",
        },
      });
      if (error || !data.user) {
        throw new Error(
          `Could not create the Supabase Auth admin user: ${error?.message ?? "No user was returned."}`,
        );
      }
      user = data.user;
      console.info(`Created Supabase Auth account for ${adminEmail}.`);
    } else {
      console.info(
        `Found existing Supabase Auth account for ${adminEmail}; its password was not changed.`,
      );
    }

    await prisma.userProfile.upsert({
      where: { id: user.id },
      update: {
        email: user.email,
        role: UserRole.ADMIN,
      },
      create: {
        id: user.id,
        email: user.email,
        firstName: process.env.ADMIN_FIRST_NAME?.trim() || "GEME3T",
        lastName: process.env.ADMIN_LAST_NAME?.trim() || "Admin",
        role: UserRole.ADMIN,
      },
    });

    console.info(
      `Granted ADMIN role to ${adminEmail}. Sign in at /admin/sign-in.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Admin seeding failed:", error.message);
  process.exitCode = 1;
});
