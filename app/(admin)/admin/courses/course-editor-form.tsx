import {
  CourseStatus,
  LessonContentKind,
  ModuleAccessType,
} from "@prisma/client";
import Link from "next/link";
import {
  moveCourseModule,
  moveLesson,
  createLessonContentItem,
  moveLessonContentItem,
  removeLessonContentItem,
  saveCourse,
  saveCourseModule,
  saveLesson,
  saveLessonContentItem,
  uploadLessonAttachmentAction,
} from "@/app/(admin)/admin/actions";
import { CourseImagePicker } from "@/components/geme3t/course-image-picker";
import { CourseModuleDisclosure } from "@/components/geme3t/course-module-disclosure";

type EditableModule = {
  id: string;
  title: string;
  description: string | null;
  sortOrder: number;
  accessTypes: ModuleAccessType[];
  lessons: EditableLesson[];
};

type EditableLesson = {
  id: string;
  title: string;
  sortOrder: number;
  isPublished: boolean;
  contentItems: {
    id: string;
    kind: LessonContentKind;
    title: string | null;
    body: string | null;
    url: string | null;
    fileName: string | null;
    sortOrder: number;
  }[];
};

export type EditableCourse = {
  id: string;
  slug: string;
  title: string;
  category: string;
  description: string;
  imageUrl: string | null;
  durationWeeks: number;
  freeBootcampEnabled: boolean;
  status: CourseStatus;
};

const notices: Record<string, string> = {
  "saved-course": "Course saved.",
  "duplicate-course": "That URL slug is already in use.",
  "invalid-course": "Check the course details and try again.",
  "invalid-course-image": "Choose a valid PNG, JPEG, or WebP image up to 4 MB.",
  "course-image-upload-failed": "The course image could not be uploaded. Check Supabase Storage configuration and try again.",
};

const moduleNotices: Record<string, string> = {
  "saved-module": "Module saved.",
  "saved-order": "Learning path order saved.",
  "saved-lesson": "Lesson saved.",
  "saved-content": "Lesson content saved.",
  "invalid-video": "Enter a valid YouTube video link.",
  "invalid-lesson": "Check the lesson details and try again.",
  "invalid-attachment": "Choose a supported document no larger than 20 MB.",
  "attachment-upload-failed": "The attachment could not be uploaded. Check Supabase Storage configuration and try again.",
  "attachment-remove-failed": "The attachment could not be removed from storage. Try again.",
  "duplicate-module-order": "Another module already uses that order number.",
  "invalid-module": "Check the module details and try again.",
};

const moduleAccessOptions: { value: ModuleAccessType; label: string }[] = [
  { value: ModuleAccessType.FREE_BOOTCAMP, label: "Free Tech Bootcamp" },
  { value: ModuleAccessType.PAID, label: "Paid learners" },
  { value: ModuleAccessType.PROMO, label: "Promo access" },
  { value: ModuleAccessType.ALL_ENROLLED, label: "All enrolled learners" },
];

export function CourseEditorForm({
  course,
  notice,
  modules = [],
  moduleNotice,
  showCourseDetails = true,
  modulePresentation = "accordion",
}: {
  course?: EditableCourse;
  notice?: string;
  modules?: EditableModule[];
  moduleNotice?: string;
  showCourseDetails?: boolean;
  modulePresentation?: "accordion" | "modal";
}) {
  return (
    <>
      {notice && notices[notice] && (
        <p className="admin-notice" role="status">{notices[notice]}</p>
      )}
      {showCourseDetails && <section className="dashboard-panel admin-editor-panel">
        <div className="workspace-panel-heading">
          <div>
            <h2>{course ? "Course details" : "New course"}</h2>
            <p>
              {course
                ? "Update the course information, image, and listing status."
                : "Add a programme to the catalogue. Published courses appear on the public site and application form."}
            </p>
          </div>
        </div>
        <form action={saveCourse} className="admin-edit-form">
          {course && <input name="id" type="hidden" value={course.id} />}
          <label>
            Course name
            <input defaultValue={course?.title} maxLength={120} name="title" required />
          </label>
          <label>
            URL slug
            <input
              defaultValue={course?.slug}
              maxLength={80}
              name="slug"
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              placeholder="course-name"
              required
            />
          </label>
          <label>
            Category
            <input
              defaultValue={course?.category}
              maxLength={80}
              name="category"
              required
            />
          </label>
          <label>
            Duration (weeks)
            <input
              defaultValue={course?.durationWeeks ?? 16}
              max={100}
              min={1}
              name="durationWeeks"
              required
              type="number"
            />
          </label>
          <label className="admin-form-wide">
            Description
            <textarea
              defaultValue={course?.description}
              maxLength={2000}
              name="description"
              required
              rows={3}
            />
          </label>
          <input name="imageUrl" type="hidden" value={course?.imageUrl ?? ""} />
          <CourseImagePicker
            currentImageUrl={course?.imageUrl ?? null}
            required={!course?.imageUrl}
          />
          <label>
            Listing status
            <select defaultValue={course?.status ?? CourseStatus.PUBLISHED} name="status">
              <option value={CourseStatus.DRAFT}>Draft</option>
              <option value={CourseStatus.PUBLISHED}>Published</option>
              <option value={CourseStatus.ARCHIVED}>Archived</option>
            </select>
          </label>
          <label className="course-bootcamp-toggle">
            <input
              defaultChecked={course?.freeBootcampEnabled ?? false}
              name="freeBootcampEnabled"
              type="checkbox"
            />
            <span>
              <strong>Available for the Free Tech Bootcamp</strong>
              <small>Include this course in bootcamp application choices.</small>
            </span>
          </label>
          <div className="admin-form-actions course-editor-actions">
            <Link className="button button--small button--light" href="/admin/courses">
              Cancel
            </Link>
            <button className="button button--small" type="submit">
              {course ? "Save course" : "Add course"}
            </button>
          </div>
        </form>
      </section>}
      {course && (
        <section className="dashboard-panel course-modules-panel">
          <div className="workspace-panel-heading">
            <div>
              <h2>Course modules</h2>
              <p>
                Edit each module’s title, description, and learner access.
                Update its subtopics and lesson content below, then arrange
                modules and lessons with the move controls.
              </p>
            </div>
            <span className="workspace-count">{modules.length} modules</span>
          </div>
          {moduleNotice && moduleNotices[moduleNotice] && (
            <p className="admin-notice" role="status">
              {moduleNotices[moduleNotice]}
            </p>
          )}
          {modules.length > 0 && (
            <div className="course-module-list">
              {modules.map((module, moduleIndex) => (
                <CourseModuleDisclosure
                  accessLabel={
                    module.accessTypes.length === 0
                      ? "Locked"
                      : module.accessTypes.includes(ModuleAccessType.ALL_ENROLLED)
                        ? "Open to all enrolled"
                        : "Restricted access"
                  }
                  key={module.id}
                  lessonCount={module.lessons.length}
                  mode={modulePresentation}
                  moduleId={module.id}
                  moduleNumber={module.sortOrder}
                  title={module.title}
                >
                  <form action={saveCourseModule}>
                    <input name="courseId" type="hidden" value={course.id} />
                    <input name="moduleId" type="hidden" value={module.id} />
                    <input name="sortOrder" type="hidden" value={module.sortOrder} />
                    <p className="admin-form-help">
                      Edit this module’s details and access settings.
                    </p>
                    <div className="admin-edit-form course-module-fields">
                    <label>
                      Module title
                      <input
                        defaultValue={module.title}
                        maxLength={120}
                        name="title"
                        required
                      />
                    </label>
                    <div className="course-module-order">
                      <span>Order</span>
                      <strong>{module.sortOrder}</strong>
                    </div>
                    <label className="admin-form-wide">
                      Description
                      <textarea
                        defaultValue={module.description ?? ""}
                        maxLength={2000}
                        name="description"
                        rows={2}
                      />
                    </label>
                  </div>
                  <fieldset className="course-module-access">
                    <legend>Who can open this module?</legend>
                    <div className="course-module-access-options">
                      {moduleAccessOptions.map(({ value, label }) => (
                        <label key={value}>
                          <input
                            defaultChecked={module.accessTypes.includes(value)}
                            name="accessTypes"
                            type="checkbox"
                            value={value}
                          />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                    <p>
                      Choosing “All enrolled learners” overrides the other
                      groups. No selection means the module stays locked.
                    </p>
                  </fieldset>
                  <div className="course-module-actions">
                    <button className="button button--small" type="submit">
                      Save module changes
                    </button>
                  </div>
                  </form>
                  <div className="course-order-actions">
                    <form action={moveCourseModule}>
                      <input name="moduleId" type="hidden" value={module.id} />
                      <input name="direction" type="hidden" value="up" />
                      <button disabled={moduleIndex === 0} className="button button--small button--light" type="submit">
                        Move module up
                      </button>
                    </form>
                    <form action={moveCourseModule}>
                      <input name="moduleId" type="hidden" value={module.id} />
                      <input name="direction" type="hidden" value="down" />
                      <button disabled={moduleIndex === modules.length - 1} className="button button--small button--light" type="submit">
                        Move module down
                      </button>
                    </form>
                  </div>
                  <div className="course-lessons">
                    <h3>Subtopics and lesson content</h3>
                    {module.lessons.map((lesson, lessonIndex) => (
                      <article className="course-lesson-card" key={lesson.id}>
                        <div className="course-module-card-heading">
                          <span>Lesson {lesson.sortOrder}</span>
                          <strong>{lesson.isPublished ? "Visible in applicant preview" : "Draft · teacher preview only"}</strong>
                        </div>
                        <form action={saveLesson} className="admin-edit-form">
                          <input name="moduleId" type="hidden" value={module.id} />
                          <input name="lessonId" type="hidden" value={lesson.id} />
                          <label>
                            Subtopic title
                            <input defaultValue={lesson.title} maxLength={120} name="title" required />
                          </label>
                          <label className="course-lesson-publish">
                            <input defaultChecked={lesson.isPublished} name="isPublished" type="checkbox" />
                            Show this lesson in the public course preview
                          </label>
                          <div className="course-module-actions">
                            <button className="button button--small" type="submit">Save lesson</button>
                          </div>
                        </form>
                        <div className="course-order-actions">
                          <form action={moveLesson}>
                            <input name="lessonId" type="hidden" value={lesson.id} />
                            <input name="direction" type="hidden" value="up" />
                            <button disabled={lessonIndex === 0} className="button button--small button--light" type="submit">Move lesson up</button>
                          </form>
                          <form action={moveLesson}>
                            <input name="lessonId" type="hidden" value={lesson.id} />
                            <input name="direction" type="hidden" value="down" />
                            <button disabled={lessonIndex === module.lessons.length - 1} className="button button--small button--light" type="submit">Move lesson down</button>
                          </form>
                        </div>
                        {lesson.contentItems.length === 0 && (
                          <p className="campaign-empty">No content items yet. Add lesson text, a video, or a document below.</p>
                        )}
                        {lesson.contentItems.map((item, itemIndex) => (
                          <div className="course-content-editor" key={item.id}>
                            <div className="course-module-card-heading">
                              <span>Item {item.sortOrder} · {item.kind.toLowerCase()}</span>
                              {item.kind === LessonContentKind.ATTACHMENT && item.url && (
                                <a href={item.url} rel="noreferrer" target="_blank">{item.fileName ?? "Open attachment"}</a>
                              )}
                            </div>
                            {item.kind === LessonContentKind.ATTACHMENT ? (
                              null
                            ) : (
                              <form action={saveLessonContentItem} className="admin-edit-form">
                                <input name="lessonId" type="hidden" value={lesson.id} />
                                <input name="contentItemId" type="hidden" value={item.id} />
                                <label className="admin-form-wide">
                                  Item title
                                  <input defaultValue={item.title ?? ""} maxLength={120} name="title" required />
                                </label>
                                {item.kind === LessonContentKind.TEXT ? (
                                  <label className="admin-form-wide">
                                    Text content
                                    <textarea defaultValue={item.body ?? ""} maxLength={20000} name="body" rows={5} />
                                  </label>
                                ) : (
                                  <label className="admin-form-wide">
                                    YouTube video URL
                                    <input defaultValue={item.url ?? ""} name="url" placeholder="https://www.youtube.com/watch?v=..." required type="url" />
                                  </label>
                                )}
                                <div className="course-module-actions admin-form-wide">
                                  <button className="button button--small" type="submit">Save item</button>
                                </div>
                              </form>
                            )}
                            <form action={removeLessonContentItem} className="course-content-remove">
                              <input name="contentItemId" type="hidden" value={item.id} />
                              <button className="courses-table-archive" type="submit">Remove item</button>
                            </form>
                            <div className="course-order-actions">
                              <form action={moveLessonContentItem}>
                                <input name="contentItemId" type="hidden" value={item.id} />
                                <input name="direction" type="hidden" value="up" />
                                <button disabled={itemIndex === 0} className="button button--small button--light" type="submit">Move item up</button>
                              </form>
                              <form action={moveLessonContentItem}>
                                <input name="contentItemId" type="hidden" value={item.id} />
                                <input name="direction" type="hidden" value="down" />
                                <button disabled={itemIndex === lesson.contentItems.length - 1} className="button button--small button--light" type="submit">Move item down</button>
                              </form>
                            </div>
                          </div>
                        ))}
                        <div className="course-add-content">
                          <form action={createLessonContentItem}>
                            <input name="lessonId" type="hidden" value={lesson.id} />
                            <input name="kind" type="hidden" value={LessonContentKind.TEXT} />
                            <button className="button button--small button--light" type="submit">Add text</button>
                          </form>
                          <form action={createLessonContentItem}>
                            <input name="lessonId" type="hidden" value={lesson.id} />
                            <input name="kind" type="hidden" value={LessonContentKind.VIDEO} />
                            <button className="button button--small button--light" type="submit">Add YouTube video</button>
                          </form>
                          <form action={uploadLessonAttachmentAction} className="course-attachment-upload">
                            <input name="lessonId" type="hidden" value={lesson.id} />
                            <label>
                              Upload attachment
                              <input accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv" name="file" required type="file" />
                            </label>
                            <button className="button button--small button--light" type="submit">Upload document</button>
                            <small>PDF, Word, PowerPoint, Excel, TXT, or CSV · up to 20 MB</small>
                          </form>
                        </div>
                      </article>
                    ))}
                    <form action={saveLesson} className="course-lesson-card course-lesson-new admin-edit-form">
                      <input name="moduleId" type="hidden" value={module.id} />
                      <h4 className="admin-form-wide">Add a subtopic</h4>
                      <label>
                        Subtopic title
                        <input maxLength={120} name="title" required />
                      </label>
                      <label className="course-lesson-publish">
                        <input name="isPublished" type="checkbox" />
                        Show this lesson in the public course preview
                      </label>
                      <div className="course-module-actions admin-form-wide">
                        <button className="button button--small" type="submit">Add lesson</button>
                      </div>
                    </form>
                  </div>
                </CourseModuleDisclosure>
              ))}
            </div>
          )}
          <form action={saveCourseModule} className="course-module-card course-module-new">
            <input name="courseId" type="hidden" value={course.id} />
            <div className="course-module-card-heading">
              <span>Add to learning path</span>
              <strong>New module</strong>
            </div>
            <div className="admin-edit-form course-module-fields">
              <label>
                Module title
                <input maxLength={120} name="title" required />
              </label>
              <label>
                Order
                <input
                  defaultValue={
                    modules.reduce(
                      (highest, module) => Math.max(highest, module.sortOrder),
                      0,
                    ) + 1
                  }
                  max={500}
                  min={1}
                  name="sortOrder"
                  required
                  type="number"
                />
              </label>
              <label className="admin-form-wide">
                Description
                <textarea maxLength={2000} name="description" rows={2} />
              </label>
            </div>
            <fieldset className="course-module-access">
              <legend>Who can open this module?</legend>
              <div className="course-module-access-options">
                {moduleAccessOptions.map(({ value, label }) => (
                  <label key={value}>
                    <input name="accessTypes" type="checkbox" value={value} />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
              <p>
                No selection means the module is created locked until access is
                granted.
              </p>
            </fieldset>
            <div className="course-module-actions">
              <button className="button button--small" type="submit">
                Add module
              </button>
            </div>
          </form>
        </section>
      )}
    </>
  );
}
