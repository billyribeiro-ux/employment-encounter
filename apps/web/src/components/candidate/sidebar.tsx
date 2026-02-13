"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  User,
  FileText,
  Bookmark,
  MessageSquare,
  Calendar,
  Settings,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useConversations } from "@/lib/hooks/use-conversations";
import { useMeetings } from "@/lib/hooks/use-meetings";
import { useSavedJobs } from "@/lib/hooks/use-saved-jobs";

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

export function CandidateSidebar() {
  const pathname = usePathname();

  // Fetch unread conversation count
  const { data: conversationsData } = useConversations({ per_page: 50 });
  const unreadCount =
    conversationsData?.data?.reduce(
      (sum, c) => sum + (c.unread_count || 0),
      0
    ) ?? 0;

  // Fetch upcoming meetings count
  const { data: meetingsData } = useMeetings({ per_page: 50, status: "pending" });
  const upcomingInterviews = meetingsData?.data?.filter((m) => {
    const start = new Date(m.confirmed_start || m.proposed_start);
    return start >= new Date() && m.status !== "cancelled";
  }).length ?? 0;

  // Fetch saved jobs count
  const { data: savedJobs } = useSavedJobs();
  const savedCount = savedJobs?.length ?? 0;

  const sections: NavSection[] = [
    {
      label: "Overview",
      items: [
        { name: "Dashboard", href: "/candidate", icon: LayoutDashboard },
        { name: "Browse Jobs", href: "/jobs", icon: Search },
      ],
    },
    {
      label: "Career",
      items: [
        { name: "My Profile", href: "/candidate/profile", icon: User },
        {
          name: "My Applications",
          href: "/candidate/applications",
          icon: FileText,
        },
        {
          name: "Saved Jobs",
          href: "/candidate/saved",
          icon: Bookmark,
          badge: savedCount > 0 ? savedCount : undefined,
        },
      ],
    },
    {
      label: "Communication",
      items: [
        {
          name: "Messages",
          href: "/candidate/messages",
          icon: MessageSquare,
          badge: unreadCount > 0 ? unreadCount : undefined,
        },
        {
          name: "Interviews",
          href: "/candidate/interviews",
          icon: Calendar,
          badge: upcomingInterviews > 0 ? upcomingInterviews : undefined,
        },
      ],
    },
    {
      label: "Account",
      items: [
        { name: "Settings", href: "/candidate/settings", icon: Settings },
      ],
    },
  ];

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
                  item.href === "/candidate"
                    ? pathname === "/candidate"
                    : pathname === item.href ||
                      pathname?.startsWith(item.href + "/");
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
                    <span className="flex-1">{item.name}</span>
                    {item.badge !== undefined && (
                      <Badge
                        className={cn(
                          "h-5 min-w-[20px] rounded-full px-1.5 text-[10px] font-semibold",
                          item.name === "Messages"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted-foreground/20 text-muted-foreground"
                        )}
                      >
                        {item.badge > 99 ? "99+" : item.badge}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
        <p className="text-xs text-muted-foreground">Talent OS v0.2.0</p>
      </div>
    </aside>
  );
}
