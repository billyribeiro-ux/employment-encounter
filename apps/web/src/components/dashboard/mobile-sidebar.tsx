"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  Calendar,
  Settings,
  FolderOpen,
  CheckSquare,
  MessageSquare,
  PieChart,
  Video,
  Search,
  Briefcase,
  UserCheck,
  CreditCard,
  CalendarClock,
  ClipboardCheck,
  Star,
  FileSignature,
  Bell,
  Mail,
  Globe,
  Activity,
  Plug,
  Upload,
  Brain,
  GitCompare,
  MessageCircleQuestion,
  Zap,
  Heart,
  FileSearch,
  Kanban,
  Layers,
  ShieldCheck,
  ClipboardList,
  VideoIcon,
  UserPlus,
  Handshake,
  BookOpen,
  GraduationCap,
  DollarSign,
  Shield,
  SearchCheck,
  Scale,
  Menu,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const sections: NavSection[] = [
  {
    label: "Hiring",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Jobs & Pipeline", href: "/hiring", icon: Briefcase },
      { name: "Pipeline Board", href: "/hiring/pipeline", icon: Kanban },
      { name: "Custom Stages", href: "/hiring/stages", icon: Layers },
      { name: "Evaluation Center", href: "/hiring/evaluate", icon: ClipboardCheck },
      { name: "Talent Discovery", href: "/talent", icon: Search },
      { name: "Advanced Search", href: "/hiring/search", icon: SearchCheck },
      { name: "Offers", href: "/hiring/offers", icon: FileSignature },
      { name: "Negotiations", href: "/hiring/negotiations", icon: Scale },
      { name: "Approvals", href: "/hiring/approvals", icon: ShieldCheck },
      { name: "Career Page", href: "/hiring/career-page", icon: Globe },
      { name: "Team", href: "/hiring/team", icon: Users },
    ],
  },
  {
    label: "Evaluation",
    items: [
      { name: "Scorecards", href: "/hiring/scorecards", icon: ClipboardList },
      { name: "Assessments", href: "/hiring/assessments", icon: GraduationCap },
      { name: "Video Interviews", href: "/hiring/video-interviews", icon: VideoIcon },
      { name: "Reference Checks", href: "/hiring/references", icon: BookOpen },
    ],
  },
  {
    label: "Talent",
    items: [
      { name: "Referral Portal", href: "/hiring/referrals", icon: Handshake },
      { name: "Talent Pools", href: "/hiring/talent-pools", icon: UserPlus },
      { name: "Onboarding", href: "/hiring/onboarding", icon: GraduationCap },
      { name: "Compensation", href: "/hiring/compensation", icon: DollarSign },
    ],
  },
  {
    label: "AI & Tools",
    items: [
      { name: "AI Matching", href: "/hiring/matching", icon: Brain },
      { name: "Compare Candidates", href: "/hiring/compare", icon: GitCompare },
      { name: "Resume Parser", href: "/hiring/resume-parser", icon: FileSearch },
      { name: "Question Bank", href: "/hiring/questions", icon: MessageCircleQuestion },
      { name: "Automations", href: "/hiring/automations", icon: Zap },
      { name: "Diversity & Inclusion", href: "/hiring/diversity", icon: Heart },
    ],
  },
  {
    label: "Communication",
    items: [
      { name: "Conversations", href: "/conversations", icon: MessageSquare, badge: 3 },
      { name: "Scheduling", href: "/scheduling", icon: CalendarClock },
      { name: "Conference", href: "/conference", icon: Video },
      { name: "Notifications", href: "/notifications", icon: Bell, badge: 5 },
    ],
  },
  {
    label: "Operations",
    items: [
      { name: "Documents", href: "/documents", icon: FileText },
      { name: "Workflows", href: "/workflows", icon: FolderOpen },
      { name: "Tasks", href: "/tasks", icon: CheckSquare },
      { name: "Calendar", href: "/calendar", icon: Calendar },
      { name: "Templates", href: "/hiring/templates", icon: Mail },
      { name: "Activity Log", href: "/hiring/activity", icon: Activity },
      { name: "Integrations", href: "/hiring/integrations", icon: Plug },
      { name: "Import", href: "/hiring/import", icon: Upload },
      { name: "Compliance / GDPR", href: "/hiring/compliance", icon: Shield },
    ],
  },
  {
    label: "Insights",
    items: [
      { name: "Analytics", href: "/analytics", icon: BarChart3 },
      { name: "Reports", href: "/reports", icon: PieChart },
    ],
  },
  {
    label: "Account",
    items: [
      { name: "Billing", href: "/billing", icon: CreditCard },
      { name: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export function MobileSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    () => new Set(sections.map((s) => s.label))
  );

  function toggleSection(label: string) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0 flex flex-col">
        {/* Logo header */}
        <SheetHeader className="flex-row items-center gap-2 border-b px-6 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <UserCheck className="h-4 w-4" />
          </div>
          <SheetTitle className="text-lg">Talent OS</SheetTitle>
        </SheetHeader>

        {/* Scrollable navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {sections.map((section) => {
            const isExpanded = expandedSections.has(section.label);

            return (
              <div key={section.label} className="mb-2">
                {/* Section header - collapsible toggle */}
                <button
                  type="button"
                  onClick={() => toggleSection(section.label)}
                  className="flex w-full items-center justify-between rounded-md px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                >
                  <span>{section.label}</span>
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </button>

                {/* Section items */}
                {isExpanded && (
                  <div className="mt-0.5 space-y-0.5">
                    {section.items.map((item) => {
                      const isActive =
                        pathname === item.href ||
                        pathname?.startsWith(item.href + "/");
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                          )}
                        >
                          <item.icon className="h-4 w-4 flex-shrink-0" />
                          <span className="flex-1">{item.name}</span>
                          {item.badge != null && item.badge > 0 && (
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t p-4">
          <p className="text-xs text-muted-foreground">Talent OS v1.0.0</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
