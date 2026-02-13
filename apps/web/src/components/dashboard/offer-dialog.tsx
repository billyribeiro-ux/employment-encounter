"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { DollarSign, Send, Save } from "lucide-react";
import { useCreateOffer, useSendOffer } from "@/lib/hooks/use-offers";
import { toast } from "sonner";

function formatCents(cents: number | null): string {
  if (!cents) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

interface OfferDialogProps {
  children: React.ReactNode;
  applicationId: string;
  jobId: string;
  candidateId: string;
  jobTitle: string;
  candidateName: string;
}

export function OfferDialog({
  children,
  applicationId,
  jobId,
  candidateId,
  jobTitle,
  candidateName,
}: OfferDialogProps) {
  const [open, setOpen] = useState(false);
  const [baseSalary, setBaseSalary] = useState("");
  const [equityPct, setEquityPct] = useState("");
  const [signingBonus, setSigningBonus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [benefitsSummary, setBenefitsSummary] = useState("");
  const [customTerms, setCustomTerms] = useState("");

  const createOffer = useCreateOffer();
  const sendOffer = useSendOffer();

  function resetForm() {
    setBaseSalary("");
    setEquityPct("");
    setSigningBonus("");
    setStartDate("");
    setExpiryDate("");
    setBenefitsSummary("");
    setCustomTerms("");
  }

  function buildPayload() {
    return {
      application_id: applicationId,
      job_id: jobId,
      candidate_id: candidateId,
      title: jobTitle,
      base_salary_cents: baseSalary ? Math.round(parseFloat(baseSalary) * 100) : undefined,
      salary_currency: "USD",
      equity_pct: equityPct ? parseFloat(equityPct) : undefined,
      signing_bonus_cents: signingBonus
        ? Math.round(parseFloat(signingBonus) * 100)
        : undefined,
      start_date: startDate || undefined,
      expiry_date: expiryDate || undefined,
      benefits_summary: benefitsSummary.trim() || undefined,
      custom_terms: customTerms.trim() || undefined,
    };
  }

  function handleSaveDraft(e: React.FormEvent) {
    e.preventDefault();
    createOffer.mutate(buildPayload(), {
      onSuccess: () => {
        toast.success("Offer saved as draft");
        setOpen(false);
        resetForm();
      },
      onError: () => toast.error("Failed to create offer"),
    });
  }

  function handleSendOffer(e: React.FormEvent) {
    e.preventDefault();
    createOffer.mutate(buildPayload(), {
      onSuccess: (data) => {
        sendOffer.mutate(data.id, {
          onSuccess: () => {
            toast.success("Offer sent to candidate");
            setOpen(false);
            resetForm();
          },
          onError: () => toast.error("Offer created but failed to send"),
        });
      },
      onError: () => toast.error("Failed to create offer"),
    });
  }

  const isPending = createOffer.isPending || sendOffer.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSaveDraft}>
          <DialogHeader>
            <DialogTitle>Create Offer</DialogTitle>
            <DialogDescription>
              Create and send an offer to the candidate.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-xs text-muted-foreground">
                  Job Title
                </Label>
                <p className="text-sm font-medium">{jobTitle}</p>
              </div>
              <div className="grid gap-2">
                <Label className="text-xs text-muted-foreground">
                  Candidate
                </Label>
                <p className="text-sm font-medium">{candidateName}</p>
              </div>
            </div>

            <Separator />

            <div className="grid gap-2">
              <Label htmlFor="base-salary">Base Salary (USD)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="base-salary"
                  type="number"
                  min="0"
                  step="1000"
                  value={baseSalary}
                  onChange={(e) => setBaseSalary(e.target.value)}
                  placeholder="120000"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="equity-pct">Equity (%)</Label>
                <Input
                  id="equity-pct"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={equityPct}
                  onChange={(e) => setEquityPct(e.target.value)}
                  placeholder="0.5"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="signing-bonus">Signing Bonus (USD)</Label>
                <Input
                  id="signing-bonus"
                  type="number"
                  min="0"
                  step="500"
                  value={signingBonus}
                  onChange={(e) => setSigningBonus(e.target.value)}
                  placeholder="10000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="expiry-date">Expiry Date</Label>
                <Input
                  id="expiry-date"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="benefits">Benefits Summary</Label>
              <Textarea
                id="benefits"
                value={benefitsSummary}
                onChange={(e) => setBenefitsSummary(e.target.value)}
                placeholder="Health insurance, 401k matching, unlimited PTO, etc."
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="custom-terms">Custom Terms</Label>
              <Textarea
                id="custom-terms"
                value={customTerms}
                onChange={(e) => setCustomTerms(e.target.value)}
                placeholder="Any additional terms or conditions..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="outline"
              disabled={isPending}
            >
              <Save className="mr-2 h-4 w-4" />
              {createOffer.isPending ? "Saving..." : "Save as Draft"}
            </Button>
            <Button
              type="button"
              onClick={handleSendOffer}
              disabled={isPending}
            >
              <Send className="mr-2 h-4 w-4" />
              {sendOffer.isPending ? "Sending..." : "Send Offer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
