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

interface NavSection {
  label: string;
  items: { name: string; href: string; icon: React.ElementType }[];
}

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
      { name: "Saved Jobs", href: "/candidate/saved", icon: Bookmark },
    ],
  },
  {
    label: "Communication",
    items: [
      { name: "Messages", href: "/candidate/messages", icon: MessageSquare },
      { name: "Interviews", href: "/candidate/interviews", icon: Calendar },
    ],
  },
  {
    label: "Account",
    items: [
      { name: "Settings", href: "/candidate/settings", icon: Settings },
    ],
  },
];

export function CandidateSidebar() {
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
        <p className="text-xs text-muted-foreground">Talent OS v0.2.0</p>
      </div>
    </aside>
  );
}
