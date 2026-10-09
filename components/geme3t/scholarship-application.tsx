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
import { normalizeWhatsAppNumber, phoneCountries } from "@/lib/phone";
import {
  isFieldEnabled,
  onboardingFieldDefinitions,
  type OnboardingAudience,
  type OnboardingFieldRule,
} from "@/lib/onboarding-fields";
import { toast } from "sonner";
import { BrandedLoader } from "./branded-loader";

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
type PromoOption = {
  value: string;
  courseTitle: string | null;
  discountPercent: number;
};
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
  required?: boolean;
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
  required = true,
}: {
  name: string;
  value: string;
  options: ChoiceOption[];
  onChange: (name: string, value: string) => void;
  columns?: 1 | 2 | 3;
  compact?: boolean;
  required?: boolean;
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
              required={required}
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

function PhoneQuestionField({
  question,
  value,
  countryCode,
  onChange,
}: {
  question: TextQuestion;
  value: string;
  countryCode: string;
  onChange: (name: string, value: string) => void;
}) {
  return (
    <div className="application-single-field">
      <FieldLabel htmlFor={question.key}>
        {question.prompt} <span>*</span>
      </FieldLabel>
      <div className="application-phone-input">
        <label className="application-phone-country">
          <span className="application-visually-hidden">Country calling code</span>
          <select
            aria-label="Country calling code"
            autoComplete="tel-country-code"
            onChange={(event) => onChange("phoneCountry", event.target.value)}
            required
            value={countryCode}
          >
            {phoneCountries.map((country) => (
              <option
                key={country.countryCode}
                title={country.name}
                value={country.countryCode}
              >
                {country.countryCode === "NG" ? "NGN" : country.countryCode} (+
                {country.callingCode})
              </option>
            ))}
          </select>
        </label>
        <input
          autoComplete="tel-national"
          autoFocus
          id={question.key}
          inputMode="tel"
          maxLength={32}
          name={question.key}
          onChange={(event) => onChange(question.key, event.target.value)}
          placeholder="Phone number"
          required
          type="tel"
          value={value}
        />
      </div>
    </div>
  );
}

function makeQuestions(
  answers: Answers,
  courseOptions: string[],
  scholarshipCourseOptions: string[],
  scholarshipOptions: ScholarshipOption[],
  promoOptions: PromoOption[],
  cohortOptions: CohortOption[],
  scholarshipsEnabled: boolean,
  fieldSettings: OnboardingFieldRule[],
): Question[] {
  const scholarshipPath =
    answers.supportType === "I'm here for the free tech bootcamp";
  const promoPath = answers.supportType === "I have a promo code";
  const audience: OnboardingAudience = scholarshipPath
    ? "SCHOLARSHIP"
    : promoPath
      ? "PROMO"
      : "REGULAR";
  const selectedPromo = promoOptions.find(
    (promo) => promo.value.toLowerCase() === answers.promoCode?.trim().toLowerCase(),
  );
  const availableCourseOptions = scholarshipPath
    ? scholarshipCourseOptions
    : selectedPromo?.courseTitle
      ? courseOptions.filter((course) => course === selectedPromo.courseTitle)
      : courseOptions;
  const fieldEnabled = (key: OnboardingFieldRule["fieldKey"]) =>
    isFieldEnabled(fieldSettings, key, audience);
  const questions: Question[] = [{
    key: "firstName",
    title: "Your contact details",
    prompt: "What should we call you?",
    kind: "text",
    autoComplete: "given-name",
    maxLength: 80,
  }];

  if (scholarshipsEnabled || promoOptions.length > 0) {
    const supportOptions: string[] = ["I want to register for a course"];
    if (scholarshipOptions.length > 0 && scholarshipCourseOptions.length > 0) {
      supportOptions.unshift("I'm here for the free tech bootcamp");
    }
    if (promoOptions.length > 0) supportOptions.push("I have a promo code");
    if (scholarshipsEnabled) {
      supportOptions.push("I want specialized training and mentorship");
    }
    questions.push({
      key: "supportType",
      title: "Choose your support",
      prompt: scholarshipsEnabled
        ? "How would you like to join?"
        : "How would you like to enroll?",
      hint: scholarshipsEnabled
        ? "Choose a course, apply for tuition support, or enter a promo code."
        : "Choose a course or enter a promo code.",
      kind: "choice",
      options: supportOptions,
    });
  }

  if (scholarshipPath && scholarshipsEnabled) {
    questions.push({
      key: "scholarship",
      title: "Choose your support",
      prompt: "Choose a scholarship offer",
      hint: "Only available scholarship offers are listed.",
      kind: "choice",
      options: scholarshipOptions,
    });
  }

  if (promoPath) {
    questions.push({
      key: "promoCode",
      title: "Promo enrollment",
      prompt: "Enter your promo code",
      hint: "We’ll apply the promotion to an eligible course.",
      kind: "text",
      maxLength: 80,
    });
  }

  questions.push(
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
      hint: "Choose the country calling code, then enter your number. We’ll save it in international format.",
      kind: "text",
      inputType: "tel",
      autoComplete: "tel",
      maxLength: 32,
    },
  );

  const optionalQuestions = onboardingFieldDefinitions.filter((field) =>
    fieldEnabled(field.key),
  );
  const field = (key: string) =>
    optionalQuestions.find((candidate) => candidate.key === key);

  if (field("gender")) {
    questions.push({
      key: "gender",
      title: "A little about you",
      prompt: "What is your gender?",
      kind: "choice",
      options: ["Female", "Male", "Prefer not to say"],
    });
  }
  if (field("country")) {
    questions.push({
      key: "country",
      title: "A little about you",
      prompt: "Where are you located?",
      kind: "choice",
      options: ["Nigeria", "UK", "United States", "Ghana", "Kenya", "Canada", "Other"],
      columns: 2,
    });
  }
  if (answers.country === "Other" && field("otherCountry")) {
    questions.push({
      key: "otherCountry",
      title: "A little about you",
      prompt: "Which country are you in?",
      kind: "text",
      autoComplete: "country-name",
      maxLength: 80,
    });
  }

  if (field("location")) {
    questions.push({
      key: "location",
      title: "A little about you",
      prompt: "What state or city?",
      hint: "If you’re outside Nigeria, enter your city name.",
      kind: "text",
      autoComplete: "address-level1",
      maxLength: 120,
    });
  }
  if (field("status")) {
    questions.push({
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
    });
  }
  if (field("education")) {
    const educationField = onboardingFieldDefinitions.find(
      (candidate) => candidate.key === "education",
    );
    if (educationField && "options" in educationField) {
      questions.push({
        key: "education",
        title: "Your background",
        prompt: educationField.prompt,
        kind: "choice",
        options: [...educationField.options],
      });
    }
  }

  questions.push({
    key: "course",
    title: "Your learning plan",
    prompt: "Choose a course",
    hint: "Select the course you would like to enroll in.",
    kind: "choice",
    options: availableCourseOptions,
    columns: 2,
  });

  questions.push(
    ...(field("learningMode")
      ? [{
      key: "learningMode",
      title: "Your learning plan",
      prompt: "How would you like to learn?",
      kind: "choice",
      options: learningModes,
      columns: 2,
      } satisfies ChoiceQuestion]
      : []),
    ...(field("startDate") || scholarshipPath
      ? [{
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
      required: scholarshipPath,
      } satisfies ChoiceQuestion]
      : []),
    ...(field("experience")
      ? [{
      key: "experience",
      title: "Your goals",
      prompt: "How much tech experience do you have?",
      hint: "There’s a place for you, even if you’re brand new.",
      kind: "choice",
      options: experienceOptions,
      } satisfies ChoiceQuestion]
      : []),
    ...(field("jobSupport")
      ? [{
      key: "jobSupport",
      title: "Your goals",
      prompt: "Want help with job placement?",
      kind: "choice",
      options: ["Yes, definitely", "Not at the moment"],
      } satisfies ChoiceQuestion]
      : []),
    ...(["specializedFocus", "specializedGoal", "mentorSupport"] as const)
      .filter((key) => field(key))
      .flatMap((key): Question[] => {
        const definition = onboardingFieldDefinitions.find(
          (candidate) => candidate.key === key,
        );
        if (!definition) return [];
        return [
          definition.kind === "choice"
            ? {
                key,
                title: "Your specialized training",
                prompt: definition.prompt,
                kind: "choice" as const,
                options: [...definition.options],
              }
            : {
                key,
                title: "Your specialized training",
                prompt: definition.prompt,
                kind: "text" as const,
                maxLength: 1000,
              },
        ];
      }),

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
  scholarshipCourseOptions,
  scholarshipOptions,
  promoOptions,
  cohortOptions,
  scholarshipsEnabled,
  fieldSettings,
}: {
  courseOptions: string[];
  scholarshipCourseOptions: string[];
  scholarshipOptions: ScholarshipOption[];
  promoOptions: PromoOption[];
  cohortOptions: CohortOption[];
  scholarshipsEnabled: boolean;
  fieldSettings: OnboardingFieldRule[];
}) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [started, setStarted] = useState(false);
  const [hasSwiped, setHasSwiped] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [autoAdvancing, setAutoAdvancing] = useState(false);
  const [answers, setAnswers] = useState<Answers>({
    phoneCountry: "NG",
    supportType: scholarshipsEnabled ? "" : "SELF_FUNDED",
  });
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
    scholarshipCourseOptions,
    scholarshipOptions,
    promoOptions,
    cohortOptions,
    scholarshipsEnabled,
    fieldSettings,
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
      activeQuestion.options.length === 0 &&
      activeQuestion.required !== false
    ) {
      return false;
    }
    if (
      activeQuestion?.key === "course" &&
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
    if (name === "supportType" || name === "firstName") setStarted(true);
    setAnswers((current) => ({
      ...current,
      [name]: value,
      ...(name === "supportType"
        ? {
            scholarship: "",
            promoCode: "",
            course: "",
            startDate: "",
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
          setHasSwiped(true);
          queueAdvance(step + 1);
        } else {
          setDragX(0);
          setDragging(false);
        }
      } else if (step > 0) {
        setHasSwiped(true);
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
    <section
      className={`application-page${started && !submissionStatus?.success ? " application-page--started" : ""}${submissionStatus?.success ? " application-page--complete" : ""}`}
    >
      {!submissionStatus?.success &&
        courseOptions.length === 0 && (
        <p className="application-option-warning" role="status">
          Registration is temporarily unavailable because there are no published courses. Please check back soon.
        </p>
      )}
      {submissionStatus?.success ? (
        <div className="application-success">
          <div aria-hidden="true" className="application-confetti">
            {Array.from({ length: 32 }, (_, index) => (
              <span
                key={index}
                style={{
                  left: `${(index * 37) % 100}%`,
                  animationDelay: `${-(index % 9) * 0.27}s`,
                  animationDuration: `${2.7 + (index % 5) * 0.24}s`,
                  transform: `rotate(${(index * 47) % 360}deg)`,
                }}
              />
            ))}
          </div>
          <div className="application-success-content">
            <div aria-hidden="true" className="application-success-icon">
              ✓
            </div>
            <span className="eyebrow">Your next chapter starts now</span>
            <h1>Congratulations, {answers.firstName}!</h1>
            <p className="application-success-lede">
              You&apos;ve completed your GEME3T application onboarding. Your
              details have been received, and our team will be in touch with
              your next steps.
            </p>
            <a
              className="button application-whatsapp-link"
              href={`/dashboard/sign-in?email=${encodeURIComponent(answers.email ?? "")}`}
            >
              Set up your learner dashboard
              <span aria-hidden="true">→</span>
            </a>
            <p className="application-success-footnote">
              Use your application email to receive a secure sign-in link. Any
              profile fields you skipped can be completed in your dashboard.
            </p>
            <div className="application-success-loader">
              <BrandedLoader />
            </div>
            <p className="application-success-community">
              Stay connected with fellow learners and get the latest academy
              updates in our WhatsApp channel.
            </p>
            <a
              className="button application-whatsapp-link"
              href="https://whatsapp.com/channel/0029VbDsGoFI1rcksIY4Se2W"
              rel="noreferrer"
              target="_blank"
            >
              Join the GEME3T WhatsApp channel
              <span aria-hidden="true">↗</span>
            </a>
            <p className="application-success-footnote">
              Joining the channel is optional and does not affect your application.
            </p>
          </div>
        </div>
      ) : (
      <div className="application-shell">
        <header className="application-intro">
          Join now and start<span className="eyebrow">TRANSFORMING TOMORROW TODAY</span>
          <h1>{scholarshipsEnabled ? "Start learning with " : "Enroll with "}<span>GEME3T Academy</span></h1>
          <p>
            {scholarshipsEnabled
              ? "Choose a course and the learning support that best fits your goals."
              : "Choose a course and take the next step in your learning journey."}
          </p>
          {scholarshipsEnabled && (
            <div className="application-highlights">
              <span><strong>Up to 100%</strong> tuition support</span>
              <span><strong>₦500,000</strong> tuition value</span>
              <span><strong>Application Closes Nov 30, 2026</strong></span>
            </div>
          )}
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
            aria-label={`${scholarshipsEnabled ? "Application" : "Enrollment"} card. Swipe left to continue and right to go back.`}
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
                      {activeQuestion.key === "firstName" && !hasSwiped && (
                        <p className="application-swipe-cue">
                          Swipe left to continue
                          <span aria-hidden="true">→</span>
                        </p>
                      )}
                      {activeQuestion.kind === "choice" ? (
                        <>
                          {activeQuestion.key === "course" && (
                            <p className="application-scroll-cue">
                              {activeQuestion.options.length > 0
                                ? <>Scroll to browse all available courses{" "}<span aria-hidden="true">↓</span></>
                                : "There are currently no published courses to choose from."}
                            </p>
                          )}
                          <fieldset className="application-fieldset application-fieldset--first">
                            <legend className="application-visually-hidden">
                              {activeQuestion.prompt} *
                            </legend>
                            {activeQuestion.options.length === 0 &&
                            (activeQuestion.key !== "startDate" ||
                              activeQuestion.required !== false) ? (
                              <p className="application-inline-note">
                                {activeQuestion.key === "course"
                                  ? "There are currently no published courses to choose from."
                                  : "There are no open cohorts with remaining seats for this course. Please choose another course or check back soon."}
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
                                required={activeQuestion.required !== false}
                                value={answers[activeQuestion.key] ?? ""}
                              />
                            )}
                          </fieldset>
                        </>
                      ) : activeQuestion.key === "phone" ? (
                        <PhoneQuestionField
                          countryCode={answers.phoneCountry ?? "NG"}
                          onChange={updateAnswer}
                          question={activeQuestion}
                          value={answers.phone ?? ""}
                        />
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
                        {(scholarshipsEnabled || answers.promoCode) && (
                          <section>
                            <div>
                              <h3>{scholarshipsEnabled ? "Support" : "Enrollment"}</h3>
                            </div>
                            {reviewAnswer(
                              "supportType",
                              "Registration type",
                              answers.supportType === "SELF_FUNDED"
                                ? "Regular course registration"
                                : answers.supportType ?? "",
                            )}
                            {scholarshipsEnabled &&
                              answers.supportType ===
                              "I'm here for the free tech bootcamp" &&
                              answers.scholarship &&
                              reviewAnswer("scholarship", "Award", answers.scholarship)}
                            {answers.supportType === "I have a promo code" &&
                              answers.promoCode &&
                              reviewAnswer("promoCode", "Promo code", answers.promoCode)}
                          </section>
                        )}
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
                                answers.phoneCountry ?? "NG",
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
                            )?.label ?? "No cohort selected",
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
                        autoAdvancing
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
      )}
    </section>
  );
}
