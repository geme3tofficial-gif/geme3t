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

const scholarships = [
  {
    label: "Aproko Nation",
    value: "Aproko Nation Tech Scholarship 2026 (up to 100%)",
  },
  {
    label: "The Asherkine",
    value: "The Asherkine Tech Scholarship 2026 (up to 100%)",
  },
  {
    label: "Sir Dickson & Friends",
    value: "Sir Dickson & Friends Tech Scholarship 2026 (up to 100%)",
  },
  {
    label: "Enioluwa",
    value: "Enioluwa Tech Scholarship 2026 (up to 100%)",
  },
  {
    label: "GEME3T",
    value: "GEME3T Scholarship 2026 (up to 100%)",
  },
];

const courses = [
  "AI & Automation",
  "Cybersecurity",
  "Data Analytics",
  "Cloud Computing",
  "Product Design (UI & UX)",
  "Digital Marketing",
  "Product Management",
  "Becoming an Influencer (Content Creation)",
  "Graphics Design",
  "Software Development",
  "Virtual Assistant",
  "DevOps Engineering",
  "Social Media Marketing",
  "Frontend Development",
  "Backend Development",
  "Data Science",
  "Project Management",
  "Product Marketing",
];

const learningModes = [
  { label: "Online", value: "Online" },
  { label: "In-person", value: "Physical (In-person)" },
  { label: "Hybrid", value: "Hybrid (Mix of online & physical)" },
];

const startDates = [
  "October 31, 2026",
  "February 28, 2027",
  "March 30, 2027",
];

const experienceOptions = [
  {
    label: "I’m completely new",
    value: "No, I’m completely new to tech",
  },
  {
    label: "I know a little",
    value: "A little, but I want to deepen my knowledge",
  },
  {
    label: "I have experience",
    value: "Yes, I already have some experience",
  },
];

type Answers = Record<string, string>;
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

function makeQuestions(answers: Answers): Question[] {
  const questions: Question[] = [
    {
      key: "scholarshipInterest",
      title: "Choose your support",
      prompt: "Would you like to apply for a scholarship?",
      hint: "Up to 100% off tuition.",
      kind: "choice",
      options: [
        "Yes, I’d like to apply for a scholarship",
        "No, I’ll self-fund my tuition",
      ],
    },
  ];

  if (answers.scholarshipInterest === "Yes, I’d like to apply for a scholarship") {
    questions.push({
      key: "scholarship",
      title: "Choose your support",
      prompt: "Pick a scholarship",
      hint: "Each award offers up to 100% tuition support.",
      kind: "choice",
      options: scholarships,
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
      hint: "Include your country code if you can.",
      kind: "text",
      inputType: "tel",
      autoComplete: "tel",
      maxLength: 32,
    },
    {
      key: "gender",
      title: "A little about you",
      prompt: "How do you identify?",
      kind: "choice",
      options: ["Female", "Male", "Prefer not to say"],
    },
    {
      key: "country",
      title: "A little about you",
      prompt: "Where are you based?",
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
      hint: "If you’re outside Nigeria, enter your city.",
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
        "Student",
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
        "Mphil / PhD",
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
      options: courses,
      columns: 2,
    },
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
      prompt: "When would you like to start?",
      kind: "choice",
      options: startDates,
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

export function ScholarshipApplication() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [started, setStarted] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [autoAdvancing, setAutoAdvancing] = useState(false);
  const [answers, setAnswers] = useState<Answers>({});
  const activePanelRef = useRef<HTMLDivElement>(null);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const suppressClickRef = useRef(false);
  const autoAdvanceTimerRef = useRef<number | null>(null);
  const questions = makeQuestions(answers);
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
    if (name === "scholarshipInterest") setStarted(true);
    setAnswers((current) => ({
      ...current,
      [name]: value,
      ...(name === "scholarshipInterest" &&
      value === "No, I’ll self-fund my tuition"
        ? { scholarship: "" }
        : {}),
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

  function openApplicationEmail() {
    const body = [
      "2026 Tech Scholarship Application",
      "",
      `Scholarship interest: ${answers.scholarshipInterest}`,
      `Selected scholarship: ${answers.scholarship || "Self-funded"}`,
      "",
      `First name: ${answers.firstName}`,
      `Last name: ${answers.lastName}`,
      `Email address: ${answers.email}`,
      `Phone number: ${answers.phone}`,
      `Gender: ${answers.gender}`,
      `Country: ${answers.country === "Other" ? answers.otherCountry : answers.country}`,
      `State/City: ${answers.location}`,
      `Current employment/study status: ${answers.status}`,
      `Educational level: ${answers.education}`,
      "",
      `Course: ${answers.course}`,
      `Preferred mode of learning: ${answers.learningMode}`,
      `Preferred start date: ${answers.startDate}`,
      `Prior tech experience: ${answers.experience}`,
      `Job placement support: ${answers.jobSupport}`,
      "",
      "Terms and Conditions: Accepted",
    ].join("\n");
    const subject = `2026 Tech Scholarship Application — ${answers.firstName} ${answers.lastName}`;
    window.location.assign(
      `mailto:geme3tofficial@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
    );
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
      <div className="application-shell">
        <header className="application-intro">
          <span className="eyebrow">Your next chapter starts here</span>
          <h1>Apply for the <span>2026 Tech Scholarships</span></h1>
          <p>
            The official GEME3T scholarship application. A few quick
            questions, then you’re ready to review.
          </p>
          <div className="application-highlights">
            <span><strong>Up to 100%</strong> tuition support</span>
            <span><strong>₦447,000</strong> tuition value</span>
            <span><strong>Closes Oct 30, 2026</strong></span>
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
              <li><span aria-hidden="true">✓</span> A community that champions you</li>
            </ul>
            <p className="application-sidebar-note">
              New to tech? You’re in the right place.
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
                onSubmit={(event: FormEvent<HTMLFormElement>) => {
                  event.preventDefault();
                  if (isLastStep && validateActiveStep()) {
                    openApplicationEmail();
                  }
                }}
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
                      {activeQuestion.key === "scholarshipInterest" && (
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
                          {answers.scholarship
                            ? reviewAnswer("scholarship", "Award", answers.scholarship)
                            : reviewAnswer("scholarshipInterest", "Tuition", "Self-funded")}
                        </section>
                        <section>
                          <div>
                            <h3>Contact</h3>
                          </div>
                          {reviewAnswer("firstName", "First name", answers.firstName)}
                          {reviewAnswer("lastName", "Last name", answers.lastName)}
                          {reviewAnswer("email", "Email", answers.email)}
                          {reviewAnswer("phone", "WhatsApp", answers.phone)}
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
                          {reviewAnswer("startDate", "Start date", answers.startDate)}
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
                        Opens a pre-filled email to geme3tofficial@gmail.com.
                        You’ll send it from your email app.
                      </p>
                    </div>
                  )}
                </div>

                <div className="application-form-footer">
                  <span className="application-required-note">
                    {isLastStep
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
                      disabled={isLastStep || autoAdvancing}
                      onClick={goToNextStep}
                      type="button"
                    >
                      Next <span aria-hidden="true">→</span>
                    </button>
                  </nav>
                  {isLastStep ? (
                    <button className="button application-submit" type="submit">
                      Open email draft <span aria-hidden="true">↗</span>
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
          Your details stay on this page until you choose to open your email app.
        </p>
      </div>
    </section>
  );
}
