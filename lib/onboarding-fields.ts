export const onboardingAudiences = [
  { value: "REGULAR", label: "Regular enrollment" },
  { value: "SCHOLARSHIP", label: "Scholarship" },
  { value: "PROMO", label: "Promo" },
] as const;

export type OnboardingAudience =
  (typeof onboardingAudiences)[number]["value"];

export const onboardingFieldDefinitions = [
  {
    key: "gender",
    label: "Gender",
    prompt: "What is your gender?",
    kind: "choice",
    options: ["Female", "Male", "Prefer not to say"],
  },
  {
    key: "country",
    label: "Country",
    prompt: "Where are you located?",
    kind: "choice",
    options: ["Nigeria", "UK", "United States", "Ghana", "Kenya", "Canada", "Other"],
  },
  {
    key: "otherCountry",
    label: "Other country",
    prompt: "Which country are you in?",
    kind: "text",
  },
  {
    key: "location",
    label: "State or city",
    prompt: "What state or city?",
    kind: "text",
  },
  {
    key: "status",
    label: "Current status",
    prompt: "What best describes you today?",
    kind: "choice",
    options: [
      "Undergraduate",
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
    label: "Highest education level",
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
    key: "learningMode",
    label: "Learning mode",
    prompt: "How would you like to learn?",
    kind: "choice",
    options: [
      { label: "Online", value: "Online" },
      { label: "Physical (on-site with other students)", value: "Physical (on-site)" },
      { label: "Physical (privately)", value: "Physical (private)" },
      { label: "Hybrid", value: "Hybrid (both online & physical)" },
    ],
  },
  {
    key: "startDate",
    label: "Training cohort",
    prompt: "Which training cohort would you like to join?",
    kind: "cohort",
  },
  {
    key: "experience",
    label: "Tech experience",
    prompt: "How much tech experience do you have?",
    kind: "choice",
    options: [
      { label: "Completely new to tech", value: "New to tech" },
      {
        label: "I have used a computer and some software",
        value: "Not new to tech",
      },
      { label: "I'm comfortable with tech", value: "Experienced in tech" },
    ],
  },
  {
    key: "jobSupport",
    label: "Job placement support",
    prompt: "Want help with job placement?",
    kind: "choice",
    options: ["Yes, definitely", "Not at the moment"],
  },
  {
    key: "specializedFocus",
    label: "Specialized training focus",
    prompt: "What would you like specialized training in?",
    kind: "text",
  },
  {
    key: "specializedGoal",
    label: "Specialized training goal",
    prompt: "What would you like to achieve?",
    kind: "text",
  },
  {
    key: "mentorSupport",
    label: "Mentor support",
    prompt: "What kind of mentor support would help you most?",
    kind: "choice",
    options: [
      "One-to-one guidance and regular check-ins",
      "Portfolio and project feedback",
      "Career planning and accountability",
      "Practical help with a specific challenge",
    ],
  },
] as const;

export type OnboardingFieldKey =
  (typeof onboardingFieldDefinitions)[number]["key"];

export type OnboardingFieldRule = {
  fieldKey: OnboardingFieldKey;
  audiences: string[];
};

export function isOnboardingAudience(
  value: string,
): value is OnboardingAudience {
  return onboardingAudiences.some((audience) => audience.value === value);
}

export function isOnboardingFieldKey(
  value: string,
): value is OnboardingFieldKey {
  return onboardingFieldDefinitions.some((field) => field.key === value);
}

export function isFieldEnabled(
  settings: OnboardingFieldRule[],
  fieldKey: OnboardingFieldKey,
  audience: OnboardingAudience,
) {
  return settings.find((setting) => setting.fieldKey === fieldKey)?.audiences
    .includes(audience) ?? false;
}

export function defaultOnboardingFieldSettings(): OnboardingFieldRule[] {
  return onboardingFieldDefinitions.map(({ key }) => ({
    fieldKey: key,
    audiences:
      key === "startDate"
      ? ["REGULAR", "SCHOLARSHIP", "PROMO"]
        : key === "education" ||
            key === "specializedFocus" ||
            key === "specializedGoal" ||
            key === "mentorSupport"
          ? []
          : ["REGULAR", "SCHOLARSHIP", "PROMO"],
  }));
}
