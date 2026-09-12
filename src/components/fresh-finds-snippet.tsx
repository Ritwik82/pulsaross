"use client";

import Link from "next/link";
import type { Project, Genre, GenreId } from "@/lib/data";
import { daysSince, scoreColor, GitHubIcon } from "@/lib/utils";
import { useLocalWatchlist, toggleLocalWatchlist } from "@/lib/local-watchlist";

interface FreshFindsSnippetProps {
  projects: Project[];
  genres: Genre[];
}

export function FreshFindsSnippet({ projects, genres }: FreshFindsSnippetProps) {
  const genreMap = new Map<GenreId, string>(genres.map((g) => [g.id as GenreId, g.label]));
  const local = useLocalWatchlist();
  const trackedIds = new Set(local.map((l) => l.id));

  // Take top 3 fresh projects sorted by score
  const topFresh = [...projects].sort((a, b) => b.score - a.score).slice(0, 3);

  return (
    <section id="fresh-finds" aria-label="Fresh Finds" className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[var(--color-signal-blue)] font-bold">◈</span>
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-text)]">
              New Apps · Launched in the last 9 months
            </h3>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            New open-source arrivals scored on early maintenance cadence and issue health.
          </p>
        </div>
        <Link
          href="/catalog?fresh=true"
          className="font-mono text-xs font-semibold text-[var(--color-accent)] hover:underline shrink-0"
        >
          View all fresh →
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {topFresh.map((p) => {
          const days = daysSince(p.last_release_at);
          const isTracked = trackedIds.has(p.id);

          return (
            <div
              key={p.id}
              className="glass p-4 rounded-xl border border-[var(--color-border)] hover:border-[var(--color-accent-border)] transition-all flex flex-col justify-between"
              style={{ boxShadow: "var(--card-shadow)" }}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className="font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: "var(--color-accent-dim)",
                      color: "var(--color-accent)",
                    }}
                  >
                    {genreMap.get(p.genre) ?? p.genre_label}
                  </span>
                  <span
                    className="font-mono text-xs font-bold px-1.5 py-0.2 rounded border"
                    style={{
                      color: scoreColor(p.score),
                      borderColor: "var(--color-border)",
                      backgroundColor: "var(--color-bg)",
                    }}
                  >
                    {(p.score * 10).toFixed(1)}
                  </span>
                </div>

                <Link
                  href={`/project/${p.id}`}
                  className="block font-semibold text-sm text-[var(--color-text)] hover:text-[var(--color-accent)] transition-colors truncate"
                  aria-label={`Open ${p.name} on PulsarOss`}
                >
                  {p.name}
                </Link>
                <p className="font-mono text-[10px] text-[var(--color-text-dim)] truncate mb-2">
                  {p.owner}
                </p>

                <p className="text-xs text-[var(--color-text-muted)] line-clamp-2 mb-4 leading-relaxed">
                  {p.description || "No upstream description provided."}
                </p>
              </div>

              <div
                className="pt-3 border-t flex items-center justify-between text-[10px] font-mono text-[var(--color-text-dim)]"
                style={{ borderColor: "var(--color-border)" }}
              >
                <div className="flex items-center gap-2">
                  <span>★ {p.stars >= 1000 ? `${(p.stars / 1000).toFixed(1)}k` : p.stars}</span>
                  {days != null && <span>· {days}d ago</span>}
                </div>

                <div className="flex items-center gap-1.5">
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open ${p.name} on GitHub`}
                    className="p-1 rounded border border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent-border)] transition-colors"
                  >
                    <GitHubIcon size={12} />
                  </a>
                  <button
                    onClick={() =>
                      toggleLocalWatchlist({
                        id: p.id,
                        name: p.name,
                        repo: p.id,
                        genre: p.genre,
                        source: "local",
                      })
                    }
                    aria-pressed={isTracked}
                    aria-label={isTracked ? `Stop tracking ${p.name}` : `Track ${p.name}`}
                    className="font-mono text-[9px] font-semibold tracking-wider px-2 py-0.5 rounded border transition-colors"
                    style={{
                      color: isTracked ? "var(--color-signal-green)" : "var(--color-accent)",
                      borderColor: isTracked ? "var(--color-signal-green)" : "var(--color-accent-border)",
                      backgroundColor: isTracked ? "rgba(74, 222, 128, 0.1)" : "var(--color-accent-dim)",
                    }}
                  >
                    {isTracked ? "TRACKED" : "TRACK"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
