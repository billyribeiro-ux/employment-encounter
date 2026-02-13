"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  Users,
  Briefcase,
  MessageSquare,
  Calendar,
  CreditCard,
  Search,
  Settings,
  BarChart3,
  Video,
  FileText,
  Clock,
  Receipt,
  LayoutDashboard,
  Keyboard,
  ClipboardCheck,
  FileSignature,
  Star,
  Bell,
  Plus,
  CalendarClock,
  Brain,
  GitCompare,
  FileSearch,
  MessageCircleQuestion,
  Zap,
  Heart,
  Globe,
  Mail,
  Puzzle,
  Upload,
  Activity,
  Kanban,
  Layers,
  ShieldCheck,
  ClipboardList,
  VideoIcon,
  BookOpen,
  Handshake,
  UserPlus,
  GraduationCap,
  DollarSign,
  Shield,
  SearchCheck,
  Scale,
} from "lucide-react";

interface CommandItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
  group: string;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const navigate = useCallback(
    (path: string) => {
      router.push(path);
      setOpen(false);
    },
    [router]
  );

  const commands: CommandItem[] = [
    // Hiring
    { id: "dashboard", label: "Go to Dashboard", icon: <LayoutDashboard className="h-4 w-4" />, shortcut: "G D", action: () => navigate("/dashboard"), group: "Hiring" },
    { id: "hiring", label: "Go to Jobs & Pipeline", icon: <Briefcase className="h-4 w-4" />, shortcut: "G J", action: () => navigate("/hiring"), group: "Hiring" },
    { id: "pipeline", label: "Go to Pipeline Board", icon: <Kanban className="h-4 w-4" />, shortcut: "G P", action: () => navigate("/hiring/pipeline"), group: "Hiring" },
    { id: "stages", label: "Go to Custom Stages", icon: <Layers className="h-4 w-4" />, action: () => navigate("/hiring/stages"), group: "Hiring" },
    { id: "evaluate", label: "Go to Evaluation Center", icon: <ClipboardCheck className="h-4 w-4" />, shortcut: "G E", action: () => navigate("/hiring/evaluate"), group: "Hiring" },
    { id: "talent", label: "Go to Talent Discovery", icon: <Search className="h-4 w-4" />, shortcut: "G T", action: () => navigate("/talent"), group: "Hiring" },
    { id: "search", label: "Go to Advanced Search", icon: <SearchCheck className="h-4 w-4" />, action: () => navigate("/hiring/search"), group: "Hiring" },
    { id: "offers", label: "Go to Offers", icon: <FileSignature className="h-4 w-4" />, shortcut: "G O", action: () => navigate("/hiring/offers"), group: "Hiring" },
    { id: "negotiations", label: "Go to Negotiations", icon: <Scale className="h-4 w-4" />, action: () => navigate("/hiring/negotiations"), group: "Hiring" },
    { id: "approvals", label: "Go to Approvals", icon: <ShieldCheck className="h-4 w-4" />, action: () => navigate("/hiring/approvals"), group: "Hiring" },
    { id: "create-job", label: "Create New Job", icon: <Plus className="h-4 w-4" />, action: () => navigate("/hiring/jobs/new"), group: "Hiring" },
    { id: "career-page", label: "Go to Career Page", icon: <Globe className="h-4 w-4" />, action: () => navigate("/hiring/career-page"), group: "Hiring" },
    { id: "team", label: "Go to Hiring Team", icon: <Users className="h-4 w-4" />, action: () => navigate("/hiring/team"), group: "Hiring" },
    // Evaluation
    { id: "scorecards", label: "Go to Scorecards", icon: <ClipboardList className="h-4 w-4" />, action: () => navigate("/hiring/scorecards"), group: "Evaluation" },
    { id: "assessments", label: "Go to Assessments", icon: <GraduationCap className="h-4 w-4" />, action: () => navigate("/hiring/assessments"), group: "Evaluation" },
    { id: "video-interviews", label: "Go to Video Interviews", icon: <VideoIcon className="h-4 w-4" />, action: () => navigate("/hiring/video-interviews"), group: "Evaluation" },
    { id: "references", label: "Go to Reference Checks", icon: <BookOpen className="h-4 w-4" />, action: () => navigate("/hiring/references"), group: "Evaluation" },
    // Talent
    { id: "referrals", label: "Go to Referral Portal", icon: <Handshake className="h-4 w-4" />, action: () => navigate("/hiring/referrals"), group: "Talent" },
    { id: "talent-pools", label: "Go to Talent Pools", icon: <UserPlus className="h-4 w-4" />, action: () => navigate("/hiring/talent-pools"), group: "Talent" },
    { id: "onboarding", label: "Go to Onboarding", icon: <GraduationCap className="h-4 w-4" />, action: () => navigate("/hiring/onboarding"), group: "Talent" },
    { id: "compensation", label: "Go to Compensation", icon: <DollarSign className="h-4 w-4" />, action: () => navigate("/hiring/compensation"), group: "Talent" },
    // AI & Tools
    { id: "matching", label: "Go to AI Matching", icon: <Brain className="h-4 w-4" />, action: () => navigate("/hiring/matching"), group: "AI & Tools" },
    { id: "compare", label: "Go to Compare Candidates", icon: <GitCompare className="h-4 w-4" />, action: () => navigate("/hiring/compare"), group: "AI & Tools" },
    { id: "resume-parser", label: "Go to Resume Parser", icon: <FileSearch className="h-4 w-4" />, action: () => navigate("/hiring/resume-parser"), group: "AI & Tools" },
    { id: "questions", label: "Go to Question Bank", icon: <MessageCircleQuestion className="h-4 w-4" />, action: () => navigate("/hiring/questions"), group: "AI & Tools" },
    { id: "automations", label: "Go to Automations", icon: <Zap className="h-4 w-4" />, action: () => navigate("/hiring/automations"), group: "AI & Tools" },
    { id: "diversity", label: "Go to Diversity Dashboard", icon: <Heart className="h-4 w-4" />, action: () => navigate("/hiring/diversity"), group: "AI & Tools" },
    // Communication
    { id: "conversations", label: "Go to Conversations", icon: <MessageSquare className="h-4 w-4" />, shortcut: "G C", action: () => navigate("/conversations"), group: "Communication" },
    { id: "scheduling", label: "Go to Scheduling", icon: <CalendarClock className="h-4 w-4" />, shortcut: "G S", action: () => navigate("/scheduling"), group: "Communication" },
    { id: "conference", label: "Go to Conference", icon: <Video className="h-4 w-4" />, shortcut: "G V", action: () => navigate("/conference"), group: "Communication" },
    { id: "notifications", label: "Go to Notifications", icon: <Bell className="h-4 w-4" />, shortcut: "G N", action: () => navigate("/notifications"), group: "Communication" },
    // Operations
    { id: "documents", label: "Go to Documents", icon: <FileText className="h-4 w-4" />, action: () => navigate("/documents"), group: "Operations" },
    { id: "workflows", label: "Go to Workflows", icon: <Clock className="h-4 w-4" />, action: () => navigate("/workflows"), group: "Operations" },
    { id: "tasks", label: "Go to Tasks", icon: <Clock className="h-4 w-4" />, action: () => navigate("/tasks"), group: "Operations" },
    { id: "calendar", label: "Go to Calendar", icon: <Calendar className="h-4 w-4" />, action: () => navigate("/calendar"), group: "Operations" },
    { id: "templates", label: "Go to Email Templates", icon: <Mail className="h-4 w-4" />, action: () => navigate("/hiring/templates"), group: "Operations" },
    { id: "activity", label: "Go to Activity Log", icon: <Activity className="h-4 w-4" />, action: () => navigate("/hiring/activity"), group: "Operations" },
    { id: "integrations", label: "Go to Integrations", icon: <Puzzle className="h-4 w-4" />, action: () => navigate("/hiring/integrations"), group: "Operations" },
    { id: "import", label: "Go to Bulk Import", icon: <Upload className="h-4 w-4" />, action: () => navigate("/hiring/import"), group: "Operations" },
    { id: "compliance", label: "Go to Compliance / GDPR", icon: <Shield className="h-4 w-4" />, action: () => navigate("/hiring/compliance"), group: "Operations" },
    // Insights
    { id: "analytics", label: "Go to Analytics", icon: <BarChart3 className="h-4 w-4" />, action: () => navigate("/analytics"), group: "Insights" },
    { id: "reports", label: "Go to Reports", icon: <FileText className="h-4 w-4" />, action: () => navigate("/reports"), group: "Insights" },
    // Account
    { id: "billing", label: "Go to Billing", icon: <CreditCard className="h-4 w-4" />, shortcut: "G B", action: () => navigate("/billing"), group: "Account" },
    { id: "settings", label: "Go to Settings", icon: <Settings className="h-4 w-4" />, action: () => navigate("/settings"), group: "Account" },
  ];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div className="fixed left-1/2 top-[20%] -translate-x-1/2 w-full max-w-lg">
        <Command
          className="rounded-xl border bg-popover text-popover-foreground shadow-2xl overflow-hidden"
          loop
        >
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input
              placeholder="Type a command or search..."
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              autoFocus
            />
            <kbd className="pointer-events-none ml-2 inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              ESC
            </kbd>
          </div>
          <Command.List className="max-h-[300px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>
            {["Hiring", "Evaluation", "Talent", "AI & Tools", "Communication", "Operations", "Insights", "Account"].map((group) => {
              const groupCommands = commands.filter((c) => c.group === group);
              if (groupCommands.length === 0) return null;
              return (
                <Command.Group key={group} heading={group} className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
                  {groupCommands.map((cmd) => (
                    <Command.Item
                      key={cmd.id}
                      value={cmd.label}
                      onSelect={cmd.action}
                      className="relative flex cursor-pointer select-none items-center rounded-md px-2 py-2 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                    >
                      <span className="mr-3 text-muted-foreground">{cmd.icon}</span>
                      <span className="flex-1">{cmd.label}</span>
                      {cmd.shortcut && (
                        <span className="ml-auto text-xs text-muted-foreground">
                          {cmd.shortcut.split(" ").map((key, i) => (
                            <kbd key={i} className="ml-0.5 rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">
                              {key}
                            </kbd>
                          ))}
                        </span>
                      )}
                    </Command.Item>
                  ))}
                </Command.Group>
              );
            })}
          </Command.List>
          <div className="border-t px-3 py-2 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Keyboard className="h-3 w-3" />
              <span>Navigate with arrow keys</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">Enter</kbd>
              <span>to select</span>
            </div>
          </div>
        </Command>
      </div>
    </div>
  );
}
