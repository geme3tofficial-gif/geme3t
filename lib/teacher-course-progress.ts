export function calculateTeacherCourseProgress(
  publishedLessonIds: string[],
  learners: { lessonProgress: { lessonId: string }[] }[],
) {
  const lessonIds = new Set(publishedLessonIds);
  const totalProgress = learners.reduce((completed, learner) => {
    const completedIds = new Set(
      learner.lessonProgress
        .map(({ lessonId }) => lessonId)
        .filter((lessonId) => lessonIds.has(lessonId)),
    );
    return completed + completedIds.size;
  }, 0);
  const totalLessons = lessonIds.size * learners.length;
  return totalLessons ? Math.round((totalProgress / totalLessons) * 100) : 0;
}
