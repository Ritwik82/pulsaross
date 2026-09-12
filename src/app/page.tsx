import { getProjects, getGenres } from "@/lib/data";
import { NavBar } from "@/components/nav-bar";
import { ObservatoryHero } from "@/components/observatory-hero";
import { HeatGrid } from "@/components/heat-grid";
import { FreshFindsSnippet } from "@/components/fresh-finds-snippet";
import { RepoLookup } from "@/components/repo-lookup";
import { Footer } from "@/components/footer";
import Link from "next/link";

export default function Home() {
  const data = getProjects();
  const genres = getGenres();

  const cutoff = new Date(data.fresh_cutoff ?? data.generated_at).getTime();
  const freshProjects = data.projects.filter(
    (p) =>
      new Date(p.added_at ?? p.created_at).getTime() >= cutoff &&
      new Date(p.created_at).getTime() >= cutoff
  );

  return (
    <div
      id="main-content"
      className="w-full min-h-screen font-sans flex flex-col relative"
      style={{ color: "var(--color-text)" }}
    >
      <NavBar projects={data.projects} />

      {/* L1 Observatory Hero: Telemetry HUD & Value Proposition */}
      <ObservatoryHero projects={data.projects} generatedAt={data.generated_at} />

      {/* Main Dashboard Canvas */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-10 space-y-12">
        {/* Heat Grid & Bivariate Density Matrix */}
        <section aria-label="Catalog Health Matrix">
          <HeatGrid projects={data.projects} genres={genres.genres} />
        </section>

        {/* Fresh Finds Snippet */}
        <FreshFindsSnippet projects={freshProjects} genres={genres.genres} />

        {/* Ad-Hoc GitHub Repo Scanner Tool */}
        <section aria-label="Ad-Hoc Repository Scanner">
          <RepoLookup />
        </section>

        {/* Workbench CTA Banner */}
        <section
          className="glass p-6 sm:p-8 rounded-xl border border-[var(--color-border)] text-center relative overflow-hidden"
          style={{ boxShadow: "var(--card-shadow)" }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--color-accent-border)] bg-[var(--color-accent-dim)] mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" />
            <span className="font-mono text-[10px] tracking-widest uppercase font-semibold text-[var(--color-accent)]">
              Full Archive Available
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text)] mb-3">
            Ready to explore all {data.projects.length} Android packages?
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] max-w-xl mx-auto mb-6 leading-relaxed">
            Jump into the Catalog Workbench with multi-facet filters, Android target SDK audits, and instant JSON/CSV exports.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/catalog"
              className="px-5 py-2.5 rounded-lg bg-[var(--color-accent)] text-[var(--color-bg)] font-mono text-xs font-bold tracking-wider uppercase transition-all hover:opacity-90 active:scale-[0.98] shadow-sm"
            >
              Open Catalog Workbench →
            </Link>
            <Link
              href="/watchlist"
              className="px-5 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] font-mono text-xs font-semibold tracking-wider uppercase hover:border-[var(--color-accent-border)] transition-all active:scale-[0.98]"
            >
              Manage Watchlist
            </Link>
          </div>
        </section>
      </main>

      <Footer generatedAt={data.generated_at} />
    </div>
  );
}
