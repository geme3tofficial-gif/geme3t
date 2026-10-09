"use server";

import {
  CohortStatus,
  CourseStatus,
  ModuleAccessType,
  Prisma,
  ScholarshipStatus,
  SessionStatus,
  UserRole,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { getPrismaClient } from "@/lib/prisma";
import {
  onboardingFieldDefinitions,
  isOnboardingAudience,
} from "@/lib/onboarding-fields";
import {
  CourseImageUploadError,
  uploadCourseImage,
} from "@/lib/course-image-storage";

function readText(formData: FormData, key: string, maxLength: number) {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= maxLength ? trimmed : null;
}

function readOptionalText(
  formData: FormData,
  key: string,
  maxLength: number,
): string | null | undefined {
  const value = formData.get(key);
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.length <= maxLength ? trimmed : undefined;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isCourseImageUrl(value: string) {
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return false;

  try {
    const imageUrl = new URL(value);
    const configuredSupabaseUrl = new URL(supabaseUrl);
    return (
      imageUrl.origin === configuredSupabaseUrl.origin &&
      imageUrl.pathname.startsWith(
        "/storage/v1/object/public/course-images/",
      ) &&
      !imageUrl.search
    );
  } catch {
    return false;
  }
}

function isCourseStatus(value: unknown): value is CourseStatus {
  return (
    typeof value === "string" &&
    Object.values(CourseStatus).some((status) => status === value)
  );
}

function isScholarshipStatus(value: unknown): value is ScholarshipStatus {
  return (
    typeof value === "string" &&
    Object.values(ScholarshipStatus).some((status) => status === value)
  );
}

function isCohortStatus(value: unknown): value is CohortStatus {
  return (
    typeof value === "string" &&
    Object.values(CohortStatus).some((status) => status === value)
  );
}

function isSessionStatus(value: unknown): value is SessionStatus {
  return (
    typeof value === "string" &&
    Object.values(SessionStatus).some((status) => status === value)
  );
}

function readUtcDateTime(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    return null;
  }
  const date = new Date(`${value}:00Z`);
  if (!Number.isFinite(date.getTime())) return null;
  if (
    date.getUTCFullYear() !== Number(value.slice(0, 4)) ||
    date.getUTCMonth() + 1 !== Number(value.slice(5, 7)) ||
    date.getUTCDate() !== Number(value.slice(8, 10)) ||
    date.getUTCHours() !== Number(value.slice(11, 13)) ||
    date.getUTCMinutes() !== Number(value.slice(14, 16))
  ) {
    return null;
  }
  return date;
}

function revalidateCoursePaths(slug?: string) {
  revalidatePath("/admin/courses");
  revalidatePath("/");
  revalidatePath("/courses");
  revalidatePath("/apply");
  if (slug) revalidatePath(`/${slug}`);
}

function courseEditorPath(id?: string) {
  return id && isUuid(id) ? `/admin/courses/${id}` : "/admin/courses/new";
}

export async function saveCourse(formData: FormData) {
  await requireAdmin();
  const id = readText(formData, "id", 36);
  const editorPath = courseEditorPath(id ?? undefined);
  const slug = readText(formData, "slug", 80);
  const title = readText(formData, "title", 120);
  const category = readText(formData, "category", 80);
  const description = readText(formData, "description", 2000);
  const existingImageUrl = readOptionalText(formData, "imageUrl", 500);
  const rawImageFile = formData.get("imageFile");
  const imageFile =
    rawImageFile instanceof File && rawImageFile.size > 0
      ? rawImageFile
      : null;
  const durationWeeks = Number(formData.get("durationWeeks"));
  const freeBootcampEnabled = formData.get("freeBootcampEnabled") === "on";
  const status = formData.get("status");

  if (
    (formData.has("id") && (!id || !isUuid(id))) ||
    !slug ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ||
    !title ||
    !category ||
    !description ||
    existingImageUrl === undefined ||
    (existingImageUrl !== null &&
      !isCourseImageUrl(existingImageUrl)) ||
    (rawImageFile !== null &&
      !(rawImageFile instanceof File)) ||
    (rawImageFile instanceof File &&
      rawImageFile.size > 0 &&
      rawImageFile.size > 4 * 1024 * 1024) ||
    (!imageFile && !existingImageUrl) ||
    !Number.isInteger(durationWeeks) ||
    durationWeeks < 1 ||
    durationWeeks > 100 ||
    !isCourseStatus(status)
  ) {
    redirect(
      rawImageFile instanceof File &&
        rawImageFile.size > 4 * 1024 * 1024
        ? `${editorPath}?notice=invalid-course-image`
        : `${editorPath}?notice=invalid-course`,
    );
  }

  const duplicate = await getPrismaClient().course.findFirst({
    where: { slug, ...(id ? { NOT: { id } } : {}) },
    select: { id: true },
  });
  if (duplicate) redirect(`${editorPath}?notice=duplicate-course`);
  const existing = id
    ? await getPrismaClient().course.findUnique({
        where: { id },
        select: { publishedAt: true },
      })
    : null;
  if (id && !existing) redirect(`${editorPath}?notice=invalid-course`);
  let imageUrl = existingImageUrl;
  if (imageFile) {
    try {
      imageUrl = await uploadCourseImage(imageFile, slug);
    } catch (error) {
      if (error instanceof CourseImageUploadError) {
        console.error("Course image upload failed.", error.cause ?? error.message);
        redirect(
          error.kind === "invalid-image"
            ? `${editorPath}?notice=invalid-course-image`
            : `${editorPath}?notice=course-image-upload-failed`,
        );
      }
      throw error;
    }
  }
  const data = {
    slug,
    title,
    category,
    description,
    imageUrl,
    durationWeeks,
    freeBootcampEnabled,
    status,
    publishedAt:
      status === CourseStatus.PUBLISHED
        ? existing?.publishedAt ?? new Date()
        : null,
  };

  let savedCourse: { id: string };
  try {
    savedCourse = id
      ? await getPrismaClient().course.update({
          where: { id },
          data,
          select: { id: true },
        })
      : await getPrismaClient().course.create({
          data,
          select: { id: true },
        });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      redirect(`${editorPath}?notice=duplicate-course`);
    }
    throw error;
  }

  revalidateCoursePaths(slug);
  revalidatePath(`/admin/courses/${savedCourse.id}`);
  redirect(`/admin/courses/${savedCourse.id}?notice=saved-course`);
}

export async function archiveCourse(formData: FormData) {
  await requireAdmin();
  const id = readText(formData, "id", 36);
  const slug = readText(formData, "slug", 80);
  if (
    !id ||
    !isUuid(id) ||
    !slug ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
  ) {
    redirect("/admin/courses?notice=invalid-course");
  }

  await getPrismaClient().course.update({
    where: { id },
    data: { status: CourseStatus.ARCHIVED },
  });

  revalidateCoursePaths(slug);
  redirect("/admin/courses?notice=archived-course");
}

const validModuleAccessTypes = Object.values(ModuleAccessType);

function isModuleAccessType(value: unknown): value is ModuleAccessType {
  return (
    typeof value === "string" &&
    validModuleAccessTypes.some((accessType) => accessType === value)
  );
}

function readModuleAccessTypes(formData: FormData) {
  const values = formData.getAll("accessTypes");
  if (values.some((value) => !isModuleAccessType(value))) {
    return null;
  }

  const selected = [...new Set(values.filter(isModuleAccessType))];
  return selected.includes(ModuleAccessType.ALL_ENROLLED)
    ? [ModuleAccessType.ALL_ENROLLED]
    : selected;
}

function revalidateCourseModules(courseId: string, slug: string) {
  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath("/admin/courses");
  revalidatePath(`/${slug}`);
  revalidatePath("/apply");
}

export async function saveCourseModule(formData: FormData) {
  await requireAdmin();
  const courseId = readText(formData, "courseId", 36);
  const moduleId = readText(formData, "moduleId", 36);
  const title = readText(formData, "title", 120);
  const description = readOptionalText(formData, "description", 2000);
  const sortOrder = Number(formData.get("sortOrder"));
  const accessTypes = readModuleAccessTypes(formData);
  const editorPath =
    courseId && isUuid(courseId) ? `/admin/courses/${courseId}` : "/admin/courses";

  if (
    !courseId ||
    !isUuid(courseId) ||
    (formData.has("moduleId") && (!moduleId || !isUuid(moduleId))) ||
    !title ||
    description === undefined ||
    !Number.isInteger(sortOrder) ||
    sortOrder < 1 ||
    sortOrder > 500 ||
    accessTypes === null
  ) {
    redirect(`${editorPath}?moduleNotice=invalid-module`);
  }

  const prisma = getPrismaClient();
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, slug: true },
  });
  if (!course) redirect("/admin/courses?notice=invalid-course");

  if (moduleId) {
    const existingModule = await prisma.courseModule.findFirst({
      where: { id: moduleId, courseId },
      select: { id: true },
    });
    if (!existingModule) {
      redirect(`${editorPath}?moduleNotice=invalid-module`);
    }
  }

  try {
    const data = {
      title,
      description,
      sortOrder,
      accessTypes,
    };
    if (moduleId) {
      await prisma.courseModule.update({
        where: { id: moduleId },
        data,
      });
    } else {
      await prisma.courseModule.create({
        data: { ...data, courseId },
      });
    }
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      redirect(`${editorPath}?moduleNotice=duplicate-module-order`);
    }
    throw error;
  }

  revalidateCourseModules(course.id, course.slug);
  redirect(`/admin/courses/${course.id}?moduleNotice=saved-module`);
}

function revalidateScholarshipPaths() {
  revalidatePath("/admin/scholarships");
  revalidatePath("/apply");
}

export async function saveScholarshipSettings(formData: FormData) {
  await requireAdmin();
  const scholarshipsEnabled = formData.get("scholarshipsEnabled") === "on";
  await getPrismaClient().applicationConfig.upsert({
    where: { id: 1 },
    create: { id: 1, scholarshipsEnabled },
    update: { scholarshipsEnabled },
  });
  revalidateScholarshipPaths();
  redirect(
    `/admin/scholarships?notice=${scholarshipsEnabled ? "scholarships-enabled" : "scholarships-disabled"}`,
  );
}

export async function saveOnboardingFieldSettings(formData: FormData) {
  await requireAdmin();
  const settings = onboardingFieldDefinitions.map((field) => {
    const submittedAudiences = formData
      .getAll(field.key)
      .filter((value): value is string => typeof value === "string")
      .filter(isOnboardingAudience);
    const audiences =
      field.key === "startDate"
        ? Array.from(new Set([...submittedAudiences, "SCHOLARSHIP" as const]))
        : Array.from(new Set(submittedAudiences));
    return { fieldKey: field.key, audiences };
  });

  const db = getPrismaClient();
  await db.$transaction(
    settings.map(({ fieldKey, audiences }) =>
      db.onboardingFieldSetting.upsert({
        where: { fieldKey },
        create: { fieldKey, audiences },
        update: { audiences },
      }),
    ),
  );

  revalidateScholarshipPaths();
  redirect("/admin/scholarships?notice=onboarding-fields-saved");
}

export async function saveScholarship(formData: FormData) {
  await requireAdmin();
  const id = readText(formData, "id", 36);
  const name = readText(formData, "name", 200);
  const sponsor = readOptionalText(formData, "sponsor", 100);
  const description = readOptionalText(formData, "description", 1000);
  const currency = readText(formData, "currency", 3)?.toUpperCase();
  const tuitionPercent = Number(formData.get("tuitionPercent"));
  const rawAmount = formData.get("amount");
  const amountText = typeof rawAmount === "string" ? rawAmount.trim() : null;
  const amount =
    amountText
      ? Number(amountText)
      : null;
  const status = formData.get("status");

  if (
    (formData.has("id") && (!id || !isUuid(id))) ||
    !name ||
    sponsor === undefined ||
    description === undefined ||
    !currency ||
    !/^[A-Z]{3}$/.test(currency) ||
    !Number.isInteger(tuitionPercent) ||
    tuitionPercent < 0 ||
    tuitionPercent > 100 ||
    (rawAmount !== null && typeof rawAmount !== "string") ||
    (amountText !== null &&
      amountText !== "" &&
      (!/^\d{1,10}(?:\.\d{1,2})?$/.test(amountText) ||
        amount === null ||
        amount > 9999999999.99)) ||
    !isScholarshipStatus(status)
  ) {
    redirect("/admin/scholarships?notice=invalid-scholarship");
  }

  const duplicate = await getPrismaClient().scholarship.findFirst({
    where: { name, ...(id ? { NOT: { id } } : {}) },
    select: { id: true },
  });
  if (duplicate) redirect("/admin/scholarships?notice=duplicate-scholarship");

  const data = {
    name,
    sponsor,
    description,
    currency,
    tuitionPercent,
    amount,
    status,
  };

  try {
    if (id) {
      await getPrismaClient().scholarship.update({ where: { id }, data });
    } else {
      await getPrismaClient().scholarship.create({ data });
    }
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      redirect("/admin/scholarships?notice=duplicate-scholarship");
    }
    throw error;
  }

  revalidateScholarshipPaths();
  redirect("/admin/scholarships?notice=saved-scholarship");
}

export async function removeScholarship(formData: FormData) {
  await requireAdmin();
  const id = readText(formData, "id", 36);
  if (!id || !isUuid(id)) {
    redirect("/admin/scholarships?notice=invalid-scholarship");
  }

  await getPrismaClient().scholarship.update({
    where: { id },
    data: { status: ScholarshipStatus.INACTIVE },
  });

  revalidateScholarshipPaths();
  redirect("/admin/scholarships?notice=removed-scholarship");
}

function revalidateSchedulePaths() {
  revalidatePath("/admin/cohorts");
  revalidatePath("/admin/sessions");
  revalidatePath("/apply");
  revalidatePath("/admin/applications");
}

export async function saveCohort(formData: FormData) {
  await requireAdmin();
  const id = readText(formData, "id", 36);
  const courseId = readText(formData, "courseId", 36);
  const name = readText(formData, "name", 120);
  const startsAt = readUtcDateTime(formData, "startsAt");
  const endsAtValue = formData.get("endsAt");
  const endsAt =
    typeof endsAtValue === "string" && endsAtValue.trim()
      ? readUtcDateTime(formData, "endsAt")
      : null;
  const seatLimitValue = formData.get("seatLimit");
  const seatLimitText =
    typeof seatLimitValue === "string" ? seatLimitValue.trim() : undefined;
  const seatLimit =
    seatLimitText === "" ? null : Number(seatLimitText);
  const status = formData.get("status");

  if (
    (formData.has("id") && (!id || !isUuid(id))) ||
    !courseId ||
    !isUuid(courseId) ||
    !name ||
    !startsAt ||
    (typeof endsAtValue !== "string" ||
      (endsAtValue.trim() !== "" && !endsAt)) ||
    (endsAt && endsAt <= startsAt) ||
    seatLimitText === undefined ||
    (seatLimitText !== "" &&
      (seatLimit === null ||
        !Number.isInteger(seatLimit) ||
        seatLimit < 1 ||
        seatLimit > 100000)) ||
    !isCohortStatus(status)
  ) {
    redirect("/admin/cohorts?notice=invalid-cohort");
  }

  const course = await getPrismaClient().course.findUnique({
    where: { id: courseId },
    select: { id: true },
  });
  if (!course) redirect("/admin/cohorts?notice=invalid-cohort");

  try {
    if (id) {
      await getPrismaClient().cohort.update({
        where: { id },
        data: { courseId, name, startsAt, endsAt, seatLimit, status },
      });
    } else {
      await getPrismaClient().cohort.create({
        data: { courseId, name, startsAt, endsAt, seatLimit, status },
      });
    }
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      redirect("/admin/cohorts?notice=duplicate-cohort");
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      redirect("/admin/cohorts?notice=invalid-cohort");
    }
    throw error;
  }

  revalidateSchedulePaths();
  redirect("/admin/cohorts?notice=saved-cohort");
}

export async function saveTrainingSession(formData: FormData) {
  await requireAdmin();
  const id = readText(formData, "id", 36);
  const cohortId = readText(formData, "cohortId", 36);
  const teacherId = readOptionalText(formData, "teacherId", 36);
  const title = readText(formData, "title", 160);
  const description = readOptionalText(formData, "description", 2000);
  const startsAt = readUtcDateTime(formData, "startsAt");
  const endsAt = readUtcDateTime(formData, "endsAt");
  const location = readOptionalText(formData, "location", 200);
  const meetingUrl = readOptionalText(formData, "meetingUrl", 500);
  const status = formData.get("status");

  if (
    (formData.has("id") && (!id || !isUuid(id))) ||
    !cohortId ||
    !isUuid(cohortId) ||
    teacherId === undefined ||
    (teacherId !== null && !isUuid(teacherId)) ||
    !title ||
    description === undefined ||
    !startsAt ||
    !endsAt ||
    endsAt <= startsAt ||
    location === undefined ||
    meetingUrl === undefined ||
    (meetingUrl !== null && !/^https?:\/\//i.test(meetingUrl)) ||
    !isSessionStatus(status)
  ) {
    redirect("/admin/sessions?notice=invalid-session");
  }

  const cohort = await getPrismaClient().cohort.findUnique({
    where: { id: cohortId },
    select: { id: true },
  });
  if (!cohort) redirect("/admin/sessions?notice=invalid-session");

  if (teacherId) {
    const teacher = await getPrismaClient().userProfile.findFirst({
      where: { id: teacherId, role: UserRole.TEACHER },
      select: { id: true },
    });
    if (!teacher) redirect("/admin/sessions?notice=invalid-session");
  }

  const data = {
    cohortId,
    teacherId,
    title,
    description,
    startsAt,
    endsAt,
    location,
    meetingUrl,
    status,
  };

  try {
    if (id) {
      await getPrismaClient().liveSession.update({ where: { id }, data });
    } else {
      await getPrismaClient().liveSession.create({ data });
    }
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      redirect("/admin/sessions?notice=invalid-session");
    }
    throw error;
  }

  revalidateSchedulePaths();
  redirect("/admin/sessions?notice=saved-session");
}
