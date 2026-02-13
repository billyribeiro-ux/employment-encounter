"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
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
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const STORAGE_KEY_COLLAPSED = "sidebar-collapsed";
const STORAGE_KEY_PINNED = "sidebar-pinned";

const DEFAULT_PINNED = ["Dashboard", "Jobs & Pipeline", "Conversations"];

const BADGE_COUNTS: Record<string, number> = {
  Conversations: 3,
  Notifications: 5,
  Approvals: 2,
};

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
      { name: "Conversations", href: "/conversations", icon: MessageSquare },
      { name: "Scheduling", href: "/scheduling", icon: CalendarClock },
      { name: "Conference", href: "/conference", icon: Video },
      { name: "Notifications", href: "/notifications", icon: Bell },
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

// Build a flat lookup: item name -> NavItem (with badge info)
const itemByName: Record<string, NavItem> = {};
for (const section of sections) {
  for (const item of section.items) {
    itemByName[item.name] = { ...item, badge: BADGE_COUNTS[item.name] };
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readLocalStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocalStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota exceeded – silently ignore
  }
}

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const sectionContentVariants = {
  open: {
    height: "auto" as const,
    opacity: 1,
    transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] as const },
  },
  closed: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] as const },
  },
} satisfies import("framer-motion").Variants;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Badge({ count }: { count: number }) {
  return (
    <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold leading-none text-primary-foreground">
      {count}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

export function Sidebar() {
  const pathname = usePathname();

  // ---- State: sidebar width collapsed (icon-only) ----
  const [isNarrow, setIsNarrow] = useState(false);
  useEffect(() => {
    setIsNarrow(readLocalStorage(STORAGE_KEY_COLLAPSED, false));
  }, []);
  const toggleNarrow = useCallback(() => {
    setIsNarrow((prev) => {
      const next = !prev;
      writeLocalStorage(STORAGE_KEY_COLLAPSED, next);
      return next;
    });
  }, []);

  // ---- State: pinned items ----
  const [pinnedNames, setPinnedNames] = useState<string[]>(DEFAULT_PINNED);
  useEffect(() => {
    setPinnedNames(readLocalStorage(STORAGE_KEY_PINNED, DEFAULT_PINNED));
  }, []);
  const togglePin = useCallback((name: string) => {
    setPinnedNames((prev) => {
      const next = prev.includes(name)
        ? prev.filter((n) => n !== name)
        : [...prev, name];
      writeLocalStorage(STORAGE_KEY_PINNED, next);
      return next;
    });
  }, []);

  // ---- State: expanded sections ----
  const activeSectionLabel = useMemo(() => {
    for (const section of sections) {
      for (const item of section.items) {
        if (pathname === item.href || pathname?.startsWith(item.href + "/")) {
          return section.label;
        }
      }
    }
    return null;
  }, [pathname]);

  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    () => new Set(["Hiring"])
  );

  // Auto-expand active section on route change
  useEffect(() => {
    if (activeSectionLabel) {
      setExpandedSections((prev) => {
        if (prev.has(activeSectionLabel)) return prev;
        const next = new Set(prev);
        next.add(activeSectionLabel);
        return next;
      });
    }
  }, [activeSectionLabel]);

  const toggleSection = useCallback((label: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }, []);

  // Double-click a heading -> toggle all
  const lastDoubleClick = useRef(0);
  const handleDoubleClick = useCallback(() => {
    const now = Date.now();
    if (now - lastDoubleClick.current < 300) return; // debounce
    lastDoubleClick.current = now;
    setExpandedSections((prev) => {
      const allLabels = sections.map((s) => s.label);
      const allExpanded = allLabels.every((l) => prev.has(l));
      return allExpanded ? new Set<string>() : new Set(allLabels);
    });
  }, []);

  // ---- State: search ----
  const [searchQuery, setSearchQuery] = useState("");
  const trimmedQuery = searchQuery.trim().toLowerCase();

  const filteredSections = useMemo(() => {
    if (!trimmedQuery) return sections;
    return sections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) =>
          item.name.toLowerCase().includes(trimmedQuery)
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [trimmedQuery]);

  // ---- Derived: pinned items ----
  const pinnedItems = useMemo(
    () =>
      pinnedNames
        .map((name) => itemByName[name])
        .filter(Boolean) as NavItem[],
    [pinnedNames]
  );

  // ---- Helpers ----
  const isActive = useCallback(
    (href: string) => pathname === href || pathname?.startsWith(href + "/"),
    [pathname]
  );

  // ---- Render helpers ----

  function renderNavLink(item: NavItem, collapsed: boolean) {
    const active = isActive(item.href);
    const badge = BADGE_COUNTS[item.name];
    const pinned = pinnedNames.includes(item.name);

    const linkContent = (
      <Link
        href={item.href}
        className={cn(
          "group/link relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          collapsed && "justify-center px-0",
          active
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <item.icon className="h-4 w-4 flex-shrink-0" />
        {!collapsed && (
          <>
            <span className="truncate">{item.name}</span>
            {badge && <Badge count={badge} />}
            {/* Pin toggle on hover */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                togglePin(item.name);
              }}
              className={cn(
                "ml-auto flex-shrink-0 rounded p-0.5 opacity-0 transition-opacity group-hover/link:opacity-100",
                pinned
                  ? "text-amber-500 opacity-100"
                  : "text-muted-foreground hover:text-foreground",
                badge && "ml-1"
              )}
              aria-label={pinned ? "Unpin item" : "Pin item"}
            >
              <Star
                className={cn("h-3 w-3", pinned && "fill-amber-500")}
              />
            </button>
          </>
        )}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip key={item.name} delayDuration={0}>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-2">
            {item.name}
            {badge ? (
              <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                {badge}
              </span>
            ) : null}
          </TooltipContent>
        </Tooltip>
      );
    }

    return <div key={item.name}>{linkContent}</div>;
  }

  // ======================================================================
  // RENDER
  // ======================================================================

  return (
    <TooltipProvider>
      <aside
        className={cn(
          "hidden flex-shrink-0 border-r bg-card lg:flex lg:flex-col transition-all duration-300 ease-in-out",
          isNarrow ? "w-16" : "w-64"
        )}
      >
        {/* ---- Logo ---- */}
        <div
          className={cn(
            "flex h-16 items-center gap-2 border-b",
            isNarrow ? "justify-center px-2" : "px-6"
          )}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground flex-shrink-0">
            <UserCheck className="h-4 w-4" />
          </div>
          {!isNarrow && (
            <span className="text-lg font-semibold whitespace-nowrap">
              Talent OS
            </span>
          )}
        </div>

        {/* ---- Search ---- */}
        {!isNarrow && (
          <div className="px-3 pt-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search navigation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-lg border bg-background pl-9 pr-8 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ---- Navigation ---- */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {/* Pinned section */}
          {!trimmedQuery && pinnedItems.length > 0 && (
            <div className="mb-3">
              {!isNarrow && (
                <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-amber-500/80">
                  Pinned
                </p>
              )}
              <div className="space-y-0.5">
                {pinnedItems.map((item) => renderNavLink(item, isNarrow))}
              </div>
              {!isNarrow && (
                <div className="my-3 border-t" />
              )}
            </div>
          )}

          {/* Sections */}
          {filteredSections.map((section) => {
            const isExpanded =
              !!trimmedQuery || expandedSections.has(section.label);

            return (
              <div key={section.label} className="mb-1">
                {/* Section heading */}
                {!isNarrow ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (!trimmedQuery) toggleSection(section.label);
                    }}
                    onDoubleClick={handleDoubleClick}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-colors",
                      "text-muted-foreground/60 hover:text-muted-foreground",
                      trimmedQuery && "cursor-default"
                    )}
                  >
                    <span>{section.label}</span>
                    {!trimmedQuery && (
                      <ChevronDown
                        className={cn(
                          "h-3 w-3 transition-transform duration-200",
                          !isExpanded && "-rotate-90"
                        )}
                      />
                    )}
                  </button>
                ) : (
                  <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                      <div className="my-2 flex justify-center">
                        <div className="h-px w-6 bg-border" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      {section.label}
                    </TooltipContent>
                  </Tooltip>
                )}

                {/* Section items */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      key={section.label + "-content"}
                      initial="closed"
                      animate="open"
                      exit="closed"
                      variants={sectionContentVariants}
                      className="overflow-hidden"
                    >
                      <div className="space-y-0.5 pb-2">
                        {section.items.map((item) =>
                          renderNavLink(item, isNarrow)
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Collapsed: always show items in icon mode */}
                {isNarrow && (
                  <div className="space-y-0.5">
                    {section.items.map((item) => renderNavLink(item, true))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* ---- Footer ---- */}
        <div className="border-t p-2">
          {/* Collapse / expand toggle */}
          <button
            type="button"
            onClick={toggleNarrow}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
              isNarrow && "justify-center px-0"
            )}
            aria-label={isNarrow ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isNarrow ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span>Collapse</span>
              </>
            )}
          </button>
          {!isNarrow && (
            <p className="px-3 pt-1 text-xs text-muted-foreground">
              Talent OS v2.0.0
            </p>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
