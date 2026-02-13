"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
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
  Sparkles,
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

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 200 : -200,
    opacity: 0,
    scale: 0.95,
    filter: "blur(4px)",
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const },
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 200 : -200,
    opacity: 0,
    scale: 0.95,
    filter: "blur(4px)",
    transition: { duration: 0.25, ease: [0.4, 0, 1, 1] },
  }),
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(0);
  const [firmData, setFirmData] = useState({ name: "", phone: "", email: "", website: "", address: "" });

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setDirection(1);
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setDirection(-1);
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    // Persist firm data if filled
    if (firmData.name) {
      try {
        await api.put("/settings/firm", { name: firmData.name });
      } catch {
        // Best-effort save
      }
    }
    toast.success("Onboarding complete! Welcome to CPA Platform.");
    router.push("/dashboard");
  };

  return (
    <motion.div
      className="mx-auto max-w-3xl space-y-6"
      initial="hidden"
      animate="visible"
      variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } }}
    >
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-bold tracking-tight">Welcome to CPA Platform</h1>
        <p className="text-sm text-muted-foreground">Let&apos;s get your firm set up in a few quick steps</p>
      </motion.div>

      {/* Animated Progress */}
      <motion.div variants={fadeUp} className="flex items-center gap-1">
        {STEPS.map((step) => (
          <div key={step.id} className="flex-1 flex flex-col items-center gap-1">
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: "0%" }}
                animate={{ width: step.id <= currentStep ? "100%" : "0%" }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
              />
            </div>
            <span className={`text-[10px] transition-colors ${step.id === currentStep ? "text-primary font-semibold" : "text-muted-foreground"}`}>
              {step.title}
            </span>
          </div>
        ))}
      </motion.div>

      {/* Step Content with page-flip animation */}
      <motion.div variants={fadeUp}>
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardHeader>
            <div className="flex items-center gap-3">
              <motion.div
                key={currentStep}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10"
              >
                {(() => {
                  const StepIcon = STEPS[currentStep - 1].icon;
                  return <StepIcon className="h-5 w-5 text-primary" />;
                })()}
              </motion.div>
              <div>
                <CardTitle className="text-lg">
                  Step {currentStep}: {STEPS[currentStep - 1].title}
                </CardTitle>
                <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
              </div>
              <Badge variant="outline" className="ml-auto tabular-nums">
                {currentStep} / {STEPS.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentStep}
                custom={direction}
                variants={slideVariants as never}
                initial="enter"
                animate="center"
                exit="exit"
                className="space-y-4"
              >
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Firm Name</Label>
                        <Input
                          placeholder="Acme CPA Group"
                          value={firmData.name}
                          onChange={(e) => setFirmData({ ...firmData, name: e.target.value })}
                          className="bg-muted/50 border-0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input type="tel" placeholder="(555) 123-4567" className="bg-muted/50 border-0" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input type="email" placeholder="info@acmecpa.com" className="bg-muted/50 border-0" />
                      </div>
                      <div className="space-y-2">
                        <Label>Website</Label>
                        <Input placeholder="https://acmecpa.com" className="bg-muted/50 border-0" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Address</Label>
                      <Input placeholder="123 Main St, Suite 100, City, ST 12345" className="bg-muted/50 border-0" />
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Invite team members to collaborate. You can always add more later from Settings.
                    </p>
                    {[1, 2, 3].map((i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08, duration: 0.3 }}
                        className="grid grid-cols-3 gap-3"
                      >
                        <Input placeholder="Email address" type="email" className="bg-muted/50 border-0" />
                        <Input placeholder="First name" className="bg-muted/50 border-0" />
                        <select className="flex h-9 w-full rounded-md bg-muted/50 px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                          <option value="staff_accountant">Staff Accountant</option>
                          <option value="senior_accountant">Senior Accountant</option>
                          <option value="manager">Manager</option>
                          <option value="partner">Partner</option>
                          <option value="admin">Admin</option>
                        </select>
                      </motion.div>
                    ))}
                    <Button variant="outline" size="sm">+ Add another</Button>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Import your existing client list from a CSV file or add them manually.
                    </p>
                    <motion.div
                      className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 card-hover cursor-pointer"
                      whileHover={{ borderColor: "var(--primary)", scale: 1.01 }}
                      transition={{ duration: 0.2 }}
                    >
                      <FileText className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm font-medium">Drop a CSV file here</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Columns: name, business_type, email, phone
                      </p>
                      <Button variant="outline" size="sm" className="mt-3">Browse Files</Button>
                    </motion.div>
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
                          <Input type="number" placeholder="150" className="pl-7 bg-muted/50 border-0" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Currency</Label>
                        <select className="flex h-9 w-full rounded-md bg-muted/50 px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                          <option value="USD">USD — US Dollar</option>
                          <option value="CAD">CAD — Canadian Dollar</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Payment Terms</Label>
                      <select className="flex h-9 w-full rounded-md bg-muted/50 px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
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
                    ].map((integration, i) => (
                      <motion.div
                        key={integration.name}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08, duration: 0.3 }}
                        className="flex items-center justify-between rounded-lg border p-4 card-hover"
                      >
                        <div>
                          <p className="text-sm font-medium">{integration.name}</p>
                          <p className="text-xs text-muted-foreground">{integration.desc}</p>
                        </div>
                        <Button variant="outline" size="sm">Connect</Button>
                      </motion.div>
                    ))}
                  </div>
                )}

                {currentStep === 6 && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Customize your workspace preferences.</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Timezone</Label>
                        <select className="flex h-9 w-full rounded-md bg-muted/50 px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                          <option value="America/New_York">Eastern (ET)</option>
                          <option value="America/Chicago">Central (CT)</option>
                          <option value="America/Denver">Mountain (MT)</option>
                          <option value="America/Los_Angeles">Pacific (PT)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Default Fiscal Year End</Label>
                        <select className="flex h-9 w-full rounded-md bg-muted/50 px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
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
                          <label key={pref} className="flex items-center gap-2 text-sm cursor-pointer hover:text-foreground transition-colors">
                            <input type="checkbox" defaultChecked className="rounded border-input accent-primary" />
                            {pref}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 7 && (
                  <motion.div
                    className="flex flex-col items-center justify-center py-8 text-center"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
                  >
                    <motion.div
                      className="rounded-full bg-green-500/10 p-4 mb-4"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Sparkles className="h-8 w-8 text-green-600" />
                    </motion.div>
                    <h3 className="text-xl font-bold mb-2">You&apos;re all set!</h3>
                    <p className="text-sm text-muted-foreground max-w-md mb-6">
                      Your CPA Platform workspace is ready. Start by adding clients, tracking time,
                      or exploring the dashboard.
                    </p>
                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => router.push("/clients")}>
                        Add Clients
                      </Button>
                      <Button onClick={handleComplete} className="shadow-lg shadow-primary/20">
                        Go to Dashboard
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* Navigation */}
      {currentStep < 7 && (
        <motion.div variants={fadeUp} className="flex items-center justify-between">
          <Button variant="ghost" onClick={handlePrev} disabled={currentStep === 1}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => { setDirection(1); setCurrentStep(7); }} className="text-muted-foreground">
              Skip Setup
            </Button>
            <Button onClick={handleNext} className="shadow-sm">
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
