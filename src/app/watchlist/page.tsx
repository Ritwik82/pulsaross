import { Suspense } from "react";
import type { Metadata } from "next";
import { getProjects, getWatchlist, getGenres } from "@/lib/data";
import { NavBar } from "@/components/nav-bar";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { WatchlistPanel } from "@/components/watchlist-panel";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Watchlist Management",
  description: "Monitor personal Android app health, track maintenance cadences, and sync with Obtainium.",
};

export default function WatchlistPage() {
  const data = getProjects();
  const watchlistData = getWatchlist();
  const genres = getGenres();

  return (
    <div
      id="main-content"
      className="w-full min-h-screen font-sans flex flex-col relative"
      style={{ color: "var(--color-text)" }}
    >
      <NavBar projects={data.projects} />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <BreadcrumbNav
          items={[
            { label: "Home", href: "/" },
            { label: "Watchlist Management" },
          ]}
        />

        <Suspense fallback={<div className="py-20 text-center font-mono text-xs text-[var(--color-text-dim)]">Loading watchlist telemetry...</div>}>
          <WatchlistPanel
            apps={watchlistData.apps}
            genres={genres.genres}
            projects={data.projects}
          />
        </Suspense>
      </main>

      <Footer generatedAt={data.generated_at} />
    </div>
  );
}
