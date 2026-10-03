import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { courses, getCourse, sitePages } from "@/lib/site-data";
import { CourseCard } from "./course-card";
import {
  CallToAction,
  SectionHeading,
  TestimonialCard,
} from "./page-sections";

const schools = [
  {
    title: "School of Products",
    copy: "Learn to shape, design, and deliver products people love.",
    icon: "◈",
    course: "Product Management",
    href: "/product-management",
  },
  {
    title: "School of Engineering",
    copy: "Build the software, systems, and infrastructure behind the digital world.",
    icon: "⌘",
    course: "Software Development",
    href: "/software-development",
  },
  {
    title: "School of Media & Digital Operations",
    copy: "Create meaningful content and help modern brands grow online.",
    icon: "✳",
    course: "Content Creation",
    href: "/content-creation",
  },
  {
    title: "School of Data & Artificial Intelligence",
    copy: "Turn data and emerging technology into practical solutions.",
    icon: "⌁",
    course: "Data Science",
    href: "/data-science",
  },
];

function PageHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="page-hero">
      <div className="container page-heading">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </section>
  );
}

function CoursePage({ slug }: { slug: string }) {
  const course = getCourse(slug);
  if (!course) notFound();

  return (
    <>
      <PageHero
        description={course.description}
        eyebrow={`${course.category} programme`}
        title={course.title}
      />
      <section className="section container">
        <div className="course-detail-grid">
          <div>
            <div className="course-detail-visual">
              <Image
                alt={`${course.title} programme`}
                fill
                priority
                sizes="(max-width: 680px) 100vw, 60vw"
                src={course.image}
              />
            </div>
            <div className="page-content" style={{ marginTop: 35 }}>
              <span className="eyebrow">Course overview</span>
              <h2>Build skills you can put to work.</h2>
              <p>
                This beginner-friendly programme takes you from core concepts
                to practical projects. Work through a structured learning path,
                apply what you learn, and get guidance from experienced
                instructors along the way.
              </p>
              <h2>What you’ll learn</h2>
              <ul className="check-list">
                <li>
                  <span className="check-mark">✓</span>
                  Understand the foundations and tools used in {course.title}.
                </li>
                <li>
                  <span className="check-mark">✓</span>
                  Apply your skills to guided, real-world projects.
                </li>
                <li>
                  <span className="check-mark">✓</span>
                  Communicate your process and present your work with confidence.
                </li>
              </ul>
              <h2>Learn with ongoing support</h2>
              <p>
                Get access to world-class tutors, mentorship, accountability
                check-ins, and a welcoming community of learners.
              </p>
            </div>
          </div>
          <aside className="content-card">
            <span className="eyebrow">Your next step</span>
            <h2 style={{ margin: "8px 0" }}>Start learning with us</h2>
            <p>
              Build a strong foundation with a flexible learning experience and
              support when you need it.
            </p>
            <div className="course-facts">
              <div className="course-fact">
                <span>Level</span>
                <strong>Beginner friendly</strong>
              </div>
              <div className="course-fact">
                <span>Format</span>
                <strong>Flexible learning</strong>
              </div>
              <div className="course-fact">
                <span>Duration</span>
                <strong>{course.duration}</strong>
              </div>
              <div className="course-fact">
                <span>Support</span>
                <strong>Mentors & tutors</strong>
              </div>
            </div>
            <Link className="button" href="/contact">
              Ask about this course <span aria-hidden="true">→</span>
            </Link>
          </aside>
        </div>
      </section>
      <CallToAction />
    </>
  );
}

function CoursesPage() {
  return (
    <>
      <PageHero
        description="Practical, beginner-friendly programmes designed to help you grow your skills and move forward in your career."
        eyebrow="Find your next skill"
        title="Explore our courses"
      />
      <section className="section container">
        <div className="course-grid">
          {courses.map((course) => (
            <CourseCard course={course} key={course.slug} />
          ))}
        </div>
      </section>
      <CallToAction />
    </>
  );
}

function AboutPage() {
  return (
    <>
      <PageHero
        description="We believe that world-class education should be accessible to everyone, wherever they are in their journey."
        eyebrow="About GEME3T Academy"
        title="Learn skills. Earn opportunities. Build your future."
      />
      <section className="section container">
        <div className="split-section">
          <div className="split-image">
            <Image
              alt="GEME3T Academy learning experience"
              fill
              sizes="(max-width: 680px) 100vw, 45vw"
              src="/frontend/wp-content/uploads/2025/09/Frame-2147223862-1-scaled.png"
            />
          </div>
          <div className="split-copy">
            <span className="eyebrow">Our purpose</span>
            <h2>Education that meets you where you are.</h2>
            <p>
              Whether your ambition lies in Product Management, Cybersecurity,
              Data Science, AI & Automation, or becoming a thriving content
              creator, we make it easier to take the first step.
            </p>
            <ul className="check-list">
              <li>
                <span className="check-mark">✓</span>
                Beginner-friendly, flexible programmes
              </li>
              <li>
                <span className="check-mark">✓</span>
                Personalized mentorship and accountability
              </li>
              <li>
                <span className="check-mark">✓</span>
                Practical skills connected to real opportunities
              </li>
            </ul>
            <Link className="button" href="/courses">
              Explore our courses
            </Link>
          </div>
        </div>
      </section>
      <section className="section section-soft">
        <div className="container">
          <SectionHeading
            eyebrow="What matters to us"
            title="A learning experience built around you"
            description="Clear paths, consistent support, and practical work make progress feel possible."
          />
          <div className="feature-grid">
            {[
              ["Personalized mentorship", "Get guidance that helps you move through challenges and stay focused on your goals."],
              ["A welcoming start", "Build confidence with approachable lessons, no matter your experience level."],
              ["Career connections", "Grow practical experience and prepare for the next opportunity."],
            ].map(([title, text]) => (
              <article className="feature-card" key={title}>
                <span className="feature-icon" aria-hidden="true">✦</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <CallToAction />
    </>
  );
}

function SchoolsPage() {
  return (
    <>
      <PageHero
        description="Explore a learning path that brings together practical skills, supportive mentors, and opportunities to grow."
        eyebrow="Find your direction"
        title="Explore our schools"
      />
      <section className="section container">
        <div className="school-grid">
          {schools.map((school) => (
            <article className="school-card" key={school.title}>
              <span className="feature-icon" aria-hidden="true">
                {school.icon}
              </span>
              <h3>{school.title}</h3>
              <p>{school.copy}</p>
              <Link className="text-link" href={school.href}>
                Explore {school.course} <span aria-hidden="true">→</span>
              </Link>
            </article>
          ))}
        </div>
      </section>
      <section className="section section-soft">
        <div className="container" style={{ maxWidth: 790 }}>
          <div className="cta-band">
            <div className="cta-band-inner">
              <div>
                <span className="eyebrow">Scholarships available</span>
                <h2>Take the next step with tuition support.</h2>
                <p>
                  Ask our team about scholarship opportunities and tuition
                  discounts of up to 90%.
                </p>
              </div>
              <Link className="button" href="/contact">
                Ask us how
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function TestimonialsPage() {
  return (
    <>
      <PageHero
        description="Every learner has a different starting point. Here are a few reflections on the learning journey."
        eyebrow="Learner stories"
        title="Small steps. Real progress."
      />
      <section className="section section-soft">
        <div className="container testimonial-grid">
          <TestimonialCard
            course="AI/Automation Student"
            name="TimoDazzle"
            quote="Been able to continue my study on AI/Automation with the recordings. I really got interested in Zapier, Make, and n8n."
          />
          <TestimonialCard
            course="Cybersecurity Student"
            name="Officialmenak"
            quote="Tutors make learning so easy! They explain things simply, leaving you hungry for more."
          />
          <TestimonialCard
            course="AI Automation Student"
            name="Oracle_009"
            quote="I learnt about Trigger and Action and how to connect Google Forms with Google Sheets through Zapier."
          />
          <TestimonialCard
            course="Data Analysis Student"
            name="Gclick_moves"
            quote="I picked up valuable lessons on converting data into an Excel Table and the benefits of working with one."
          />
          <TestimonialCard
            course="Product Design Student"
            name="Kell_vingReddio"
            quote="Today's class on UI/UX was amazing. Every detail was well explained and simplified to our level of understanding."
          />
        </div>
      </section>
      <CallToAction />
    </>
  );
}

function ContactPage() {
  return (
    <>
      <PageHero
        description="Have a question about a course, scholarships, or how to get started? We’d love to hear from you."
        eyebrow="Get in touch"
        title="Let’s talk about your next step."
      />
      <section className="section container">
        <div className="contact-grid">
          <div>
            <span className="eyebrow">Contact details</span>
            <h2 style={{ fontSize: "2rem", letterSpacing: "-0.04em" }}>
              We’re here to help.
            </h2>
            <p style={{ color: "var(--muted)" }}>
              Reach out to our team and we’ll help you find the right
              information.
            </p>
            <div className="contact-details">
              <div className="contact-item">
                <strong>Email</strong>
                <span>
                  <a href="mailto:support@tsacademyonline.com">
                    support@tsacademyonline.com
                  </a>
                </span>
              </div>
              <div className="contact-item">
                <strong>Phone</strong>
                <span>
                  <a href="tel:+447405541451">+44 7405 541451</a>
                </span>
              </div>
              <div className="contact-item">
                <strong>Location</strong>
                <span>61 Hooper Street, B18 7BD, Birmingham</span>
                <span>366 Murtala Muhammed Way, Yaba, Lagos</span>
              </div>
              <div className="contact-item">
                <strong>Office hours</strong>
                <span>Monday–Friday, 9am–5pm</span>
              </div>
            </div>
          </div>
          <form className="contact-form" action="mailto:support@tsacademyonline.com" method="post" encType="text/plain">
            <label>
              Your name
              <input autoComplete="name" name="name" required />
            </label>
            <label>
              Email address
              <input autoComplete="email" name="email" required type="email" />
            </label>
            <label>
              How can we help?
              <textarea name="message" required rows={5} />
            </label>
            <button className="button" type="submit">
              Send your message <span aria-hidden="true">→</span>
            </button>
          </form>
        </div>
      </section>
    </>
  );
}

function LearningPlatformPage() {
  return (
    <>
      <PageHero
        description="Choose your learning platform to continue to your courses."
        eyebrow="Student learning portal"
        title="Which platform is yours?"
      />
      <section className="section container">
        <div className="lms-options">
          <article className="content-card">
            <span className="feature-icon" aria-hidden="true">▣</span>
            <h3>GEME3T Academy learners</h3>
            <p>
              Continue to your learning space to access your courses, lessons,
              and study resources.
            </p>
            <Link className="text-link" href="/dashboard">
              Open student dashboard <span aria-hidden="true">→</span>
            </Link>
          </article>
          <article className="content-card">
            <span className="feature-icon" aria-hidden="true">↗</span>
            <h3>New to GEME3T Academy?</h3>
            <p>
              Browse programmes and speak to our team about the right course
              for you.
            </p>
            <Link className="text-link" href="/courses">
              Find a course <span aria-hidden="true">→</span>
            </Link>
          </article>
          <article className="content-card">
            <span className="feature-icon" aria-hidden="true">▥</span>
            <h3>GEME3T Academy team</h3>
            <p>
              Preview the administration tools and teaching workspace. These
              are sample dashboards and are not connected to live accounts.
            </p>
            <div className="workspace-resource-links">
              <Link className="text-link" href="/admin">
                Admin dashboard preview <span aria-hidden="true">→</span>
              </Link>
              <Link className="text-link" href="/teacher">
                Teacher dashboard preview <span aria-hidden="true">→</span>
              </Link>
            </div>
          </article>
        </div>
        <div className="page-content" style={{ margin: "44px auto 0" }}>
          <h2>Trouble logging in?</h2>
          <p>
            Try clearing your browser cache and cookies, disabling extensions,
            updating your browser, or opening the learning portal in a private
            window. If you still need help, please contact our team.
          </p>
          <Link className="text-link" href="/contact">
            Contact learner support <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </>
  );
}

function EditorialPage() {
  const steps = [
    "Understand the basics",
    "Choose your path",
    "Learn the right tools",
    "Build real projects",
    "Create a portfolio",
    "Learn how the industry works",
    "Take internships or freelance jobs",
    "Keep learning",
  ];
  return (
    <>
      <PageHero
        description="A practical guide to taking your first steps into a technology career."
        eyebrow="Career guide"
        title="Your guide to starting a tech career"
      />
      <section className="section container">
        <article className="page-content">
          <p>
            Starting a new career can feel like a big leap. Breaking the journey
            into manageable steps helps you build confidence and keep moving
            forward.
          </p>
          {steps.map((step, index) => (
            <section key={step}>
              <h2>
                {index + 1}. {step}
              </h2>
              <p>
                Explore the options, practice consistently, and learn from
                real projects and people already working in the field. A
                supportive course can help you build a clear foundation.
              </p>
            </section>
          ))}
          <h2>Keep taking the next step</h2>
          <p>
            There is no single path into technology. Start with a skill that
            interests you, find a learning rhythm that works, and keep building
            on what you know.
          </p>
          <Link className="button" href="/courses">
            Explore courses
          </Link>
        </article>
      </section>
    </>
  );
}

type LegalSection = {
  title: string;
  paragraphs?: string[];
  points?: string[];
  after?: string;
};

const privacySections: LegalSection[] = [
  {
    title: "1. Information We Collect",
    paragraphs: [
      "We collect information to provide better learning experiences and improve our services. The information we collect includes:",
      "Personal information: When you register, enroll in a course, or contact us, we may collect your full name, email address, phone number, billing or payment information, account login credentials, and institution or organization details (if applicable).",
      "Non-personal information: We may also collect browser type and version, IP address, device information, pages visited and time spent on each, and referring website and location data. This information helps us improve user experience and optimize our services.",
    ],
  },
  {
    title: "2. How We Use Your Information",
    paragraphs: ["We use the collected information to:"],
    points: [
      "Provide and manage your access to our courses and resources",
      "Process payments and issue receipts",
      "Communicate with you about updates, offers, or support",
      "Personalize your learning experience",
      "Improve the performance and functionality of our platform",
      "Comply with legal obligations and prevent fraudulent activities",
    ],
  },
  {
    title: "3. How We Protect Your Information",
    paragraphs: [
      "We adopt appropriate data collection, storage, and processing practices, along with security measures, to protect against unauthorized access, alteration, disclosure, or destruction of your personal information.",
      "All data transmission between your browser and our website is protected using SSL (Secure Socket Layer) encryption. Sensitive payment information is handled securely through trusted third-party payment gateways and is not stored on our servers.",
    ],
  },
  {
    title: "4. Sharing Your Information",
    paragraphs: ["We do not sell, trade, or rent users’ personal information. We may share limited data with:"],
    points: [
      "Trusted partners or service providers who help us operate our business (e.g., payment processors, learning management systems, analytics providers)",
      "Law enforcement or regulatory authorities, if required by law",
      "Affiliates or subsidiaries, for administrative or operational purposes",
    ],
  },
  {
    title: "5. Cookies and Tracking Technologies",
    paragraphs: ["Our website uses cookies and similar technologies to:"],
    points: [
      "Enhance site performance",
      "Remember your preferences",
      "Track analytics to improve user experience",
    ],
    after:
      "You can choose to disable cookies in your browser, but some parts of the website may not function properly as a result.",
  },
  {
    title: "6. Your Rights and Choices",
    paragraphs: ["Depending on your location, you may have the right to:"],
    points: [
      "Access, correct, or delete your personal information",
      "Withdraw consent for processing your data",
      "Request a copy of your stored data",
      "Object to certain types of processing",
    ],
    after: "To exercise these rights, please contact us at support@tsacademyonline.com.",
  },
  {
    title: "7. Data Retention",
    paragraphs: [
      "We retain your personal information only as long as necessary for the purposes outlined in this policy, or as required by applicable law.",
      "When you delete your account or unsubscribe from our services, we will remove or anonymize your personal data, unless retention is required for legal, accounting, or security reasons.",
    ],
  },
  {
    title: "8. Third-Party Links",
    paragraphs: [
      "Our platform may contain links to third-party websites or resources. We are not responsible for the privacy practices or content of those websites. Please review their respective privacy policies before providing any personal data.",
    ],
  },
  {
    title: "9. Children’s Privacy",
    paragraphs: [
      "Our website is not intended for children under 16 years of age. We do not knowingly collect personal information from children. If we become aware that we have collected such data, we will delete it immediately.",
    ],
  },
  {
    title: "10. Changes to This Policy",
    paragraphs: [
      "We may update this Privacy Policy from time to time. Updates will be posted on this page with a revised “Last Updated” date. Continued use of our website after such updates signifies your acceptance of the changes.",
    ],
  },
  {
    title: "11. Contact Us",
    paragraphs: [
      "If you have any questions, concerns, or requests regarding this Privacy Policy, please contact GEME3T Academy at support@tsacademyonline.com or visit tsacademyonline.com.",
      "Our mission at GEME3T Academy is to equip Africans with the skills and confidence to thrive in the booming technology and digital industries.",
    ],
  },
];

const termsSections: LegalSection[] = [
  {
    title: "1. Acceptance of Terms",
    paragraphs: [
      "By accessing or using our Services, you confirm that you have read, understood, and agree to these Terms. If you do not agree, you must not use our website or enroll in any course.",
    ],
  },
  {
    title: "2. Eligibility",
    paragraphs: [
      "To use our Services, you must be at least 18 years old or have the consent of a parent or legal guardian. You agree that all information you provide during registration is accurate and up to date.",
    ],
  },
  {
    title: "3. Account Registration",
    paragraphs: [
      "To access certain features, you may need to create an account. You are responsible for maintaining the confidentiality of your login details and for all activities that occur under your account. Notify us immediately if you suspect any unauthorized access or breach of security.",
    ],
  },
  {
    title: "4. Course Enrollment and Access",
    paragraphs: [
      "Upon successful payment, you will gain access to the enrolled course(s) one week before the class resumption date for the duration specified on the course page. Access rights are personal and non-transferable. Sharing your login details or course materials with others is strictly prohibited.",
    ],
  },
  {
    title: "5. Intellectual Property",
    paragraphs: [
      "All course content, including videos, text, images, graphics, and materials on this website, are the intellectual property of GEME3T Academy and are protected by copyright laws. You may not reproduce, distribute, or share any content without prior written permission.",
    ],
  },
  {
    title: "6. User Conduct",
    paragraphs: [
      "You agree not to use the website for unlawful purposes, upload or share harmful, defamatory, or misleading content, or attempt to hack, disrupt, or reverse-engineer any part of the website or course platform.",
    ],
  },
  {
    title: "7. Certificates of Completion",
    paragraphs: [
      "Certificates are issued upon successful completion of a course where applicable. The availability and format of certificates depend on each course’s policy.",
    ],
  },
  {
    title: "8. Scholarships",
    paragraphs: [
      "Scholarships are awarded at the institution’s discretion and are subject to payment of the non-refundable application fee and acceptance into the program. They may cover full or partial tuition as stated in the offer. Scholarships are non-transferable, non-exchangeable, and may be withdrawn if academic or conduct standards are not maintained.",
    ],
  },
  {
    title: "9. Limitation of Liability",
    paragraphs: [
      "We make every effort to provide accurate and reliable content. However, GEME3T Academy is not liable for any direct, indirect, or incidental damages arising from your use of our Services or reliance on course content.",
    ],
  },
  {
    title: "10. Termination",
    paragraphs: [
      "We reserve the right to suspend or terminate your account at our discretion if you violate these Terms or engage in misuse of our Services.",
    ],
  },
  {
    title: "11. Changes to Terms",
    paragraphs: [
      "We may update these Terms occasionally to reflect changes in our operations or legal requirements. Updates will be posted on this page with a revised “Last Updated” date. Continued use of our website indicates your acceptance of the updated Terms.",
    ],
  },
  {
    title: "12. Third-Party Links",
    paragraphs: [
      "Our website may contain links to third-party websites for convenience. We do not endorse or take responsibility for their content, privacy policies, or practices.",
    ],
  },
  {
    title: "13. Contact Us",
    paragraphs: [
      "For questions or concerns regarding these Terms, please contact us at support@tsacademyonline.com or visit tsacademyonline.com.",
      "Our mission at GEME3T Academy is to equip Africans with the skills and confidence to thrive in the booming technology and digital industries.",
    ],
  },
];

function LegalPage({
  title,
  sections,
}: {
  title: "Privacy policy" | "Terms and conditions";
  sections: LegalSection[];
}) {
  return (
    <>
      <PageHero
        description={`Please read our ${title.toLowerCase()} to understand how we support a safe and transparent learning experience.`}
        eyebrow="Legal information"
        title={title}
      />
      <section className="section container">
        <article className="page-content">
          {title === "Privacy policy" ? (
            <p>
              Welcome to GEME3T Academy (“we,” “our,” or “us”). We value
              your privacy and are committed to protecting your personal
              information. This Privacy Policy explains how we collect, use,
              disclose, and safeguard your information when you visit our
              website https://tsacademyonline.com, including related
              platforms, applications, or services. Please read this policy
              carefully. By using our website or services, you consent to it.
            </p>
          ) : (
            <p>
              Welcome to GEME3T Academy (“we,” “our,” “us”). These Terms and
              Conditions (“Terms”) govern your access to and use of our
              website, online courses, and related services (“Services”). By
              using our website or enrolling in any course, you agree to be
              bound by these Terms. Please read them carefully before
              proceeding.
            </p>
          )}
          {sections.map((section) => (
            <section key={section.title}>
              <h2>{section.title}</h2>
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {section.points && (
                <ul>
                  {section.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              )}
              {section.after && <p>{section.after}</p>}
            </section>
          ))}
        </article>
      </section>
    </>
  );
}

export function PublicPage({ slug }: { slug: string }) {
  if (getCourse(slug)) return <CoursePage slug={slug} />;

  switch (slug) {
    case "courses":
      return <CoursesPage />;
    case "about-us":
      return <AboutPage />;
    case "school":
      return <SchoolsPage />;
    case "testimonials":
      return <TestimonialsPage />;
    case "contact":
      return <ContactPage />;
    case "lms-redirect":
      return <LearningPlatformPage />;
    case "feed":
      return <EditorialPage />;
    case "privacy-policy":
      return <LegalPage sections={privacySections} title="Privacy policy" />;
    case "terms-condition":
      return (
        <LegalPage sections={termsSections} title="Terms and conditions" />
      );
    default:
      notFound();
  }
}

export function getPageDescription(slug: string) {
  const course = getCourse(slug);
  if (course) return course.description;
  const descriptions: Record<string, string> = {
    "about-us": "Learn about GEME3T Academy and our approach to practical education.",
    contact: "Talk with GEME3T Academy about courses, scholarships, and getting started.",
    courses: "Explore practical, beginner-friendly programmes at GEME3T Academy.",
    school: "Explore GEME3T Academy schools and find a learning path that fits your goals.",
    testimonials: "Hear reflections from learners building their next skills with GEME3T Academy.",
    "lms-redirect": "Continue to your GEME3T Academy student learning platform.",
    feed: "A practical guide to starting a technology career.",
    "privacy-policy": "Read the GEME3T Academy privacy policy.",
    "terms-condition": "Read the GEME3T Academy terms and conditions.",
  };
  return descriptions[slug] ?? "Explore practical learning with GEME3T Academy.";
}

export function hasPublicPage(slug: string) {
  return courses.some((course) => course.slug === slug) ||
    (sitePages as readonly string[]).includes(slug);
}
