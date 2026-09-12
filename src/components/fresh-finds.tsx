"use client";

import { useEffect, useState, useCallback, useMemo, startTransition } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import type { Project, Genre, GenreId } from "@/lib/data";
import { useLocalWatchlist, toggleLocalWatchlist } from "@/lib/local-watchlist";
import { FilterChipGroup } from "./filter-chip";
import { daysSince, scoreColor, GitHubIcon } from "@/lib/utils";

export function FreshFinds({ projects, genres }: { projects: Project[]; genres: Genre[] }) {
  const genreMap = new Map<GenreId, string>(genres.map((g) => [g.id as GenreId, g.label]));
  const [page, setPage] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [sort, setSort] = useState<"score" | "newest" | "stars">("score");
  const PAGE_SIZE = 6;
  const totalPages = Math.max(1, Math.ceil(projects.length / PAGE_SIZE));
  const clampedPage = Math.min(page, totalPages - 1);

  const sorted = useMemo(() => {
    const list = [...projects];
    if (sort === "newest") {
      list.sort(
        (a, b) =>
          new Date(b.added_at ?? b.created_at).getTime() -
          new Date(a.added_at ?? a.created_at).getTime()
      );
    } else if (sort === "stars") {
      list.sort((a, b) => b.stars - a.stars);
    } else {
      list.sort((a, b) => b.score - a.score);
    }
    return list;
  }, [projects, sort]);

  const visible = sorted.slice(clampedPage * PAGE_SIZE, clampedPage * PAGE_SIZE + PAGE_SIZE);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const copyLink = useCallback(async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setToast("GitHub link copied.");
    } catch {
      setToast("Copy failed — grab the URL from the card.");
    }
  }, []);

  const local = useLocalWatchlist();
  const trackedIds = useMemo(() => new Set(local.map((l) => l.id)), [local]);
  const toggleTrack = useCallback((p: Project) => {
    const added = toggleLocalWatchlist({
      id: p.id,
      name: p.name,
      repo: p.id,
      genre: p.genre,
      source: "local",
    });
    setToast(added ? `Added ${p.name} to your watchlist.` : `Removed ${p.name} from your watchlist.`);
  }, []);

  return (
    <section id="fresh-finds" className="py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h2
            className="text-3xl md:text-4xl font-bold tracking-tight"
            style={{ color: "var(--color-text)" }}
          >
            New &amp; actively maintained
          </h2>
          <p
            className="text-sm max-w-lg mt-2 leading-relaxed"
            style={{ color: "var(--color-text-muted)" }}
          >
            Open-source apps launched in the last 9 months, scored on activity,
            contributors, and freshness. No abandoned projects.
          </p>
          <div className="mt-3">
            <FilterChipGroup
              label="sort"
              options={[
                { value: "score", label: "SCORE" },
                { value: "newest", label: "NEWEST" },
                { value: "stars", label: "STARS" },
              ]}
              value={sort}
              onChange={(v) => startTransition(() => setSort(v as "score" | "newest" | "stars"))}
              useStartTransition
            />
          </div>
        </div>

        {/* Grid */}
        {projects.length === 0 ? (
          <div className="glass p-12 text-center">
            <p className="font-mono text-[10px] tracking-widest uppercase mb-2" style={{ color: "var(--color-text-dim)" }}>
              No fresh finds yet
            </p>
            <p className="text-sm max-w-md mx-auto leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
              The catalog is updated periodically. Check back soon for new arrivals.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visible.map((p, idx) => (
                <FreshCard
                  key={p.id}
                  project={p}
                  genreLabel={genreMap.get(p.genre) ?? p.genre_label}
                  onCopy={copyLink}
                  tracked={trackedIds.has(p.id)}
                  onToggleTrack={() => toggleTrack(p)}
                  featured={idx === 0 && clampedPage === 0}
                />
              ))}
            </div>
            {totalPages > 1 && (
              <div
                className="glass flex items-center justify-between mt-8 p-4"
              >
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={clampedPage === 0}
                  aria-disabled={clampedPage === 0}
                  className="font-mono text-[10px] tracking-wider px-3 py-1.5 border disabled:opacity-40 transition-colors"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                >
                  ← Prev
                </button>
                <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "var(--color-text-dim)" }}>
                  {clampedPage + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={clampedPage >= totalPages - 1}
                  aria-disabled={clampedPage >= totalPages - 1}
                  className="font-mono text-[10px] tracking-wider px-3 py-1.5 border disabled:opacity-40 transition-colors"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] glass px-4 py-2 font-mono text-[11px] tracking-wider"
          style={{
            color: "var(--color-text)",
            borderColor: "var(--color-accent-border)",
            boxShadow: "var(--card-shadow)",
          }}
        >
          {toast}
        </div>
      )}
    </section>
  );
}

function FreshCard({
  project,
  genreLabel,
  onCopy,
  tracked,
  onToggleTrack,
  featured = false,
}: {
  project: Project;
  genreLabel: string;
  onCopy: (url: string) => void;
  tracked: boolean;
  onToggleTrack: () => void;
  featured?: boolean;
}) {
  const days = daysSince(project.last_release_at);
  const isFresh = days !== null && days < 14;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -1 }}
      className={`glass group relative p-5 flex flex-col justify-between transition-all hover:border-[var(--color-accent-border)] ${featured ? "lg:col-span-2 bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-surface-hover)]" : ""}`}
      style={{ boxShadow: "var(--card-shadow)" }}
    >
      {featured && (
        <div className="mb-3 inline-flex items-center gap-1.5 self-start px-2 py-0.5 rounded border border-[var(--color-signal-green)]/30 bg-[var(--color-signal-green)]/10 text-[var(--color-signal-green)] font-mono text-[10px] font-medium tracking-wider uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-signal-green)] animate-pulse" />
          Spotlight Fresh App
        </div>
      )}

      {/* Top row: genre + score */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <span
          className="font-mono text-[10px] tracking-widest uppercase px-1.5 py-0.5"
          style={{
            backgroundColor: "var(--color-accent-dim)",
            color: "var(--color-accent)",
          }}
        >
          {genreLabel}
        </span>
        <div className="flex items-center gap-2">
          {project.shizuku && (
            <span
              className="font-mono text-[10px] tracking-wider px-1.5 py-0.5"
              style={{
                backgroundColor: "var(--color-signal-purple)",
                color: "var(--color-bg)",
              }}
            >
              SHIZUKU
            </span>
          )}
          <span
            className="font-mono text-xs font-bold px-2 py-0.5 border"
            style={{
              color: "var(--color-accent)",
              borderColor: "var(--color-accent-border)",
              backgroundColor: "var(--color-accent-dim)",
            }}
          >
            {(project.score * 10).toFixed(1)}
          </span>
        </div>
      </div>

      {/* Score bar (10px track, decision #40) + number beside */}
      <div className="flex items-center gap-2 mb-4">
        <div
          className="h-[10px] flex-1 overflow-hidden rounded-sm"
          style={{ backgroundColor: "var(--color-ruled)" }}
        >
          <div
            className="h-full transition-[width] duration-500"
            style={{
              width: `${project.score * 100}%`,
              backgroundColor: scoreColor(project.score),
            }}
          />
        </div>
        <span className="font-mono text-[10px] font-bold" style={{ color: "var(--color-accent)" }}>
          {(project.score * 10).toFixed(1)}/10
        </span>
      </div>

      {/* Name + owner link */}
      <Link
        href={`/project/${project.id}`}
        className="block mb-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
        aria-label={`Open ${project.name} on PulsarOss`}
      >
        <h4
          className="font-semibold text-sm tracking-tight line-clamp-1 mb-0.5 transition-colors group-hover:text-[var(--color-accent)]"
          style={{ color: "var(--color-text)" }}
        >
          {project.name}
        </h4>
        <p className="font-mono text-[10px]" style={{ color: "var(--color-text-dim)" }}>
          {project.owner}
        </p>
      </Link>

      {/* Description */}
      <p
        className="text-sm leading-relaxed line-clamp-2 mb-4"
        style={{ color: "var(--color-text-muted)" }}
      >
        {project.description || "No description provided."}
      </p>

      {/* Footer */}
      <div
        className="flex flex-col items-stretch gap-3 pt-3 border-t sm:flex-row sm:items-center sm:justify-between"
        style={{ borderColor: "var(--color-ruled)" }}
      >
        <div className="flex items-center gap-3 min-w-0 flex-wrap">
          <span
            className="font-medium text-xs truncate"
            style={{ color: "var(--color-text)" }}
          >
            {project.language || "—"}
          </span>
          <span
            className="font-mono text-xs whitespace-nowrap"
            style={{ color: "var(--color-text-muted)" }}
          >
            ★ {project.stars.toLocaleString()}
          </span>
          {days != null && (
            <span
              className="font-mono text-[11px] whitespace-nowrap"
              style={{ color: "var(--color-text-dim)" }}
              title="Updated Xd ago"
            >
              {days}d ago
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          {isFresh && (
            <span
              className="badge-pulse font-mono text-[11px] px-1.5 py-0.5"
              style={{ backgroundColor: "var(--color-signal-green)", color: "var(--color-bg)" }}
            >
              NEW
            </span>
          )}
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${project.name} on GitHub`}
            className="relative z-10 flex items-center border px-2 py-1 transition-colors hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
            style={{
              color: "var(--color-accent)",
              borderColor: "var(--color-accent-border)",
              backgroundColor: "var(--color-accent-dim)",
            }}
          >
            <GitHubIcon size={12} />
          </a>
          <button
            onClick={onToggleTrack}
            aria-pressed={tracked}
            aria-label={tracked ? `Stop tracking ${project.name}` : `Track ${project.name}`}
            className="relative z-10 font-mono text-[10px] tracking-wider px-2 py-1 border transition-all hover:opacity-80 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
            style={{
              color: tracked ? "var(--color-signal-green)" : "var(--color-accent)",
              borderColor: tracked ? "var(--color-signal-green)" : "var(--color-accent-border)",
              backgroundColor: tracked ? "transparent" : "var(--color-accent-dim)",
            }}
          >
            {tracked ? "TRACKED" : "TRACK"}
          </button>
          <button
            onClick={() => onCopy(project.url)}
            aria-label={`Copy GitHub link for ${project.name}`}
            className="relative z-10 font-mono text-[10px] tracking-wider px-2 py-1 border transition-all hover:opacity-80 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
            style={{
              color: "var(--color-accent)",
              borderColor: "var(--color-accent-border)",
              backgroundColor: "var(--color-accent-dim)",
            }}
          >
            Copy GitHub link
          </button>
        </div>
      </div>

      {/* Corner ticks */}
      <div
        className="absolute top-0 left-0 w-2 h-2 border-t border-l"
        style={{ borderColor: "var(--color-accent)" }}
      />
      <div
        className="absolute bottom-0 right-0 w-2 h-2 border-b border-r"
        style={{ borderColor: "var(--color-accent)" }}
      />
    </motion.div>
  );
}
