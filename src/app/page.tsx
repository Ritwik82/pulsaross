import {
  getProjects,
  getWatchlist,
  getGenres,
} from "@/lib/data";
import { RelativeTime } from "@/components/relative-time";
import { NavBar } from "@/components/nav-bar";
import { ProjectGrid } from "@/components/project-grid";
import { ScoringSection } from "@/components/scoring-section";
import { WatchlistPanel } from "@/components/watchlist-panel";
import { FreshFinds } from "@/components/fresh-finds";
import { ExportButtons } from "@/components/export-buttons";
import { RepoLookup } from "@/components/repo-lookup";
import { ObservatoryHero } from "@/components/observatory-hero";
import { ViewTransition, Suspense } from "react";

export default function Home() {
  const data = getProjects();
  const watchlistData = getWatchlist();
  const genres = getGenres();

  // Fresh Finds = the "launched ≤9 months" promise: repos added to F-Droid AND
  // created within the window (data.fresh_cutoff written by refresh-data.mjs).
  // The archive below keeps the full catalog.
  const cutoff = new Date(data.fresh_cutoff ?? data.generated_at).getTime();
  const freshProjects = data.projects.filter(
    (p) =>
      new Date(p.added_at ?? p.created_at).getTime() >= cutoff &&
      new Date(p.created_at).getTime() >= cutoff
  );

  return (
    <div
      id="main-content"
      className="w-full min-h-screen font-sans relative"
      style={{ color: "var(--color-text)" }}
    >
      <NavBar projects={data.projects} />
      <ViewTransition
          enter={{ "nav-forward": "slide-from-right", "nav-back": "slide-from-left", default: "none" }}
          exit={{ "nav-forward": "slide-to-left", "nav-back": "slide-to-right", default: "none" }}
          default="none"
        >
          {/* Observatory Hero: Telemetry HUD & Value Proposition */}
          <ObservatoryHero projects={data.projects} generatedAt={data.generated_at} />

          {/* Zone 1 — Your Watchlist (most important, top) */}
          <Suspense fallback={null}>
            <WatchlistPanel apps={watchlistData.apps} genres={genres.genres} projects={data.projects} />
          </Suspense>

          {/* Zone 2.5 — Ad-hoc repo lookup for untracked repos */}
          <div className="px-4">
            <div className="max-w-4xl mx-auto mb-8">
              <RepoLookup />
            </div>
          </div>

          {/* Zone 2 — Fresh Finds (recent, high-score fresh apps) */}
          <FreshFinds projects={freshProjects} genres={genres.genres} />

          {/* Zone 3 — The rest of the archive with pagination */}
          <ProjectGrid projects={data.projects} genres={genres.genres} />

          {/* Scoring methodology — at the bottom, after the data */}
          <ScoringSection />

          <div className="py-8 px-4">
            <div className="max-w-4xl mx-auto">
              <ExportButtons
                watchlist={watchlistData.apps}
                projects={data.projects}
              />
            </div>
          </div>

          <footer
            className="border-t py-12 px-4"
            style={{ borderColor: "var(--color-border)" }}
          >
            <div className="max-w-6xl mx-auto flex flex-col items-center gap-3 text-center">
              <div className="flex items-center gap-2 mb-2">
                <div className="status-dot" />
                <span
                  className="font-mono text-[10px] tracking-[0.2em] uppercase"
                  style={{ color: "var(--color-accent)" }}
                >
                  PulsarOss
                </span>
              </div>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                Built by{" "}
                <a
                  href="https://github.com/Ritwik82"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 decoration-accent/50 transition-colors hover:opacity-80"
                  style={{ color: "var(--color-accent)" }}
                >
                  Ritwik
                </a>
                {" · "}
                <a
                  href="https://github.com/Ritwik82/pulsaross"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 decoration-accent/50 transition-colors hover:opacity-80"
                  style={{ color: "var(--color-accent)" }}
                >
                  View on GitHub
                </a>
              </p>
              <p className="font-mono text-[10px]" style={{ color: "var(--color-text-dim)" }}>
                Last calibration: <RelativeTime iso={data.generated_at} />
              </p>
              <p
                className="text-[10px] max-w-md leading-relaxed mt-2"
                style={{ color: "var(--color-text-dim)" }}
              >
                Scores are automated health signals —{" "}
                <a href="#methodology" className="underline underline-offset-2" style={{ color: "var(--color-accent)" }}>
                  see formulas
                </a>{" "}
                — not endorsements or safety reviews. Use your own judgment.
              </p>
            </div>
          </footer>
        </ViewTransition>
    </div>
  );
}
