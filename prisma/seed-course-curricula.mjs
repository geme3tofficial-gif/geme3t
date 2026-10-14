import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const curriculumText = {
  "frontend-development": `
Introduction to the Web | How the web and internet work | Research and learning
HTML Fundamentals | Document structure, metadata, and attributes | Headings, sections, and text basics | Lists, links, and navigation
Advanced HTML and Semantic Layout | Multimedia and tables | Forms and buttons | Semantic HTML
CSS Basics | Box model | Selectors and nesting | Cascade, specificity, and inheritance | Sizing units, typography, and custom fonts
Layout Techniques | Layout foundations | Flexbox and Grid | Responsive web design
CSS Styling and Animations | Transitions | Animations
JavaScript Basics | Variables, data types, and operators | Conditionals, loops, and functions | Arrays and objects
DOM Manipulation and Events | Selecting and modifying elements | Event handling and form validation
APIs and Asynchronous JavaScript | Fetch API, promises, and async/await | Working with JSON data
Career Readiness and Next Steps | Git basics, branching, and merging | Collaborating on GitHub | Hosting projects on GitHub
Introduction to React | JSX and project setup | Components, props, and state
React Routing and API Integration | React Router | Fetching data from APIs
Capstone Project | Build and deploy a complete frontend web app
`,
  "ai-automation": `
Introduction to AI and Automation | What is AI? | What is prompt engineering? | What is automation? | Types of automation | Overview of automation platforms | Relationships and advanced data structures | Examples and practice questions
AI Automation in Practice | Planning an automation project | Automation best practices | Workflow design principles | Common automation use cases
Zapier and Smart Workflow Automation | Introduction to Zapier and how it works | Triggers, actions, and paths | Formatters and delays | Webhooks | Code by Zapier | Integrating Google Workspace tools
Make and Advanced Workflow Automation | Introduction to Make and how it works | Scenarios, modules, and data mapping | Triggers and actions | Routers, filters, and logic | Webhooks and custom integrations | Data stores and API connections | Building multi-app workflows | Real-world case studies and assignment
n8n Advanced Workflow Automation | Introduction to n8n and its interface | Nodes, triggers, and workflows | Build simple automations step by step | Logic controls and data transformations | Webhooks and API integrations | Error handling and execution control | Practice: create a three-step automated workflow
Essential n8n Nodes and Core Building Blocks | Ten essential nodes at a glance | Logic nodes: If and Switch | Merge data streams | Data nodes: Set, Split in Batches, and Aggregate | Control nodes: HTTP Request, Code, Wait, and Error Trigger | Choosing the right node | Node identification and configuration exercises
Combining Nodes to Build Real Workflows | Workflow architecture and node selection | Lead qualification: Webhook, Set, If, Switch, HTTP Request, and Merge | Order processing: Trigger, Split in Batches, Code, If, HTTP Request, Aggregate, and Error Trigger | Customer support ticket routing | Debugging and testing | Production workflow best practices | Hands-on end-to-end workflow
Chatbot Development and Implementation | Introduction to chatbots | Chatbot use cases | Voiceflow, n8n, Chatbase, and ManyChat | Other platforms | Advanced chatbot features | Exercise
AI Agents and Agentic Systems | Understanding AI agents | Types of AI agents | Low-code/no-code platforms: n8n and Relevance AI | Code-first frameworks: LangChain | Multi-agent systems | Agent capabilities and applications | Governance and safety | Design and build an AI agent exercise
AI Agents and Smart Automation with n8n | AI-powered automation | Connect n8n with OpenAI, ChatGPT, Claude, and other AI tools | Use APIs to build AI agents | Integrate ManyChat and Voiceflow | Connect Airtable and Google Sheets | Lead generation and customer support automation | Multi-channel workflows | AI agent case study and assignment
Vibe Coding and AI-Powered Development | Introduction to vibe coding | Vibe coding philosophy | AI-powered IDEs and code editors | No-code and low-code platforms such as Bolt.new | Vibe coding workflow | Challenges and limitations | Exercise
AI Voice Agents and Conversational AI | Introduction to AI voice agents | Voice agent capabilities | Vapi and Retell AI | Other voice AI platforms such as ElevenLabs | Voice agent use cases | Voice AI best practices | Exercise
`,
  "backend-development": `
Introduction to Backend Development | What backend development is and why it matters | Frontend and backend differences | Daily work of backend developers | Why JavaScript and Node.js are popular | Backend career opportunities
Understanding How the Web Works | Client-server architecture | What happens when you visit a website | HTTP/HTTPS and status codes | APIs and application communication | REST API principles
JavaScript Fundamentals for Backend | JavaScript syntax and basic concepts | let, const, and var | Data types, arrays, and objects | Functions and arrow functions | Callbacks and asynchronous concepts | map, filter, and forEach
Introduction to Node.js and NPM | Node.js runtime | NPM and package management | package.json | Built-in fs, path, and http modules | ES6+ destructuring, spread, and template literals
Building Your First API with Express.js | Set up an Express server | Routes and HTTP methods | Middleware | JSON responses | Request parameters and body data
Working with Databases (MongoDB) | Why databases are used | SQL vs NoSQL | MongoDB collections and documents | Mongoose | CRUD operations
Authentication and Security Basics | Why security matters | Password hashing with bcrypt | JWT authentication | Environment variables and secret handling | Common security mistakes
Working with External APIs and Services | Consume third-party APIs | Axios and fetch | API keys and documentation | Errors and rate limits | Email services | CORS | File uploads with Multer
Deployment and Version Control | Git and GitHub | Core Git commands and branches | .gitignore and secrets | Deploy on Render, Railway, or Cyclic | Production environment variables
Capstone Project: Complete Backend Project | Build a blog or content API | Build an e-commerce backend | Build a task or project-management API | Basic server management
Career Readiness and Next Steps | Developer portfolio and GitHub profile | Technical documentation and READMEs | Technical interviews | Job descriptions | Freelance and company career paths | Open-source contributions
`,
  "cybersecurity": `
Foundations of Cybersecurity and Computing | Cybersecurity and its importance | Evolution and domains | Threat, vulnerability, and exploit terminology | CIA triad, AAA, and risk | SOC, penetration testing, and GRC roles | Ethics | Linux and Windows fundamentals
Networking and Threat Fundamentals | OSI and TCP/IP models | Network topologies and devices | IP addressing, DNS, and subnetting | DoS, spoofing, and sniffing | Phishing, malware, and social engineering | Defense in depth
Defensive Security Operations (SOC and Incident Response) | SOC structure, roles, and escalation tiers | Wazuh and Splunk SIEM | Log analysis and correlation | NIST incident response lifecycle | Documentation and reporting | IOC identification | Career focus workshop
Offensive Security and Vulnerability Management | Ethical hacking | PTES and OWASP frameworks | Active and passive reconnaissance | Vulnerability scanning and exploitation | OWASP Top 10 | Reporting and documentation
Cloud Security and Identity Management | IaaS, PaaS, and SaaS | Shared responsibility model | Identity and access management | Cloud threats and best practices | Azure and AWS security tools
Governance, Risk, and Compliance (GRC) | Governance and compliance | ISO 27001 and NIST CSF | Identify, treat, and monitor risk | Policy creation and enforcement | Security audits and awareness training
Final Capstone: Defend and Respond | Reflection, team planning, and project briefing | Integrate SOC, threat intelligence, penetration testing, and GRC | Simulated breach and response | Detection, containment, eradication, and reporting
`,
  "data-analytics": `
Introduction to Data Analysis | What data analysis is and why it matters | Data analysis process | Analyst roles, skills, and career paths | Exercise: identify how a business uses data
Understanding the Data Landscape | Databases, files, APIs, and online sources | Structured and unstructured data | Collect, clean, analyze, visualize, and report workflow | Research a relevant dataset
Core Analytical Skills and Foundations | Excel formulas, SQL syntax, and Power BI | Analytical questions and data interpretation | Communication, storytelling, and attention to detail
Mastering Excel for Data Analysis | Data cleaning, formatting, and transformation | VLOOKUP, INDEX-MATCH, IF, and SUMIFS | Pivot tables and charts | Analyze sales data and share insights
SQL for Data Querying and Insights | Databases and relationships | SELECT, WHERE, ORDER BY, and GROUP BY | Joins, subqueries, and aggregations | Query a sample database
Power BI for Visualization and Dashboards | Power BI interface | Power Query | Data models and relationships | Interactive dashboards and reports | Build a sample business dashboard
Practical Data Projects | End-to-end analysis with Excel, SQL, and Power BI | Real-world project simulation | Present a final project dashboard
Analyzing Data with AI | ChatGPT, Copilot, and analyst tools | AI for cleaning, summarization, and reporting | AI in Power BI and Excel | Automate part of an analysis
Building Your Portfolio and Resume | Structure an analytics portfolio | Data-role resume templates | Add a finished project to your portfolio
Career Readiness and Next Steps | Job applications and interviews | Freelance, remote, and full-time data roles | Continuous learning
`,
  "data-science": `
Python for Data Science | Python basics, variables, types, loops, and conditionals | Functions and modules | File and exception handling | NumPy arrays | Pandas reading, filtering, and aggregation | Missing values and outliers | Descriptive statistics
Data Visualization and Statistics | Matplotlib visualizations | Seaborn histograms, boxplots, and pairplots | Correlation and covariance | Probability distributions | Hypothesis testing and p-values | Consumer dataset mini project
Introduction to Machine Learning | Supervised and unsupervised learning | Linear and logistic regression | Train/test split and evaluation metrics | House-price or loan-default mini project
SQL and Supervised Learning | SELECT, WHERE, ORDER BY, and LIMIT | Joins, GROUP BY, and HAVING | Subqueries and aggregations | SQL with Python, SQLite, and SQLAlchemy | Analyze a dataset with SQL and Pandas
Decision Trees and Ensemble Learning | Decision trees and random forests | Feature importance and cross-validation | Avoiding overfitting | Customer churn mini project
Classification and Model Evaluation | K-nearest neighbors | ROC, F1, precision, and recall | Imbalanced data, SMOTE, and class weights | Fraud detection or medical diagnosis mini project
Feature Engineering and Hyperparameter Tuning | Scikit-learn pipelines | GridSearchCV and RandomizedSearchCV | Bias-variance tradeoff | Model optimization challenge
Unsupervised Learning and Clustering | K-means and hierarchical clustering | Elbow method and silhouette score | PCA | Customer market segmentation activity
Time Series Analysis | Trend, seasonality, and residuals | Lag features and rolling statistics | ARIMA basics | Sales or stock price forecasting activity
Model Deployment with Streamlit | Serialize models with Pickle or Joblib | Build Streamlit dashboards | Deploy locally
Model Explainability and Ethics | Feature importance visualization | SHAP and LIME | Ethical AI and fairness | Explainable credit-risk activity
Capstone Project | Present a capstone project | GitHub portfolio with notebook, README, and visualizations | Optional deployed Streamlit app
`,
  "devops-engineering": `
DevOps Culture and Linux Basics | Introduction to DevOps | Linux introduction and setup
Linux Command Line Mastery | Essential Linux commands and file management | Process management and system operations
Linux Networking and Bash Scripting | Linux networking fundamentals | Introduction to Bash scripting
Bash Scripting and Git | Bash scripting | Git and version control fundamentals
Docker Fundamentals | Docker and containers | Docker images and Dockerfile | Docker networking, volumes, and Compose | Assignment
Cloud Computing with AWS | AWS and cloud computing | EC2 and core compute services | AWS storage and networking | IAM and security best practices | AWS services integration project
Terraform Fundamentals | Infrastructure as code and Terraform | Resources and variables
Terraform and Real-World Scenarios | Advanced Terraform features | Complete infrastructure project
CI/CD with GitHub Actions | Introduction to CI/CD and GitHub Actions | Build complete CI/CD pipelines
Advanced CI/CD and Deployment Strategies | Advanced GitHub Actions and deployment patterns | Deploy infrastructure with GitHub Actions and Terraform
Kubernetes Fundamentals and Deep Dive | Introduction to Kubernetes | Pods, deployments, and services | ConfigMaps, secrets, and persistent storage | Networking and ingress
Kubernetes Production Readiness and Helm | Kubernetes best practices | Helm package manager | Advanced Helm and deployment strategies | AWS EKS
Monitoring and Logging | Prometheus and Grafana | Centralized logging with ELK Stack
CI/CD for Kubernetes and Final Project | Complete Kubernetes CI/CD pipeline | Project kickoff and DevOps best practices | Final project work sessions | Project presentations and graduation
`,
  "product-digital-marketing": `
Foundations of Product and Digital Marketing | Product marketing vs digital marketing | Digital channels | Marketing and product growth | Customer journey and funnel
Market Research, Buyer Personas, and Positioning | Audience and market opportunities | Buyer personas and user journeys | Pain points and segmentation | Value propositions and messaging | SEO, SEM, social, email, and content channels | Competitor analysis and SWOT | Case studies
Performance Marketing Fundamentals | Google, Meta, and LinkedIn paid ads | Google Tag Manager and event tracking | Campaign setup, targeting, and budgeting | Conversion tracking and analytics | Lookalike audiences and retargeting
Content, Social Media, and Email Marketing | Content strategies | Social campaigns and community building | Influencer and partnership marketing | Email automation and nurturing | Paid social structure and objectives | CPC, CTR, ROAS, and CPM | B2B LinkedIn and email lead generation
Go-to-Market Strategy and Product Launch | GTM objectives, channels, and audiences | Pricing and product lifecycle | Pre-launch, launch, and post-launch | Sales and customer success alignment | Launch success metrics
Platform Strategy, Influencer Marketing, and B2B | Major platform strategies and best practices | Identify and partner with influencers | B2B strategies | Successful tech product launch case studies
CRM, Automation, and Lifecycle Marketing | HubSpot, Zoho, and Salesforce basics | Marketing automation | Automate workflows | Awareness, activation, retention, and referral journeys
Analytics and Optimization | Google Analytics 4 and conversion tracking | Landing pages | A/B testing and funnel optimization | Reporting and growth insights | Segmentation and personalization
SEO and SEM | On-page, off-page, and technical SEO | Keyword research | Paid search campaigns
Capstone Project | Create a B2C or B2B marketing strategy | Set up campaigns, track metrics, and present outcomes | Build a marketing portfolio | CV, LinkedIn, and personal brand
`,
  "graphics-design": `
Introduction, Course Overview, and Design Tools | Photoshop, Canva, and Illustrator | Key digital skills
Learning to See Like a Designer | Observation as a design skill | Visual literacy, positive and negative space, and focal points | Gestalt and unified compositions
Contrast and Composition | Contrast and its impact | Figure/ground, hierarchy, and emphasis | Rhythm and movement
Introduction to Type and Hierarchy | Typography basics | Type contrast and hierarchy | Combine type and visual elements clearly
Color Theory and Visual Impact | Color theory and psychology | Emphasis and mood with color and value | Use color to clarify and organize
Grids, Guides, and Creating Movement | Grids, columns, and ratios | Movement and flow | Alignment and rhythm
The Life of a Designer | Guest interview and industry insights | Real-world processes, challenges, and opportunities
Studio Practice and Class Q&A | Common challenges | Recap key skills | Q&A, troubleshooting, and peer support
Advanced Typography and Simplifying Design | Typography and shape language | Simplify complex ideas | Case studies
Message and Meaning in Design | Combine type, color, shape, and layout | Clarity without losing depth | Assignment
Client Project: The Final Boss | Interpret a real or simulated client brief | Plan, execute, and revise from feedback | Assignment
Portfolio and Next Steps | Select work and write project descriptions | PDF, web, and Behance portfolios | Job search and freelance opportunities
`,
  "product-design-ui-ux": `
Introduction to Product Design | Product design and industry expectations | Product designer role | Design thinking and human-centered design | Figma, Miro, and Notion | Exercise
UX Fundamentals and Design Thinking | UX principles | Empathize, define, ideate, prototype, and test | User research and interviews | Assignment
Information Architecture and User Flows | Information architecture | IA tools and techniques | User and task flows | Sitemaps | Class exercise
Wireframing and Low-Fidelity Prototyping | Wireframe principles | Layout and hierarchy | Sketching interfaces | Build Figma prototypes | Assignment
UI Basics: Layout, Typography, and Colors | UI design principles and usability heuristics | Typography and color | Visual hierarchy and WCAG accessibility | Design systems | Capstone brief
High-Fidelity Design and Components | Reusable Figma components | Auto Layout and constraints | Grids and responsive layouts | Visual consistency and branding | Assignments
Prototyping and Microinteractions | Figma prototyping | Smart Animate and transitions | Microinteractions | Assignments
Usability Testing and Iteration | Set usability test goals | Test planning and recruitment | Moderated and unmoderated testing | Analyze feedback and iterate
Product Thinking and Strategy | Design and business success | Decisions based on business goals | Measure design impact | Assignments
Design Handoff and Collaboration | Figma handoff | Design documentation | Collaborate with developers and product managers | Version control and comments
Portfolio Building and Case Studies | Compelling case studies | Storytelling for product designers | UX portfolio structure | Present design work
Final Project Presentation and Review | Present final projects | Peer review and feedback | Next steps in a design career
`,
  "product-management": `
Introduction to Product Management | Product management and relevance | Scope, purpose, roles, and responsibilities | Bridge business, technology, and users | Product development lifecycle | Organize and manage a product team | Product management tools | Software development methodologies
Understanding Users and Market Research | Customer discovery and problem validation | JTBD, personas, and empathy maps | Segmentation and competitor analysis | Persona building
Product Vision, Strategy, and Roadmapping | Product vision and mission | Vision statements | North Star metrics, OKRs, and KPIs | Roadmapping tools | Create a high-level roadmap
Ideation, Hypothesis Creation, and Validation | RICE and MoSCoW prioritization | Minimum viable product | Validate metrics | Form testable hypotheses
Defining Requirements: PRD and User Stories | Write product requirements documents | PRD anatomy | INVEST user stories | Features, acceptance criteria, and breakdown
Agile Development and Working with Engineering | Agile, Scrum, and Kanban | Sprint planning and backlog grooming | Standups and retrospectives | Collaborate with engineering
User-Centered Design | User-centered design | Research fundamentals | Define problems | Design for users | Test and iterate | Apply UCD to product workflows | UX collaboration | Accessibility and inclusion
Data, Metrics, and Product Analytics | AARRR product success metrics | Product analytics tools
Go-to-Market Strategy and Launch Planning | Product positioning and messaging | Marketing, sales, and customer success | Launch checklist | Growth loops and early traction
Stakeholder Management and Communication | Stakeholder mapping | Cross-functional relationships | RACI and DACI | Influence through storytelling and data | Product updates
Career Preparation | Demonstrate end-to-end skills | Product management terminology | Product CV | Interview and portfolio preparation
`,
  "project-management": `
Introduction to Product Management | Foundational project elements | Project, program, portfolio, and operations management | Project governance
Project Management Principles and Systems for Delivery | Project environment | Project Management Office (PMO)
Project Lifecycle and Development Approach | Initiating, planning, executing, monitoring, and controlling | Predictive, adaptive, and hybrid approaches
Project Management Domain: Scope Management | Scope planning and requirements | Define scope | Work breakdown structure | Validate and control scope
Project Management Domain: Schedule Management | Schedule planning and activity definition | Sequence activities and estimate duration | Develop and control schedule
Project Management Domain: Finance, Cost, and Resource Management | Cost planning and estimation | Cost control and budgets | Estimate, acquire, and manage resources
Project Management Domain: Stakeholder and Team Management | Identify and engage stakeholders | Manage stakeholders across the lifecycle | Collaborative project team environments
Project Management Domain: Risk and Quality Management | Identify project risks | Risk analysis and responses | Monitor risk | Quality planning, management, and control
Other Domains: Communication and Procurement Management | Communication management | Procurement planning, conduct, and control
Tailoring Projects | Tailor processes and project domains | Models, methods, and artifacts | AI for projects | Product and project management intersection
Wrap Up, Career Preparation, and Capstone | CV and interview preparation | Demonstrate project skills across industries | Apply skills in a capstone
`,
  "social-media-marketing": `
Introduction to Social Media Marketing | Evolution and business impact | Platforms and audience behavior | Marketing funnel and touchpoints | Organic and paid social | Reach, engagement, conversion, and retention
Social Media Strategy and Planning | Content calendars and campaign roadmaps | Brand tone, messaging, and identity | Buffer, Hootsuite, and Notion
Content Strategy, Creative Development, and Storytelling | Storytelling frameworks and content pillars | Education, entertainment, and engagement | Visual impact | Captions and calls to action | Trends, reels, and viral content
Platform Strategy and Community Growth | Build online communities | Instagram and TikTok short-form storytelling | LinkedIn B2B authority | YouTube content, SEO, and monetization | X conversation marketing | Canva, CapCut, Notion, ChatGPT, and Figma | DMs, feedback, and user-generated content
Paid Advertising and Performance Marketing | Paid social objectives and structure | Meta, TikTok, and LinkedIn campaigns | Targeting, budgeting, and A/B testing | Lookalike audiences and retargeting
Analytics, Growth, and Community Management | Native platform insights and Google Analytics | Community management and feedback | Loyalty and influencer collaboration | CPC, CTR, ROAS, and CPM reporting
Influencer Marketing, Collaboration, and B2B Social Media | Find and partner with creators | Influencer contracts, briefs, and deliverables | LinkedIn and YouTube B2B strategy | Employer branding and thought leadership | ROI and brand lift
Capstone Project | Plan a 360-degree social campaign | Set objectives, calendars, and ads | Report results | Build a case study, content samples, and personal brand
`,
  "software-development": `
Introduction to Full Stack Development | Frontend, backend, and databases | Full-stack developer roles | Tools, technologies, and development environments
Web Fundamentals | Client-server model | HTTP, browsers, and APIs | HTML, CSS, and JavaScript
HTML Deep Dive | Build web page structures | Semantic HTML and accessibility | Forms, tables, and multimedia
CSS and Responsive Design | CSS selectors, box model, and Flexbox | Grid and media queries | Animations and transitions
JavaScript Programming | Variables, data types, loops, and functions | DOM and events | ES6+ and modular JavaScript
Frontend Frameworks (React.js) | Introduction to React | Components, props, and state | Hooks and React Router | APIs in React
Version Control and Collaboration | Git basics and branching | GitHub and pull requests | Collaborative workflows
Backend Development with Node.js and Express | Node.js and NPM | REST APIs with Express | Routing, middleware, and controllers
Databases and Data Modeling | SQL and NoSQL | Database schema design | MongoDB or PostgreSQL | CRUD and relationships
Authentication and Authorization | Registration and login systems | JWT and cookies | Role-based access control
API Development and Integration | Build and test APIs with Postman | Connect frontend and backend | Errors and validation
Deployment and DevOps Basics | Host frontend and backend apps | CI/CD introduction | Environment variables and production builds
Testing and Debugging | Unit and integration testing with Jest or Mocha | Debugging tools and techniques | Code quality and linting
Advanced Topics | TypeScript basics | Performance optimization | Docker and cloud deployment
Capstone Project | Plan, build, and deploy a full-stack app | Integrate authentication, database, and APIs | Host and present the final project
`,
  "virtual-assistant": `
Introduction to the Virtual Assistant Profession | Who is a virtual assistant? | Common misconceptions | Remote work opportunities and VA roles | Why become a VA? | Exercise
Skills Self-Assessment and Growth Plan | Soft skills: communication, time management, and adaptability | Hard skills: research, writing, data entry, and customer support | Professional communication and file organization
Tools for Virtual Assistance | Google Workspace and Microsoft 365 | Slack, Zoom, Notion, Asana, and Trello | Document management and scheduling
Client Communication and Task Management | Structure workflows and manage multiple clients | Emails, appointments, and calls | Professional messages and reports | Organize and prioritize tasks | Exercise
AI, Social Media, and Content Management | Create, schedule, and manage Canva content | AI and virtual assistance | ClickUp, Asana, ChatGPT, and Otter.ai
Email and Calendar Management | Inbox organization | Calendar management
Research, Reporting, and Documentation | Conduct research | Prepare reports | Present updates effectively
Branding and Career Growth as a Virtual Assistant | Create an online profile and portfolio | Find clients on Upwork, Fiverr, and LinkedIn | Build long-term client relationships
`,
  "content-creation": `
PLACEHOLDER: Content Strategy and Audience | Identify target audiences and content goals | Define content pillars and a brand voice
PLACEHOLDER: Writing and Storytelling | Develop ideas and story outlines | Write clear scripts, captions, and calls to action
PLACEHOLDER: Visual Content Production | Plan photos and graphics | Create and edit short-form visual content
PLACEHOLDER: Audio and Video Production | Prepare a basic recording setup | Record, edit, and caption audio or video
PLACEHOLDER: Publishing and Distribution | Choose suitable platforms and formats | Build a publishing calendar | Repurpose content for multiple channels
PLACEHOLDER: Analytics and Portfolio | Review reach, engagement, and audience feedback | Improve content using performance insights | Assemble a sample content portfolio
`,
};

function parseCurriculum(text) {
  return text
    .trim()
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [title, ...topics] = line.split("|").map((part) => part.trim());
      if (!title || topics.length === 0 || topics.some((topic) => !topic)) {
        throw new Error(`Invalid curriculum row: ${line}`);
      }
      return { title, topics };
    });
}

async function main() {
  const catalogCourses = await prisma.course.findMany({
    select: { id: true, slug: true, title: true },
  });
  const bySlug = new Map(catalogCourses.map((course) => [course.slug, course]));
  const missingCourses = Object.keys(curriculumText).filter(
    (slug) => !bySlug.has(slug),
  );
  if (missingCourses.length > 0) {
    throw new Error(
      `Curriculum references unknown course slugs: ${missingCourses.join(", ")}`,
    );
  }

  let seededCourses = 0;
  let seededModules = 0;
  let seededLessons = 0;

  for (const [slug, text] of Object.entries(curriculumText)) {
    const course = bySlug.get(slug);
    const modules = parseCurriculum(text);
    const result = await prisma.$transaction(
      async (tx) => {
        const existingCount = await tx.courseModule.count({
          where: { courseId: course.id },
        });
        if (existingCount > 0) return { skipped: true };

        for (const [index, module] of modules.entries()) {
          await tx.courseModule.create({
            data: {
              courseId: course.id,
              title: module.title,
              description: module.title.startsWith("PLACEHOLDER:")
                ? "Placeholder curriculum. Replace these topics with the approved Content Creation course outline."
                : null,
              sortOrder: index + 1,
              lessons: {
                create: module.topics.map((topic, lessonIndex) => ({
                  title: topic,
                  sortOrder: lessonIndex + 1,
                  isPublished: true,
                })),
              },
            },
          });
        }
        return {
          skipped: false,
          moduleCount: modules.length,
          lessonCount: modules.reduce(
            (total, module) => total + module.topics.length,
            0,
          ),
        };
      },
      { maxWait: 20_000, timeout: 120_000 },
    );

    if (result.skipped) {
      console.info(
        `Skipped ${course.title}: existing modules were left unchanged.`,
      );
      continue;
    }
    seededCourses += 1;
    seededModules += result.moduleCount;
    seededLessons += result.lessonCount;
    console.info(
      `Added ${result.moduleCount} modules and ${result.lessonCount} topics to ${course.title}.`,
    );
  }

  console.info(
    `Curriculum seed complete: ${seededCourses} courses, ${seededModules} modules, and ${seededLessons} topics added.`,
  );
}

main()
  .catch((error) => {
    console.error("Course curriculum seeding failed.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
