import type { Project } from "@/lib/data";
import { RelativeTime } from "@/components/relative-time";

interface StatStripProps {
  projects: Project[];
  generatedAt: string;
}

export function StatStrip({ projects, generatedAt }: StatStripProps) {
  const total = projects.length;
  const activeCount = projects.filter((p) => p.score * 10 >= 6).length;
  const activePct = total > 0 ? Math.round((activeCount / total) * 100) : 0;

  const fossCount = projects.filter((p) => p.license_name || p.score_breakdown?.license === 1).length;
  const fossPct = total > 0 ? Math.round((fossCount / total) * 100) : 0;

  const avgScore =
    total > 0
      ? ((projects.reduce((sum, p) => sum + p.score, 0) / total) * 10).toFixed(1)
      : "0.0";

  return (
    <div
      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5 relative overflow-hidden"
      style={{
        boxShadow: "0 10px 30px -10px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)] mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--color-signal-green)] animate-pulse" />
          <span className="font-mono text-xs text-[var(--color-text)] font-semibold tracking-wider uppercase">
            System Telemetry
          </span>
        </div>
        <span className="font-mono text-[10px] text-[var(--color-text-dim)]">
          CALIBRATED: <RelativeTime iso={generatedAt} />
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1 */}
        <div className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]/40">
          <span className="block font-mono text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider">
            Tracked Catalog
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="font-mono text-2xl font-bold text-[var(--color-text)]">{total}</span>
            <span className="font-mono text-[10px] text-[var(--color-text-dim)]">apps</span>
          </div>
          <div className="w-full bg-[var(--color-surface)] h-1 rounded-full mt-2 overflow-hidden">
            <div className="bg-[var(--color-accent)] h-full w-full" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]/40">
          <span className="block font-mono text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider">
            Health Index
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="font-mono text-2xl font-bold text-[var(--color-signal-green)]">{avgScore}</span>
            <span className="font-mono text-[10px] text-[var(--color-text-dim)]">/ 10</span>
          </div>
          <div className="w-full bg-[var(--color-surface)] h-1 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-[var(--color-signal-green)] h-full"
              style={{ width: `${Number(avgScore) * 10}%` }}
            />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]/40">
          <span className="block font-mono text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider">
            Active Rate
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="font-mono text-2xl font-bold text-[var(--color-signal-blue)]">{activePct}%</span>
            <span className="font-mono text-[10px] text-[var(--color-text-dim)]">maintained</span>
          </div>
          <div className="w-full bg-[var(--color-surface)] h-1 rounded-full mt-2 overflow-hidden">
            <div className="bg-[var(--color-signal-blue)] h-full" style={{ width: `${activePct}%` }} />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]/40">
          <span className="block font-mono text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider">
            FOSS Verified
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="font-mono text-2xl font-bold text-[var(--color-signal-purple)]">{fossPct}%</span>
            <span className="font-mono text-[10px] text-[var(--color-text-dim)]">licensed</span>
          </div>
          <div className="w-full bg-[var(--color-surface)] h-1 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-[var(--color-signal-purple)] h-full"
              style={{ width: `${fossPct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
