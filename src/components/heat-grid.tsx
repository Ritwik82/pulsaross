import Link from "next/link";
import type { Project, Genre } from "@/lib/data";
import { getSuccessor } from "@/lib/successors";

interface HeatGridProps {
  projects: Project[];
  genres?: Genre[];
}

export function HeatGrid({ projects }: HeatGridProps) {
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
    <section aria-label="Momentum Leaders and At-Risk Radar" className="w-full">
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
    </section>
  );
}
