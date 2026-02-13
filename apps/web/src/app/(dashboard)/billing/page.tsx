"use client";

import { useState } from "react";
import {
  CreditCard,
  Check,
  Zap,
  Building2,
  Rocket,
  Crown,
  Users,
  Briefcase,
  UserSearch,
  ArrowRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  useCurrentSubscription,
  usePlans,
  useUsage,
  useChangePlan,
} from "@/lib/hooks/use-subscriptions";
import { toast } from "sonner";

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function planIcon(planName: string) {
  switch (planName.toLowerCase()) {
    case "starter":
      return <Zap className="h-5 w-5 text-blue-600" />;
    case "growth":
      return <Rocket className="h-5 w-5 text-emerald-600" />;
    case "scale":
      return <Building2 className="h-5 w-5 text-violet-600" />;
    case "enterprise":
      return <Crown className="h-5 w-5 text-amber-600" />;
    default:
      return <CreditCard className="h-5 w-5 text-muted-foreground" />;
  }
}

function UsageBar({
  label,
  used,
  limit,
  icon,
}: {
  label: string;
  used: number;
  limit: number;
  icon: React.ReactNode;
}) {
  const percentage = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const isNearLimit = percentage >= 80;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className="text-sm text-muted-foreground">
          {used} / {limit === -1 ? "Unlimited" : limit}
        </span>
      </div>
      {limit !== -1 && (
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isNearLimit ? "bg-amber-500" : "bg-primary"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}

const DEFAULT_PLANS = [
  {
    id: "starter",
    name: "Starter",
    price_cents: 4900,
    billing_cycle: "monthly",
    features: [
      "Up to 5 job postings",
      "3 team members",
      "100 candidate profiles",
      "Basic analytics",
      "Email support",
    ],
    limits: { jobs: 5, users: 3, candidates: 100 },
    is_popular: false,
  },
  {
    id: "growth",
    name: "Growth",
    price_cents: 9900,
    billing_cycle: "monthly",
    features: [
      "Up to 25 job postings",
      "10 team members",
      "500 candidate profiles",
      "Advanced analytics",
      "Priority support",
      "API access",
    ],
    limits: { jobs: 25, users: 10, candidates: 500 },
    is_popular: true,
  },
  {
    id: "scale",
    name: "Scale",
    price_cents: 19900,
    billing_cycle: "monthly",
    features: [
      "Up to 100 job postings",
      "25 team members",
      "2,000 candidate profiles",
      "Custom analytics",
      "Dedicated support",
      "API access",
      "SSO integration",
    ],
    limits: { jobs: 100, users: 25, candidates: 2000 },
    is_popular: false,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price_cents: 0,
    billing_cycle: "custom",
    features: [
      "Unlimited job postings",
      "Unlimited team members",
      "Unlimited candidates",
      "Custom analytics",
      "24/7 support",
      "Full API access",
      "SSO & SCIM",
      "Custom integrations",
      "SLA guarantee",
    ],
    limits: { jobs: -1, users: -1, candidates: -1 },
    is_popular: false,
  },
];

export default function BillingPage() {
  const {
    data: subscription,
    isLoading: subLoading,
  } = useCurrentSubscription();
  const { data: apiPlans } = usePlans();
  const { data: usage, isLoading: usageLoading } = useUsage();
  const changePlan = useChangePlan();

  const plans = apiPlans && apiPlans.length > 0 ? apiPlans : DEFAULT_PLANS;

  function handleChangePlan(planId: string) {
    changePlan.mutate(planId, {
      onSuccess: () => toast.success("Plan changed successfully"),
      onError: () => toast.error("Failed to change plan"),
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Subscription & Billing
        </h1>
        <p className="text-muted-foreground">
          Manage your subscription plan and monitor usage
        </p>
      </div>

      {/* Current Plan Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Current Plan</CardTitle>
        </CardHeader>
        <CardContent>
          {subLoading ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
            </div>
          ) : subscription ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  {planIcon(subscription.plan_name)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">
                      {subscription.plan_name}
                    </h3>
                    <Badge variant="default">{subscription.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatCents(subscription.price_cents)} /{" "}
                    {subscription.billing_cycle}
                    {" - "}
                    {subscription.seats_used} / {subscription.seats_limit} seats
                    used
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Next renewal:{" "}
                    {new Date(
                      subscription.current_period_end
                    ).toLocaleDateString()}
                    {subscription.cancel_at_period_end && (
                      <span className="text-amber-600 ml-2">
                        (Cancels at end of period)
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">Change Plan</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Change Plan</DialogTitle>
                    <DialogDescription>
                      Select a new plan for your organization.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-3 py-4">
                    {plans.map((plan) => (
                      <button
                        key={plan.id}
                        onClick={() => handleChangePlan(plan.id)}
                        disabled={
                          changePlan.isPending ||
                          plan.id === subscription.plan_id
                        }
                        className={`flex items-center justify-between rounded-lg border p-4 text-left transition-colors hover:bg-accent disabled:opacity-50 ${
                          plan.id === subscription.plan_id
                            ? "border-primary bg-primary/5"
                            : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {planIcon(plan.name)}
                          <div>
                            <p className="font-medium">{plan.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {plan.price_cents > 0
                                ? `${formatCents(plan.price_cents)} / ${plan.billing_cycle}`
                                : "Custom pricing"}
                            </p>
                          </div>
                        </div>
                        {plan.id === subscription.plan_id ? (
                          <Badge>Current</Badge>
                        ) : (
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <div className="text-center py-6">
              <CreditCard className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No active subscription found. Choose a plan below to get
                started.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Usage</CardTitle>
        </CardHeader>
        <CardContent>
          {usageLoading ? (
            <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-2 w-full" />
                </div>
              ))}
            </div>
          ) : usage ? (
            <div className="space-y-6">
              <UsageBar
                label="Job Postings"
                used={usage.jobs_used}
                limit={usage.jobs_limit}
                icon={<Briefcase className="h-4 w-4 text-blue-600" />}
              />
              <UsageBar
                label="Team Members"
                used={usage.users_used}
                limit={usage.users_limit}
                icon={<Users className="h-4 w-4 text-emerald-600" />}
              />
              <UsageBar
                label="Candidate Profiles"
                used={usage.candidates_used}
                limit={usage.candidates_limit}
                icon={<UserSearch className="h-4 w-4 text-violet-600" />}
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              Usage data is not available yet.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Plan Comparison Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Compare Plans</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => {
            const isCurrent =
              subscription && plan.id === subscription.plan_id;
            return (
              <Card
                key={plan.id}
                className={`relative ${
                  plan.is_popular
                    ? "border-primary shadow-md"
                    : ""
                }`}
              >
                {plan.is_popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <div className="flex justify-center mb-2">
                    {planIcon(plan.name)}
                  </div>
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <div className="mt-2">
                    {plan.price_cents > 0 ? (
                      <>
                        <span className="text-3xl font-bold">
                          {formatCents(plan.price_cents)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          /{plan.billing_cycle}
                        </span>
                      </>
                    ) : (
                      <span className="text-lg font-semibold text-muted-foreground">
                        Custom Pricing
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm"
                      >
                        <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    <Button variant="outline" className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : plan.price_cents === 0 ? (
                    <Button variant="outline" className="w-full">
                      Contact Sales
                    </Button>
                  ) : (
                    <Button
                      variant={plan.is_popular ? "default" : "outline"}
                      className="w-full"
                      onClick={() => handleChangePlan(plan.id)}
                      disabled={changePlan.isPending}
                    >
                      {changePlan.isPending
                        ? "Switching..."
                        : "Switch to " + plan.name}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
