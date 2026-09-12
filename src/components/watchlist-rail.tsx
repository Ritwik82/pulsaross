"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import type { Project } from "@/lib/data";
import {
  useLocalWatchlist,
  mergeWatchlist,
  toggleLocalWatchlist,
} from "@/lib/local-watchlist";
import { getSuccessor } from "@/lib/successors";

export function WatchlistRail({ projects = [] }: { projects: Project[] }) {
  const [open, setOpen] = useState(false);
  const local = useLocalWatchlist();
  const railRef = useRef<HTMLDivElement | null>(null);

  const allApps = useMemo(
    () => mergeWatchlist([], local, projects),
    [local, projects]
  );

  const attention = useMemo(
    () =>
      allApps.filter(
        (a) =>
          a.staleness === "stale" ||
          a.staleness === "abandoned" ||
          a.staleness === "warning" ||
          getSuccessor(a.repo ?? a.id) != null
      ),
    [allApps]
  );

  const healthy = useMemo(
    () => allApps.filter((a) => !attention.includes(a)),
    [allApps, attention]
  );

  // Global listeners for Cmd+B and custom event
  useEffect(() => {
    const onToggle = () => setOpen((prev) => !prev);
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "b" || e.key === "B")) {
        e.preventDefault();
        setOpen((prev) => !prev);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };

    window.addEventListener("pulsaross-toggle-rail", onToggle);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pulsaross-toggle-rail", onToggle);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Persistent Watchlist Rail"
      className="fixed inset-0 z-[80] flex justify-end"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Rail Panel */}
      <aside
        ref={railRef}
        className="relative w-full max-w-sm h-full bg-[var(--color-surface)] border-l border-[var(--color-border)] shadow-2xl flex flex-col z-10 overflow-hidden"
        style={{
          boxShadow: "-10px 0 30px rgba(0, 0, 0, 0.5)",
        }}
      >
        {/* Header */}
        <div className="p-4 border-b border-[var(--color-border)] bg-[var(--color-bg)]/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-[var(--color-accent)] font-bold">⚡</span>
            <div>
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-text)]">
                Watchlist Rail
              </h2>
              <span className="font-mono text-[10px] text-[var(--color-text-dim)]">
                {allApps.length} Tracked Specimen{allApps.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/watchlist"
              onClick={() => setOpen(false)}
              className="font-mono text-[10px] uppercase font-semibold text-[var(--color-accent)] hover:underline"
            >
              Full View →
            </Link>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close watchlist rail"
              className="p-1 rounded text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {allApps.length === 0 ? (
            <div className="py-16 text-center">
              <span className="text-2xl block mb-2">🔭</span>
              <p className="font-mono text-xs text-[var(--color-text-dim)] uppercase tracking-wider mb-2">
                No apps tracked yet
              </p>
              <p className="text-xs text-[var(--color-text-muted)] max-w-[24ch] mx-auto mb-4">
                Click TRACK on any app in the catalog to monitor its health here.
              </p>
              <Link
                href="/catalog"
                onClick={() => setOpen(false)}
                className="inline-block font-mono text-xs px-3 py-1.5 rounded bg-[var(--color-accent)] text-[var(--color-bg)] font-semibold uppercase tracking-wider"
              >
                Explore Catalog
              </Link>
            </div>
          ) : (
            <>
              {/* Needs Attention Group */}
              {attention.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-signal-amber)]" />
                    <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-[var(--color-signal-amber)]">
                      Needs Attention ({attention.length})
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {attention.map((app) => {
                      const successor = getSuccessor(app.repo ?? app.id);
                      return (
                        <div
                          key={app.id}
                          className="p-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]/60 hover:border-[var(--color-accent-border)] transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <Link
                              href={`/project/${app.repo ?? app.id}`}
                              onClick={() => setOpen(false)}
                              className="font-semibold text-xs text-[var(--color-text)] hover:text-[var(--color-accent)] truncate"
                            >
                              {app.name}
                            </Link>
                            <button
                              onClick={() =>
                                toggleLocalWatchlist({
                                  id: app.id,
                                  name: app.name,
                                  repo: app.repo,
                                  genre: app.genre,
                                  source: "local",
                                })
                              }
                              aria-label={`Untrack ${app.name}`}
                              className="font-mono text-[9px] text-[var(--color-text-dim)] hover:text-[var(--color-signal-red)]"
                            >
                              ✕
                            </button>
                          </div>

                          <p className="font-mono text-[10px] text-[var(--color-text-dim)] truncate mt-0.5">
                            {app.repo ?? app.id}
                          </p>

                          {successor && (
                            <div className="mt-2 p-1.5 rounded bg-emerald-950/40 border border-emerald-800/40 text-[10px] font-mono text-emerald-300 flex items-center justify-between">
                              <span className="truncate">🔄 Successor: {successor.successor_name}</span>
                              <Link
                                href={`/project/${successor.successor_repo}`}
                                onClick={() => setOpen(false)}
                                className="underline text-emerald-200 shrink-0 ml-1"
                              >
                                View
                              </Link>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Healthy Group */}
              {healthy.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-signal-green)]" />
                    <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-[var(--color-signal-green)]">
                      Active &amp; Maintained ({healthy.length})
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {healthy.map((app) => (
                      <div
                        key={app.id}
                        className="p-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]/60 hover:border-[var(--color-accent-border)] transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/project/${app.repo ?? app.id}`}
                            onClick={() => setOpen(false)}
                            className="font-semibold text-xs text-[var(--color-text)] hover:text-[var(--color-accent)] truncate"
                          >
                            {app.name}
                          </Link>
                          <button
                            onClick={() =>
                              toggleLocalWatchlist({
                                id: app.id,
                                name: app.name,
                                repo: app.repo,
                                genre: app.genre,
                                source: "local",
                              })
                            }
                            aria-label={`Untrack ${app.name}`}
                            className="font-mono text-[9px] text-[var(--color-text-dim)] hover:text-[var(--color-signal-red)]"
                          >
                            ✕
                          </button>
                        </div>
                        <p className="font-mono text-[10px] text-[var(--color-text-dim)] truncate mt-0.5">
                          {app.repo ?? app.id}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-3 border-t border-[var(--color-border)] bg-[var(--color-bg)]/80 flex items-center justify-between gap-2 text-[10px] font-mono">
          <Link
            href="/watchlist"
            onClick={() => setOpen(false)}
            className="px-3 py-1.5 rounded border border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-accent-border)] transition-colors"
          >
            Manage All
          </Link>
          <span className="text-[var(--color-text-dim)]">Cmd+B to toggle</span>
        </div>
      </aside>
    </div>
  );
}
