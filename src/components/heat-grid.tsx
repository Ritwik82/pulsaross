import Link from "next/link";
import type { Project, Genre } from "@/lib/data";
import { scoreColor } from "@/lib/utils";
import { getSuccessor } from "@/lib/successors";

interface HeatGridProps {
  projects: Project[];
  genres: Genre[];
}

export function HeatGrid({ projects, genres }: HeatGridProps) {
  // Compute score quantile buckets (10 buckets: 0-1, 1-2, ..., 9-10)
  const quantileBuckets = Array.from({ length: 10 }, (_, i) => {
    const min = i / 10;
    const max = i === 9 ? 1.01 : (i + 1) / 10;
    const count = projects.filter((p) => p.score >= min && p.score < max).length;
    return {
      label: `${i}–${i + 1}`,
      count,
      pct: projects.length > 0 ? (count / projects.length) * 100 : 0,
    };
  });

  const maxBucketCount = Math.max(...quantileBuckets.map((b) => b.count), 1);

  // Compute bivariate matrix (Genre x Tier)
  // Tiers: Stale (<4.0), Warning (4.0-6.9), Healthy (7.0-10.0)
  const genreStats = genres.map((g) => {
    const genreProjects = projects.filter((p) => p.genre === g.id);
    const stale = genreProjects.filter((p) => p.score < 0.4);
    const warning = genreProjects.filter((p) => p.score >= 0.4 && p.score < 0.7);
    const healthy = genreProjects.filter((p) => p.score >= 0.7);
    return {
      id: g.id,
      label: g.label,
      total: genreProjects.length,
      staleCount: stale.length,
      warningCount: warning.length,
      healthyCount: healthy.length,
    };
  });

  // Momentum leaders (highest score and stars)
  const momentumLeaders = [...projects]
    .sort((a, b) => b.score - a.score || b.stars - a.stars)
    .slice(0, 4);

  // At-risk / superseded radar
  const atRiskProjects = [...projects]
    .filter((p) => p.score < 0.4 || p.abandonment_risk > 0.7 || getSuccessor(p.id))
    .sort((a, b) => a.score - b.score)
    .slice(0, 4);

  return (
    <div className="space-y-8">
      {/* Score Quantile Heat Strip */}
      <div
        className="glass p-5 rounded-xl border border-[var(--color-border)]"
        style={{ boxShadow: "var(--card-shadow)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[var(--color-accent)] font-bold">▦</span>
            <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--color-text)]">
              Score Distribution Heat Strip (0–10 Scale)
            </h3>
          </div>
          <span className="font-mono text-[10px] text-[var(--color-text-dim)]">
            {projects.length} Total Specimens
          </span>
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 pt-2">
          {quantileBuckets.map((bucket, i) => {
            const heightPct = Math.max(12, (bucket.count / maxBucketCount) * 100);
            const scoreVal = i + 0.5;
            const color = scoreColor(scoreVal / 10);
            return (
              <Link
                key={bucket.label}
                href={`/catalog?minScore=${i / 10}`}
                className="group flex flex-col items-center justify-end p-2 rounded border border-[var(--color-border)] bg-[var(--color-bg)]/60 hover:border-[var(--color-accent-border)] hover:bg-[var(--color-surface-hover)] transition-all min-h-[90px]"
                title={`Score ${bucket.label}: ${bucket.count} apps (${bucket.pct.toFixed(1)}%)`}
                aria-label={`Score range ${bucket.label}: ${bucket.count} apps`}
              >
                <span className="font-mono text-[10px] font-bold text-[var(--color-text)] mb-1">
                  {bucket.count}
                </span>
                <div className="w-full bg-[var(--color-surface)] h-10 rounded-sm overflow-hidden flex items-end">
                  <div
                    className="w-full rounded-sm transition-all duration-300"
                    style={{
                      height: `${heightPct}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
                <span className="font-mono text-[9px] text-[var(--color-text-dim)] mt-1.5 group-hover:text-[var(--color-accent)]">
                  {bucket.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bivariate Density Matrix */}
      <div
        className="glass p-5 rounded-xl border border-[var(--color-border)] overflow-x-auto"
        style={{ boxShadow: "var(--card-shadow)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[var(--color-signal-purple)] font-bold">⊞</span>
            <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--color-text)]">
              Bivariate Health Matrix (Genre × Status Tier)
            </h3>
          </div>
          <span className="font-mono text-[10px] text-[var(--color-text-dim)]">
            Click any tier to filter catalog
          </span>
        </div>

        <table className="w-full text-left border-collapse font-mono text-xs" aria-label="Bivariate Health Matrix">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-[10px] text-[var(--color-text-dim)] uppercase tracking-wider">
              <th scope="col" className="py-2.5 px-3 font-medium">Genre</th>
              <th scope="col" className="py-2.5 px-3 text-right font-medium">Total</th>
              <th scope="col" className="py-2.5 px-3 text-center font-medium text-[var(--color-signal-red)]">
                0.0–3.9 (At Risk)
              </th>
              <th scope="col" className="py-2.5 px-3 text-center font-medium text-[var(--color-signal-amber)]">
                4.0–6.9 (Warning)
              </th>
              <th scope="col" className="py-2.5 px-3 text-center font-medium text-[var(--color-signal-green)]">
                7.0–10.0 (Healthy)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]/40">
            {genreStats.map((row) => (
              <tr key={row.id} className="hover:bg-[var(--color-surface-hover)] transition-colors">
                <th scope="row" className="py-2.5 px-3 font-normal text-[var(--color-text)]">
                  <Link
                    href={`/catalog?genre=${row.id}`}
                    className="hover:text-[var(--color-accent)] transition-colors"
                  >
                    {row.label}
                  </Link>
                </th>
                <td className="py-2.5 px-3 text-right font-mono text-[var(--color-text-dim)]">
                  {row.total}
                </td>
                {/* At Risk Cell */}
                <td className="py-2.5 px-3 text-center">
                  <Link
                    href={`/catalog?genre=${row.id}&maxScore=0.39`}
                    className="inline-flex items-center justify-center min-w-[2.5rem] px-2 py-0.5 rounded border transition-colors hover:scale-105"
                    style={{
                      borderColor: row.staleCount > 0 ? "var(--color-signal-red)" : "var(--color-border)",
                      backgroundColor: row.staleCount > 0 ? "rgba(248, 113, 113, 0.1)" : "transparent",
                      color: row.staleCount > 0 ? "var(--color-signal-red)" : "var(--color-text-dim)",
                    }}
                    aria-label={`${row.label}: ${row.staleCount} at-risk apps`}
                  >
                    {row.staleCount}
                  </Link>
                </td>
                {/* Warning Cell */}
                <td className="py-2.5 px-3 text-center">
                  <Link
                    href={`/catalog?genre=${row.id}&minScore=0.4&maxScore=0.69`}
                    className="inline-flex items-center justify-center min-w-[2.5rem] px-2 py-0.5 rounded border transition-colors hover:scale-105"
                    style={{
                      borderColor: row.warningCount > 0 ? "var(--color-signal-amber)" : "var(--color-border)",
                      backgroundColor: row.warningCount > 0 ? "rgba(251, 191, 36, 0.1)" : "transparent",
                      color: row.warningCount > 0 ? "var(--color-signal-amber)" : "var(--color-text-dim)",
                    }}
                    aria-label={`${row.label}: ${row.warningCount} warning apps`}
                  >
                    {row.warningCount}
                  </Link>
                </td>
                {/* Healthy Cell */}
                <td className="py-2.5 px-3 text-center">
                  <Link
                    href={`/catalog?genre=${row.id}&minScore=0.7`}
                    className="inline-flex items-center justify-center min-w-[2.5rem] px-2 py-0.5 rounded border transition-colors hover:scale-105"
                    style={{
                      borderColor: row.healthyCount > 0 ? "var(--color-signal-green)" : "var(--color-border)",
                      backgroundColor: row.healthyCount > 0 ? "rgba(74, 222, 128, 0.1)" : "transparent",
                      color: row.healthyCount > 0 ? "var(--color-signal-green)" : "var(--color-text-dim)",
                    }}
                    aria-label={`${row.label}: ${row.healthyCount} healthy apps`}
                  >
                    {row.healthyCount}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Dual Radar: Momentum Leaders vs At-Risk Radar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Momentum Leaders */}
        <div
          className="glass p-5 rounded-xl border border-[var(--color-border)] flex flex-col justify-between"
          style={{ boxShadow: "var(--card-shadow)" }}
        >
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--color-signal-green)]" />
                <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-text)]">
                  Momentum Leaders
                </h4>
              </div>
              <Link
                href="/catalog?sort=stars"
                className="font-mono text-[10px] text-[var(--color-accent)] hover:underline"
              >
                View all →
              </Link>
            </div>

            <div className="space-y-2.5">
              {momentumLeaders.map((p, i) => (
                <Link
                  key={p.id}
                  href={`/project/${p.id}`}
                  className="flex items-center justify-between gap-3 p-2 rounded-lg border border-transparent hover:border-[var(--color-accent-border)] hover:bg-[var(--color-surface-hover)] transition-all"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-[var(--color-text-dim)]">0{i + 1}</span>
                      <span className="text-xs font-semibold text-[var(--color-text)] truncate">{p.name}</span>
                    </div>
                    <p className="font-mono text-[10px] text-[var(--color-text-dim)] truncate">
                      ★ {(p.stars / 1000).toFixed(1)}k · {p.genre_label}
                    </p>
                  </div>
                  <span
                    className="font-mono text-xs font-bold px-2 py-0.5 rounded border shrink-0"
                    style={{
                      color: "var(--color-signal-green)",
                      borderColor: "var(--color-signal-green)",
                      backgroundColor: "rgba(74, 222, 128, 0.1)",
                    }}
                  >
                    {(p.score * 10).toFixed(1)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* At-Risk / Superseded Radar */}
        <div
          className="glass p-5 rounded-xl border border-[var(--color-border)] flex flex-col justify-between"
          style={{ boxShadow: "var(--card-shadow)" }}
        >
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--color-signal-red)]" />
                <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-text)]">
                  At-Risk &amp; Superseded Radar
                </h4>
              </div>
              <Link
                href="/catalog?sort=abandonment"
                className="font-mono text-[10px] text-[var(--color-accent)] hover:underline"
              >
                Audit all →
              </Link>
            </div>

            <div className="space-y-2.5">
              {atRiskProjects.map((p) => {
                const successor = getSuccessor(p.id);
                return (
                  <Link
                    key={p.id}
                    href={`/project/${p.id}`}
                    className="flex items-center justify-between gap-3 p-2 rounded-lg border border-transparent hover:border-[var(--color-signal-red)]/50 hover:bg-[var(--color-surface-hover)] transition-all"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[var(--color-text)] truncate">{p.name}</span>
                        {successor && (
                          <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-emerald-950/60 border border-emerald-700/60 text-emerald-400">
                            🔄 Successor
                          </span>
                        )}
                      </div>
                      <p className="font-mono text-[10px] text-[var(--color-text-dim)] truncate">
                        {successor ? `Upgrade to ${successor.successor_name}` : `Idle >90d · Score ${(p.score * 10).toFixed(1)}`}
                      </p>
                    </div>
                    <span
                      className="font-mono text-xs font-bold px-2 py-0.5 rounded border shrink-0"
                      style={{
                        color: "var(--color-signal-red)",
                        borderColor: "var(--color-signal-red)",
                        backgroundColor: "rgba(248, 113, 113, 0.1)",
                      }}
                    >
                      {(p.score * 10).toFixed(1)}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
