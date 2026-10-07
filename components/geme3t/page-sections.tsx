import Image from "next/image";
import Link from "next/link";
import { CourseCard } from "./course-card";
import { courses } from "@/lib/site-data";

const benefits = [
  {
    icon: "✦",
    title: "Real-world skills",
    copy: "Learn by doing, with hands-on projects that help you turn new knowledge into practical experience.",
  },
  {
    icon: "◎",
    title: "Beginner-friendly",
    copy: "Start from the foundations and follow a clear learning path, with support at every step.",
  },
  {
    icon: "↗",
    title: "People in your corner",
    copy: "Stay on track with mentor guidance, accountability check-ins, and a community of fellow learners.",
  },
];

const testimonials = [
  {
    quote:
      "Been able to continue my study on AI/Automation with the recordings. I really got interested in Zapier, Make, and n8n.",
    name: "TimoDazzle",
    course: "AI/Automation Student",
  },
  {
    quote:
      "Tutors make learning so easy! They explain things simply, leaving you hungry for more.",
    name: "Officialmenak",
    course: "Cybersecurity Student",
  },
  {
    quote:
      "I learnt about Trigger and Action and how to connect Google Forms with Google Sheets through Zapier.",
    name: "Oracle_009",
    course: "AI Automation Student",
  },
];

export function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Your next chapter starts here</span>
            <h1>
              Redefining learning for the <span>future workforce.</span>
            </h1>
            <p>
              Build practical, in-demand skills with flexible learning and
              personal support—wherever you are starting from.
            </p>
            <div className="hero-actions">
              <Link className="button" href="/apply">
                Apply for a scholarship <span aria-hidden="true">→</span>
              </Link>
              <Link className="button button--light" href="/courses">
                Explore our courses
              </Link>
            </div>
            <div className="hero-note">
              <span className="check-mark">✓</span>
              <span>
                Designed for <strong>beginners and career changers</strong>
              </span>
            </div>
          </div>
          <div className="hero-visual" aria-label="A learner studying online">
            <div className="hero-image">
              <Image
                alt="A learner studying online"
                fill
                priority
                sizes="(max-width: 680px) 90vw, 48vw"
                src="/frontend/wp-content/uploads/2025/09/n-nb-m-1.png"
              />
            </div>
            <div className="floating-card">
              <span className="floating-icon" aria-hidden="true">
                ↗
              </span>
              <span>
                <strong>Learn at your pace</strong>
                <span>With real people beside you</span>
              </span>
            </div>
          </div>
        </div>
      </section>
      <div className="trust-strip">
        <span>Training recognised by our global partner</span>
        <Image
          alt="American Council of Training and Development"
          height={300}
          src="/frontend/wp-content/uploads/2025/12/ACTD-2.png"
          width={300}
        />
      </div>
      <section className="section container">
        <SectionHeading
          eyebrow="Learning made practical"
          title="A better way to build your future"
          description="At GEME3T Academy, we’re more than an academy—we’re your partner in growth."
        />
        <div className="feature-grid">
          {benefits.map((benefit) => (
            <article className="feature-card" key={benefit.title}>
              <span aria-hidden="true" className="feature-icon">
                {benefit.icon}
              </span>
              <h3>{benefit.title}</h3>
              <p>{benefit.copy}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="section section-soft">
        <div className="container">
          <SectionHeading
            eyebrow="Explore our courses"
            title="Find the skills that move you forward"
            description="Choose a practical programme built to help you take the next step in your career."
          />
          <div className="course-grid">
            {courses.slice(0, 6).map((course) => (
              <CourseCard course={course} key={course.slug} />
            ))}
          </div>
          <div className="section-action">
            <Link className="button button--light" href="/courses">
              View all programmes <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>
      <section className="section container">
        <div className="split-section">
          <div className="split-image">
            <Image
              alt="GEME3T Academy learning community"
              fill
              sizes="(max-width: 680px) 100vw, 45vw"
              src="/frontend/wp-content/uploads/2025/09/Frame-2147223869.png"
            />
          </div>
          <div className="split-copy">
            <span className="eyebrow">Skills that open doors</span>
            <h2>Learning should take you somewhere.</h2>
            <p>
              Our programmes connect guided learning with the kind of practical
              work you can take into your next opportunity.
            </p>
            <ul className="check-list">
              <li>
                <span className="check-mark">✓</span>
                Beginner-friendly lessons and clear milestones
              </li>
              <li>
                <span className="check-mark">✓</span>
                Hands-on projects to grow your portfolio
              </li>
              <li>
                <span className="check-mark">✓</span>
                Mentors and check-ins to keep your momentum
              </li>
            </ul>
            <Link className="text-link" href="/about-us">
              Discover the GEME3T Academy approach <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>
      <section className="section section-soft">
        <div className="container">
          <SectionHeading
            eyebrow="Learner stories"
            title="Progress looks different for everyone"
            description="A supportive community can make all the difference as you build your next skill."
          />
          <div className="testimonial-grid">
            {testimonials.map((testimonial) => (
              <TestimonialCard
                course={testimonial.course}
                key={testimonial.course}
                name={testimonial.name}
                quote={testimonial.quote}
              />
            ))}
          </div>
        </div>
      </section>
      <CallToAction />
    </>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="section-heading">
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  );
}

export function TestimonialCard({
  name,
  course,
  quote,
}: {
  name: string;
  course: string;
  quote: string;
}) {
  return (
    <article className="testimonial-card">
      <div aria-label="5 out of 5 stars" className="testimonial-stars">
        ★★★★★
      </div>
      <p>“{quote}”</p>
      <div className="testimonial-person">
        <span className="avatar" aria-hidden="true">
          TS
        </span>
        <span>
          <strong>{name}</strong>
          <span>{course}</span>
        </span>
      </div>
    </article>
  );
}

export function CallToAction() {
  return (
    <section className="section container">
      <div className="cta-band">
        <div className="cta-band-inner">
          <div>
            <span className="eyebrow">Start where you are</span>
            <h2>Make your next move a confident one.</h2>
            <p>
              Find a programme that fits your goals and get the support to see
              it through.
            </p>
          </div>
          <Link className="button" href="/courses">
            Find your course <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
