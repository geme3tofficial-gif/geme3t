import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient, UserRole } from "@prisma/client";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const adminKey =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const demoUsers = [
  {
    role: UserRole.TEACHER,
    email:
      process.env.DUMMY_TEACHER_EMAIL?.trim().toLowerCase() ||
      "teacher.demo@geme3t.example.com",
    firstName: "Demo",
    lastName: "Teacher",
  },
  {
    role: UserRole.STUDENT,
    email:
      process.env.DUMMY_STUDENT_EMAIL?.trim().toLowerCase() ||
      "student.demo@geme3t.example.com",
    firstName: "Demo",
    lastName: "Student",
  },
];

function validateConfiguration() {
  const missing = [];
  if (!supabaseUrl) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!adminKey) {
    missing.push("SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY");
  }

  if (missing.length > 0) {
    throw new Error(
      `Demo user seeding requires these .env values: ${missing.join(", ")}.`,
    );
  }

  for (const demoUser of demoUsers) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(demoUser.email)) {
      throw new Error(`Invalid demo account email for role ${demoUser.role}.`);
    }
  }
  if (demoUsers[0].email === demoUsers[1].email) {
    throw new Error("Teacher and student demo accounts must use different emails.");
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
  const createdCredentials = [];

  try {
    for (const demoUser of demoUsers) {
      let user = await findAuthUser(supabase, demoUser.email);

      if (user && user.user_metadata?.geme3t_demo_account !== true) {
        throw new Error(
          `Refusing to change ${demoUser.email}: an Auth account already exists but is not marked as a GEME3T demo user.`,
        );
      }

      if (!user) {
        const password = `G3!${randomBytes(24).toString("base64url")}a9`;
        const { data, error } = await supabase.auth.admin.createUser({
          email: demoUser.email,
          password,
          email_confirm: true,
          user_metadata: {
            first_name: demoUser.firstName,
            last_name: demoUser.lastName,
            geme3t_demo_account: true,
          },
        });

        if (error || !data.user) {
          throw new Error(
            `Could not create the ${demoUser.role.toLowerCase()} demo user: ${error?.message ?? "No user was returned."}`,
          );
        }

        user = data.user;
        createdCredentials.push({ ...demoUser, password });
        console.info(
          `Created ${demoUser.role.toLowerCase()} demo user ${demoUser.email}.`,
        );
      } else {
        console.info(
          `Found existing managed demo user ${demoUser.email}; its password was not changed.`,
        );
      }

      await prisma.userProfile.upsert({
        where: { id: user.id },
        update: {
          email: user.email,
          firstName: demoUser.firstName,
          lastName: demoUser.lastName,
          role: demoUser.role,
        },
        create: {
          id: user.id,
          email: user.email,
          firstName: demoUser.firstName,
          lastName: demoUser.lastName,
          role: demoUser.role,
        },
      });

      console.info(
        `Assigned ${demoUser.role} role to ${demoUser.email}.`,
      );
    }
  } finally {
    await prisma.$disconnect();
  }

  if (createdCredentials.length > 0) {
    console.info(
      "Save these generated passwords now; they are shown only for accounts created in this run:",
    );
    for (const credential of createdCredentials) {
      console.info(
        `${credential.role}: ${credential.email} | password: ${credential.password}`,
      );
    }
  } else {
    console.info(
      "No new passwords were generated. Existing managed demo account passwords were left unchanged.",
    );
  }
}

main().catch((error) => {
  console.error("Demo user seeding failed:", error.message);
  process.exitCode = 1;
});
