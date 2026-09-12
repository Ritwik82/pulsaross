import type { Project } from "@/lib/data";
import Link from "next/link";
import { StatStrip } from "@/components/stat-strip";

interface ObservatoryHeroProps {
  projects: Project[];
  generatedAt: string;
}

export function ObservatoryHero({ projects, generatedAt }: ObservatoryHeroProps) {
  const total = projects.length;

  return (
    <section className="relative px-4 pt-6 pb-8 border-b border-[var(--color-border)] overflow-hidden">
      {/* Precision grid backdrop overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--color-text) 1px, transparent 1px), linear-gradient(to bottom, var(--color-text) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column — Value Prop & Jump Action */}
          <div className="lg:col-span-6 flex flex-col items-start gap-4">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-[var(--color-accent-border)] bg-[var(--color-accent-dim)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-signal-green)] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-signal-green)]" />
              </span>
              <span className="font-mono text-[11px] font-medium tracking-wider uppercase text-[var(--color-text)]">
                Live FOSS Radar Active
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[var(--color-text)] leading-[1.1]">
              Open-source Android <br />
              <span className="text-[var(--color-accent)]">Health Observatory</span>
            </h1>

            <p className="text-sm sm:text-base text-[var(--color-text-muted)] max-w-[52ch] leading-relaxed">
              Automated telemetry on maintenance cadence, abandonment risk, and target SDK security across 500+ Android packages. Never install abandonware again.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/catalog"
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--color-accent)] text-[var(--color-bg)] transition-all hover:opacity-90 active:scale-[0.98] shadow-sm font-mono tracking-wider uppercase"
              >
                Explore Catalog ({total}) →
              </Link>
              <Link
                href="/watchlist"
                className="px-4 py-2 text-xs font-medium rounded-lg border border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-accent-border)] hover:bg-[var(--color-surface)] transition-all active:scale-[0.98] font-mono tracking-wider uppercase"
              >
                Watchlist Hub
              </Link>
              <Link
                href="/methodology"
                className="px-3 py-2 text-xs text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors underline underline-offset-4 decoration-[var(--color-border)] font-mono"
              >
                Methodology &amp; API
              </Link>
            </div>
          </div>

          {/* Right Column — Telemetry HUD Pod */}
          <div className="lg:col-span-6">
            <StatStrip projects={projects} generatedAt={generatedAt} />
          </div>
        </div>
      </div>
    </section>
  );
}
