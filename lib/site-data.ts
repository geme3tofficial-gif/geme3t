import catalogData from "./catalog-data.json";

export type Course = {
  slug: string;
  title: string;
  category: string;
  description: string;
  image: string;
  duration: string;
};

export const courses: Course[] = catalogData.courses.map(
  ({ durationWeeks, ...course }) => ({
    ...course,
    duration: `${durationWeeks} weeks`,
  }),
);

export const sitePages = [
  "about-us",
  "ai-automation",
  "backend-development",
  "contact",
  "content-creation",
  "courses",
  "cybersecurity",
  "data-analytics",
  "data-science",
  "devops-engineering",
  "feed",
  "frontend-development",
  "graphics-design",
  "lms-redirect",
  "privacy-policy",
  "product-design-ui-ux",
  "product-digital-marketing",
  "product-management",
  "project-management",
  "school",
  "social-media-marketing",
  "software-development",
  "terms-condition",
  "testimonials",
  "virtual-assistant",
] as const;

export function getCourse(slug: string) {
  return courses.find((course) => course.slug === slug);
}

export function getPageTitle(slug: string) {
  if (slug === "about-us") return "About us";
  if (slug === "contact") return "Contact";
  if (slug === "courses") return "Our courses";
  if (slug === "school") return "Explore our schools";
  if (slug === "testimonials") return "Learner stories";
  if (slug === "privacy-policy") return "Privacy policy";
  if (slug === "terms-condition") return "Terms and conditions";
  if (slug === "lms-redirect") return "Learning platform";
  if (slug === "feed") return "Your guide to starting a tech career";
  return getCourse(slug)?.title ?? "GEME3T Academy";
}
