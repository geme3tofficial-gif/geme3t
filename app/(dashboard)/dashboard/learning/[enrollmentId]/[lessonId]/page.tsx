import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import {
  CourseStatus,
  EnrollmentStatus,
  LessonProgressStatus,
} from "@prisma/client";
import { completeLesson } from "@/app/(dashboard)/dashboard/learning/actions";
import { getLearnerSession } from "@/lib/learner-auth";
import { getPrismaClient } from "@/lib/prisma";
import { getYouTubeVideoId } from "@/lib/youtube";

export const metadata: Metadata = {
  title: "Course lesson",
};

export default async function StudentLessonPage({
  params,
}: {
  params: Promise<{ enrollmentId: string; lessonId: string }>;
}) {
  await connection();
  const [{ enrollmentId, lessonId }, session] = await Promise.all([
    params,
    getLearnerSession(),
  ]);
  if (!session) redirect("/dashboard/sign-in");
  if (session.profile?.role === "ADMIN") redirect("/admin");
  if (session.profile?.role === "TEACHER") redirect("/teacher");
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(enrollmentId) ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(lessonId)
  ) {
    notFound();
  }

  const enrollment = await getPrismaClient().enrollment.findFirst({
    where: {
      id: enrollmentId,
      learnerId: session.user.id,
      status: { in: [EnrollmentStatus.ACTIVE, EnrollmentStatus.COMPLETED] },
      course: { status: CourseStatus.PUBLISHED },
    },
    select: {
      id: true,
      status: true,
      course: {
        select: {
          id: true,
          title: true,
          modules: {
            where: { lessons: { some: { isPublished: true } } },
            orderBy: { sortOrder: "asc" },
            select: { id: true, title: true },
          },
        },
      },
    },
  });
  if (!enrollment) notFound();

  const lesson = await getPrismaClient().lesson.findFirst({
    where: {
      id: lessonId,
      isPublished: true,
      module: { courseId: enrollment.course.id },
    },
    select: {
      id: true,
      title: true,
      description: true,
      module: { select: { id: true, title: true } },
      contentItems: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          kind: true,
          title: true,
          body: true,
          url: true,
          fileName: true,
        },
      },
      progress: {
        where: { enrollmentId },
        select: { status: true },
      },
    },
  });
  if (!lesson) notFound();

  return (
    <>
      <div className="dashboard-welcome">
        <div>
          <span className="eyebrow">{enrollment.course.title} · {lesson.module.title}</span>
          <h1>{lesson.title}</h1>
          {lesson.description && <p>{lesson.description}</p>}
        </div>
        <Link className="text-link" href="/dashboard/learning">
          Back to my learning
        </Link>
      </div>
      <article className="dashboard-panel learner-lesson-content">
        {lesson.contentItems.length === 0 ? (
          <p className="campaign-empty">Lesson materials have not been added yet.</p>
        ) : (
          lesson.contentItems.map((item) => (
            <section key={item.id}>
              {item.title && <h2>{item.title}</h2>}
              {item.kind === "TEXT" && item.body && (
                <div className="learner-lesson-text">{item.body}</div>
              )}
              {item.kind === "VIDEO" && item.url && (
                getYouTubeVideoId(item.url) ? (
                  <div className="learner-lesson-video">
                    <iframe
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      loading="lazy"
                      src={`https://www.youtube-nocookie.com/embed/${getYouTubeVideoId(item.url)}`}
                      title={item.title ?? lesson.title}
                    />
                  </div>
                ) : (
                  <a href={item.url} rel="noopener noreferrer" target="_blank">
                    Open video
                  </a>
                )
              )}
              {item.kind === "ATTACHMENT" && item.url && (
                <a href={item.url} rel="noopener noreferrer" target="_blank">
                  Download {item.fileName ?? item.title ?? "lesson attachment"}
                </a>
              )}
            </section>
          ))
        )}
        {lesson.progress.some(
          ({ status }) => status === LessonProgressStatus.COMPLETED,
        ) ? (
          <p className="admin-notice" role="status">You have completed this lesson.</p>
        ) : (
          <form action={completeLesson} className="learner-lesson-complete">
            <input name="enrollmentId" type="hidden" value={enrollment.id} />
            <input name="lessonId" type="hidden" value={lesson.id} />
            <button className="button button--small" type="submit">
              Mark lesson complete
            </button>
          </form>
        )}
      </article>
    </>
  );
}
