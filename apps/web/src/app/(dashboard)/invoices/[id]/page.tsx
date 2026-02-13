"use client";

import { use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FileSignature,
  Download,
  Send,
  CheckCircle2,
  Clock,
  Edit,
  Copy,
  Printer,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function OfferLetterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  // Simulated offer letter data
  const offer = {
    id,
    templateName: "Standard Full-Time Offer",
    candidateName: "Sarah Chen",
    candidateEmail: "sarah.chen@email.com",
    jobTitle: "Senior Software Engineer",
    department: "Engineering",
    salary: "$165,000",
    startDate: "March 15, 2026",
    status: "pending" as const,
    sentAt: "February 10, 2026",
    expiresAt: "February 24, 2026",
    content: `Dear Sarah Chen,

We are delighted to offer you the position of Senior Software Engineer at Talent OS. After careful consideration, we believe your skills and experience make you an excellent addition to our Engineering team.

Position Details:
- Title: Senior Software Engineer
- Department: Engineering
- Reports to: Jane Smith, VP of Engineering
- Start Date: March 15, 2026
- Employment Type: Full-Time

Compensation:
- Base Salary: $165,000 per year
- Annual Bonus: Up to 15% of base salary
- Equity: 10,000 stock options (4-year vesting, 1-year cliff)

Benefits:
- Health, dental, and vision insurance
- 401(k) with 4% company match
- Unlimited PTO
- $2,500 annual learning & development budget
- Remote work flexibility

This offer is contingent upon successful completion of a background check and your ability to provide proof of authorization to work in the United States.

Please confirm your acceptance by signing and returning this letter by February 24, 2026.

We are excited about the possibility of you joining our team!

Sincerely,
Jane Smith
VP of Engineering
Talent OS`,
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/invoices">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Templates
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Offer Letter</h1>
          <p className="text-muted-foreground">
            {offer.candidateName} &mdash; {offer.jobTitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            <Clock className="mr-1 h-3 w-3" />
            {offer.status === "pending" ? "Awaiting Response" : "Accepted"}
          </Badge>
        </div>
      </div>

      {/* Status Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Candidate</p>
              <p className="text-sm font-medium">{offer.candidateName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Position</p>
              <p className="text-sm font-medium">{offer.jobTitle}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Sent On</p>
              <p className="text-sm font-medium">{offer.sentAt}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Expires</p>
              <p className="text-sm font-medium">{offer.expiresAt}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Letter Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileSignature className="h-5 w-5" />
              Offer Letter Content
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Printer className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-white p-6 dark:bg-muted/30">
            <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">
              {offer.content}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button variant="outline">
          <Download className="mr-1.5 h-4 w-4" />
          Download PDF
        </Button>
        <div className="flex gap-2">
          <Button variant="outline">
            <Edit className="mr-1.5 h-4 w-4" />
            Edit & Resend
          </Button>
          <Button>
            <Send className="mr-1.5 h-4 w-4" />
            Send Reminder
          </Button>
        </div>
      </div>
    </div>
  );
}
