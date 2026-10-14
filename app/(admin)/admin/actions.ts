"use server";

import {
  CohortStatus,
  CourseStatus,
  CourseSuggestionStatus,
  LessonContentKind,
  ModuleAccessType,
  Prisma,
  ScholarshipStatus,
  SessionStatus,
  TeacherCohortApplicationStatus,
  UserRole,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import {
  assertCourseEditorCourseAccess,
  requireCourseEditor,
} from "@/lib/course-editor-auth";
import {
  deleteLessonAttachment,
  LessonAttachmentUploadError,
  uploadLessonAttachment,
} from "@/lib/lesson-attachment-storage";
import { getPrismaClient } from "@/lib/prisma";
import { getYouTubeVideoId } from "@/lib/youtube";
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

export async function submitCourseSuggestion(formData: FormData) {
  const editor = await requireCourseEditor();
  if (editor.role !== UserRole.TEACHER) {
    redirect("/teacher/courses?notice=teacher-required");
  }

  const title = readText(formData, "title", 120);
  const description = readText(formData, "description", 2000);
  const durationWeeks = Number(formData.get("durationWeeks"));
  const selectedCategory = readText(formData, "category", 80);
  const newCategory = readOptionalText(formData, "newCategory", 80);
  const category =
    selectedCategory === "__new__" ? newCategory : selectedCategory;

  if (
    !title ||
    !description ||
    !Number.isInteger(durationWeeks) ||
    durationWeeks < 1 ||
    durationWeeks > 100 ||
    !category ||
    newCategory === undefined ||
    (selectedCategory !== "__new__" && newCategory !== null)
  ) {
    redirect("/teacher/courses?notice=invalid-suggestion");
  }

  await getPrismaClient().courseSuggestion.create({
    data: {
      title,
      category,
      description,
      durationWeeks,
      suggestedById: editor.userId,
    },
  });

  revalidatePath("/teacher/courses");
  revalidatePath("/admin/courses");
  redirect("/teacher/courses?notice=suggestion-submitted");
}

export async function reviewCourseSuggestion(formData: FormData) {
  const admin = await requireAdmin();
  const id = readText(formData, "id", 36);
  const decision = formData.get("decision");
  if (
    !id ||
    !isUuid(id) ||
    (decision !== "approve" && decision !== "reject")
  ) {
    redirect("/admin/courses?notice=invalid-suggestion");
  }

  const prisma = getPrismaClient();
  let publishedSlug: string | null = null;

  if (decision === "reject") {
    const result = await prisma.courseSuggestion.updateMany({
      where: { id, status: CourseSuggestionStatus.PENDING },
      data: {
        status: CourseSuggestionStatus.REJECTED,
        reviewedById: admin.id,
        reviewedAt: new Date(),
      },
    });
    if (result.count === 0) {
      redirect("/admin/courses?notice=suggestion-already-reviewed");
    }
  } else {
    publishedSlug = await prisma.$transaction(async (transaction) => {
      const suggestion = await transaction.courseSuggestion.findUnique({
        where: { id },
      });
      if (!suggestion || suggestion.status !== CourseSuggestionStatus.PENDING) {
        return null;
      }

      const claimed = await transaction.courseSuggestion.updateMany({
        where: { id, status: CourseSuggestionStatus.PENDING },
        data: {
          status: CourseSuggestionStatus.APPROVED,
          reviewedById: admin.id,
          reviewedAt: new Date(),
        },
      });
      if (claimed.count === 0) return null;

      const titleSlug =
        suggestion.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
          .slice(0, 60) || "proposed-course";
      const slug = `${titleSlug}-${suggestion.id.replace(/-/g, "").slice(0, 8)}`;
      const course = await transaction.course.create({
        data: {
          slug,
          title: suggestion.title,
          category: suggestion.category,
          description: suggestion.description,
          durationWeeks: suggestion.durationWeeks,
          status: CourseStatus.PUBLISHED,
          publishedAt: new Date(),
        },
        select: { id: true, slug: true },
      });
      await transaction.courseSuggestion.update({
        where: { id },
        data: { courseId: course.id },
      });
      return course.slug;
    });

    if (!publishedSlug) {
      redirect("/admin/courses?notice=suggestion-already-reviewed");
    }
  }

  revalidatePath("/admin/courses");
  revalidatePath("/teacher/courses");
  if (publishedSlug) revalidateCoursePaths(publishedSlug);
  redirect(
    decision === "approve"
      ? "/admin/courses?notice=suggestion-approved"
      : "/admin/courses?notice=suggestion-rejected",
  );
}

export async function applyToTeachCohort(formData: FormData) {
  const editor = await requireCourseEditor();
  if (editor.role !== UserRole.TEACHER) {
    redirect("/teacher?notice=teacher-required");
  }

  const cohortId = readText(formData, "cohortId", 36);
  if (!cohortId || !isUuid(cohortId)) {
    redirect("/teacher?notice=invalid-cohort-application");
  }

  const prisma = getPrismaClient();
  const availableCohort = await prisma.cohort.findFirst({
    where: {
      id: cohortId,
      status: { in: [CohortStatus.PLANNED, CohortStatus.OPEN] },
      startsAt: { gt: new Date() },
      course: { status: CourseStatus.PUBLISHED },
      teachers: { none: { teacherId: editor.userId } },
    },
    select: { id: true },
  });
  if (!availableCohort) {
    redirect("/teacher?notice=cohort-no-longer-available");
  }

  try {
    const existing = await prisma.teacherCohortApplication.findUnique({
      where: {
        cohortId_teacherId: { cohortId, teacherId: editor.userId },
      },
      select: { status: true },
    });
    if (
      existing?.status === TeacherCohortApplicationStatus.PENDING ||
      existing?.status === TeacherCohortApplicationStatus.APPROVED
    ) {
      redirect("/teacher?notice=cohort-application-exists");
    }

    if (existing?.status === TeacherCohortApplicationStatus.REJECTED) {
      await prisma.teacherCohortApplication.updateMany({
        where: {
          cohortId,
          teacherId: editor.userId,
          status: TeacherCohortApplicationStatus.REJECTED,
        },
        data: {
          status: TeacherCohortApplicationStatus.PENDING,
          appliedAt: new Date(),
          reviewedById: null,
          reviewedAt: null,
        },
      });
    } else {
      await prisma.teacherCohortApplication.create({
        data: { cohortId, teacherId: editor.userId },
      });
    }
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      redirect("/teacher?notice=cohort-application-exists");
    }
    throw error;
  }

  revalidateSchedulePaths();
  redirect("/teacher?notice=cohort-application-submitted");
}

export async function reviewTeacherCohortApplication(formData: FormData) {
  const admin = await requireAdmin();
  const id = readText(formData, "id", 36);
  const decision = formData.get("decision");
  if (
    !id ||
    !isUuid(id) ||
    (decision !== "approve" && decision !== "reject")
  ) {
    redirect("/admin/cohorts?notice=invalid-teacher-application");
  }

  const prisma = getPrismaClient();
  if (decision === "reject") {
    const result = await prisma.teacherCohortApplication.updateMany({
      where: { id, status: TeacherCohortApplicationStatus.PENDING },
      data: {
        status: TeacherCohortApplicationStatus.REJECTED,
        reviewedById: admin.id,
        reviewedAt: new Date(),
      },
    });
    if (result.count === 0) {
      redirect("/admin/cohorts?notice=teacher-application-already-reviewed");
    }
  } else {
    const approved = await prisma.$transaction(async (transaction) => {
      const application =
        await transaction.teacherCohortApplication.findUnique({
          where: { id },
          select: {
            cohortId: true,
            teacherId: true,
            status: true,
            cohort: {
              select: {
                status: true,
                course: { select: { status: true } },
              },
            },
          },
        });
      if (
        !application ||
        application.status !== TeacherCohortApplicationStatus.PENDING
      ) {
        return false;
      }
      if (
        application.cohort.status === CohortStatus.CANCELLED ||
        application.cohort.status === CohortStatus.COMPLETED ||
        application.cohort.course.status !== CourseStatus.PUBLISHED
      ) {
        return false;
      }

      const claimed = await transaction.teacherCohortApplication.updateMany({
        where: { id, status: TeacherCohortApplicationStatus.PENDING },
        data: {
          status: TeacherCohortApplicationStatus.APPROVED,
          reviewedById: admin.id,
          reviewedAt: new Date(),
        },
      });
      if (claimed.count === 0) return false;

      await transaction.cohortTeachingAssignment.upsert({
        where: {
          cohortId_teacherId: {
            cohortId: application.cohortId,
            teacherId: application.teacherId,
          },
        },
        create: {
          cohortId: application.cohortId,
          teacherId: application.teacherId,
        },
        update: {},
      });
      return true;
    });

    if (!approved) {
      redirect("/admin/cohorts?notice=teacher-application-unavailable");
    }
  }

  revalidateSchedulePaths();
  redirect(
    decision === "approve"
      ? "/admin/cohorts?notice=teacher-application-approved"
      : "/admin/cohorts?notice=teacher-application-rejected",
  );
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
  revalidatePath(`/teacher/courses/${courseId}`);
  revalidatePath(`/teacher/courses/${courseId}/preview`);
  revalidatePath("/teacher/courses");
  revalidatePath("/admin/courses");
  revalidatePath(`/${slug}`);
  revalidatePath("/courses");
  revalidatePath("/apply");
}

export async function saveCourseModule(formData: FormData) {
  const editor = await requireCourseEditor();
  const { role } = editor;
  const courseId = readText(formData, "courseId", 36);
  const moduleId = readText(formData, "moduleId", 36);
  const title = readText(formData, "title", 120);
  const description = readOptionalText(formData, "description", 2000);
  const sortOrder = Number(formData.get("sortOrder"));
  const accessTypes = readModuleAccessTypes(formData);
  const editorPath =
    courseId && isUuid(courseId)
      ? role === UserRole.TEACHER
        ? `/teacher/courses/${courseId}`
        : `/admin/courses/${courseId}`
      : "/admin/courses";

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
  await assertCourseEditorCourseAccess(editor, course.id);

  const existingModule = moduleId
    ? await prisma.courseModule.findFirst({
      where: { id: moduleId, courseId },
      select: { id: true, sortOrder: true },
    })
    : null;
  if (moduleId && !existingModule) {
    redirect(`${editorPath}?moduleNotice=invalid-module`);
  }

  try {
    const data = {
      title,
      description,
      sortOrder: existingModule?.sortOrder ?? sortOrder,
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
  redirect(`${editorPath}?moduleNotice=saved-module`);
}

function courseContentEditorPath(courseId: string, role: UserRole) {
  return role === UserRole.TEACHER
    ? `/teacher/courses/${courseId}`
    : `/admin/courses/${courseId}`;
}

function revalidateLessonPaths(courseId: string, slug: string) {
  revalidateCourseModules(courseId, slug);
  revalidatePath(`/teacher/courses/${courseId}/preview`);
  revalidatePath(`/${slug}`);
  revalidatePath(`/teacher/courses/${courseId}`);
  revalidatePath(`/admin/courses/${courseId}`);
}

async function reorderCourseModules(courseId: string) {
  const prisma = getPrismaClient();
  const modules = await prisma.courseModule.findMany({
    where: { courseId },
    orderBy: { sortOrder: "asc" },
    select: { id: true, sortOrder: true },
  });
  return modules;
}

export async function moveCourseModule(formData: FormData) {
  const editor = await requireCourseEditor();
  const { role } = editor;
  const moduleId = readText(formData, "moduleId", 36);
  const direction = formData.get("direction");
  if (
    !moduleId ||
    !isUuid(moduleId) ||
    (direction !== "up" && direction !== "down")
  ) {
    redirect("/teacher/courses?notice=invalid-course");
  }

  const prisma = getPrismaClient();
  const courseModule = await prisma.courseModule.findUnique({
    where: { id: moduleId },
    select: { id: true, courseId: true, course: { select: { slug: true } } },
  });
  if (!courseModule) redirect("/teacher/courses?notice=invalid-course");
  await assertCourseEditorCourseAccess(editor, courseModule.courseId);
  const editorPath = courseContentEditorPath(courseModule.courseId, role);
  const modules = await reorderCourseModules(courseModule.courseId);
  const currentIndex = modules.findIndex((item) => item.id === courseModule.id);
  if (currentIndex === -1) redirect(`${editorPath}?moduleNotice=invalid-module`);
  const targetIndex = currentIndex + (direction === "up" ? -1 : 1);
  if (targetIndex < 0 || targetIndex >= modules.length) {
    redirect(`${editorPath}?moduleNotice=saved-order`);
  }

  const reordered = [...modules];
  [reordered[currentIndex], reordered[targetIndex]] = [
    reordered[targetIndex],
    reordered[currentIndex],
  ];
  await prisma.$transaction(async (transaction) => {
    const temporaryStart =
      Math.max(...reordered.map((item) => item.sortOrder), 0) + reordered.length;
    for (const [index, item] of reordered.entries()) {
      await transaction.courseModule.update({
        where: { id: item.id },
        data: { sortOrder: temporaryStart + index + 1 },
      });
    }
    for (const [index, item] of reordered.entries()) {
      await transaction.courseModule.update({
        where: { id: item.id },
        data: { sortOrder: index + 1 },
      });
    }
  });

  revalidateCourseModules(courseModule.courseId, courseModule.course.slug);
  redirect(`${editorPath}?moduleNotice=saved-order`);
}

export async function saveLesson(formData: FormData) {
  const editor = await requireCourseEditor();
  const { role } = editor;
  const moduleId = readText(formData, "moduleId", 36);
  const lessonId = readText(formData, "lessonId", 36);
  const title = readText(formData, "title", 120);
  const isPublished = formData.get("isPublished") === "on";
  const editorPath =
    role === UserRole.TEACHER ? "/teacher/courses" : "/admin/courses";

  if (
    !moduleId ||
    !isUuid(moduleId) ||
    (formData.has("lessonId") && (!lessonId || !isUuid(lessonId))) ||
    !title
  ) {
    redirect(`${editorPath}?notice=invalid-course`);
  }

  const prisma = getPrismaClient();
  const courseModule = await prisma.courseModule.findUnique({
    where: { id: moduleId },
    select: {
      id: true,
      courseId: true,
      course: { select: { slug: true } },
      lessons: { select: { sortOrder: true }, orderBy: { sortOrder: "desc" }, take: 1 },
    },
  });
  if (!courseModule) redirect("/teacher/courses?notice=invalid-course");
  await assertCourseEditorCourseAccess(editor, courseModule.courseId);
  const returnPath = courseContentEditorPath(courseModule.courseId, role);

  if (lessonId) {
    const existingLesson = await prisma.lesson.findFirst({
      where: { id: lessonId, moduleId },
      select: { id: true, sortOrder: true },
    });
    if (!existingLesson) {
      redirect(`${returnPath}?moduleNotice=invalid-lesson`);
    }
    await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        title,
        isPublished,
      },
    });
  } else {
    const sortOrder = (courseModule.lessons[0]?.sortOrder ?? 0) + 1;
    if (sortOrder > 500) {
      redirect(`${returnPath}?moduleNotice=invalid-lesson`);
    }
    await prisma.lesson.create({
      data: {
        moduleId,
        title,
        sortOrder,
        isPublished,
      },
    });
  }

  revalidateLessonPaths(courseModule.courseId, courseModule.course.slug);
  redirect(`${returnPath}?moduleNotice=saved-lesson`);
}

export async function moveLesson(formData: FormData) {
  const editor = await requireCourseEditor();
  const { role } = editor;
  const lessonId = readText(formData, "lessonId", 36);
  const direction = formData.get("direction");
  if (
    !lessonId ||
    !isUuid(lessonId) ||
    (direction !== "up" && direction !== "down")
  ) {
    redirect("/teacher/courses?notice=invalid-course");
  }

  const prisma = getPrismaClient();
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      moduleId: true,
      sortOrder: true,
      module: {
        select: {
          courseId: true,
          course: { select: { slug: true } },
          lessons: {
            orderBy: { sortOrder: "asc" },
            select: { id: true, sortOrder: true },
          },
        },
      },
    },
  });
  if (!lesson) redirect("/teacher/courses?notice=invalid-course");
  await assertCourseEditorCourseAccess(editor, lesson.module.courseId);
  const lessons = lesson.module.lessons;
  const currentIndex = lessons.findIndex((item) => item.id === lesson.id);
  const targetIndex = currentIndex + (direction === "up" ? -1 : 1);
  const returnPath = courseContentEditorPath(lesson.module.courseId, role);
  if (targetIndex < 0 || targetIndex >= lessons.length) {
    redirect(`${returnPath}?moduleNotice=saved-order`);
  }

  const reordered = [...lessons];
  [reordered[currentIndex], reordered[targetIndex]] = [
    reordered[targetIndex],
    reordered[currentIndex],
  ];
  await prisma.$transaction(async (transaction) => {
    const temporaryStart =
      Math.max(...reordered.map((item) => item.sortOrder), 0) + reordered.length;
    for (const [index, item] of reordered.entries()) {
      await transaction.lesson.update({
        where: { id: item.id },
        data: { sortOrder: temporaryStart + index + 1 },
      });
    }
    for (const [index, item] of reordered.entries()) {
      await transaction.lesson.update({
        where: { id: item.id },
        data: { sortOrder: index + 1 },
      });
    }
  });

  revalidateLessonPaths(lesson.module.courseId, lesson.module.course.slug);
  redirect(`${returnPath}?moduleNotice=saved-order`);
}

function isEditableContentKind(value: unknown): value is LessonContentKind {
  return value === LessonContentKind.TEXT || value === LessonContentKind.VIDEO;
}

export async function createLessonContentItem(formData: FormData) {
  const editor = await requireCourseEditor();
  const { role } = editor;
  const lessonId = readText(formData, "lessonId", 36);
  const kind = formData.get("kind");
  if (!lessonId || !isUuid(lessonId) || !isEditableContentKind(kind)) {
    redirect("/teacher/courses?notice=invalid-course");
  }

  const prisma = getPrismaClient();
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      moduleId: true,
      module: { select: { courseId: true, course: { select: { slug: true } } } },
      contentItems: {
        orderBy: { sortOrder: "desc" },
        take: 1,
        select: { sortOrder: true },
      },
    },
  });
  if (!lesson) redirect("/teacher/courses?notice=invalid-course");
  await assertCourseEditorCourseAccess(editor, lesson.module.courseId);
  const returnPath = courseContentEditorPath(lesson.module.courseId, role);
  const sortOrder = (lesson.contentItems[0]?.sortOrder ?? 0) + 1;
  if (sortOrder > 500) {
    redirect(`${returnPath}?moduleNotice=invalid-lesson`);
  }

  await prisma.lessonContentItem.create({
    data: {
      lessonId,
      kind,
      title: kind === LessonContentKind.TEXT ? "Lesson text" : "YouTube video",
      sortOrder,
    },
  });
  revalidateLessonPaths(lesson.module.courseId, lesson.module.course.slug);
  redirect(`${returnPath}?moduleNotice=saved-content`);
}

export async function saveLessonContentItem(formData: FormData) {
  const editor = await requireCourseEditor();
  const { role } = editor;
  const lessonId = readText(formData, "lessonId", 36);
  const contentItemId = readText(formData, "contentItemId", 36);
  const title = readText(formData, "title", 120);
  const itemTitle = formData.get("title");
  const body = readOptionalText(formData, "body", 20000);
  const url = readOptionalText(formData, "url", 2000);
  if (
    !lessonId ||
    !isUuid(lessonId) ||
    !contentItemId ||
    !isUuid(contentItemId) ||
    !title ||
    body === undefined ||
    url === undefined
  ) {
    redirect("/teacher/courses?notice=invalid-course");
  }

  const prisma = getPrismaClient();
  const contentItem = await prisma.lessonContentItem.findFirst({
    where: {
      id: contentItemId,
      lessonId,
      kind: { in: [LessonContentKind.TEXT, LessonContentKind.VIDEO] },
    },
    select: {
      id: true,
      kind: true,
      lesson: {
        select: {
          module: {
            select: { courseId: true, course: { select: { slug: true } } },
          },
        },
      },
    },
  });
  if (!contentItem) redirect("/teacher/courses?notice=invalid-course");
  await assertCourseEditorCourseAccess(
    editor,
    contentItem.lesson.module.courseId,
  );

  if (
    contentItem.kind === LessonContentKind.VIDEO &&
    (!url || !getYouTubeVideoId(url))
  ) {
    redirect(
      `${courseContentEditorPath(
        contentItem.lesson.module.courseId,
        role,
      )}?moduleNotice=invalid-video`,
    );
  }

  await prisma.lessonContentItem.update({
    where: { id: contentItem.id },
    data: {
      title: itemTitle as string,
      body: contentItem.kind === LessonContentKind.TEXT ? body : null,
      url: contentItem.kind === LessonContentKind.VIDEO ? url : null,
    },
  });
  revalidateLessonPaths(
    contentItem.lesson.module.courseId,
    contentItem.lesson.module.course.slug,
  );
  redirect(
    `${courseContentEditorPath(
      contentItem.lesson.module.courseId,
      role,
    )}?moduleNotice=saved-content`,
  );
}

export async function moveLessonContentItem(formData: FormData) {
  const editor = await requireCourseEditor();
  const { role } = editor;
  const contentItemId = readText(formData, "contentItemId", 36);
  const direction = formData.get("direction");
  if (
    !contentItemId ||
    !isUuid(contentItemId) ||
    (direction !== "up" && direction !== "down")
  ) {
    redirect("/teacher/courses?notice=invalid-course");
  }

  const prisma = getPrismaClient();
  const contentItem = await prisma.lessonContentItem.findUnique({
    where: { id: contentItemId },
    select: {
      id: true,
      lessonId: true,
      lesson: {
        select: {
          module: {
            select: { courseId: true, course: { select: { slug: true } } },
          },
          contentItems: {
            orderBy: { sortOrder: "asc" },
            select: { id: true, sortOrder: true },
          },
        },
      },
    },
  });
  if (!contentItem) redirect("/teacher/courses?notice=invalid-course");
  await assertCourseEditorCourseAccess(
    editor,
    contentItem.lesson.module.courseId,
  );
  const contentItems = contentItem.lesson.contentItems;
  const currentIndex = contentItems.findIndex(
    (item) => item.id === contentItem.id,
  );
  const targetIndex = currentIndex + (direction === "up" ? -1 : 1);
  const courseId = contentItem.lesson.module.courseId;
  const slug = contentItem.lesson.module.course.slug;
  const returnPath = courseContentEditorPath(courseId, role);
  if (
    currentIndex === -1 ||
    targetIndex < 0 ||
    targetIndex >= contentItems.length
  ) {
    redirect(`${returnPath}?moduleNotice=saved-order`);
  }

  const reordered = [...contentItems];
  [reordered[currentIndex], reordered[targetIndex]] = [
    reordered[targetIndex],
    reordered[currentIndex],
  ];
  await prisma.$transaction(async (transaction) => {
    const temporaryStart =
      Math.max(...reordered.map((item) => item.sortOrder), 0) +
      reordered.length;
    for (const [index, item] of reordered.entries()) {
      await transaction.lessonContentItem.update({
        where: { id: item.id },
        data: { sortOrder: temporaryStart + index + 1 },
      });
    }
    for (const [index, item] of reordered.entries()) {
      await transaction.lessonContentItem.update({
        where: { id: item.id },
        data: { sortOrder: index + 1 },
      });
    }
  });
  revalidateLessonPaths(courseId, slug);
  redirect(`${returnPath}?moduleNotice=saved-order`);
}

export async function uploadLessonAttachmentAction(formData: FormData) {
  const editor = await requireCourseEditor();
  const { role } = editor;
  const lessonId = readText(formData, "lessonId", 36);
  if (!lessonId || !isUuid(lessonId)) {
    redirect("/teacher/courses?notice=invalid-course");
  }

  const prisma = getPrismaClient();
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      moduleId: true,
      contentItems: {
        orderBy: { sortOrder: "desc" },
        take: 1,
        select: { sortOrder: true },
      },
      module: { select: { courseId: true, course: { select: { slug: true } } } },
    },
  });
  if (!lesson) redirect("/teacher/courses?notice=invalid-course");
  await assertCourseEditorCourseAccess(editor, lesson.module.courseId);

  const returnPath = courseContentEditorPath(lesson.module.courseId, role);
  if ((lesson.contentItems[0]?.sortOrder ?? 0) >= 500) {
    redirect(`${returnPath}?moduleNotice=invalid-lesson`);
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    redirect(
      `${returnPath}?moduleNotice=invalid-attachment`,
    );
  }

  try {
    const uploaded = await uploadLessonAttachment(file, lesson.id);
    try {
      const fileName = file.name
        .replace(/[\u0000-\u001f\u007f]/g, "")
        .slice(0, 255) || "Lesson attachment";
      await prisma.lessonContentItem.create({
        data: {
          lessonId: lesson.id,
          kind: LessonContentKind.ATTACHMENT,
          title: fileName,
          fileName,
          url: uploaded.url,
          storagePath: uploaded.storagePath,
          sortOrder: (lesson.contentItems[0]?.sortOrder ?? 0) + 1,
        },
      });
    } catch (error) {
      try {
        await deleteLessonAttachment(uploaded.storagePath);
      } catch (cleanupError) {
        console.error(
          "Could not clean up an uploaded lesson attachment after its record failed to save.",
          cleanupError,
        );
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof LessonAttachmentUploadError) {
      console.error("Lesson attachment upload failed.", error.message);
      redirect(
        `${courseContentEditorPath(lesson.module.courseId, role)}?moduleNotice=${
          error.kind === "invalid-file"
            ? "invalid-attachment"
            : "attachment-upload-failed"
        }`,
      );
    }
    throw error;
  }

  revalidateLessonPaths(lesson.module.courseId, lesson.module.course.slug);
  redirect(`${returnPath}?moduleNotice=saved-content`);
}

export async function removeLessonContentItem(formData: FormData) {
  const editor = await requireCourseEditor();
  const { role } = editor;
  const contentItemId = readText(formData, "contentItemId", 36);
  if (!contentItemId || !isUuid(contentItemId)) {
    redirect("/teacher/courses?notice=invalid-course");
  }

  const prisma = getPrismaClient();
  const contentItem = await prisma.lessonContentItem.findUnique({
    where: { id: contentItemId },
    select: {
      id: true,
      kind: true,
      storagePath: true,
      lesson: {
        select: {
          moduleId: true,
          module: {
            select: { courseId: true, course: { select: { slug: true } } },
          },
        },
      },
    },
  });
  if (!contentItem) redirect("/teacher/courses?notice=invalid-course");
  await assertCourseEditorCourseAccess(
    editor,
    contentItem.lesson.module.courseId,
  );

  if (contentItem.kind === LessonContentKind.ATTACHMENT) {
    if (!contentItem.storagePath) {
      redirect(
        `${courseContentEditorPath(
          contentItem.lesson.module.courseId,
          role,
        )}?moduleNotice=attachment-remove-failed`,
      );
    }
    try {
      await deleteLessonAttachment(contentItem.storagePath);
    } catch (error) {
      if (error instanceof LessonAttachmentUploadError) {
        console.error("Lesson attachment removal failed.", error.message);
        redirect(
          `${courseContentEditorPath(
            contentItem.lesson.module.courseId,
            role,
          )}?moduleNotice=attachment-remove-failed`,
        );
      }
      throw error;
    }
  }
  await prisma.lessonContentItem.delete({ where: { id: contentItem.id } });
  revalidateLessonPaths(
    contentItem.lesson.module.courseId,
    contentItem.lesson.module.course.slug,
  );
  redirect(
    `${courseContentEditorPath(
      contentItem.lesson.module.courseId,
      role,
    )}?moduleNotice=saved-content`,
  );
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
  revalidatePath("/admin/teachers");
  revalidatePath("/teacher");
  revalidatePath("/teacher/classes");
  revalidatePath("/teacher/courses");
  revalidatePath("/teacher/learners");
  revalidatePath("/teacher/schedule");
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
  const submittedTeacherIds = formData.getAll("teacherIds");
  const teacherIds = submittedTeacherIds.filter(
    (teacherId): teacherId is string => typeof teacherId === "string",
  );
  const uniqueTeacherIds = [...new Set(teacherIds)];

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

  if (
    teacherIds.length !== submittedTeacherIds.length ||
    teacherIds.some((teacherId) => !isUuid(teacherId))
  ) {
    redirect("/admin/cohorts?notice=invalid-teacher-assignment");
  }

  const prisma = getPrismaClient();
  const [course, teachers] = await Promise.all([
    prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true },
    }),
    prisma.userProfile.findMany({
      where: { id: { in: uniqueTeacherIds }, role: UserRole.TEACHER },
      select: { id: true },
    }),
  ]);
  if (!course) redirect("/admin/cohorts?notice=invalid-cohort");
  if (teachers.length !== uniqueTeacherIds.length) {
    redirect("/admin/cohorts?notice=invalid-teacher-assignment");
  }

  try {
    await prisma.$transaction(async (transaction) => {
      const cohort = id
        ? await transaction.cohort.update({
            where: { id },
            data: { courseId, name, startsAt, endsAt, seatLimit, status },
            select: { id: true },
          })
        : await transaction.cohort.create({
            data: { courseId, name, startsAt, endsAt, seatLimit, status },
            select: { id: true },
          });

      await transaction.cohortTeachingAssignment.deleteMany({
        where: { cohortId: cohort.id },
      });
      if (uniqueTeacherIds.length > 0) {
        await transaction.cohortTeachingAssignment.createMany({
          data: uniqueTeacherIds.map((teacherId) => ({
            cohortId: cohort.id,
            teacherId,
          })),
        });
      }
    });
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
