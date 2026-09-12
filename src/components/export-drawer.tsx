"use client";

import { useState } from "react";
import type { WatchlistApp, Project } from "@/lib/data";
import { useLocalWatchlist, mergeWatchlist } from "@/lib/local-watchlist";
import { getSuccessor } from "@/lib/successors";

function csvEscape(v: unknown): string {
  const s = v == null ? "" : String(v);
  if (/^[=+\-@]/.test(s)) return `"'${s}"`;
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function watchlistCsv(apps: WatchlistApp[]): string {
  const header = [
    "name",
    "id",
    "genre",
    "source",
    "repo",
    "installedVersion",
    "latestVersion",
    "installed",
    "trackOnly",
    "fdroid",
    "staleness",
    "daysSincePush",
    "updateAvailable",
  ];
  const rows = apps.map((a) =>
    [
      a.name,
      a.id,
      a.genre,
      a.source,
      a.repo,
      a.installedVersion,
      a.latestVersion,
      a.installed,
      a.trackOnly,
      a.fdroid,
      a.staleness ?? "",
      a.days_since_push ?? "",
      a.update_available ?? "",
    ]
      .map(csvEscape)
      .join(",")
  );
  return [header.join(","), ...rows].join("\n");
}

function obtainiumJson(apps: WatchlistApp[]): string {
  const exportApps = apps
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

  return JSON.stringify({ apps: exportApps }, null, 2);
}

function stamp() {
  return new Date().toISOString().slice(0, 10);
}

export function ExportDrawer({
  projects,
  watchlist = [],
}: {
  projects: Project[];
  watchlist?: WatchlistApp[];
}) {
  const [open, setOpen] = useState(false);
  const local = useLocalWatchlist();
  const allWatchlist = mergeWatchlist(watchlist, local, projects);

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Export catalog and watchlist data"
        className="font-mono text-[10px] tracking-wider font-semibold uppercase px-3 py-1.5 rounded border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:border-[var(--color-accent-border)] hover:text-[var(--color-accent)] transition-all flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
      >
        <span>EXPORT</span>
        <span className="text-[9px]">▾</span>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            className="absolute right-0 mt-1 w-64 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl z-50 p-2 space-y-1 font-mono text-xs"
            style={{ boxShadow: "var(--card-shadow)" }}
          >
            <div className="px-2 py-1 text-[10px] text-[var(--color-text-dim)] uppercase tracking-wider border-b border-[var(--color-border)] mb-1">
              Export Utilities
            </div>
            <button
              onClick={() => {
                setOpen(false);
                download(
                  `obtainium-cleaned-${stamp()}.json`,
                  obtainiumJson(allWatchlist),
                  "application/json"
                );
              }}
              className="w-full text-left px-2.5 py-1.5 rounded hover:bg-[var(--color-surface-hover)] text-[var(--color-signal-green)] flex items-center justify-between transition-colors"
            >
              <span>Cleaned for Obtainium</span>
              <span className="text-[10px] text-[var(--color-text-dim)]">JSON</span>
            </button>
            <button
              onClick={() => {
                setOpen(false);
                download(
                  `watchlist-${stamp()}.json`,
                  JSON.stringify(allWatchlist, null, 2),
                  "application/json"
                );
              }}
              className="w-full text-left px-2.5 py-1.5 rounded hover:bg-[var(--color-surface-hover)] text-[var(--color-text)] flex items-center justify-between transition-colors"
            >
              <span>Watchlist</span>
              <span className="text-[10px] text-[var(--color-text-dim)]">JSON</span>
            </button>
            <button
              onClick={() => {
                setOpen(false);
                download(
                  `watchlist-${stamp()}.csv`,
                  watchlistCsv(allWatchlist),
                  "text/csv"
                );
              }}
              className="w-full text-left px-2.5 py-1.5 rounded hover:bg-[var(--color-surface-hover)] text-[var(--color-text)] flex items-center justify-between transition-colors"
            >
              <span>Watchlist</span>
              <span className="text-[10px] text-[var(--color-text-dim)]">CSV</span>
            </button>
            <button
              onClick={() => {
                setOpen(false);
                download(
                  `projects-${stamp()}.json`,
                  JSON.stringify(projects, null, 2),
                  "application/json"
                );
              }}
              className="w-full text-left px-2.5 py-1.5 rounded hover:bg-[var(--color-surface-hover)] text-[var(--color-text)] flex items-center justify-between transition-colors"
            >
              <span>Full Catalog ({projects.length})</span>
              <span className="text-[10px] text-[var(--color-text-dim)]">JSON</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
