"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import {
  Play,
  ArrowRight,
  CheckCircle2,
  Shield,
  Clock,
  BarChart3,
  FileText,
  Users,
  Zap,
  Lock,
  Globe,
  TrendingUp,
  Calculator,
  Calendar,
  MessageSquare,
  FolderOpen,
  Receipt,
  GitBranch,
  ChevronRight,
  Building2,
  Star,
  Sun,
  Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";

/* ─────────────────────────────────────────────
   Animation Variants
   ───────────────────────────────────────────── */
const ease = [0.16, 1, 0.3, 1] as const;

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24, filter: "blur(4px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.7, ease } },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6, ease } },
};

const scaleUp = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.7, ease } },
};

/* ─────────────────────────────────────────────
   Data
   ───────────────────────────────────────────── */
const PROBLEMS = [
  {
    icon: Clock,
    title: "Drowning in Manual Work",
    description:
      "Your team spends 60% of their time on repetitive data entry, chasing clients for documents, and managing spreadsheets instead of delivering strategic advisory.",
  },
  {
    icon: FileText,
    title: "Scattered Systems & Silos",
    description:
      "Client data lives in 5+ disconnected tools. Invoicing in one, time tracking in another, documents in email. Nothing talks to each other.",
  },
  {
    icon: Shield,
    title: "Compliance & Security Risks",
    description:
      "Sensitive financial data shared via email, missed filing deadlines, no audit trail. One breach could cost your firm everything.",
  },
  {
    icon: BarChart3,
    title: "Zero Visibility Into Performance",
    description:
      "You can't answer basic questions: Which clients are profitable? Who's underutilized? Are we on track for revenue targets this quarter?",
  },
];

const FEATURES = [
  {
    icon: Users,
    title: "Client Management",
    description: "360-degree client profiles with contact history, documents, billing, and engagement tracking in one unified view.",
    color: "from-blue-500/10 to-indigo-500/10",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    icon: Clock,
    title: "Time & Billing",
    description: "One-click timers, automatic rate calculations, and instant invoice generation. Stop losing billable hours.",
    color: "from-emerald-500/10 to-teal-500/10",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    icon: Receipt,
    title: "Smart Invoicing",
    description: "Professional invoices with line items, tax calculations, payment tracking, and Stripe integration for instant online payments.",
    color: "from-violet-500/10 to-purple-500/10",
    iconColor: "text-violet-600 dark:text-violet-400",
  },
  {
    icon: FolderOpen,
    title: "Document Vault",
    description: "Secure, organized document management with client portals, version control, and instant search across all files.",
    color: "from-amber-500/10 to-orange-500/10",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  {
    icon: GitBranch,
    title: "Workflow Automation",
    description: "Templated workflows for tax returns, audits, and onboarding. Automatic step assignments, progress tracking, and deadline alerts.",
    color: "from-rose-500/10 to-pink-500/10",
    iconColor: "text-rose-600 dark:text-rose-400",
  },
  {
    icon: Calculator,
    title: "Expense Tracking",
    description: "Categorize, approve, and reimburse expenses. Attach receipts, set budgets, and generate reports for every client engagement.",
    color: "from-cyan-500/10 to-sky-500/10",
    iconColor: "text-cyan-600 dark:text-cyan-400",
  },
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    description: "Revenue forecasts, utilization rates, profitability analysis, and cash flow projections — all in real-time dashboards.",
    color: "from-fuchsia-500/10 to-purple-500/10",
    iconColor: "text-fuchsia-600 dark:text-fuchsia-400",
  },
  {
    icon: Calendar,
    title: "Deadline & Calendar",
    description: "Never miss a filing deadline. Automated reminders, compliance calendars, and team scheduling in one unified view.",
    color: "from-lime-500/10 to-green-500/10",
    iconColor: "text-lime-600 dark:text-lime-400",
  },
  {
    icon: MessageSquare,
    title: "Secure Messaging",
    description: "End-to-end encrypted client communication. Share documents, request signatures, and keep every conversation in context.",
    color: "from-orange-500/10 to-red-500/10",
    iconColor: "text-orange-600 dark:text-orange-400",
  },
];

const METRICS = [
  { value: "73%", label: "Reduction in admin time", suffix: "" },
  { value: "4.2×", label: "Faster invoice collection", suffix: "" },
  { value: "99.9%", label: "Uptime guarantee", suffix: "" },
  { value: "256-bit", label: "AES encryption at rest", suffix: "" },
];

const DEEP_DIVES = [
  {
    badge: "Intelligence",
    title: "Analytics that drive decisions, not just reports",
    description:
      "Go beyond vanity metrics. Our analytics engine calculates true client profitability factoring in write-downs, realization rates, and staff costs. Forecast cash flow 90 days out. Identify at-risk clients before they churn. Every insight is actionable.",
    features: [
      "Client profitability heat maps",
      "Staff utilization & capacity planning",
      "Revenue forecasting with trend analysis",
      "Automated KPI alerts & thresholds",
    ],
    icon: TrendingUp,
    gradient: "from-primary/5 via-chart-2/5 to-transparent",
  },
  {
    badge: "Security",
    title: "Bank-grade security your clients expect",
    description:
      "Built for firms that handle sensitive financial data. Multi-tenant architecture with PostgreSQL Row-Level Security ensures complete data isolation. Every action is logged, every document encrypted, every session monitored.",
    features: [
      "SOC 2 Type II compliant architecture",
      "Multi-factor authentication (TOTP)",
      "Role-based access with 5-level hierarchy",
      "Complete audit trail & security events",
    ],
    icon: Lock,
    gradient: "from-chart-5/5 via-destructive/5 to-transparent",
  },
  {
    badge: "Scale",
    title: "From solo practitioner to Top 100 firm",
    description:
      "The same platform grows with you. Start solo, add partners, open new offices. Multi-tenant isolation means each client's data stays perfectly separated while you manage everything from a single pane of glass.",
    features: [
      "Unlimited team members & clients",
      "Multi-office, multi-entity support",
      "Custom workflows per engagement type",
      "API-first architecture for integrations",
    ],
    icon: Globe,
    gradient: "from-chart-3/5 via-chart-1/5 to-transparent",
  },
];

/* ─────────────────────────────────────────────
   Component
   ───────────────────────────────────────────── */
export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const { theme, setTheme } = useTheme();

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">
      {/* ══════════════════════════════════════
         NAVIGATION
         ══════════════════════════════════════ */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl"
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
              <Building2 className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">CPA Platform</span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#security" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Security</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-sm">
                Sign in
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="text-sm shadow-md shadow-primary/20">
                Start free trial
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* ══════════════════════════════════════
         HERO
         ══════════════════════════════════════ */}
      <section ref={heroRef} className="relative pt-32 pb-20 overflow-hidden">
        {/* Background gradients */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-[30%] left-[10%] h-[60vh] w-[60vh] rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute top-[20%] right-[5%] h-[50vh] w-[50vh] rounded-full bg-chart-2/5 blur-3xl" />
          <div className="absolute bottom-[10%] left-[30%] h-[40vh] w-[40vh] rounded-full bg-chart-5/4 blur-3xl" />
        </div>
        {/* Grid overlay */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,oklch(0.5_0_0/2%)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.5_0_0/2%)_1px,transparent_1px)] bg-[size:4rem_4rem]" />

        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
          className="relative z-10 mx-auto max-w-7xl px-6"
        >
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="mx-auto max-w-4xl text-center"
          >
            {/* Badge */}
            <motion.div variants={fadeUp} className="mb-6 flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
                <Zap className="h-3.5 w-3.5" />
                The modern practice management platform
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeUp}
              className="text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl"
            >
              <span className="block">Run your CPA firm</span>
              <span className="block mt-1 gradient-text">like a tech company</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              variants={fadeUp}
              className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl leading-relaxed"
            >
              One platform to manage clients, automate workflows, track time, send invoices,
              and grow revenue. Purpose-built for accounting firms that refuse to settle.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={fadeUp} className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href="/register">
                <Button size="lg" className="h-12 px-8 text-base font-semibold shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all">
                  Start your free trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <a href="#demo">
                <Button variant="outline" size="lg" className="h-12 px-8 text-base font-semibold border-border/50 shadow-sm">
                  <Play className="mr-2 h-4 w-4" />
                  Watch demo
                </Button>
              </a>
            </motion.div>

            {/* Trust signals */}
            <motion.div variants={fadeUp} className="mt-10 flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Free 14-day trial
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                No credit card required
              </span>
              <span className="hidden sm:flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Cancel anytime
              </span>
            </motion.div>
          </motion.div>

          {/* ── Video Placeholder ── */}
          <motion.div
            variants={scaleUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            id="demo"
            className="mx-auto mt-16 max-w-5xl"
          >
            <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card shadow-2xl shadow-black/5 dark:shadow-black/30">
              {/* Fake browser chrome */}
              <div className="flex items-center gap-2 border-b border-border/50 bg-muted/30 px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-400/80" />
                  <div className="h-3 w-3 rounded-full bg-amber-400/80" />
                  <div className="h-3 w-3 rounded-full bg-emerald-400/80" />
                </div>
                <div className="mx-auto flex items-center gap-2 rounded-lg bg-background/60 px-4 py-1 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  app.cpaplatform.com/dashboard
                </div>
              </div>

              {/* Video area */}
              <div className="relative aspect-video bg-gradient-to-br from-muted/50 via-muted/30 to-muted/50">
                {/* Animated placeholder content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-8">
                  {/* Dashboard wireframe preview */}
                  <div className="w-full max-w-3xl space-y-4 opacity-30">
                    <div className="flex gap-4">
                      <div className="h-24 flex-1 rounded-xl bg-foreground/10" />
                      <div className="h-24 flex-1 rounded-xl bg-foreground/10" />
                      <div className="h-24 flex-1 rounded-xl bg-foreground/10" />
                      <div className="h-24 flex-1 rounded-xl bg-foreground/10" />
                    </div>
                    <div className="flex gap-4">
                      <div className="h-48 flex-[2] rounded-xl bg-foreground/10" />
                      <div className="h-48 flex-1 rounded-xl bg-foreground/10" />
                    </div>
                  </div>

                  {/* Play button overlay */}
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                      <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl shadow-primary/30">
                        <Play className="h-8 w-8 ml-1" fill="currentColor" />
                      </div>
                    </div>
                  </motion.button>
                </div>

                {/* Corner label */}
                <div className="absolute bottom-4 right-4 rounded-lg bg-background/80 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
                  2:47 &middot; Product Tour
                </div>
              </div>
            </div>

            {/* Caption */}
            <p className="mt-4 text-center text-sm text-muted-foreground">
              See how firms like yours save 15+ hours per week with CPA Platform
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════
         SOCIAL PROOF METRICS BAR
         ══════════════════════════════════════ */}
      <section className="border-y border-border/50 bg-muted/20">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="grid grid-cols-2 gap-8 md:grid-cols-4"
          >
            {METRICS.map((metric) => (
              <motion.div key={metric.label} variants={fadeUp} className="text-center">
                <p className="text-3xl font-extrabold tracking-tight sm:text-4xl gradient-text">
                  {metric.value}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{metric.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════
         PROBLEMS WE SOLVE
         ══════════════════════════════════════ */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="text-center mb-16"
          >
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-destructive/20 bg-destructive/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-destructive">
                The Problem
              </span>
            </motion.div>
            <motion.h2 variants={fadeUp} className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Your firm is leaving money on the table
            </motion.h2>
            <motion.p variants={fadeUp} className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Traditional practice management is broken. Disconnected tools, manual processes,
              and zero visibility are costing your firm growth and profitability.
            </motion.p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="grid gap-6 md:grid-cols-2"
          >
            {PROBLEMS.map((problem, i) => (
              <motion.div
                key={problem.title}
                variants={fadeUp}
                className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-8 transition-all hover:border-destructive/20 hover:shadow-lg"
              >
                <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-destructive/3 blur-2xl transition-all group-hover:bg-destructive/5" />
                <div className="relative">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                    <problem.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold">{problem.title}</h3>
                  <p className="mt-3 text-muted-foreground leading-relaxed">{problem.description}</p>
                  <div className="mt-4 flex items-center gap-1 text-sm font-medium text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                    Sound familiar? <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════
         FEATURES GRID
         ══════════════════════════════════════ */}
      <section id="features" className="py-24 bg-muted/20">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="text-center mb-16"
          >
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                The Solution
              </span>
            </motion.div>
            <motion.h2 variants={fadeUp} className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Everything your firm needs. Nothing it doesn&apos;t.
            </motion.h2>
            <motion.p variants={fadeUp} className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Nine purpose-built modules that work together seamlessly.
              Replace your entire tool stack with one unified platform.
            </motion.p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {FEATURES.map((feature) => (
              <motion.div
                key={feature.title}
                variants={fadeUp}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-7 transition-shadow hover:shadow-lg"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="relative">
                  <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-muted ${feature.iconColor}`}>
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════
         FEATURE DEEP DIVES
         ══════════════════════════════════════ */}
      <section id="security" className="py-24">
        <div className="mx-auto max-w-7xl px-6 space-y-32">
          {DEEP_DIVES.map((dive, i) => (
            <motion.div
              key={dive.title}
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              className={`flex flex-col gap-12 lg:flex-row lg:items-center lg:gap-20 ${
                i % 2 === 1 ? "lg:flex-row-reverse" : ""
              }`}
            >
              {/* Text side */}
              <div className="flex-1">
                <motion.div variants={fadeUp}>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                    {dive.badge}
                  </span>
                </motion.div>
                <motion.h3 variants={fadeUp} className="mt-4 text-3xl font-bold tracking-tight">
                  {dive.title}
                </motion.h3>
                <motion.p variants={fadeUp} className="mt-4 text-muted-foreground leading-relaxed">
                  {dive.description}
                </motion.p>
                <motion.ul variants={stagger} className="mt-8 space-y-3">
                  {dive.features.map((feature) => (
                    <motion.li key={feature} variants={fadeUp} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                      <span className="text-sm font-medium">{feature}</span>
                    </motion.li>
                  ))}
                </motion.ul>
              </div>

              {/* Visual side */}
              <motion.div variants={scaleUp} className="flex-1">
                <div className={`relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br ${dive.gradient} p-10`}>
                  <div className="flex items-center justify-center">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-3xl bg-primary/5 blur-2xl" />
                      <div className="relative flex h-32 w-32 items-center justify-center rounded-3xl bg-card border border-border/50 shadow-xl">
                        <dive.icon className="h-14 w-14 text-primary" strokeWidth={1.5} />
                      </div>
                    </div>
                  </div>
                  {/* Decorative grid */}
                  <div className="mt-8 grid grid-cols-2 gap-3">
                    {dive.features.map((f, j) => (
                      <motion.div
                        key={j}
                        initial={{ opacity: 0, y: 8 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + j * 0.1, duration: 0.4, ease }}
                        viewport={{ once: true }}
                        className="rounded-lg bg-card/80 backdrop-blur-sm border border-border/30 px-4 py-3 text-xs font-medium"
                      >
                        {f}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════
         TESTIMONIAL / SOCIAL PROOF
         ══════════════════════════════════════ */}
      <section className="py-24 bg-muted/20">
        <div className="mx-auto max-w-4xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl border border-border/50 bg-card p-10 sm:p-14 text-center shadow-xl"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-1/2 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <div className="flex justify-center gap-1 mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <blockquote className="text-xl sm:text-2xl font-medium leading-relaxed text-foreground">
              &ldquo;We replaced QuickBooks, Harvest, Dropbox, and three spreadsheets with CPA Platform.
              Our team saves over 20 hours per week, and clients love the portal.
              It&apos;s the single best investment we&apos;ve made for the firm.&rdquo;
            </blockquote>
            <div className="mt-8 flex items-center justify-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                JR
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">Jennifer Rodriguez, CPA</p>
                <p className="text-xs text-muted-foreground">Managing Partner &middot; Rodriguez & Associates</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════
         FINAL CTA
         ══════════════════════════════════════ */}
      <section id="pricing" className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="relative overflow-hidden rounded-3xl bg-primary px-8 py-20 text-center text-primary-foreground sm:px-16"
          >
            {/* Background pattern */}
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,oklch(1_0_0/5%)_1px,transparent_1px),linear-gradient(to_bottom,oklch(1_0_0/5%)_1px,transparent_1px)] bg-[size:3rem_3rem]" />
            <div className="absolute -top-32 -right-32 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
            <div className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-white/5 blur-3xl" />

            <div className="relative">
              <motion.h2 variants={fadeUp} className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Ready to modernize your practice?
              </motion.h2>
              <motion.p variants={fadeUp} className="mx-auto mt-4 max-w-xl text-lg text-primary-foreground/80">
                Join hundreds of forward-thinking CPA firms. Set up in 10 minutes,
                see results in your first week.
              </motion.p>
              <motion.div variants={fadeUp} className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Link href="/register">
                  <Button size="lg" variant="secondary" className="h-12 px-8 text-base font-semibold shadow-xl">
                    Start your free 14-day trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button
                    size="lg"
                    variant="ghost"
                    className="h-12 px-8 text-base font-semibold text-primary-foreground/90 hover:text-primary-foreground hover:bg-white/10"
                  >
                    Sign in to existing account
                  </Button>
                </Link>
              </motion.div>
              <motion.p variants={fadeIn} className="mt-6 text-sm text-primary-foreground/60">
                No credit card required &middot; Free migration assistance &middot; Cancel anytime
              </motion.p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════
         FOOTER
         ══════════════════════════════════════ */}
      <footer className="border-t border-border/50 bg-muted/20">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div className="lg:col-span-1">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Building2 className="h-5 w-5" />
                </div>
                <span className="text-lg font-bold">CPA Platform</span>
              </Link>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-xs">
                The modern practice management platform for CPA firms that want to grow faster
                with less overhead.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Product</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#security" className="text-muted-foreground hover:text-foreground transition-colors">Security</a></li>
                <li><a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#demo" className="text-muted-foreground hover:text-foreground transition-colors">Watch Demo</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Company</h4>
              <ul className="space-y-3 text-sm">
                <li><span className="text-muted-foreground">About</span></li>
                <li><span className="text-muted-foreground">Blog</span></li>
                <li><span className="text-muted-foreground">Careers</span></li>
                <li><span className="text-muted-foreground">Contact</span></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Legal</h4>
              <ul className="space-y-3 text-sm">
                <li><span className="text-muted-foreground">Privacy Policy</span></li>
                <li><span className="text-muted-foreground">Terms of Service</span></li>
                <li><span className="text-muted-foreground">SOC 2 Compliance</span></li>
                <li><span className="text-muted-foreground">Data Processing</span></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/50 pt-8 sm:flex-row">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} CPA Platform. All rights reserved.
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" />
              SOC 2 Type II &middot; 256-bit encryption &middot; GDPR compliant
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
