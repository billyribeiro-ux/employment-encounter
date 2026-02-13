import Link from "next/link";
import {
  Brain,
  KanbanSquare,
  Video,
  GraduationCap,
  Heart,
  Shield,
  UserCheck,
  ArrowRight,
  Star,
  CheckCircle2,
  Sparkles,
  Play,
  Twitter,
  Linkedin,
  Github,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const features = [
  {
    icon: Brain,
    title: "AI-Powered Matching",
    description:
      "Our AI analyzes skills, culture fit, and career trajectory to find perfect matches.",
    gradient: "from-violet-500 to-purple-600",
    bgGlow: "bg-violet-500/10",
  },
  {
    icon: KanbanSquare,
    title: "Visual Pipeline",
    description:
      "Drag-and-drop Kanban boards for every stage of your hiring process.",
    gradient: "from-blue-500 to-cyan-500",
    bgGlow: "bg-blue-500/10",
  },
  {
    icon: Video,
    title: "Video Interviews",
    description:
      "Built-in async and live video interviews with AI transcription.",
    gradient: "from-pink-500 to-rose-500",
    bgGlow: "bg-pink-500/10",
  },
  {
    icon: GraduationCap,
    title: "Assessment Engine",
    description:
      "Custom skill assessments with anti-cheat monitoring.",
    gradient: "from-amber-500 to-orange-500",
    bgGlow: "bg-amber-500/10",
  },
  {
    icon: Heart,
    title: "Diversity Analytics",
    description:
      "Real-time D&I dashboards to build inclusive teams.",
    gradient: "from-emerald-500 to-teal-500",
    bgGlow: "bg-emerald-500/10",
  },
  {
    icon: Shield,
    title: "GDPR Compliance",
    description:
      "Enterprise-grade data privacy with full GDPR toolkit.",
    gradient: "from-indigo-500 to-blue-600",
    bgGlow: "bg-indigo-500/10",
  },
];

const stats = [
  { value: "50K+", label: "Candidates matched" },
  { value: "98%", label: "Customer satisfaction" },
  { value: "3x", label: "Faster time-to-hire" },
  { value: "150+", label: "Countries supported" },
];

const testimonials = [
  {
    quote:
      "Talent OS cut our time-to-hire by 60%. The AI matching is scarily accurate -- we found three senior engineers in the first week.",
    name: "Sarah Chen",
    title: "VP of Engineering",
    company: "Raycast",
    initials: "SC",
  },
  {
    quote:
      "We evaluated every ATS on the market. Nothing comes close to the depth of analytics and the seamless candidate experience Talent OS provides.",
    name: "Marcus Johnson",
    title: "Head of Talent",
    company: "Vercel",
    initials: "MJ",
  },
  {
    quote:
      "The visual pipeline alone was worth the switch. Our recruiters went from juggling spreadsheets to closing roles 3x faster.",
    name: "Priya Patel",
    title: "Chief People Officer",
    company: "Linear",
    initials: "PP",
  },
];

const footerLinks = {
  Product: ["Features", "Pricing", "Integrations", "Changelog", "API Docs"],
  Solutions: [
    "Startups",
    "Enterprise",
    "Staffing Agencies",
    "Remote Teams",
    "Diversity Hiring",
  ],
  Resources: ["Blog", "Guides", "Webinars", "Case Studies", "Help Center"],
  Company: ["About", "Careers", "Press", "Contact", "Legal"],
};

/* ------------------------------------------------------------------ */
/*  Page (Server Component)                                            */
/* ------------------------------------------------------------------ */

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* ============================================================ */}
      {/*  NAVIGATION                                                   */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/25">
              <UserCheck className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Talent<span className="text-indigo-600">&nbsp;OS</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-8 text-sm font-medium text-gray-600 md:flex">
            <Link href="#features" className="transition-colors hover:text-gray-900">
              Features
            </Link>
            <Link href="#testimonials" className="transition-colors hover:text-gray-900">
              Customers
            </Link>
            <Link href="#demo" className="transition-colors hover:text-gray-900">
              Demo
            </Link>
            <Link href="/login" className="transition-colors hover:text-gray-900">
              Sign In
            </Link>
          </nav>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <Link
              href="/register"
              className="group inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl hover:shadow-indigo-500/30 hover:brightness-110"
            >
              Start Free Trial
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/*  HERO                                                         */}
      {/* ============================================================ */}
      <section className="relative isolate overflow-hidden">
        {/* Background gradient */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-blue-50/60 to-purple-50" />
          <div className="absolute -top-24 right-0 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-indigo-200/40 to-purple-200/40 blur-3xl" />
          <div className="absolute -bottom-24 left-0 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-blue-200/30 to-indigo-200/30 blur-3xl" />
          {/* Subtle grid */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(to right, #6366f1 1px, transparent 1px), linear-gradient(to bottom, #6366f1 1px, transparent 1px)",
              backgroundSize: "64px 64px",
            }}
          />
        </div>

        <div className="mx-auto max-w-7xl px-4 pb-24 pt-20 sm:px-6 sm:pb-32 sm:pt-28 lg:px-8 lg:pb-40 lg:pt-36">
          <div className="mx-auto max-w-3xl text-center">
            {/* Trust pill */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-indigo-200/60 bg-white/70 px-4 py-1.5 text-sm font-medium text-indigo-700 shadow-sm backdrop-blur">
              <Sparkles className="h-4 w-4" />
              Trusted by 2,000+ companies
            </div>

            {/* Headline */}
            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              The Most Powerful{" "}
              <span className="bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                Hiring Platform
              </span>{" "}
              Ever Built
            </h1>

            {/* Subheadline */}
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-600 sm:text-xl">
              Talent OS combines ATS, CRM, assessments, and AI matching into one
              seamless platform. Used by teams who refuse to settle.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/register"
                className="group inline-flex h-12 items-center gap-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 text-base font-semibold text-white shadow-xl shadow-indigo-500/25 transition-all hover:shadow-2xl hover:shadow-indigo-500/30 hover:brightness-110"
              >
                Start Free Trial
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="#demo"
                className="group inline-flex h-12 items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-8 text-base font-semibold text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:shadow-md"
              >
                <Play className="h-4 w-4 text-indigo-600" />
                Watch Demo
              </Link>
            </div>

            {/* Social proof logos strip */}
            <div className="mt-16">
              <p className="mb-6 text-xs font-semibold uppercase tracking-widest text-gray-400">
                Powering hiring at industry leaders
              </p>
              <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-40 grayscale">
                {["Stripe", "Vercel", "Linear", "Notion", "Figma"].map(
                  (brand) => (
                    <span
                      key={brand}
                      className="text-lg font-bold tracking-tight text-gray-900 sm:text-xl"
                    >
                      {brand}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  STATS BAR                                                    */}
      {/* ============================================================ */}
      <section className="relative border-y border-gray-100 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-gray-100 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="px-6 py-10 text-center sm:py-12">
              <p className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
                {stat.value}
              </p>
              <p className="mt-2 text-sm font-medium text-gray-500">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FEATURES GRID                                                */}
      {/* ============================================================ */}
      <section id="features" className="relative py-24 sm:py-32">
        {/* Subtle bg */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-gray-50/50 to-white" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
              Features
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
              Everything you need to hire{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                world-class talent
              </span>
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-gray-600">
              Six powerful modules. One unified platform. Zero compromises.
            </p>
          </div>

          {/* Grid */}
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-gray-200/50"
              >
                {/* Icon */}
                <div
                  className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.bgGlow}`}
                >
                  <feature.icon className="h-6 w-6 text-indigo-600" />
                </div>

                {/* Content */}
                <h3 className="mb-2 text-lg font-bold text-gray-900">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-gray-600">
                  {feature.description}
                </p>

                {/* Hover glow */}
                <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br from-indigo-100/0 to-purple-100/0 transition-all duration-500 group-hover:from-indigo-100/60 group-hover:to-purple-100/60 group-hover:blur-2xl" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  TESTIMONIALS                                                 */}
      {/* ============================================================ */}
      <section
        id="testimonials"
        className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white py-24 sm:py-32"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
              Testimonials
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Loved by hiring teams everywhere
            </h2>
          </div>

          {/* Cards */}
          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="relative rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition-shadow hover:shadow-lg"
              >
                {/* Stars */}
                <div className="mb-4 flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>

                {/* Quote */}
                <blockquote className="text-base leading-relaxed text-gray-700">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>

                {/* Author */}
                <div className="mt-6 flex items-center gap-3 border-t border-gray-100 pt-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white">
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {t.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t.title}, {t.company}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  BOTTOM CTA                                                   */}
      {/* ============================================================ */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-700 px-8 py-20 text-center shadow-2xl shadow-indigo-500/25 sm:px-16 sm:py-24">
            {/* Decorative elements */}
            <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
            <div
              className="pointer-events-none absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 25% 25%, white 1px, transparent 1px)",
                backgroundSize: "32px 32px",
              }}
            />

            <div className="relative">
              <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Ready to transform your hiring?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-indigo-100">
                Join 2,000+ companies already using Talent OS to build
                exceptional teams.
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/register"
                  className="group inline-flex h-12 items-center gap-2.5 rounded-xl bg-white px-8 text-base font-semibold text-indigo-700 shadow-xl transition-all hover:bg-gray-50 hover:shadow-2xl"
                >
                  Start Free Trial
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>

              <p className="mt-4 flex items-center justify-center gap-1.5 text-sm text-indigo-200">
                <CheckCircle2 className="h-4 w-4" />
                No credit card required
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FOOTER                                                       */}
      {/* ============================================================ */}
      <footer className="border-t border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Upper footer */}
          <div className="grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-6">
            {/* Brand */}
            <div className="lg:col-span-2">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/25">
                  <UserCheck className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold tracking-tight">
                  Talent<span className="text-indigo-600">&nbsp;OS</span>
                </span>
              </Link>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-gray-500">
                The most powerful hiring platform ever built. ATS, CRM,
                assessments, and AI matching -- all in one place.
              </p>
              {/* Social icons */}
              <div className="mt-6 flex gap-3">
                {[Twitter, Linkedin, Github].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Link columns */}
            {Object.entries(footerLinks).map(([heading, links]) => (
              <div key={heading}>
                <h4 className="text-sm font-semibold text-gray-900">
                  {heading}
                </h4>
                <ul className="mt-4 space-y-3">
                  {links.map((link) => (
                    <li key={link}>
                      <Link
                        href="#"
                        className="text-sm text-gray-500 transition-colors hover:text-gray-900"
                      >
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-200 py-8 sm:flex-row">
            <p className="text-sm text-gray-400">
              &copy; 2026 Talent OS. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-gray-400">
              <Link href="#" className="hover:text-gray-600">
                Privacy Policy
              </Link>
              <Link href="#" className="hover:text-gray-600">
                Terms of Service
              </Link>
              <Link href="#" className="hover:text-gray-600">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
