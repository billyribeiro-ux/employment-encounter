"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Users,
  FileText,
  CreditCard,
  Shield,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Rocket,
} from "lucide-react";
import { toast } from "sonner";

const STEPS = [
  { id: 1, title: "Firm Profile", icon: Building2, description: "Set up your firm details" },
  { id: 2, title: "Team Members", icon: Users, description: "Invite your team" },
  { id: 3, title: "Client Import", icon: FileText, description: "Import existing clients" },
  { id: 4, title: "Billing Setup", icon: CreditCard, description: "Configure billing" },
  { id: 5, title: "Integrations", icon: Shield, description: "Connect your tools" },
  { id: 6, title: "Preferences", icon: CheckCircle2, description: "Customize your workspace" },
  { id: 7, title: "Launch", icon: Rocket, description: "You're ready to go!" },
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
    toast.success("Onboarding complete! Welcome to CPA Platform.");
    router.push("/dashboard");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Welcome to CPA Platform</h1>
        <p className="text-muted-foreground">Let&apos;s get your firm set up in a few quick steps</p>
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
                  <Label>Firm Name</Label>
                  <Input placeholder="Acme CPA Group" />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input type="tel" placeholder="(555) 123-4567" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" placeholder="info@acmecpa.com" />
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input placeholder="https://acmecpa.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input placeholder="123 Main St, Suite 100, City, ST 12345" />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Invite team members to collaborate. You can always add more later from Settings.
              </p>
              {[1, 2, 3].map((i) => (
                <div key={i} className="grid grid-cols-3 gap-3">
                  <Input placeholder="Email address" type="email" />
                  <Input placeholder="First name" />
                  <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                    <option value="staff_accountant">Staff Accountant</option>
                    <option value="senior_accountant">Senior Accountant</option>
                    <option value="manager">Manager</option>
                    <option value="partner">Partner</option>
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
                Import your existing client list from a CSV file or add them manually.
              </p>
              <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8">
                <FileText className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Drop a CSV file here</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Columns: name, business_type, email, phone
                </p>
                <Button variant="outline" size="sm" className="mt-3">
                  Browse Files
                </Button>
              </div>
              <Button variant="link" size="sm" onClick={() => router.push("/clients")}>
                Or add clients manually →
              </Button>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Set your default billing rates and payment preferences.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Default Hourly Rate</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input type="number" placeholder="150" className="pl-7" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                    <option value="USD">USD — US Dollar</option>
                    <option value="CAD">CAD — Canadian Dollar</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Payment Terms</Label>
                <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  <option value="net15">Net 15</option>
                  <option value="net30">Net 30</option>
                  <option value="net45">Net 45</option>
                  <option value="due_on_receipt">Due on Receipt</option>
                </select>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Connect your existing tools. You can set these up later from Settings.
              </p>
              {[
                { name: "QuickBooks Online", desc: "Sync clients, invoices, and payments" },
                { name: "Google Drive", desc: "Auto-sync documents" },
                { name: "Stripe", desc: "Accept online payments" },
              ].map((integration) => (
                <div key={integration.name} className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="text-sm font-medium">{integration.name}</p>
                    <p className="text-xs text-muted-foreground">{integration.desc}</p>
                  </div>
                  <Button variant="outline" size="sm">Connect</Button>
                </div>
              ))}
            </div>
          )}

          {currentStep === 6 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Customize your workspace preferences.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                    <option value="America/New_York">Eastern (ET)</option>
                    <option value="America/Chicago">Central (CT)</option>
                    <option value="America/Denver">Mountain (MT)</option>
                    <option value="America/Los_Angeles">Pacific (PT)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Default Fiscal Year End</Label>
                  <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                    <option value="Calendar">Calendar Year (Dec 31)</option>
                    <option value="March">March 31</option>
                    <option value="June">June 30</option>
                    <option value="September">September 30</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email Notifications</Label>
                <div className="space-y-2">
                  {["Deadline reminders", "Invoice payments", "New document uploads", "Task assignments"].map((pref) => (
                    <label key={pref} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" defaultChecked className="rounded border-input" />
                      {pref}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 7 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="rounded-full bg-green-100 dark:bg-green-900 p-4 mb-4">
                <Rocket className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">You&apos;re all set!</h3>
              <p className="text-sm text-muted-foreground max-w-md mb-6">
                Your CPA Platform workspace is ready. Start by adding clients, tracking time,
                or exploring the dashboard.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => router.push("/clients")}>
                  Add Clients
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
