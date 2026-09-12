import Link from "next/link";
import type { Project, TargetSdkCompatibility } from "@/lib/data";
import type { SuccessorEntry } from "@/lib/successors";
import { getHealthStatus, getTargetSdkCompatibility } from "@/lib/data";
import { scoreColor, GitHubIcon } from "@/lib/utils";
import { TrackButton } from "@/components/track-button";
import { CopyBadgeButton } from "@/components/copy-badge-button";

interface DiagnosticLabProps {
  project: Project;
  successor: SuccessorEntry | null;
  alternatives: Project[];
}

const signalDetails: Record<
  string,
  { label: string; weight: string; dotClass: string; desc: string }
> = {
  recency: {
    label: "Recency",
    weight: "24%",
    dotClass: "signal-dot-green",
    desc: "Days since last push (decaying to 0 over 90d window)",
  },
  momentum: {
    label: "Momentum",
    weight: "20%",
    dotClass: "signal-dot-blue",
    desc: "Star velocity relative to repo age (absolute reference)",
  },
  issue_health: {
    label: "Issue Health",
    weight: "16%",
    dotClass: "signal-dot-purple",
    desc: "Open-issue maintenance load (excluding open PRs)",
  },
  contributors: {
    label: "Contributors",
    weight: "12%",
    dotClass: "signal-dot-orange",
    desc: "Bus-factor resilience (capped at 20 contributors)",
  },
  license: {
    label: "License",
    weight: "8%",
    dotClass: "signal-dot-purple",
    desc: "SPDX open-source license clarity",
  },
  abandonment_risk: {
    label: "Abandonment Risk ↓",
    weight: "20%",
    dotClass: "signal-dot-red",
    desc: "Inverted: penalty kicks in after 14d idle up to 90d",
  },
};

function BreakdownBar({
  keyName,
  value,
}: {
  keyName: string;
  value: number;
}) {
  const meta = signalDetails[keyName] || {
    label: keyName,
    weight: "10%",
    dotClass: "",
    desc: "",
  };

  const scaledValue = (value * 10).toFixed(1);
  const percent = Math.round(value * 100);

  return (
    <div
      className="relative pl-5 py-3 border-b border-[var(--color-border)]/50 last:border-0"
    >
      {/* Margin signal dot */}
      <div
        className={`absolute left-0 top-4 w-2 h-2 rounded-full ${meta.dotClass}`}
        aria-hidden="true"
      />

      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold text-[var(--color-text)]">
            {meta.label}
          </span>
          <span className="font-mono text-[10px] text-[var(--color-text-dim)]">
            ({meta.weight})
          </span>
        </div>
        <span
          className="font-mono text-xs font-bold"
          style={{ color: scoreColor(value) }}
        >
          {scaledValue} / 10
        </span>
      </div>

      <div
        role="progressbar"
        aria-label={`${meta.label} score`}
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={`${scaledValue} out of 10`}
        className="w-full h-2 rounded-full bg-[var(--color-surface)] overflow-hidden"
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percent}%`,
            backgroundColor: scoreColor(value),
          }}
        />
      </div>

      <p className="font-mono text-[10px] text-[var(--color-text-dim)] mt-1">
        {meta.desc}
      </p>
    </div>
  );
}

export function DiagnosticLab({
  project,
  successor,
  alternatives,
}: DiagnosticLabProps) {
  const health = getHealthStatus(project.score);
  const compat: TargetSdkCompatibility = getTargetSdkCompatibility(project.target_sdk);

  const observation =
    project.score >= 0.7
      ? "This specimen demonstrates healthy maintenance cadence, active issue resolution, and strong community backing. Low abandonment risk."
      : project.score >= 0.4
      ? "Moderate maintenance activity. Updates occur periodically, but monitor release cadence if deploying for mission-critical setups."
      : "High abandonment risk or inactive upstream repository. Review Android compatibility and consider active alternatives below.";

  return (
    <div className="space-y-8">
      {/* Main 3-Column Diagnostic Lab Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Column 1: Telemetry Dossier & Identity (3 cols) */}
        <section
          aria-label="Specimen Identity and Actions"
          className="lg:col-span-3 space-y-4 glass p-5 rounded-xl border border-[var(--color-border)]"
          style={{ boxShadow: "var(--card-shadow)" }}
        >
          <div>
            <div className="flex items-center gap-1.5 mb-2 font-mono text-[10px] text-[var(--color-text-dim)] uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" />
              <span>Specimen Dossier</span>
            </div>

            <p className="font-mono text-xs text-[var(--color-text-dim)]">
              {project.owner}
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)] mb-3">
              {project.name}
            </h1>

            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed mb-4">
              {project.description || "No upstream description provided on GitHub."}
            </p>
          </div>

          <div className="pt-3 border-t border-[var(--color-border)] space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between text-[var(--color-text-dim)]">
              <span>Genre</span>
              <span className="text-[var(--color-accent)]">{project.genre_label || project.genre}</span>
            </div>
            <div className="flex items-center justify-between text-[var(--color-text-dim)]">
              <span>Language</span>
              <span className="text-[var(--color-text)]">{project.language || "—"}</span>
            </div>
            <div className="flex items-center justify-between text-[var(--color-text-dim)]">
              <span>Stars</span>
              <span className="text-[var(--color-text)]">★ {project.stars.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-[var(--color-text-dim)]">
              <span>Contributors</span>
              <span className="text-[var(--color-text)]">{project.contributor_count}</span>
            </div>
            <div className="flex items-center justify-between text-[var(--color-text-dim)]">
              <span>Last Release</span>
              <span className="text-[var(--color-text)]">
                {project.last_release_at ? project.last_release_at.slice(0, 10) : "—"}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-[var(--color-border)] space-y-2">
            <div className="flex items-center gap-2">
              <TrackButton project={project} />
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 font-mono text-[10px] font-semibold tracking-wider uppercase px-3 py-1.5 rounded border border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-accent-border)] hover:text-[var(--color-accent)] transition-colors inline-flex items-center justify-center gap-1.5"
              >
                <GitHubIcon size={12} />
                <span>GitHub ↗</span>
              </a>
            </div>

            <div className="space-y-1">
              <a
                href={`obtainium://add/${project.url}`}
                className="w-full font-mono text-[10px] font-semibold tracking-wider uppercase px-3 py-2 rounded border border-[var(--color-accent-border)] text-[var(--color-accent)] bg-[var(--color-accent-dim)] hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-1.5"
                title="Open & track in Obtainium Android app"
              >
                <span>Track in Obtainium 📲</span>
              </a>
              <p className="font-mono text-[9px] text-center text-[var(--color-text-dim)]">
                (requires Obtainium installed on Android)
              </p>
            </div>

            <CopyBadgeButton projectUrl={project.url} repoId={project.id} />
          </div>
        </section>

        {/* Column 2: 6-Signal Health Engine (5 cols) */}
        <section
          aria-label="Health Assessment and Breakdown"
          className="lg:col-span-5 space-y-4 glass p-5 rounded-xl border border-[var(--color-border)]"
          style={{ boxShadow: "var(--card-shadow)" }}
        >
          {/* Header & Composite Gauge */}
          <div className="pb-4 border-b border-[var(--color-border)]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-[var(--color-signal-green)] font-bold">●</span>
                <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-text)]">
                  Composite Health Assessment
                </h2>
              </div>
              <Link
                href="/methodology"
                className="font-mono text-[10px] text-[var(--color-accent)] hover:underline"
              >
                Formulas →
              </Link>
            </div>

            <div className="flex items-baseline justify-between mt-3">
              <div>
                <span
                  className="font-mono text-4xl font-bold"
                  style={{ color: scoreColor(project.score) }}
                >
                  {(project.score * 10).toFixed(1)}
                </span>
                <span className="font-mono text-xs text-[var(--color-text-dim)] ml-1">/ 10</span>
              </div>
              <span
                className="font-mono text-xs font-bold px-2.5 py-1 rounded border"
                style={{
                  color: health.color,
                  borderColor: health.color,
                  backgroundColor: "rgba(255,255,255,0.03)",
                }}
              >
                {health.label}
              </span>
            </div>
          </div>

          {/* 6 Signal Breakdown List */}
          <div>
            <span className="block font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-dim)] mb-2">
              Weighted Signal Engines
            </span>
            <div className="divide-y divide-[var(--color-border)]/40">
              {Object.entries(project.score_breakdown).map(([k, v]) => (
                <BreakdownBar key={k} keyName={k} value={v} />
              ))}
            </div>
          </div>

          {/* Diagnostic Observation Note */}
          <div className="pt-3 border-t border-[var(--color-border)] bg-[var(--color-bg)]/40 p-3 rounded-lg">
            <span className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-dim)] mb-1">
              Observation Log
            </span>
            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
              {observation}
            </p>
          </div>
        </section>

        {/* Column 3: Android Compatibility & Migration (4 cols) */}
        <section
          aria-label="Compatibility and Discussions"
          className="lg:col-span-4 space-y-4"
        >
          {/* Spiritual Successor Banner (if any) */}
          {successor && (
            <div
              className="glass p-5 rounded-xl border-2 relative overflow-hidden"
              style={{
                borderColor: "var(--color-signal-green)",
                backgroundColor: "rgba(74, 222, 128, 0.05)",
                boxShadow: "var(--card-shadow)",
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base" aria-hidden="true">🔄</span>
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-signal-green)]">
                  Spiritual Successor Available
                </h3>
              </div>
              <p className="text-sm font-bold text-[var(--color-text)] mb-1">
                {successor.successor_name}{" "}
                <span className="font-mono text-xs font-normal text-[var(--color-text-dim)]">
                  ({successor.successor_repo})
                </span>
              </p>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed mb-4">
                {successor.reason}
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Link
                  href={`/project/${successor.successor_repo}`}
                  className="font-mono text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded border border-[var(--color-signal-green)] text-[var(--color-signal-green)] hover:bg-[var(--color-signal-green)]/10 text-center transition-colors"
                >
                  View Successor Telemetry →
                </Link>
                <a
                  href={`obtainium://add/https://github.com/${successor.successor_repo}`}
                  className="font-mono text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded border border-[var(--color-accent-border)] text-[var(--color-accent)] bg-[var(--color-accent-dim)] hover:opacity-90 text-center transition-opacity"
                >
                  Add to Obtainium 📲
                </a>
              </div>
            </div>
          )}

          {/* Android Target SDK Diagnostics */}
          <div
            className="glass p-5 rounded-xl border border-[var(--color-border)]"
            style={{ boxShadow: "var(--card-shadow)" }}
          >
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[var(--color-border)]">
              <span className="font-mono text-xs text-[var(--color-signal-purple)] font-bold">⚡</span>
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-text)]">
                Android Platform Diagnostics
              </h3>
            </div>

            <div className="space-y-3">
              <div>
                <span className="block font-mono text-[10px] text-[var(--color-text-dim)] uppercase tracking-wider">
                  Target SDK Compatibility
                </span>
                <div
                  className="mt-1 p-2 rounded border font-mono text-xs font-semibold flex items-center gap-2"
                  style={{
                    color: compat.color,
                    borderColor: compat.color,
                    backgroundColor: "rgba(255, 255, 255, 0.02)",
                  }}
                >
                  <span>{compat.label}</span>
                </div>
                {compat.warning && (
                  <p className="text-[11px] text-[var(--color-signal-amber)] mt-1.5 leading-relaxed">
                    ⚠️ {compat.warning}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--color-border)] text-xs font-mono">
                <div>
                  <span className="text-[var(--color-text-dim)] text-[10px] block">MIN SDK</span>
                  <span className="text-[var(--color-text)] font-semibold">
                    {project.min_sdk != null ? `SDK ${project.min_sdk}` : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--color-text-dim)] text-[10px] block">LICENSE</span>
                  <span className="text-[var(--color-text)] font-semibold truncate block">
                    {project.license_name || "Unspecified"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Upstream Discussion Links */}
          {project.discussion_links.length > 0 && (
            <div
              className="glass p-5 rounded-xl border border-[var(--color-border)]"
              style={{ boxShadow: "var(--card-shadow)" }}
            >
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[var(--color-border)]">
                <span className="font-mono text-xs text-[var(--color-accent)] font-bold">💬</span>
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-text)]">
                  Community Discussions
                </h3>
              </div>

              <div className="space-y-2">
                {project.discussion_links.map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2 rounded border border-[var(--color-border)] hover:border-[var(--color-accent-border)] hover:bg-[var(--color-surface-hover)] text-xs font-mono text-[var(--color-accent)] transition-all"
                  >
                    <span>{link.source === "hn" ? "Hacker News Thread" : "Reddit Community"}</span>
                    <span className="text-[10px] text-[var(--color-text-dim)]">↗</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Active Alternatives in Same Genre */}
      {alternatives.length > 0 && (
        <section
          aria-label="Active Alternatives"
          className="glass p-5 sm:p-6 rounded-xl border border-[var(--color-border)]"
          style={{ boxShadow: "var(--card-shadow)" }}
        >
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-[var(--color-signal-blue)] font-bold">◈</span>
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-text)]">
                Active Alternatives in {project.genre_label || project.genre}
              </h3>
            </div>
            <Link
              href={`/catalog?genre=${project.genre}`}
              className="font-mono text-[10px] text-[var(--color-accent)] hover:underline"
            >
              View genre catalog →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {alternatives.map((alt) => {
              const altHealth = getHealthStatus(alt.score);
              return (
                <Link
                  key={alt.id}
                  href={`/project/${alt.id}`}
                  className="p-3.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]/60 hover:border-[var(--color-accent-border)] hover:bg-[var(--color-surface-hover)] transition-all flex flex-col justify-between"
                >
                  <div>
                    <p className="font-semibold text-xs text-[var(--color-text)] truncate mb-0.5">
                      {alt.name}
                    </p>
                    <p className="font-mono text-[10px] text-[var(--color-text-dim)] truncate mb-2">
                      {alt.owner}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)] line-clamp-2 leading-relaxed mb-3">
                      {alt.description || "Active open-source Android package."}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[var(--color-border)] flex items-center justify-between font-mono text-[10px]">
                    <span style={{ color: altHealth.color }} className="font-bold">
                      {(alt.score * 10).toFixed(1)} / 10
                    </span>
                    <span className="text-[var(--color-text-dim)]">★ {alt.stars}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
