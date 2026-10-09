import { CourseStatus, ModuleAccessType } from "@prisma/client";
import Link from "next/link";
import { saveCourse, saveCourseModule } from "@/app/(admin)/admin/actions";
import { CourseImagePicker } from "@/components/geme3t/course-image-picker";

type EditableModule = {
  id: string;
  title: string;
  description: string | null;
  sortOrder: number;
  accessTypes: ModuleAccessType[];
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
}: {
  course?: EditableCourse;
  notice?: string;
  modules?: EditableModule[];
  moduleNotice?: string;
}) {
  return (
    <>
      {notice && notices[notice] && (
        <p className="admin-notice" role="status">{notices[notice]}</p>
      )}
      <section className="dashboard-panel admin-editor-panel">
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
      </section>
      {course && (
        <section className="dashboard-panel course-modules-panel">
          <div className="workspace-panel-heading">
            <div>
              <h2>Course modules</h2>
              <p>
                Organize the learning path and choose which learner groups can
                open each module. Leave every group unchecked to keep a module
                locked.
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
              {modules.map((module) => (
                <form
                  action={saveCourseModule}
                  className="course-module-card"
                  key={module.id}
                >
                  <input name="courseId" type="hidden" value={course.id} />
                  <input name="moduleId" type="hidden" value={module.id} />
                  <div className="course-module-card-heading">
                    <span>Module {module.sortOrder}</span>
                    <strong>
                      {module.accessTypes.length === 0
                        ? "Locked"
                        : module.accessTypes.includes(ModuleAccessType.ALL_ENROLLED)
                          ? "Open to all enrolled"
                          : "Restricted access"}
                    </strong>
                  </div>
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
                    <label>
                      Order
                      <input
                        defaultValue={module.sortOrder}
                        max={500}
                        min={1}
                        name="sortOrder"
                        required
                        type="number"
                      />
                    </label>
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
                      Save module
                    </button>
                  </div>
                </form>
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
