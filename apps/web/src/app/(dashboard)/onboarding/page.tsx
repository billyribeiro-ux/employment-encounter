"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Building2,
  Users,
  Briefcase,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Rocket,
  Globe,
  Target,
} from "lucide-react";
import { toast } from "sonner";

const STEPS = [
  { id: 1, title: "Company Profile", icon: Building2, description: "Tell us about your organization" },
  { id: 2, title: "Hiring Team", icon: Users, description: "Invite your hiring team" },
  { id: 3, title: "First Job Posting", icon: Briefcase, description: "Create your first job" },
  { id: 4, title: "Hiring Preferences", icon: Target, description: "Set up your hiring pipeline" },
  { id: 5, title: "Career Page", icon: Globe, description: "Customize your public career page" },
  { id: 6, title: "Billing", icon: CreditCard, description: "Choose your plan" },
  { id: 7, title: "Launch", icon: Rocket, description: "You're ready to hire!" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    toast.success("Setup complete! Welcome to Talent OS.");
    router.push("/dashboard");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Welcome to Talent OS</h1>
        <p className="text-muted-foreground">Let&apos;s get your hiring platform set up in a few quick steps</p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-1">
        {STEPS.map((step) => (
          <div key={step.id} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={`h-2 w-full rounded-full transition-colors ${
                step.id <= currentStep ? "bg-primary" : "bg-muted"
              }`}
            />
            <span className={`text-[10px] ${step.id === currentStep ? "text-primary font-medium" : "text-muted-foreground"}`}>
              {step.title}
            </span>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            {(() => {
              const StepIcon = STEPS[currentStep - 1].icon;
              return <StepIcon className="h-5 w-5 text-primary" />;
            })()}
            <div>
              <CardTitle>
                Step {currentStep}: {STEPS[currentStep - 1].title}
              </CardTitle>
              <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
            </div>
            <Badge variant="outline" className="ml-auto">
              {currentStep} / {STEPS.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input placeholder="Acme Inc." />
                </div>
                <div className="space-y-2">
                  <Label>Industry</Label>
                  <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                    <option value="">Select industry...</option>
                    <option value="technology">Technology</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="finance">Finance</option>
                    <option value="education">Education</option>
                    <option value="retail">Retail</option>
                    <option value="manufacturing">Manufacturing</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company Size</Label>
                  <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-1000">201-1,000 employees</option>
                    <option value="1000+">1,000+ employees</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input placeholder="https://acme.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Company Description</Label>
                <Textarea placeholder="Tell candidates what makes your company great..." rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Headquarters Location</Label>
                <div className="grid grid-cols-3 gap-3">
                  <Input placeholder="City" />
                  <Input placeholder="State" />
                  <Input placeholder="Country" />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Invite recruiters, hiring managers, and interviewers to collaborate on your hiring pipeline.
              </p>
              {[1, 2, 3].map((i) => (
                <div key={i} className="grid grid-cols-3 gap-3">
                  <Input placeholder="Email address" type="email" />
                  <Input placeholder="Name" />
                  <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                    <option value="recruiter">Recruiter</option>
                    <option value="hiring_manager">Hiring Manager</option>
                    <option value="interviewer">Interviewer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              ))}
              <Button variant="outline" size="sm">+ Add another</Button>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Create your first job posting to start attracting candidates.
              </p>
              <div className="space-y-2">
                <Label>Job Title</Label>
                <Input placeholder="e.g. Senior Software Engineer" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Input placeholder="e.g. Engineering" />
                </div>
                <div className="space-y-2">
                  <Label>Employment Type</Label>
                  <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                    <option value="full_time">Full-time</option>
                    <option value="part_time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Job Description</Label>
                <Textarea placeholder="Describe the role and responsibilities..." rows={4} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Salary Range (Annual)</Label>
                  <div className="flex gap-2">
                    <Input type="number" placeholder="Min ($)" />
                    <Input type="number" placeholder="Max ($)" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input placeholder="e.g. San Francisco, CA" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                You can edit this job later and add more details from the Jobs & Pipeline page.
              </p>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Configure your default hiring pipeline stages and preferences.
              </p>
              <div className="space-y-2">
                <Label>Pipeline Stages</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Default stages for all new positions. You can customize per job later.
                </p>
                {["Applied", "Screening", "Phone Screen", "Technical Interview", "Onsite Interview", "Offer", "Hired"].map((stage, i) => (
                  <div key={stage} className="flex items-center gap-2 rounded-lg border p-3">
                    <Badge variant="secondary" className="text-xs w-6 h-6 flex items-center justify-center p-0">{i + 1}</Badge>
                    <span className="text-sm font-medium">{stage}</span>
                    <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-500" />
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <Label>Auto-rejection Settings</Label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" defaultChecked className="rounded border-input" />
                  Auto-reject applications below screening score threshold
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="rounded border-input" />
                  Send rejection emails automatically
                </label>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Customize your public career page that candidates will see.
              </p>
              <div className="space-y-2">
                <Label>Career Page Title</Label>
                <Input placeholder="Join Our Team" />
              </div>
              <div className="space-y-2">
                <Label>Career Page Description</Label>
                <Textarea placeholder="Why work with us? Tell candidates about your culture, benefits, and mission..." rows={4} />
              </div>
              <div className="space-y-2">
                <Label>Company Logo</Label>
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6">
                  <Building2 className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">Upload your logo</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG up to 2MB
                  </p>
                  <Button variant="outline" size="sm" className="mt-3">
                    Browse Files
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Perks & Benefits</Label>
                <div className="grid grid-cols-2 gap-2">
                  {["Health Insurance", "Remote Work", "Stock Options", "401k Match", "Unlimited PTO", "Learning Budget", "Gym Membership", "Free Lunch"].map((perk) => (
                    <label key={perk} className="flex items-center gap-2 text-sm rounded-lg border p-2">
                      <input type="checkbox" className="rounded border-input" />
                      {perk}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 6 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Choose a plan that fits your hiring needs. You can change this anytime.
              </p>
              {[
                { name: "Starter", price: "$49/mo", features: ["5 job postings", "3 team members", "100 candidates"], popular: false },
                { name: "Growth", price: "$99/mo", features: ["25 job postings", "10 team members", "500 candidates", "Advanced analytics"], popular: true },
                { name: "Scale", price: "$199/mo", features: ["100 job postings", "25 team members", "2,000 candidates", "API access", "SSO"], popular: false },
              ].map((plan) => (
                <div
                  key={plan.name}
                  className={`flex items-center justify-between rounded-lg border p-4 cursor-pointer hover:bg-accent transition-colors ${plan.popular ? "border-primary ring-1 ring-primary" : ""}`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{plan.name}</p>
                      {plan.popular && <Badge className="text-[10px]">Popular</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {plan.features.join(" · ")}
                    </p>
                  </div>
                  <p className="text-sm font-bold">{plan.price}</p>
                </div>
              ))}
              <Button variant="link" size="sm" onClick={() => router.push("/billing")}>
                View full plan comparison →
              </Button>
            </div>
          )}

          {currentStep === 7 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="rounded-full bg-green-100 dark:bg-green-900 p-4 mb-4">
                <Rocket className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">You&apos;re ready to hire!</h3>
              <p className="text-sm text-muted-foreground max-w-md mb-6">
                Your Talent OS workspace is set up. Start by posting jobs, discovering talent,
                or exploring your hiring dashboard.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => router.push("/hiring")}>
                  View Jobs
                </Button>
                <Button variant="outline" onClick={() => router.push("/talent")}>
                  Discover Talent
                </Button>
                <Button onClick={handleComplete}>
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      {currentStep < 7 && (
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={handlePrev} disabled={currentStep === 1}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setCurrentStep(7)}>
              Skip Setup
            </Button>
            <Button onClick={handleNext}>
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
