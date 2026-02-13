"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  Clock,
  Receipt,
  BarChart3,
  Calendar,
  Settings,
  FolderOpen,
  CheckSquare,
  Wallet,
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
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavSection {
  label: string;
  items: { name: string; href: string; icon: React.ElementType }[];
}

const sections: NavSection[] = [
  {
    label: "Hiring",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Jobs & Pipeline", href: "/hiring", icon: Briefcase },
      { name: "Evaluation Center", href: "/hiring/evaluate", icon: ClipboardCheck },
      { name: "Talent Discovery", href: "/talent", icon: Search },
      { name: "Shortlisted", href: "/hiring/evaluate?tab=shortlisted", icon: Star },
      { name: "Offers", href: "/hiring/offers", icon: FileSignature },
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

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 flex-shrink-0 border-r bg-card lg:flex lg:flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <UserCheck className="h-4 w-4" />
        </div>
        <span className="text-lg font-semibold">Talent OS</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {sections.map((section) => (
          <div key={section.label} className="mb-4">
            <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href || pathname?.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
        <p className="text-xs text-muted-foreground">Talent OS v1.0.0</p>
      </div>
    </aside>
  );
}
