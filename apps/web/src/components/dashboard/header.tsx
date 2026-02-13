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
  { keywords: ["hiring", "jobs", "pipeline", "positions"], href: "/hiring" },
  { keywords: ["evaluate", "score", "scorecard", "review", "assessment"], href: "/hiring/evaluate" },
  { keywords: ["talent", "candidate", "search", "discover"], href: "/talent" },
  { keywords: ["offer", "offers", "compensation", "package"], href: "/hiring/offers" },
  { keywords: ["conversation", "conversations", "chat", "messaging"], href: "/conversations" },
  { keywords: ["schedule", "scheduling", "interview", "meeting"], href: "/scheduling" },
  { keywords: ["conference", "video", "call"], href: "/conference" },
  { keywords: ["notification", "notifications", "alerts"], href: "/notifications" },
  { keywords: ["document", "documents", "file", "upload"], href: "/documents" },
  { keywords: ["workflow", "workflows", "automation"], href: "/workflows" },
  { keywords: ["task", "tasks", "kanban", "todo"], href: "/tasks" },
  { keywords: ["calendar", "deadline", "compliance"], href: "/calendar" },
  { keywords: ["analytics", "metrics", "chart", "funnel"], href: "/analytics" },
  { keywords: ["report", "reports", "data"], href: "/reports" },
  { keywords: ["billing", "subscription", "plan", "payment"], href: "/billing" },
  { keywords: ["settings", "profile", "team", "security"], href: "/settings" },
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
    <header
      className="flex h-16 items-center justify-between border-b bg-card/80 backdrop-blur-sm px-6"
      role="banner"
      aria-label="Dashboard header"
    >
      {/* Mobile menu */}
      <MobileSidebar />

      {/* Search */}
      <div className="hidden flex-1 max-w-md lg:block" role="search" aria-label="Page navigation search">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            ref={searchRef}
            placeholder="Search pages... (⌘K)"
            className="pl-9 bg-muted/50 border-0 focus-visible:ring-2 focus-visible:ring-primary/20 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            onBlur={() => setTimeout(() => setSearchQuery(""), 200)}
            aria-label="Search pages. Press Command K to focus."
          />
          {searchQuery.trim().length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 rounded-md border bg-popover shadow-lg z-50 overflow-hidden">
              {SEARCH_PAGES.filter((p) =>
                p.keywords.some(
                  (k) =>
                    k.includes(searchQuery.toLowerCase().trim()) ||
                    searchQuery.toLowerCase().trim().includes(k)
                )
              ).length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">No results found</div>
              ) : (
                SEARCH_PAGES.filter((p) =>
                  p.keywords.some(
                    (k) =>
                      k.includes(searchQuery.toLowerCase().trim()) ||
                      searchQuery.toLowerCase().trim().includes(k)
                  )
                ).map((p) => (
                  <button
                    key={p.href}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2 transition-colors"
                    onMouseDown={() => {
                      router.push(p.href);
                      setSearchQuery("");
                    }}
                  >
                    <Search className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="capitalize">{p.href.replace("/", "")}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {p.keywords.slice(0, 3).join(", ")}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2" role="toolbar" aria-label="Header actions">
        {/* Notifications */}
        <NotificationBell />

        {/* Dark mode toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" aria-hidden="true" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" aria-hidden="true" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="gap-2 px-2"
              aria-label={`User menu for ${user?.first_name || ""} ${user?.last_name || ""}`.trim() || "User menu"}
              aria-haspopup="menu"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium md:inline-block">
                {user?.first_name} {user?.last_name}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56" aria-label="User menu options">
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
              <User className="mr-2 h-4 w-4" aria-hidden="true" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
