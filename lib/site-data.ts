export type Course = {
  slug: string;
  title: string;
  category: string;
  description: string;
  image: string;
  duration: string;
};

const uploadBase = "/frontend/wp-content/uploads/2025/09";

export const courses: Course[] = [
  {
    slug: "product-management",
    title: "Product Management",
    category: "Product",
    description:
      "Learn to discover customer needs, shape product strategy, and lead teams from idea to launch.",
    image: `${uploadBase}/176744.jpg`,
    duration: "16 weeks",
  },
  {
    slug: "product-design-ui-ux",
    title: "Product Design (UI/UX)",
    category: "Product",
    description:
      "Build thoughtful digital experiences through research, interaction design, and visual craft.",
    image: `${uploadBase}/Frame-43961.png`,
    duration: "16 weeks",
  },
  {
    slug: "cybersecurity",
    title: "Cybersecurity",
    category: "Engineering",
    description:
      "Develop the practical foundations to protect systems, investigate risks, and respond to threats.",
    image: `${uploadBase}/2150038913-1.jpg`,
    duration: "16 weeks",
  },
  {
    slug: "frontend-development",
    title: "Frontend Development",
    category: "Engineering",
    description:
      "Turn ideas into polished, responsive web experiences with modern front-end tools.",
    image: `${uploadBase}/108661.jpg`,
    duration: "16 weeks",
  },
  {
    slug: "data-science",
    title: "Data Science",
    category: "Data & AI",
    description:
      "Use statistics, programming, and machine learning to find insight in real-world data.",
    image: `${uploadBase}/1677.jpg`,
    duration: "16 weeks",
  },
  {
    slug: "backend-development",
    title: "Backend Development",
    category: "Engineering",
    description:
      "Build secure APIs and reliable services that power useful, scalable digital products.",
    image: `${uploadBase}/121390.jpg`,
    duration: "16 weeks",
  },
  {
    slug: "ai-automation",
    title: "AI & Automation",
    category: "Data & AI",
    description:
      "Apply artificial intelligence and automation tools to solve meaningful business problems.",
    image: `${uploadBase}/47.jpg`,
    duration: "16 weeks",
  },
  {
    slug: "product-digital-marketing",
    title: "Product & Digital Marketing",
    category: "Media",
    description:
      "Combine audience insight, product thinking, and digital campaigns to drive sustainable growth.",
    image: `${uploadBase}/2150038913-1.jpg`,
    duration: "16 weeks",
  },
  {
    slug: "social-media-marketing",
    title: "Social Media Marketing",
    category: "Media",
    description:
      "Create social strategies and content that build communities and support business goals.",
    image: `${uploadBase}/108661.jpg`,
    duration: "12 weeks",
  },
  {
    slug: "content-creation",
    title: "Content Creation",
    category: "Media",
    description:
      "Plan, produce, and publish compelling digital content for a changing online world.",
    image: `${uploadBase}/121390.jpg`,
    duration: "12 weeks",
  },
  {
    slug: "graphics-design",
    title: "Graphics Design",
    category: "Media",
    description:
      "Develop visual communication skills and create clear, memorable design work.",
    image: `${uploadBase}/Frame-43961.png`,
    duration: "12 weeks",
  },
  {
    slug: "data-analytics",
    title: "Data Analytics",
    category: "Data & AI",
    description:
      "Turn business data into clear reports, dashboards, and decisions you can act on.",
    image: `${uploadBase}/1677.jpg`,
    duration: "16 weeks",
  },
  {
    slug: "devops-engineering",
    title: "DevOps Engineering",
    category: "Engineering",
    description:
      "Bring development and operations together with cloud, automation, and delivery practices.",
    image: `${uploadBase}/2150038913-1.jpg`,
    duration: "16 weeks",
  },
  {
    slug: "software-development",
    title: "Software Development",
    category: "Engineering",
    description:
      "Learn core software principles and build practical applications from the ground up.",
    image: `${uploadBase}/108661.jpg`,
    duration: "20 weeks",
  },
  {
    slug: "project-management",
    title: "Project Management",
    category: "Product",
    description:
      "Plan, coordinate, and deliver projects with clear communication and confident leadership.",
    image: `${uploadBase}/176744.jpg`,
    duration: "12 weeks",
  },
  {
    slug: "virtual-assistant",
    title: "Virtual Assistant",
    category: "Media",
    description:
      "Build the digital, organizational, and communication skills to support modern teams remotely.",
    image: `${uploadBase}/47.jpg`,
    duration: "12 weeks",
  },
];

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
