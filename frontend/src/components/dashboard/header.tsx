"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LogOut,
  User,
  Settings,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuthStore } from "@/stores/auth-store";
import { MobileSidebar } from "@/components/dashboard/mobile-sidebar";
import { NotificationBell } from "@/components/notification-bell";
import { useWebSocket } from "@/lib/hooks/use-websocket";

const SEARCH_PAGES = [
  { keywords: ["dashboard", "home", "overview"], href: "/dashboard" },
  { keywords: ["client", "clients", "customer"], href: "/clients" },
  { keywords: ["document", "documents", "file", "upload"], href: "/documents" },
  { keywords: ["workflow", "workflows", "pipeline"], href: "/workflows" },
  { keywords: ["task", "tasks", "kanban", "todo"], href: "/tasks" },
  { keywords: ["time", "timer", "hours", "tracking"], href: "/time" },
  { keywords: ["invoice", "invoices", "billing", "payment"], href: "/invoices" },
  { keywords: ["expense", "expenses", "cost"], href: "/expenses" },
  { keywords: ["analytics", "metrics", "chart"], href: "/analytics" },
  { keywords: ["report", "reports", "profit", "loss", "cashflow", "utilization"], href: "/reports" },
  { keywords: ["message", "messages", "chat", "messaging"], href: "/messages" },
  { keywords: ["calendar", "deadline", "compliance", "filing"], href: "/calendar" },
  { keywords: ["settings", "profile", "firm", "team", "security"], href: "/settings" },
];

export function Header() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const { theme, setTheme } = useTheme();
  const searchRef = useRef<HTMLInputElement>(null);

  // Connect WebSocket for real-time events
  useWebSocket();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const initials = user
    ? `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase() || "U"
    : "U";

  function handleLogout() {
    logout();
    router.push("/login");
  }

  const handleSearch = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match = SEARCH_PAGES.find((p) =>
          p.keywords.some((k) => k.includes(q) || q.includes(k))
        );
        if (match) {
          router.push(match.href);
          setSearchQuery("");
        }
      }
    },
    [searchQuery, router]
  );

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      {/* Mobile menu */}
      <MobileSidebar />

      {/* Search */}
      <div className="hidden flex-1 max-w-md lg:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchRef}
            placeholder="Search pages... (⌘K)"
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <NotificationBell />

        {/* Dark mode toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium md:inline-block">
                {user?.first_name} {user?.last_name}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{user?.first_name} {user?.last_name}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {user?.email}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
