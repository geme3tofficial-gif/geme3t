import type { Course } from "@/lib/site-data";
import { getYouTubeVideoId } from "@/lib/youtube";

function isSafeExternalUrl(value: string) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export function CourseCurriculum({
  modules,
  heading = "Course curriculum",
}: {
  modules: NonNullable<Course["modules"]>;
  heading?: string;
}) {
  if (modules.length === 0) return null;

  return (
    <section className="section container course-curriculum">
      <div className="section-heading">
        <span className="eyebrow">Learning path</span>
        <h2>{heading}</h2>
        <p>Explore the modules and lesson resources included in this course.</p>
      </div>
      <div className="course-curriculum-list">
        {modules.map((module) => (
          <details className="course-curriculum-module" key={module.id}>
            <summary className="course-curriculum-module-summary">
              <div className="course-curriculum-module-heading">
                <span>Module {module.sortOrder}</span>
                <span className="course-module-lesson-count">
                  {module.lessons.length}{" "}
                  {module.lessons.length === 1 ? "lesson" : "lessons"}
                </span>
              </div>
              <h3>{module.title}</h3>
            </summary>
            <div className="course-curriculum-module-content">
              {module.description && <p>{module.description}</p>}
              <ol>
                {module.lessons.map((lesson) => {
                  return (
                    <li key={lesson.id}>
                      <div className="course-curriculum-lesson-heading">
                        <h4>{lesson.title}</h4>
                        {!lesson.isPublished && (
                          <span className="course-preview-draft">Draft</span>
                        )}
                      </div>
                      <div className="course-content-items">
                        {lesson.contentItems.map((item) => {
                          const videoId =
                            item.kind === "VIDEO" && item.url
                              ? getYouTubeVideoId(item.url)
                              : null;
                          return (
                            <div className="course-content-item" key={item.id}>
                              {item.title && <h5>{item.title}</h5>}
                              {item.kind === "TEXT" && item.body && (
                                <p className="course-lesson-copy">{item.body}</p>
                              )}
                              {item.kind === "VIDEO" &&
                                (videoId ? (
                                  <div className="course-video-preview">
                                    <iframe
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                      allowFullScreen
                                      loading="lazy"
                                      referrerPolicy="strict-origin-when-cross-origin"
                                      src={`https://www.youtube-nocookie.com/embed/${videoId}`}
                                      title={`YouTube video: ${item.title ?? lesson.title}`}
                                    />
                                  </div>
                                ) : item.url && isSafeExternalUrl(item.url) ? (
                                  <a href={item.url} rel="noreferrer" target="_blank">
                                    Open video
                                  </a>
                                ) : null)}
                              {item.kind === "ATTACHMENT" &&
                                item.url &&
                                isSafeExternalUrl(item.url) && (
                                  <a href={item.url} rel="noreferrer" target="_blank">
                                    {item.fileName ?? item.title ?? "Download resource"}
                                  </a>
                                )}
                            </div>
                          );
                        })}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
