"use client";

import { useState, useEffect, useRef, useMemo, useDeferredValue } from "react";
import { useRouter } from "next/navigation";
import type { Project } from "@/lib/data";
import { scoreColor } from "@/lib/utils";
import { useLocalWatchlist, mergeWatchlist } from "@/lib/local-watchlist";
import { getSuccessor } from "@/lib/successors";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: Project[];
}

interface PaletteItem {
  id: string;
  category: "routes" | "projects" | "actions";
  title: string;
  subtitle?: string;
  badge?: string;
  score?: number;
  onSelect: () => void;
}

function CommandPaletteDialog({
  onClose,
  projects,
}: {
  onClose: () => void;
  projects: Project[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const local = useLocalWatchlist();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const items = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();

    // Routes
    const navItems: PaletteItem[] = [
      {
        id: "nav-home",
        category: "routes",
        title: "Overview Dashboard",
        subtitle: "Macro telemetry & health distributions (/)",
        onSelect: () => {
          onClose();
          router.push("/");
        },
      },
      {
        id: "nav-catalog",
        category: "routes",
        title: "Catalog Workbench",
        subtitle: "Full archive with facet filters & search (/catalog)",
        onSelect: () => {
          onClose();
          router.push("/catalog");
        },
      },
      {
        id: "nav-watchlist",
        category: "routes",
        title: "Watchlist Management",
        subtitle: "Track personal Android stack & Obtainium sync (/watchlist)",
        onSelect: () => {
          onClose();
          router.push("/watchlist");
        },
      },
      {
        id: "nav-methodology",
        category: "routes",
        title: "Scoring Methodology & API",
        subtitle: "Six health signals, math reference, and OpenAPI spec (/methodology)",
        onSelect: () => {
          onClose();
          router.push("/methodology");
        },
      },
    ];

    // Actions
    const actionItems: PaletteItem[] = [
      {
        id: "act-toggle-rail",
        category: "actions",
        title: "Toggle Watchlist Rail",
        subtitle: "Open persistent sidebar drawer (Cmd+B)",
        badge: "Cmd+B",
        onSelect: () => {
          onClose();
          window.dispatchEvent(new CustomEvent("pulsaross-toggle-rail"));
        },
      },
      {
        id: "act-export-obtainium",
        category: "actions",
        title: "Export Cleaned for Obtainium",
        subtitle: "Download Obtainium-compatible JSON with successor upgrades",
        badge: "JSON",
        onSelect: () => {
          onClose();
          const all = mergeWatchlist([], local, projects);
          const exportApps = all
            .map((a) => {
              const successor = getSuccessor(a.repo ?? a.id);
              const targetRepo = successor ? successor.successor_repo : a.repo;
              if (!targetRepo) return null;
              return {
                id: a.id,
                name: successor ? successor.successor_name : a.name,
                url: `https://github.com/${targetRepo}`,
                author: targetRepo.split("/")[0],
                originalApp: successor ? a.name : undefined,
                superseded: Boolean(successor),
              };
            })
            .filter(Boolean);
          const blob = new Blob([JSON.stringify({ apps: exportApps }, null, 2)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `obtainium-cleaned-${new Date().toISOString().slice(0, 10)}.json`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
        },
      },
      {
        id: "act-view-openapi",
        category: "actions",
        title: "Open OpenAPI Specification",
        subtitle: "View raw OpenAPI 3.1 JSON route (/api/openapi)",
        badge: "REST",
        onSelect: () => {
          onClose();
          window.open("/api/openapi", "_blank");
        },
      },
      {
        id: "act-rss",
        category: "actions",
        title: "RSS 2.0 Feed",
        subtitle: "Subscribe to health updates feed (/api/feed)",
        badge: "XML",
        onSelect: () => {
          onClose();
          window.open("/api/feed", "_blank");
        },
      },
    ];

    if (!q) {
      return [...navItems, ...actionItems];
    }

    // Filtered navigation
    const matchingNav = navItems.filter(
      (n) => n.title.toLowerCase().includes(q) || (n.subtitle && n.subtitle.toLowerCase().includes(q))
    );

    // Matching projects
    const matchingProjects: PaletteItem[] = projects
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.owner.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.genre_label.toLowerCase().includes(q)
      )
      .slice(0, 10)
      .map((p) => ({
        id: `proj-${p.id}`,
        category: "projects",
        title: p.name,
        subtitle: `${p.owner} · ${p.genre_label} · SDK ${p.target_sdk ?? "?"}`,
        score: p.score,
        onSelect: () => {
          onClose();
          router.push(`/project/${p.id}`);
        },
      }));

    // Filtered actions
    const matchingActions = actionItems.filter(
      (a) => a.title.toLowerCase().includes(q) || (a.subtitle && a.subtitle.toLowerCase().includes(q))
    );

    return [...matchingNav, ...matchingProjects, ...matchingActions];
  }, [deferredQuery, projects, local, router, onClose]);

  // Safe clamp activeIndex
  const clampedActiveIndex = Math.min(activeIndex, Math.max(0, items.length - 1));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
      className="fixed inset-0 z-[100] flex items-start justify-center pt-16 sm:pt-24 px-4"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div
        className="relative w-full max-w-2xl rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl overflow-hidden z-10 flex flex-col max-h-[80vh]"
        style={{
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6), 0 0 0 1px var(--color-border)",
        }}
      >
        {/* Search header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg)]/60">
          <svg
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: "var(--color-accent)" }}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls="command-palette-results"
            aria-activedescendant={items[clampedActiveIndex] ? `palette-item-${items[clampedActiveIndex].id}` : undefined}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                if (items.length > 0) setActiveIndex((i) => (i + 1) % items.length);
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                if (items.length > 0) setActiveIndex((i) => (i <= 0 ? items.length - 1 : i - 1));
              } else if (e.key === "Enter" && items[clampedActiveIndex]) {
                e.preventDefault();
                items[clampedActiveIndex].onSelect();
              }
            }}
            placeholder="Type a command or search 500+ Android specimens..."
            className="flex-1 bg-transparent font-mono text-xs text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] outline-none"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="hidden sm:inline-block font-mono text-[10px] px-1.5 py-0.5 rounded border border-[var(--color-border)] text-[var(--color-text-dim)] bg-[var(--color-surface)]">
            ESC
          </kbd>
        </div>

        {/* Results list */}
        <div
          id="command-palette-results"
          ref={listRef}
          role="listbox"
          aria-label="Command palette suggestions"
          className="overflow-y-auto p-2 divide-y divide-[var(--color-border)]/40 flex-1 max-h-[60vh]"
        >
          {items.length === 0 ? (
            <div className="py-12 text-center">
              <p className="font-mono text-xs text-[var(--color-text-dim)]">
                No matching commands or specimens for &ldquo;{query}&rdquo;
              </p>
            </div>
          ) : (
            items.map((item, idx) => {
              const isSelected = idx === clampedActiveIndex;
              return (
                <div
                  key={item.id}
                  id={`palette-item-${item.id}`}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => item.onSelect()}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-[var(--color-accent-dim)] border border-[var(--color-accent-border)]"
                      : "hover:bg-[var(--color-surface-hover)] border border-transparent"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-semibold tracking-tight truncate ${
                          isSelected ? "text-[var(--color-accent)]" : "text-[var(--color-text)]"
                        }`}
                      >
                        {item.title}
                      </span>
                      {item.badge && (
                        <span className="font-mono text-[9px] uppercase px-1.5 py-0.2 rounded border border-[var(--color-border)] text-[var(--color-text-dim)]">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    {item.subtitle && (
                      <p className="font-mono text-[10px] text-[var(--color-text-dim)] truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    )}
                  </div>

                  {item.score != null && (
                    <span
                      className="font-mono text-xs font-bold shrink-0 px-1.5 py-0.5 rounded border"
                      style={{
                        color: scoreColor(item.score),
                        borderColor: "var(--color-border)",
                        backgroundColor: "var(--color-bg)",
                      }}
                    >
                      {(item.score * 10).toFixed(1)}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer info strip */}
        <div className="px-4 py-2 border-t border-[var(--color-border)] bg-[var(--color-bg)]/80 flex items-center justify-between text-[10px] font-mono text-[var(--color-text-dim)]">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span>PULSAROSS COMMAND</span>
        </div>
      </div>
    </div>
  );
}

export function CommandPalette({ open, onOpenChange, projects }: CommandPaletteProps) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        onOpenChange(!open);
      } else if (e.key === "Escape" && open) {
        e.preventDefault();
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <CommandPaletteDialog
      onClose={() => onOpenChange(false)}
      projects={projects}
    />
  );
}
