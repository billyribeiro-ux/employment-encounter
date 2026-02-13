"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Users,
  FileText,
  Receipt,
  CheckSquare,
  BarChart3,
  Clock,
  MessageSquare,
  Settings,
  Calendar,
  Workflow,
  LayoutDashboard,
  ArrowRight,
  Command,
  DollarSign,
  X,
  CornerDownLeft,
  FolderOpen,
  PieChart,
  Wallet,
} from "lucide-react";
import { useGlobalSearch, type SearchResult } from "@/lib/hooks/use-search";
import { cn } from "@/lib/utils";

// ── Static page navigation entries ───────────────────────────────────

const PAGES = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, keywords: ["home", "overview"] },
  { name: "Clients", href: "/clients", icon: Users, keywords: ["customer", "contact"] },
  { name: "Invoices", href: "/invoices", icon: Receipt, keywords: ["billing", "payment"] },
  { name: "Documents", href: "/documents", icon: FileText, keywords: ["file", "upload"] },
  { name: "Tasks", href: "/tasks", icon: CheckSquare, keywords: ["todo", "kanban"] },
  { name: "Workflows", href: "/workflows", icon: FolderOpen, keywords: ["pipeline", "process"] },
  { name: "Time Tracking", href: "/time", icon: Clock, keywords: ["timer", "hours"] },
  { name: "Expenses", href: "/expenses", icon: Wallet, keywords: ["cost", "receipt"] },
  { name: "Analytics", href: "/analytics", icon: BarChart3, keywords: ["metrics", "chart"] },
  { name: "Reports", href: "/reports", icon: PieChart, keywords: ["profit", "loss"] },
  { name: "Messages", href: "/messages", icon: MessageSquare, keywords: ["chat", "communication"] },
  { name: "Calendar", href: "/calendar", icon: Calendar, keywords: ["deadline", "compliance"] },
  { name: "Settings", href: "/settings", icon: Settings, keywords: ["profile", "firm"] },
];

const RESULT_ICONS: Record<string, React.ElementType> = {
  client: Users,
  document: FileText,
  invoice: Receipt,
  task: CheckSquare,
  workflow: Workflow,
};

const CATEGORY_LABELS: Record<string, string> = {
  client: "Clients",
  document: "Documents",
  invoice: "Invoices",
  task: "Tasks",
  workflow: "Workflows",
};

// ── Recent searches persistence ──────────────────────────────────────

const RECENT_SEARCHES_KEY = "cpa-command-palette-recent";
const MAX_RECENT = 5;

function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(term: string) {
  try {
    const existing = getRecentSearches();
    const updated = [term, ...existing.filter((s) => s !== term)].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [term];
  }
}

// ── Animation variants ───────────────────────────────────────────────

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};

const panelVariants = {
  hidden: { opacity: 0, scale: 0.96, y: -24, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] as const },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: -12,
    filter: "blur(2px)",
    transition: { duration: 0.15, ease: [0.4, 0, 1, 1] as const },
  },
};

const resultItemVariants = {
  hidden: { opacity: 0, x: -6 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.2,
      delay: Math.min(i * 0.025, 0.2),
      ease: [0.16, 1, 0.3, 1] as const,
    },
  }),
};

// ── Component ────────────────────────────────────────────────────────

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { data: searchResults, isLoading } = useGlobalSearch(query);

  // Filter pages by query
  const filteredPages = query.length > 0
    ? PAGES.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.keywords.some((k) => k.includes(query.toLowerCase()))
      )
    : PAGES;

  const apiResults = searchResults?.results || [];

  // Group API results by type
  const apiResultsByType: Record<string, SearchResult[]> = {};
  for (const r of apiResults) {
    if (!apiResultsByType[r.type]) apiResultsByType[r.type] = [];
    apiResultsByType[r.type].push(r);
  }

  const allResults = [
    ...filteredPages.map((p) => ({ source: "page" as const, ...p })),
    ...apiResults.map((r) => ({ source: "api" as const, ...r })),
  ];

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input and load recent searches when opening
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setSelectedIndex(0);
      setRecentSearches(getRecentSearches());
    }
  }, [open]);

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(
      `[data-index="${selectedIndex}"]`
    ) as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const handleSelect = useCallback(
    (index: number) => {
      const item = allResults[index];
      if (!item) return;
      // Save the search term
      if (query.trim().length >= 2) {
        setRecentSearches(saveRecentSearch(query.trim()));
      }
      if (item.source === "page") {
        router.push(item.href);
      } else {
        router.push(item.url);
      }
      onOpenChange(false);
    },
    [allResults, router, onOpenChange, query]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((i) => (i < allResults.length - 1 ? i + 1 : 0));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((i) => (i > 0 ? i - 1 : allResults.length - 1));
          break;
        case "Enter":
          e.preventDefault();
          handleSelect(selectedIndex);
          break;
        case "Escape":
          e.preventDefault();
          onOpenChange(false);
          break;
      }
    },
    [allResults.length, selectedIndex, handleSelect, onOpenChange]
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
            aria-hidden="true"
          />

          {/* Palette panel */}
          <motion.div
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed left-1/2 top-[15vh] z-50 w-full max-w-lg -translate-x-1/2"
            role="dialog"
            aria-label="Command palette"
            aria-modal="true"
          >
            <div className="overflow-hidden rounded-xl border bg-card shadow-2xl">
              {/* Search Input */}
              <div className="flex items-center gap-3 border-b px-4 py-3">
                <Search className="h-5 w-5 text-muted-foreground shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search pages, clients, invoices, tasks..."
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  aria-label="Search command palette"
                  aria-autocomplete="list"
                  aria-controls="command-palette-results"
                  aria-activedescendant={
                    allResults[selectedIndex]
                      ? `cmd-result-${selectedIndex}`
                      : undefined
                  }
                  role="combobox"
                  aria-expanded={true}
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  ESC
                </kbd>
              </div>

              {/* Results list */}
              <div
                ref={listRef}
                id="command-palette-results"
                role="listbox"
                className="max-h-80 overflow-y-auto py-2"
              >
                {/* Recent searches (shown when no query) */}
                {!query && recentSearches.length > 0 && (
                  <div className="mb-1">
                    <div className="px-4 py-1.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Recent Searches
                      </span>
                    </div>
                    {recentSearches.map((term) => (
                      <button
                        key={term}
                        className="flex w-full items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors rounded-lg mx-1"
                        onClick={() => setQuery(term)}
                      >
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{term}</span>
                      </button>
                    ))}
                    <div className="my-1 mx-4 border-b" />
                  </div>
                )}

                {/* No results message */}
                {allResults.length === 0 && query.length > 0 && !isLoading && (
                  <div className="px-4 py-8 text-center">
                    <Search className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No results for &ldquo;{query}&rdquo;
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      Try a different search term
                    </p>
                  </div>
                )}

                {/* Pages section */}
                {filteredPages.length > 0 && (
                  <div className="mb-1">
                    <div className="px-4 py-1.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {query ? "Pages" : "Navigate to"}
                      </span>
                    </div>
                    {filteredPages.map((page, i) => {
                      const Icon = page.icon;
                      const isSelected = selectedIndex === i;
                      return (
                        <motion.button
                          key={page.href}
                          id={`cmd-result-${i}`}
                          data-index={i}
                          role="option"
                          aria-selected={isSelected}
                          custom={i}
                          variants={resultItemVariants}
                          initial="hidden"
                          animate="visible"
                          onClick={() => handleSelect(i)}
                          onMouseEnter={() => setSelectedIndex(i)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors mx-1",
                            isSelected
                              ? "bg-primary/10 text-primary"
                              : "text-foreground hover:bg-muted"
                          )}
                        >
                          <div
                            className={cn(
                              "flex h-8 w-8 items-center justify-center rounded-lg shrink-0 transition-colors",
                              isSelected
                                ? "bg-primary/15 text-primary"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className="flex-1 text-left font-medium">{page.name}</span>
                          {isSelected && (
                            <motion.div
                              initial={{ opacity: 0, x: -4 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.15 }}
                            >
                              <ArrowRight className="h-3.5 w-3.5 text-primary" />
                            </motion.div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                )}

                {/* API search results grouped by type */}
                {Object.entries(apiResultsByType).map(([type, results]) => (
                  <div key={type} className="mt-1 border-t pt-1">
                    <div className="px-4 py-1.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {CATEGORY_LABELS[type] || type}
                      </span>
                    </div>
                    {results.map((result) => {
                      const apiIdx = apiResults.indexOf(result);
                      const globalIndex = filteredPages.length + apiIdx;
                      const isSelected = selectedIndex === globalIndex;
                      const Icon = RESULT_ICONS[result.type] || FileText;
                      return (
                        <motion.button
                          key={`${result.type}-${result.id}`}
                          id={`cmd-result-${globalIndex}`}
                          data-index={globalIndex}
                          role="option"
                          aria-selected={isSelected}
                          custom={globalIndex}
                          variants={resultItemVariants}
                          initial="hidden"
                          animate="visible"
                          onClick={() => handleSelect(globalIndex)}
                          onMouseEnter={() => setSelectedIndex(globalIndex)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors mx-1",
                            isSelected
                              ? "bg-primary/10 text-primary"
                              : "text-foreground hover:bg-muted"
                          )}
                        >
                          <div
                            className={cn(
                              "flex h-8 w-8 items-center justify-center rounded-lg shrink-0 transition-colors",
                              isSelected
                                ? "bg-primary/15 text-primary"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <p className="font-medium truncate">{result.title}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {result.subtitle}
                            </p>
                          </div>
                          {isSelected && (
                            <motion.div
                              initial={{ opacity: 0, x: -4 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.15 }}
                            >
                              <ArrowRight className="h-3.5 w-3.5 text-primary" />
                            </motion.div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                ))}

                {/* Loading indicator */}
                {isLoading && query.length >= 2 && (
                  <div className="flex items-center justify-center py-4 gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <span className="text-xs text-muted-foreground">Searching...</span>
                  </div>
                )}
              </div>

              {/* Footer with keyboard hints */}
              <div className="flex items-center justify-between border-t px-4 py-2 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <kbd className="inline-flex h-4 items-center rounded border bg-muted px-1 font-mono text-[10px]">
                      <ArrowRight className="h-2.5 w-2.5 -rotate-90" />
                    </kbd>
                    <kbd className="inline-flex h-4 items-center rounded border bg-muted px-1 font-mono text-[10px]">
                      <ArrowRight className="h-2.5 w-2.5 rotate-90" />
                    </kbd>
                    <span>navigate</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="inline-flex h-4 items-center rounded border bg-muted px-1 font-mono text-[10px]">
                      <CornerDownLeft className="h-2.5 w-2.5" />
                    </kbd>
                    <span>open</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="inline-flex h-4 items-center rounded border bg-muted px-1 font-mono text-[10px]">
                      esc
                    </kbd>
                    <span>close</span>
                  </span>
                </div>
                <span className="flex items-center gap-1">
                  <Command className="h-3 w-3" />K to open
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
