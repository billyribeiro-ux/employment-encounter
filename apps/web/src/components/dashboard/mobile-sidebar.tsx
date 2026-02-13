"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Settings,
  FolderOpen,
  CheckSquare,
  Menu,
  MessageSquare,
  BarChart3,
  PieChart,
  Calendar,
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
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Jobs & Pipeline", href: "/hiring", icon: Briefcase },
  { name: "Evaluation Center", href: "/hiring/evaluate", icon: ClipboardCheck },
  { name: "Talent Discovery", href: "/talent", icon: Search },
  { name: "Offers", href: "/hiring/offers", icon: FileSignature },
  { name: "Conversations", href: "/conversations", icon: MessageSquare },
  { name: "Scheduling", href: "/scheduling", icon: CalendarClock },
  { name: "Conference", href: "/conference", icon: Video },
  { name: "Notifications", href: "/notifications", icon: Bell },
  { name: "Documents", href: "/documents", icon: FileText },
  { name: "Workflows", href: "/workflows", icon: FolderOpen },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Reports", href: "/reports", icon: PieChart },
  { name: "Billing", href: "/billing", icon: CreditCard },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function MobileSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <UserCheck className="h-4 w-4" />
          </div>
          <span className="text-lg font-semibold">Talent OS</span>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href || pathname?.startsWith(item.href + "/");
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
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-4">
          <p className="text-xs text-muted-foreground">Talent OS v1.0.0</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
