"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  Briefcase,
  Users,
  Zap,
  Shield,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Building2,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const features = [
  {
    icon: Search,
    title: "Smart Job Matching",
    description:
      "Our intelligent matching algorithm connects candidates with roles that fit their skills, experience, and preferences.",
  },
  {
    icon: Zap,
    title: "Streamlined Applications",
    description:
      "Apply to jobs with a single click. Your profile does the heavy lifting, so you can focus on what matters.",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description:
      "Control who sees your profile. Browse anonymously or make your profile visible to select employers.",
  },
  {
    icon: BarChart3,
    title: "Track Your Progress",
    description:
      "Real-time application tracking, interview scheduling, and status updates all in one dashboard.",
  },
];

const howItWorks = [
  {
    step: "01",
    title: "Create Your Profile",
    description:
      "Build a comprehensive profile highlighting your skills, experience, and career preferences.",
  },
  {
    step: "02",
    title: "Browse Opportunities",
    description:
      "Search and filter thousands of jobs by role, location, salary, and work mode.",
  },
  {
    step: "03",
    title: "Apply with Confidence",
    description:
      "Submit applications with your profile and cover letter. Track every stage of the process.",
  },
  {
    step: "04",
    title: "Land Your Dream Role",
    description:
      "Interview, negotiate, and accept offers -- all managed through one seamless platform.",
  },
];

const stats = [
  { value: "10,000+", label: "Jobs Posted" },
  { value: "50,000+", label: "Candidates Hired" },
  { value: "2,500+", label: "Companies Trust Us" },
  { value: "95%", label: "Satisfaction Rate" },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background to-muted/30 py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <motion.div
            className="mx-auto max-w-3xl text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm text-muted-foreground">
              <Globe className="h-4 w-4" />
              Trusted by thousands of companies worldwide
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Find Your{" "}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Dream Job
              </span>
              <br />
              or Hire{" "}
              <span className="bg-gradient-to-r from-primary/60 to-primary bg-clip-text text-transparent">
                Top Talent
              </span>
            </h1>
            <p className="mb-8 text-lg text-muted-foreground sm:text-xl">
              The modern employment platform that connects exceptional candidates
              with forward-thinking companies. Streamlined hiring, transparent
              process, better outcomes.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/jobs">
                <Button size="lg" className="min-w-[180px]">
                  <Search className="mr-2 h-5 w-5" />
                  Browse Jobs
                </Button>
              </Link>
              <Link href="/register">
                <Button size="lg" variant="outline" className="min-w-[180px]">
                  <Building2 className="mr-2 h-5 w-5" />
                  Post a Job
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Background decoration */}
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
      </section>

      {/* Stats Section */}
      <section className="border-y bg-card py-12">
        <div className="container mx-auto px-4">
          <motion.div
            className="grid grid-cols-2 gap-8 md:grid-cols-4"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {stats.map((stat) => (
              <motion.div
                key={stat.label}
                className="text-center"
                variants={fadeInUp}
              >
                <p className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <motion.div
            className="mx-auto mb-16 max-w-2xl text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-muted-foreground">
              Whether you are seeking your next career move or building a
              world-class team, our platform provides the tools to make it
              happen.
            </p>
          </motion.div>

          <motion.div
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {features.map((feature) => (
              <motion.div key={feature.title} variants={fadeInUp}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardContent className="pt-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-muted/30 py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <motion.div
            className="mx-auto mb-16 max-w-2xl text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground">
              Get started in minutes. Our streamlined process makes job hunting
              and hiring effortless.
            </p>
          </motion.div>

          <motion.div
            className="grid gap-8 md:grid-cols-2 lg:grid-cols-4"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {howItWorks.map((item) => (
              <motion.div
                key={item.step}
                className="relative"
                variants={fadeInUp}
              >
                <div className="mb-4 text-5xl font-bold text-primary/10">
                  {item.step}
                </div>
                <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <motion.div
            className="mx-auto max-w-3xl rounded-2xl bg-primary p-10 text-center text-primary-foreground sm:p-16"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to Get Started?
            </h2>
            <p className="mb-8 text-lg opacity-90">
              Join thousands of professionals and companies already using Talent
              OS to build their future.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/register">
                <Button
                  size="lg"
                  variant="secondary"
                  className="min-w-[200px]"
                >
                  Create Free Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/jobs">
                <Button
                  size="lg"
                  variant="outline"
                  className="min-w-[200px] border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
                >
                  Browse Open Positions
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Briefcase className="h-4 w-4" />
                </div>
                <span className="text-lg font-semibold">Talent OS</span>
              </div>
              <p className="text-sm text-muted-foreground">
                The modern employment platform connecting talent with
                opportunity.
              </p>
            </div>
            <div>
              <h4 className="mb-3 font-semibold">For Candidates</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="/jobs"
                    className="hover:text-foreground transition-colors"
                  >
                    Browse Jobs
                  </Link>
                </li>
                <li>
                  <Link
                    href="/register"
                    className="hover:text-foreground transition-colors"
                  >
                    Create Profile
                  </Link>
                </li>
                <li>
                  <Link
                    href="/jobs"
                    className="hover:text-foreground transition-colors"
                  >
                    Career Resources
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 font-semibold">For Employers</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="/register"
                    className="hover:text-foreground transition-colors"
                  >
                    Post a Job
                  </Link>
                </li>
                <li>
                  <Link
                    href="/register"
                    className="hover:text-foreground transition-colors"
                  >
                    Talent Search
                  </Link>
                </li>
                <li>
                  <Link
                    href="/register"
                    className="hover:text-foreground transition-colors"
                  >
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 font-semibold">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="/"
                    className="hover:text-foreground transition-colors"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/"
                    className="hover:text-foreground transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/"
                    className="hover:text-foreground transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Talent OS. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
