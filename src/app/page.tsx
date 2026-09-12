import { getProjects, getGenres } from "@/lib/data";
import { NavBar } from "@/components/nav-bar";
import { ObservatoryHero } from "@/components/observatory-hero";
import { HeatGrid } from "@/components/heat-grid";
import { FreshFindsSnippet } from "@/components/fresh-finds-snippet";
import { RepoLookup } from "@/components/repo-lookup";
import { Footer } from "@/components/footer";

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

      {/* Main Dashboard Canvas: Primary Jobs Order */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-10 space-y-12">
        {/* Job 1: Find New Apps - Fresh Finds Snippet */}
        <FreshFindsSnippet projects={freshProjects} genres={genres.genres} />

        {/* Dual Radar: Momentum Leaders & At-Risk Radar */}
        <HeatGrid projects={data.projects} genres={genres.genres} />

        {/* Job 2: Check Repo Score - Ad-Hoc Scanner Tool */}
        <section aria-label="Ad-Hoc Repository Scanner">
          <RepoLookup />
        </section>
      </main>

      <Footer generatedAt={data.generated_at} />
    </div>
  );
}
