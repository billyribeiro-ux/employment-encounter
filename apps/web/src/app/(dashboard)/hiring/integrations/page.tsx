"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Breadcrumbs } from "@/components/dashboard/breadcrumbs";
import { toast } from "sonner";
import {
  Search,
  Plug,
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  MessageSquare,
  Users,
  Briefcase,
  Shield,
  Zap,
  Video,
  FileSignature,
  ExternalLink,
  RefreshCw,
  Loader2,
  Link,
  Unlink,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type IntegrationStatus = "connected" | "not_connected" | "error";

type IntegrationCategory =
  | "calendar"
  | "communication"
  | "hris"
  | "job_boards"
  | "background_checks"
  | "productivity"
  | "video"
  | "e_signature";

interface Integration {
  id: string;
  name: string;
  description: string;
  category: IntegrationCategory;
  status: IntegrationStatus;
  icon: string;
  last_synced: string | null;
  settings_url: string | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORY_INFO: Record<
  IntegrationCategory,
  { label: string; icon: React.ElementType; description: string }
> = {
  calendar: {
    label: "Calendar",
    icon: Calendar,
    description: "Sync interviews and events with your calendar",
  },
  communication: {
    label: "Communication",
    icon: MessageSquare,
    description: "Get notifications and updates in your messaging apps",
  },
  hris: {
    label: "HRIS",
    icon: Users,
    description: "Sync employee data with your HR information system",
  },
  job_boards: {
    label: "Job Boards",
    icon: Briefcase,
    description: "Publish jobs and receive applications from job boards",
  },
  background_checks: {
    label: "Background Checks",
    icon: Shield,
    description: "Run background checks on candidates seamlessly",
  },
  productivity: {
    label: "Productivity",
    icon: Zap,
    description: "Automate workflows and connect with productivity tools",
  },
  video: {
    label: "Video Conferencing",
    icon: Video,
    description: "Schedule and conduct video interviews",
  },
  e_signature: {
    label: "E-Signature",
    icon: FileSignature,
    description: "Send and manage electronic signatures for offer letters",
  },
};

const INTEGRATIONS: Integration[] = [
  // Calendar
  {
    id: "google-calendar",
    name: "Google Calendar",
    description:
      "Automatically create interview events in Google Calendar. Sync availability for scheduling.",
    category: "calendar",
    status: "not_connected",
    icon: "GCal",
    last_synced: null,
    settings_url: null,
  },
  {
    id: "outlook-calendar",
    name: "Outlook Calendar",
    description:
      "Sync interviews and events with Microsoft Outlook Calendar. Two-way sync supported.",
    category: "calendar",
    status: "not_connected",
    icon: "OL",
    last_synced: null,
    settings_url: null,
  },
  {
    id: "apple-calendar",
    name: "Apple Calendar",
    description:
      "Subscribe to interview schedules via Apple Calendar (iCal feed).",
    category: "calendar",
    status: "not_connected",
    icon: "AC",
    last_synced: null,
    settings_url: null,
  },

  // Communication
  {
    id: "slack",
    name: "Slack",
    description:
      "Get real-time hiring notifications in Slack channels. Approve candidates, get updates on pipeline changes.",
    category: "communication",
    status: "not_connected",
    icon: "SL",
    last_synced: null,
    settings_url: null,
  },
  {
    id: "microsoft-teams",
    name: "Microsoft Teams",
    description:
      "Receive hiring alerts and collaborate on candidates directly in Microsoft Teams.",
    category: "communication",
    status: "not_connected",
    icon: "MT",
    last_synced: null,
    settings_url: null,
  },
  {
    id: "discord",
    name: "Discord",
    description:
      "Send hiring updates to Discord channels. Great for startup teams using Discord.",
    category: "communication",
    status: "not_connected",
    icon: "DC",
    last_synced: null,
    settings_url: null,
  },

  // HRIS
  {
    id: "bamboohr",
    name: "BambooHR",
    description:
      "Sync new hires to BambooHR automatically. Push candidate data when offer is accepted.",
    category: "hris",
    status: "not_connected",
    icon: "BH",
    last_synced: null,
    settings_url: null,
  },
  {
    id: "workday",
    name: "Workday",
    description:
      "Enterprise-grade integration with Workday HCM. Sync positions, departments, and new hires.",
    category: "hris",
    status: "not_connected",
    icon: "WD",
    last_synced: null,
    settings_url: null,
  },
  {
    id: "successfactors",
    name: "SAP SuccessFactors",
    description:
      "Connect with SAP SuccessFactors for seamless HR data synchronization.",
    category: "hris",
    status: "not_connected",
    icon: "SF",
    last_synced: null,
    settings_url: null,
  },
  {
    id: "gusto",
    name: "Gusto",
    description:
      "Automatically onboard new hires in Gusto. Sync employee data and compensation details.",
    category: "hris",
    status: "not_connected",
    icon: "GU",
    last_synced: null,
    settings_url: null,
  },

  // Job Boards
  {
    id: "linkedin",
    name: "LinkedIn",
    description:
      "Post jobs to LinkedIn and receive applications directly. Sync candidate profiles.",
    category: "job_boards",
    status: "not_connected",
    icon: "LI",
    last_synced: null,
    settings_url: null,
  },
  {
    id: "indeed",
    name: "Indeed",
    description:
      "Publish job postings to Indeed. Import applicants into your pipeline automatically.",
    category: "job_boards",
    status: "not_connected",
    icon: "IN",
    last_synced: null,
    settings_url: null,
  },
  {
    id: "glassdoor",
    name: "Glassdoor",
    description:
      "Showcase your employer brand and jobs on Glassdoor. Import reviews and applications.",
    category: "job_boards",
    status: "not_connected",
    icon: "GD",
    last_synced: null,
    settings_url: null,
  },
  {
    id: "ziprecruiter",
    name: "ZipRecruiter",
    description:
      "Distribute jobs across ZipRecruiter's network. AI-powered candidate matching.",
    category: "job_boards",
    status: "not_connected",
    icon: "ZR",
    last_synced: null,
    settings_url: null,
  },
  {
    id: "angellist",
    name: "AngelList (Wellfound)",
    description:
      "Post startup jobs on AngelList/Wellfound. Attract top startup talent.",
    category: "job_boards",
    status: "not_connected",
    icon: "AL",
    last_synced: null,
    settings_url: null,
  },

  // Background Checks
  {
    id: "checkr",
    name: "Checkr",
    description:
      "Run fast, compliant background checks. Automated status updates in your pipeline.",
    category: "background_checks",
    status: "not_connected",
    icon: "CK",
    last_synced: null,
    settings_url: null,
  },
  {
    id: "sterling",
    name: "Sterling",
    description:
      "Enterprise background screening with Sterling. Global coverage and compliance.",
    category: "background_checks",
    status: "not_connected",
    icon: "ST",
    last_synced: null,
    settings_url: null,
  },
  {
    id: "goodhire",
    name: "GoodHire",
    description:
      "Simple, fast background checks with GoodHire. Candidate-friendly experience.",
    category: "background_checks",
    status: "not_connected",
    icon: "GH",
    last_synced: null,
    settings_url: null,
  },

  // Productivity
  {
    id: "zapier",
    name: "Zapier",
    description:
      "Connect Talent OS with 5,000+ apps via Zapier. Build custom automations without code.",
    category: "productivity",
    status: "not_connected",
    icon: "ZP",
    last_synced: null,
    settings_url: null,
  },
  {
    id: "make",
    name: "Make (Integromat)",
    description:
      "Build complex automation workflows with Make. Visual workflow builder with advanced logic.",
    category: "productivity",
    status: "not_connected",
    icon: "MK",
    last_synced: null,
    settings_url: null,
  },
  {
    id: "api-webhooks",
    name: "API Webhooks",
    description:
      "Set up custom webhooks to push events to any external system. Full API access included.",
    category: "productivity",
    status: "not_connected",
    icon: "WH",
    last_synced: null,
    settings_url: null,
  },

  // Video
  {
    id: "zoom",
    name: "Zoom",
    description:
      "Automatically generate Zoom meeting links for interviews. Record and share sessions.",
    category: "video",
    status: "not_connected",
    icon: "ZM",
    last_synced: null,
    settings_url: null,
  },
  {
    id: "google-meet",
    name: "Google Meet",
    description:
      "Create Google Meet links for scheduled interviews. Integrates with Google Calendar.",
    category: "video",
    status: "not_connected",
    icon: "GM",
    last_synced: null,
    settings_url: null,
  },
  {
    id: "ms-teams-video",
    name: "Microsoft Teams (Video)",
    description:
      "Schedule Teams video meetings for interviews. Full Microsoft 365 integration.",
    category: "video",
    status: "not_connected",
    icon: "TV",
    last_synced: null,
    settings_url: null,
  },

  // E-Signature
  {
    id: "docusign",
    name: "DocuSign",
    description:
      "Send offer letters for electronic signature via DocuSign. Track signing status in real-time.",
    category: "e_signature",
    status: "not_connected",
    icon: "DS",
    last_synced: null,
    settings_url: null,
  },
  {
    id: "hellosign",
    name: "HelloSign (Dropbox Sign)",
    description:
      "Simple, developer-friendly e-signatures with HelloSign. Embedded signing experience.",
    category: "e_signature",
    status: "not_connected",
    icon: "HS",
    last_synced: null,
    settings_url: null,
  },
  {
    id: "adobe-sign",
    name: "Adobe Sign",
    description:
      "Enterprise e-signature solution from Adobe. Advanced document workflows and compliance.",
    category: "e_signature",
    status: "not_connected",
    icon: "AS",
    last_synced: null,
    settings_url: null,
  },
];

const ICON_COLORS: Record<string, string> = {
  GCal: "bg-blue-100 text-blue-700",
  OL: "bg-sky-100 text-sky-700",
  AC: "bg-gray-100 text-gray-700",
  SL: "bg-purple-100 text-purple-700",
  MT: "bg-indigo-100 text-indigo-700",
  DC: "bg-violet-100 text-violet-700",
  BH: "bg-green-100 text-green-700",
  WD: "bg-orange-100 text-orange-700",
  SF: "bg-blue-100 text-blue-700",
  GU: "bg-rose-100 text-rose-700",
  LI: "bg-blue-100 text-blue-700",
  IN: "bg-indigo-100 text-indigo-700",
  GD: "bg-emerald-100 text-emerald-700",
  ZR: "bg-teal-100 text-teal-700",
  AL: "bg-black/10 text-black",
  CK: "bg-cyan-100 text-cyan-700",
  ST: "bg-blue-100 text-blue-700",
  GH: "bg-emerald-100 text-emerald-700",
  ZP: "bg-orange-100 text-orange-700",
  MK: "bg-violet-100 text-violet-700",
  WH: "bg-gray-100 text-gray-700",
  ZM: "bg-blue-100 text-blue-700",
  GM: "bg-green-100 text-green-700",
  TV: "bg-indigo-100 text-indigo-700",
  DS: "bg-yellow-100 text-yellow-700",
  HS: "bg-blue-100 text-blue-700",
  AS: "bg-red-100 text-red-700",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatSyncTime(dateStr: string | null): string {
  if (!dateStr) return "Never synced";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ---------------------------------------------------------------------------
// Integration Card
// ---------------------------------------------------------------------------

function IntegrationCard({
  integration,
  onConnect,
  onDisconnect,
  onSettings,
}: {
  integration: Integration;
  onConnect: (id: string) => void;
  onDisconnect: (id: string) => void;
  onSettings: (id: string) => void;
}) {
  const iconColor = ICON_COLORS[integration.icon] || "bg-gray-100 text-gray-700";

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="pt-5">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${iconColor}`}
          >
            {integration.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-semibold truncate">
                {integration.name}
              </h3>
              {integration.status === "connected" && (
                <Badge
                  variant="default"
                  className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-[10px]"
                >
                  <CheckCircle className="mr-1 h-2.5 w-2.5" />
                  Connected
                </Badge>
              )}
              {integration.status === "error" && (
                <Badge variant="destructive" className="text-[10px]">
                  <AlertCircle className="mr-1 h-2.5 w-2.5" />
                  Error
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
              {integration.description}
            </p>
            <div className="flex items-center justify-between">
              {integration.status === "connected" ? (
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <RefreshCw className="h-2.5 w-2.5" />
                  Last synced: {formatSyncTime(integration.last_synced)}
                </span>
              ) : (
                <span className="text-[10px] text-muted-foreground">
                  Not connected
                </span>
              )}
              <div className="flex gap-1">
                {integration.status === "connected" ? (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onSettings(integration.id)}
                    >
                      <Settings className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-muted-foreground hover:text-destructive"
                      onClick={() => onDisconnect(integration.id)}
                    >
                      <Unlink className="mr-1 h-3 w-3" />
                      Disconnect
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => onConnect(integration.id)}
                  >
                    <Link className="mr-1 h-3 w-3" />
                    Connect
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Settings Dialog
// ---------------------------------------------------------------------------

function IntegrationSettingsDialog({
  open,
  onOpenChange,
  integration,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  integration: Integration | null;
}) {
  const [syncing, setSyncing] = useState(false);

  async function handleSync() {
    setSyncing(true);
    await new Promise((r) => setTimeout(r, 1500));
    setSyncing(false);
    toast.success(`${integration?.name} synced successfully`);
  }

  if (!integration) return null;

  const iconColor = ICON_COLORS[integration.icon] || "bg-gray-100 text-gray-700";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${iconColor}`}
            >
              {integration.icon}
            </div>
            <div>
              <DialogTitle>{integration.name} Settings</DialogTitle>
              <DialogDescription>
                Manage your {integration.name} integration settings.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Connection Status</span>
              <Badge
                variant="default"
                className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
              >
                <CheckCircle className="mr-1 h-3 w-3" />
                Connected
              </Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Last Synced</span>
              <span className="text-sm">
                {formatSyncTime(integration.last_synced)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Sync Settings</h4>
            <div className="space-y-2 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded" />
                Auto-sync new data
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded" />
                Send notifications
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded" />
                Two-way sync
              </label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleSync} disabled={syncing}>
            {syncing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Sync Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function IntegrationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [integrations, setIntegrations] = useState(INTEGRATIONS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] =
    useState<Integration | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);

  const categories = Object.entries(CATEGORY_INFO) as [
    IntegrationCategory,
    (typeof CATEGORY_INFO)[IntegrationCategory],
  ][];

  const filteredIntegrations = integrations.filter((i) => {
    if (categoryFilter !== "all" && i.category !== categoryFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        i.name.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const connectedCount = integrations.filter(
    (i) => i.status === "connected"
  ).length;

  async function handleConnect(id: string) {
    setConnecting(id);
    // Simulate OAuth flow
    await new Promise((r) => setTimeout(r, 1500));
    setIntegrations((prev) =>
      prev.map((i) =>
        i.id === id
          ? {
              ...i,
              status: "connected" as IntegrationStatus,
              last_synced: new Date().toISOString(),
            }
          : i
      )
    );
    setConnecting(null);
    const integration = integrations.find((i) => i.id === id);
    toast.success(`${integration?.name} connected successfully`);
  }

  function handleDisconnect(id: string) {
    setIntegrations((prev) =>
      prev.map((i) =>
        i.id === id
          ? {
              ...i,
              status: "not_connected" as IntegrationStatus,
              last_synced: null,
            }
          : i
      )
    );
    const integration = integrations.find((i) => i.id === id);
    toast.success(`${integration?.name} disconnected`);
  }

  function handleSettings(id: string) {
    const integration = integrations.find((i) => i.id === id);
    if (integration) {
      setSelectedIntegration(integration);
      setSettingsOpen(true);
    }
  }

  // Group integrations by category
  const groupedIntegrations = categories
    .filter(
      ([key]) => categoryFilter === "all" || categoryFilter === key
    )
    .map(([key, info]) => ({
      key,
      info,
      items: filteredIntegrations.filter((i) => i.category === key),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Hiring", href: "/hiring" },
          { label: "Integrations" },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Integrations Hub
          </h1>
          <p className="text-muted-foreground">
            Connect your favorite tools to streamline your hiring workflow
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          <Plug className="mr-1.5 h-3.5 w-3.5" />
          {connectedCount} connected
        </Badge>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[250px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search integrations..."
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <Button
            variant={categoryFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setCategoryFilter("all")}
          >
            All
          </Button>
          {categories.map(([key, info]) => (
            <Button
              key={key}
              variant={categoryFilter === key ? "default" : "outline"}
              size="sm"
              onClick={() => setCategoryFilter(key)}
            >
              <info.icon className="mr-1.5 h-3 w-3" />
              {info.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Integration Groups */}
      {groupedIntegrations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Plug className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">
              No integrations found
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {searchQuery
                ? `No integrations match "${searchQuery}". Try a different search.`
                : "No integrations in this category."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {groupedIntegrations.map((group) => (
            <div key={group.key}>
              <div className="flex items-center gap-2 mb-4">
                <group.info.icon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h2 className="text-lg font-semibold">{group.info.label}</h2>
                  <p className="text-xs text-muted-foreground">
                    {group.info.description}
                  </p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {group.items.map((integration) => (
                  <div key={integration.id} className="relative">
                    {connecting === integration.id && (
                      <div className="absolute inset-0 bg-background/80 rounded-lg flex items-center justify-center z-10">
                        <div className="text-center">
                          <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-2" />
                          <p className="text-xs font-medium">Connecting...</p>
                        </div>
                      </div>
                    )}
                    <IntegrationCard
                      integration={integration}
                      onConnect={handleConnect}
                      onDisconnect={handleDisconnect}
                      onSettings={handleSettings}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <IntegrationSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        integration={selectedIntegration}
      />
    </div>
  );
}
