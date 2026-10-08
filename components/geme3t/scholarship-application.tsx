"use client";

import {
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type CSSProperties,
  type ReactNode,
} from "react";
import { submitScholarshipApplication } from "@/app/(geme3t)/apply/actions";
import { normalizeWhatsAppNumber } from "@/lib/phone";
import { toast } from "sonner";

const learningModes = [
  { label: "Online", value: "Online" },
  { label: "physical (on-site with other students)", value: "Physical (on-site)" },
  { label: "physical (privately)", value: "Physical (private)" },
  { label: "Hybrid", value: "Hybrid (both online & physical)" },
];

const experienceOptions = [
  {
    label: "Completely new to tech",
    value: "New to tech",
  },
  {
    label: "I have used a computer and some software",
    value: "Not new to tech",
  },
  {
    label: "I'm comfortable with tech",
    value: "Experienced in tech",
  },
];

type Answers = Record<string, string>;
type ScholarshipOption = { label: string; value: string };
type CohortOption = {
  value: string;
  label: string;
  courseTitle: string;
};
type ChoiceOption = string | { label: string; value: string };
type QuestionBase = {
  key: string;
  title: string;
  prompt: string;
  hint?: string;
};
type ChoiceQuestion = QuestionBase & {
  kind: "choice";
  options: ChoiceOption[];
  columns?: 1 | 2 | 3;
};
type TextQuestion = QuestionBase & {
  kind: "text";
  inputType?: "text" | "email" | "tel";
  autoComplete?: string;
  placeholder?: string;
  maxLength?: number;
};
type Question = ChoiceQuestion | TextQuestion | (QuestionBase & { kind: "review" });

function ChoiceCards({
  name,
  value,
  options,
  onChange,
  columns = 2,
  compact = false,
}: {
  name: string;
  value: string;
  options: ChoiceOption[];
  onChange: (name: string, value: string) => void;
  columns?: 1 | 2 | 3;
  compact?: boolean;
}) {
  return (
    <div
      className={`application-choices application-choices--${columns}${compact ? " application-choices--compact" : ""}`}
    >
      {options.map((option) => {
        const optionValue =
          typeof option === "string" ? option : option.value;
        const optionLabel =
          typeof option === "string" ? option : option.label;

        return (
          <label className="application-choice" key={optionValue}>
            <input
              checked={value === optionValue}
              name={name}
              onChange={() => onChange(name, optionValue)}
              required
              type="radio"
              value={optionValue}
            />
            <span>{optionLabel}</span>
          </label>
        );
      })}
    </div>
  );
}

function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <label className="application-label" htmlFor={htmlFor}>
      {children}
    </label>
  );
}

function TextQuestionField({
  question,
  value,
  onChange,
}: {
  question: TextQuestion;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="application-single-field">
      <FieldLabel htmlFor={question.key}>
        {question.prompt} <span>*</span>
      </FieldLabel>
      <input
        autoComplete={question.autoComplete}
        autoFocus={question.key === "firstName"}
        id={question.key}
        maxLength={question.maxLength}
        name={question.key}
        onChange={(event) => onChange(event.target.value)}
        placeholder={question.placeholder}
        required
        type={question.inputType ?? "text"}
        value={value}
      />
    </div>
  );
}

function makeQuestions(
  answers: Answers,
  courseOptions: string[],
  scholarshipOptions: ScholarshipOption[],
  cohortOptions: CohortOption[],
): Question[] {
  const questions: Question[] = [
    {
      key: "supportType",
      title: "Choose your support",
      prompt: "Would you like to apply for a sponsored training?",
      hint: "Choose a sponsored scholarship or request specialized training and mentorship.",
      kind: "choice",
      options: [
        "I'm here for the free tech bootcamp",
        "I want specialized training and mentorship",
      ],
    },
  ];

  if (answers.supportType === "I'm here for the free tech bootcamp") {
    questions.push({
      key: "scholarship",
      title: "Choose your support",
      prompt: "Pick a scholarship",
      hint: "Scroll to see all scholarships. Only one scholarship can be selected.",
      kind: "choice",
      options: scholarshipOptions,
    });
  }

  questions.push(
    {
      key: "firstName",
      title: "Your contact details",
      prompt: "What should we call you?",
      kind: "text",
      autoComplete: "given-name",
      maxLength: 80,
    },
    {
      key: "lastName",
      title: "Your contact details",
      prompt: "And your last name?",
      kind: "text",
      autoComplete: "family-name",
      maxLength: 80,
    },
    {
      key: "email",
      title: "Your contact details",
      prompt: "Where should we email you?",
      kind: "text",
      inputType: "email",
      autoComplete: "email",
      maxLength: 254,
    },
    {
      key: "phone",
      title: "Your contact details",
      prompt: "What’s your WhatsApp number?",
      hint: "Enter your local number; we’ll remove its leading 0 and add the country code you select. For Other, include + and your country code.",
      kind: "text",
      inputType: "tel",
      autoComplete: "tel",
      maxLength: 32,
    },
    {
      key: "gender",
      title: "A little about you",
      prompt: "What is your gender?",
      kind: "choice",
      options: ["Female", "Male", "Prefer not to say"],
    },
    {
      key: "country",
      title: "A little about you",
      prompt: "Where are you located?",
      kind: "choice",
      options: ["Nigeria", "UK", "United States", "Ghana", "Kenya", "Canada", "Other"],
      columns: 2,
    },
  );

  if (answers.country === "Other") {
    questions.push({
      key: "otherCountry",
      title: "A little about you",
      prompt: "Which country are you in?",
      kind: "text",
      autoComplete: "country-name",
      maxLength: 80,
    });
  }

  questions.push(
    {
      key: "location",
      title: "A little about you",
      prompt: "What state or city?",
      hint: "If you’re outside Nigeria, enter your city name.",
      kind: "text",
      autoComplete: "address-level1",
      maxLength: 120,
    },
    {
      key: "status",
      title: "Your background",
      prompt: "What best describes you today?",
      kind: "choice",
      options: [
        "undergraduate",
        "Graduate",
        "NYSC Corper",
        "Working Professional (Employed)",
        "Self Employed",
        "Unemployed",
        "Other",
      ],
    },
    {
      key: "education",
      title: "Your background",
      prompt: "What’s your highest education level?",
      kind: "choice",
      options: [
        "High School",
        "Degree",
        "Masters",
        "HND",
        "Diploma",
        "OND",
        "PhD",
        "NCE",
        "Other",
      ],
    },
    {
      key: "course",
      title: "Your learning plan",
      prompt: "What would you love to learn?",
      hint: "Scroll the card to explore every course.",
      kind: "choice",
      options: courseOptions,
      columns: 2,
    },
  );

  if (answers.supportType === "I want specialized training and mentorship") {
    questions.push(
      {
        key: "specializedFocus",
        title: "Your specialized training",
        prompt: "What would you like specialized training in?",
        hint: "Tell us the skill, tool, or topic you want to focus on.",
        kind: "text",
        maxLength: 500,
      },
      {
        key: "specializedGoal",
        title: "Your specialized training",
        prompt: "What would you like to achieve?",
        hint: "Share the outcome you want from this training and mentorship.",
        kind: "text",
        maxLength: 1000,
      },
      {
        key: "mentorSupport",
        title: "Your specialized training",
        prompt: "What kind of mentor support would help you most?",
        kind: "choice",
        options: [
          "One-to-one guidance and regular check-ins",
          "Portfolio and project feedback",
          "Career planning and accountability",
          "Practical help with a specific challenge",
        ],
      },
    );
  }

  questions.push(
    {
      key: "learningMode",
      title: "Your learning plan",
      prompt: "How would you like to learn?",
      kind: "choice",
      options: learningModes,
      columns: 2,
    },
    {
      key: "startDate",
      title: "Your learning plan",
      prompt: "Which training cohort would you like to join?",
      hint: cohortOptions.some((cohort) => cohort.courseTitle === answers.course)
        ? "Available cohort start dates are managed by GEME3T Academy."
        : "There are no future cohorts open for this course yet. Please check back soon.",
      kind: "choice",
      options: cohortOptions
        .filter((cohort) => cohort.courseTitle === answers.course)
        .map(({ value, label }) => ({ value, label })),
    },
    {
      key: "experience",
      title: "Your goals",
      prompt: "How much tech experience do you have?",
      hint: "There’s a place for you, even if you’re brand new.",
      kind: "choice",
      options: experienceOptions,
    },
    {
      key: "jobSupport",
      title: "Your goals",
      prompt: "Want help with job placement?",
      kind: "choice",
      options: ["Yes, definitely", "Not at the moment"],
    },
    {
      key: "review",
      title: "Final check",
      prompt: "Ready for your next step?",
      hint: "Review your answers and accept the terms to finish.",
      kind: "review",
    },
  );

  return questions;
}

export function ScholarshipApplication({
  courseOptions,
  scholarshipOptions,
  cohortOptions,
}: {
  courseOptions: string[];
  scholarshipOptions: ScholarshipOption[];
  cohortOptions: CohortOption[];
}) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [started, setStarted] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [autoAdvancing, setAutoAdvancing] = useState(false);
  const [answers, setAnswers] = useState<Answers>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const activePanelRef = useRef<HTMLDivElement>(null);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const suppressClickRef = useRef(false);
  const autoAdvanceTimerRef = useRef<number | null>(null);
  const questions = makeQuestions(
    answers,
    courseOptions,
    scholarshipOptions,
    cohortOptions,
  );
  const activeQuestion = questions[step];
  const isLastStep = activeQuestion?.kind === "review";

  function clearAutoAdvance() {
    if (autoAdvanceTimerRef.current !== null) {
      window.clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    setAutoAdvancing(false);
  }

  function navigateToStep(nextStep: number, focusKey?: string) {
    clearAutoAdvance();
    setDirection(nextStep >= step ? "forward" : "back");
    setDragX(0);
    setDragging(false);
    setStep(nextStep);
    window.requestAnimationFrame(() => {
      const panel = activePanelRef.current;
      if (panel) panel.scrollTop = 0;
      if (panel && focusKey) {
        const controls = Array.from(
          panel.querySelectorAll<HTMLInputElement | HTMLSelectElement>(
            "input, select",
          ),
        ).filter((control) => control.name === focusKey);
        const target =
          controls.find(
            (control) =>
              control instanceof HTMLInputElement &&
              control.type === "radio" &&
              control.checked,
          ) ?? controls[0];
        if (target) {
          target.scrollIntoView({ block: "center", behavior: "smooth" });
          target.focus({ preventScroll: true });
          return;
        }
      }
      panel?.querySelector("h2")?.focus({ preventScroll: true });
    });
  }

  function validateActiveStep() {
    if (
      activeQuestion?.key === "startDate" &&
      activeQuestion.kind === "choice" &&
      activeQuestion.options.length === 0
    ) {
      return false;
    }

    const controls =
      activePanelRef.current?.querySelectorAll<
        HTMLInputElement | HTMLSelectElement
      >("input, select");

    if (!controls) return false;

    for (const control of controls) {
      if (!control.checkValidity()) {
        control.reportValidity();
        return false;
      }
    }

    return true;
  }

  function queueAdvance(nextStep: number) {
    clearAutoAdvance();
    setDirection(nextStep >= step ? "forward" : "back");
    setDragging(false);
    setAutoAdvancing(true);
    autoAdvanceTimerRef.current = window.setTimeout(() => {
      autoAdvanceTimerRef.current = null;
      navigateToStep(nextStep);
    }, 320);
  }

  function goToNextStep() {
    if (step < questions.length - 1 && validateActiveStep()) {
      queueAdvance(step + 1);
    }
  }

  function goToPreviousStep() {
    if (step > 0) queueAdvance(step - 1);
  }

  function updateAnswer(name: string, value: string) {
    if (name === "supportType") setStarted(true);
    setAnswers((current) => ({
      ...current,
      [name]: value,
      ...(name === "supportType"
        ? {
            scholarship: "",
            specializedFocus: "",
            specializedGoal: "",
            mentorSupport: "",
          }
        : {}),
      ...(name === "course" ? { startDate: "" } : {}),
    }));
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("button, a, .application-terms")) {
      return;
    }
    pointerStartRef.current = { x: event.clientX, y: event.clientY };
    setDragging(false);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const start = pointerStartRef.current;
    if (!start) return;
    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (Math.abs(deltaX) < 8 || Math.abs(deltaX) < Math.abs(deltaY)) return;
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    setDragging(true);
    setDragX(deltaX);
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const start = pointerStartRef.current;
    pointerStartRef.current = null;
    if (!start) return;

    const deltaX = event.clientX - start.x;
    if (Math.abs(deltaX) >= 64) {
      suppressClickRef.current = true;
      event.preventDefault();
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
      if (deltaX < 0) {
        if (step < questions.length - 1 && validateActiveStep()) {
          queueAdvance(step + 1);
        } else {
          setDragX(0);
          setDragging(false);
        }
      } else if (step > 0) {
        queueAdvance(step - 1);
      } else {
        setDragX(0);
        setDragging(false);
      }
      return;
    }

    setDragX(0);
    setDragging(false);
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    if ((event.target as HTMLElement).closest("input, select, textarea, button, a")) {
      return;
    }

    event.preventDefault();
    if (event.key === "ArrowLeft") {
      if (step < questions.length - 1 && validateActiveStep()) {
        queueAdvance(step + 1);
      }
    } else if (step > 0) {
      queueAdvance(step - 1);
    }
  }

  function handleClickCapture(event: ReactMouseEvent<HTMLDivElement>) {
    if (!suppressClickRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClickRef.current = false;
  }

  function handlePointerCancel() {
    pointerStartRef.current = null;
    suppressClickRef.current = false;
    setDragX(0);
    setDragging(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isLastStep || !validateActiveStep()) return;

    setIsSubmitting(true);
    try {
      const result = await submitScholarshipApplication(answers);
      setSubmissionStatus(result);
      if (result.success) {
        toast.success(result.message, { id: "application-submit" });
      } else {
        toast.error(result.message, { id: "application-submit" });
      }
    } catch (error) {
      console.error("Application submission failed unexpectedly.", error);
      const result = {
        success: false,
        message:
          "Your application could not be submitted right now. Please try again.",
      };
      setSubmissionStatus(result);
      toast.error(result.message, { id: "application-submit" });
    } finally {
      setIsSubmitting(false);
    }
  }

  const selectedCountry =
    answers.country === "Other" ? answers.otherCountry : answers.country;
  const questionTitle = activeQuestion?.title ?? "Your application";
  const progress = ((step + 1) / questions.length) * 100;

  function goToAnswer(key: string) {
    const answerStep = questions.findIndex((question) => question.key === key);
    if (answerStep >= 0) navigateToStep(answerStep, key);
  }

  function reviewAnswer(key: string, label: string, value: string) {
    return (
      <div className="application-review-answer">
        <span>{label}</span>
        <button
          aria-label={`Edit ${label}: ${value}`}
          onClick={() => goToAnswer(key)}
          type="button"
        >
          {value}
          <span aria-hidden="true">Edit →</span>
        </button>
      </div>
    );
  }

  return (
    <section className={`application-page${started ? " application-page--started" : ""}`}>
      {(courseOptions.length === 0 || scholarshipOptions.length === 0) && (
        <p className="application-option-warning" role="status">
          Applications are temporarily unavailable because there are no active
          course or scholarship offers. Please check back soon.
        </p>
      )}
      <div className="application-shell">
        <header className="application-intro">
          Join now and start<span className="eyebrow">TRANSFORMING TOMORROW TODAY</span>
          <h1>Apply for the <span>Free Tech Bootcamp </span></h1>
          <p>
            Join the next cohort of the GEME3T free tech bootcamp and gain the skills, mentorship, and career support you need to launch your tech career.
          </p>
          <div className="application-highlights">
            <span><strong>Up to 100%</strong> tuition support</span>
            <span><strong>₦500,000</strong> tuition value</span>
            <span><strong>Application Closes Nov 30, 2026</strong></span>
          </div>
        </header>

        <div className="application-layout">
          <aside className="application-sidebar">
            <span className="application-sidebar-kicker">2026 intake</span>
            <h2>From zero to job-ready.</h2>
            <p>Beginner-friendly tech skills, with people in your corner.</p>
            <ul>
              <li><span aria-hidden="true">✓</span> Practical learning</li>
              <li><span aria-hidden="true">✓</span> Internship opportunities</li>
              <li><span aria-hidden="true">✓</span> Career placement support</li>
              <li><span aria-hidden="true">✓</span> A community that transforms you</li>
            </ul>
            <p className="application-sidebar-note">
              New to tech? No worries. GEME3T is beginner-friendly and designed to help you launch your career.
            </p>
          </aside>

          <div
            aria-label="Scholarship application card. Swipe left to continue and right to go back."
            className={`application-deck${dragging ? " is-dragging" : ""}${autoAdvancing ? ` is-advancing is-advancing-${direction}` : ""}${step === 0 ? " is-first-card" : ""}${isLastStep ? " is-last-card" : ""}`}
            onClickCapture={handleClickCapture}
            onKeyDown={handleKeyDown}
            onPointerCancel={handlePointerCancel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            style={{
              "--application-drag-offset": `${Math.max(-44, Math.min(44, dragX * 0.24))}px`,
              "--application-card-drag-offset": `${dragX}px`,
              "--application-card-drag-rotation": `${dragX * 0.018}deg`,
            } as CSSProperties}
            tabIndex={0}
          >
            <div className="application-card">
              <nav aria-label="Application progress" className="application-progress">
                <div
                  aria-valuemax={questions.length}
                  aria-valuemin={1}
                  aria-valuenow={step + 1}
                  className="application-progress-bar"
                  role="progressbar"
                >
                  <span style={{ width: `${progress}%` }} />
                </div>
                <div className="application-progress-caption">
                  <span>STEP {String(step + 1).padStart(2, "0")} / {String(questions.length).padStart(2, "0")}</span>
                  <strong>{questionTitle}</strong>
                </div>
              </nav>

              <form
                className="application-form"
                onSubmit={handleSubmit}
              >
                <div
                  aria-live="polite"
                  className={`application-step application-step--${direction}`}
                  key={activeQuestion?.key}
                  ref={activePanelRef}
                >
                  {activeQuestion && activeQuestion.kind !== "review" && (
                    <div className="application-question">
                      <span className="application-step-eyebrow">
                        {activeQuestion.kind === "choice" ? "Choose one" : "Your answer"}
                      </span>
                      <h2 tabIndex={-1}>{activeQuestion.prompt}</h2>
                      {activeQuestion.hint && (
                        <p className="application-step-lede">{activeQuestion.hint}</p>
                      )}
                      {activeQuestion.key === "supportType" && (
                        <p className="application-swipe-cue">
                          On mobile, swipe left to continue or right to go back.
                        </p>
                      )}
                      {activeQuestion.kind === "choice" ? (
                        <>
                          {activeQuestion.key === "course" && (
                            <p className="application-scroll-cue">
                              Scroll to browse courses, including Product Design (UI & UX){" "}
                              <span aria-hidden="true">↓</span>
                            </p>
                          )}
                          <fieldset className="application-fieldset application-fieldset--first">
                            <legend className="application-visually-hidden">
                              {activeQuestion.prompt} *
                            </legend>
                            {activeQuestion.key === "startDate" &&
                            activeQuestion.options.length === 0 ? (
                              <p className="application-inline-note">
                                There are no open cohorts for this course yet.
                                Please contact the GEME3T team or check back soon.
                              </p>
                            ) : (
                              <ChoiceCards
                                columns={
                                  activeQuestion.key === "course"
                                    ? 2
                                    : activeQuestion.key === "country"
                                      ? 2
                                      : activeQuestion.columns ?? 2
                                }
                                compact={
                                  activeQuestion.key === "course" ||
                                  activeQuestion.key === "status" ||
                                  activeQuestion.key === "education"
                                }
                                name={activeQuestion.key}
                                onChange={updateAnswer}
                                options={activeQuestion.options}
                                value={answers[activeQuestion.key] ?? ""}
                              />
                            )}
                          </fieldset>
                        </>
                      ) : (
                        <TextQuestionField
                          onChange={(value) =>
                            updateAnswer(activeQuestion.key, value)
                          }
                          question={activeQuestion}
                          value={answers[activeQuestion.key] ?? ""}
                        />
                      )}
                    </div>
                  )}

                  {activeQuestion?.kind === "review" && (
                    <div className="application-question application-question--review">
                      <span className="application-step-eyebrow">Final step</span>
                      <h2 tabIndex={-1}>{activeQuestion.prompt}</h2>
                      {activeQuestion.hint && (
                        <p className="application-step-lede">{activeQuestion.hint}</p>
                      )}
                      <p className="application-scroll-cue">
                        Scroll to review your answers. Tap any answer to edit it{" "}
                        <span aria-hidden="true">↓</span>
                      </p>
                      <div className="application-review">
                        <section>
                          <div>
                            <h3>Scholarship</h3>
                          </div>
                          {reviewAnswer(
                            "supportType",
                            "Support",
                            answers.supportType,
                          )}
                          {answers.supportType ===
                            "I'm here for the free tech bootcamp" &&
                            answers.scholarship &&
                            reviewAnswer("scholarship", "Award", answers.scholarship)}
                          {answers.supportType ===
                            "I want specialized training and mentorship" && (
                            <>
                              {reviewAnswer(
                                "specializedFocus",
                                "Specialization",
                                answers.specializedFocus,
                              )}
                              {reviewAnswer(
                                "specializedGoal",
                                "Training goal",
                                answers.specializedGoal,
                              )}
                              {reviewAnswer(
                                "mentorSupport",
                                "Mentor support",
                                answers.mentorSupport,
                              )}
                            </>
                          )}
                        </section>
                        <section>
                          <div>
                            <h3>Contact</h3>
                          </div>
                          {reviewAnswer("firstName", "First name", answers.firstName)}
                          {reviewAnswer("lastName", "Last name", answers.lastName)}
                          {reviewAnswer("email", "Email", answers.email)}
                          {reviewAnswer(
                            "phone",
                            "WhatsApp",
                            (answers.phone &&
                              answers.country &&
                              normalizeWhatsAppNumber(
                                answers.phone,
                                answers.country,
                              )) ||
                              answers.phone,
                          )}
                        </section>
                        <section>
                          <div>
                            <h3>About you</h3>
                          </div>
                          {reviewAnswer("gender", "Gender", answers.gender)}
                          {reviewAnswer(
                            "country",
                            "Country",
                            answers.country === "Other" ? "Other" : selectedCountry,
                          )}
                          {answers.country === "Other" &&
                            reviewAnswer("otherCountry", "Other country", selectedCountry)}
                          {reviewAnswer("location", "State or city", answers.location)}
                        </section>
                        <section>
                          <div>
                            <h3>Background</h3>
                          </div>
                          {reviewAnswer("status", "Status", answers.status)}
                          {reviewAnswer("education", "Education", answers.education)}
                        </section>
                        <section>
                          <div>
                            <h3>Learning plan</h3>
                          </div>
                          {reviewAnswer("course", "Course", answers.course)}
                          {reviewAnswer("learningMode", "Learning mode", answers.learningMode)}
                          {reviewAnswer(
                            "startDate",
                            "Selected cohort",
                            cohortOptions.find(
                              (cohort) => cohort.value === answers.startDate,
                            )?.label ?? "",
                          )}
                        </section>
                        <section>
                          <div>
                            <h3>Your goals</h3>
                          </div>
                          {reviewAnswer("experience", "Tech experience", answers.experience)}
                          {reviewAnswer("jobSupport", "Job placement", answers.jobSupport)}
                        </section>
                      </div>
                      <label className="application-terms">
                        <input
                          checked={answers.terms === "accepted"}
                          name="terms"
                          onChange={(event) =>
                            updateAnswer(
                              "terms",
                              event.target.checked ? "accepted" : "",
                            )
                          }
                          required
                          type="checkbox"
                        />
                        <span>
                          I accept GEME3T’s{" "}
                          <a href="https://tsacademyonline.com/terms-condition/" rel="noreferrer" target="_blank">
                            Terms and Conditions
                          </a>
                          . <strong>*</strong>
                        </span>
                      </label>
                      <p className="application-email-note">
                        Your application will be saved securely for the GEME3T team to review.
                      </p>
                      {submissionStatus && (
                        <p
                          aria-live="polite"
                          className={`application-email-note${submissionStatus.success ? " application-email-note--success" : " application-email-note--error"}`}
                          role="status"
                        >
                          {submissionStatus.message}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="application-form-footer">
                  <span className="application-required-note">
                    {submissionStatus?.success
                      ? "Application submitted"
                      : isLastStep
                      ? "Review your answers to finish"
                      : "Complete this step to continue"}
                  </span>
                  <span className="application-deck-count">
                    {String(step + 1).padStart(2, "0")} / {String(questions.length).padStart(2, "0")}
                  </span>
                  <nav aria-label="Application step navigation" className="application-step-navigation">
                    <button
                      className="application-step-button"
                      disabled={step === 0 || autoAdvancing}
                      onClick={goToPreviousStep}
                      type="button"
                    >
                      <span aria-hidden="true">←</span> Previous
                    </button>
                    <button
                      className="application-step-button"
                      disabled={
                        isLastStep ||
                        autoAdvancing ||
                        (activeQuestion?.key === "startDate" &&
                          activeQuestion.kind === "choice" &&
                          activeQuestion.options.length === 0)
                      }
                      onClick={goToNextStep}
                      type="button"
                    >
                      Next <span aria-hidden="true">→</span>
                    </button>
                  </nav>
                  {isLastStep ? (
                    <button
                      className="button application-submit"
                      disabled={isSubmitting || submissionStatus?.success}
                      type="submit"
                    >
                      {isSubmitting
                        ? "Submitting…"
                        : submissionStatus?.success
                          ? "Application submitted"
                          : "Submit application"}
                    </button>
                  ) : (
                    <span aria-hidden="true" className="application-swipe-direction">←</span>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
        <p className="application-security-note">
          Your application details are sent securely to GEME3T when you submit.
        </p>
      </div>
    </section>
  );
}
