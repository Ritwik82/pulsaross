"use client";

import { useState } from "react";
import { scoreColor } from "@/lib/utils";

export function ScoreCalculator() {
  const [recency, setRecency] = useState(0.9);
  const [momentum, setMomentum] = useState(0.85);
  const [issueHealth, setIssueHealth] = useState(0.8);
  const [contributors, setContributors] = useState(0.6);
  const [license, setLicense] = useState(1.0);
  const [abandonmentRisk, setAbandonmentRisk] = useState(0.1);

  // Composite calculation:
  // weights: 0.24, 0.20, 0.16, 0.12, 0.08, 0.20 (uses 1 - risk)
  const composite =
    recency * 0.24 +
    momentum * 0.20 +
    issueHealth * 0.16 +
    contributors * 0.12 +
    license * 0.08 +
    (1 - abandonmentRisk) * 0.20;

  const scaledScore = (composite * 10).toFixed(1);

  return (
    <div
      className="glass p-5 sm:p-6 rounded-xl border border-[var(--color-border)] space-y-6"
      style={{ boxShadow: "var(--card-shadow)" }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[var(--color-accent)] font-bold">🖩</span>
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-text)]">
              Interactive Health Simulator
            </h3>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Adjust the 6 telemetry signals to compute the resulting 0–10 composite score.
          </p>
        </div>

        <div className="flex items-baseline gap-2 self-start sm:self-auto p-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]/80">
          <span className="font-mono text-[10px] text-[var(--color-text-dim)] uppercase tracking-wider">
            Simulated Score:
          </span>
          <span
            className="font-mono text-2xl font-bold"
            style={{ color: scoreColor(composite) }}
          >
            {scaledScore}
          </span>
          <span className="font-mono text-xs text-[var(--color-text-dim)]">/ 10</span>
        </div>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Recency */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-mono">
            <label htmlFor="sim-recency" className="text-[var(--color-text)] font-semibold">
              Recency (24%)
            </label>
            <span className="text-[var(--color-accent)] font-bold">{(recency * 10).toFixed(1)}</span>
          </div>
          <input
            id="sim-recency"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={recency}
            onChange={(e) => setRecency(parseFloat(e.target.value))}
            className="w-full accent-[var(--color-accent)]"
            aria-label="Recency signal"
          />
        </div>

        {/* Momentum */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-mono">
            <label htmlFor="sim-momentum" className="text-[var(--color-text)] font-semibold">
              Momentum (20%)
            </label>
            <span className="text-[var(--color-accent)] font-bold">{(momentum * 10).toFixed(1)}</span>
          </div>
          <input
            id="sim-momentum"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={momentum}
            onChange={(e) => setMomentum(parseFloat(e.target.value))}
            className="w-full accent-[var(--color-accent)]"
            aria-label="Momentum signal"
          />
        </div>

        {/* Issue Health */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-mono">
            <label htmlFor="sim-issue-health" className="text-[var(--color-text)] font-semibold">
              Issue Health (16%)
            </label>
            <span className="text-[var(--color-accent)] font-bold">{(issueHealth * 10).toFixed(1)}</span>
          </div>
          <input
            id="sim-issue-health"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={issueHealth}
            onChange={(e) => setIssueHealth(parseFloat(e.target.value))}
            className="w-full accent-[var(--color-accent)]"
            aria-label="Issue Health signal"
          />
        </div>

        {/* Contributors */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-mono">
            <label htmlFor="sim-contributors" className="text-[var(--color-text)] font-semibold">
              Contributors (12%)
            </label>
            <span className="text-[var(--color-accent)] font-bold">{(contributors * 10).toFixed(1)}</span>
          </div>
          <input
            id="sim-contributors"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={contributors}
            onChange={(e) => setContributors(parseFloat(e.target.value))}
            className="w-full accent-[var(--color-accent)]"
            aria-label="Contributors signal"
          />
        </div>

        {/* License */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-mono">
            <label htmlFor="sim-license" className="text-[var(--color-text)] font-semibold">
              License (8%)
            </label>
            <span className="text-[var(--color-accent)] font-bold">{license === 1 ? "1.0 (OSI)" : "0.0 (None)"}</span>
          </div>
          <input
            id="sim-license"
            type="range"
            min="0"
            max="1"
            step="1"
            value={license}
            onChange={(e) => setLicense(parseFloat(e.target.value))}
            className="w-full accent-[var(--color-accent)]"
            aria-label="License signal"
          />
        </div>

        {/* Abandonment Risk */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-mono">
            <label htmlFor="sim-abandonment-risk" className="text-[var(--color-text)] font-semibold">
              Abandonment Risk (20%)
            </label>
            <span className="text-[var(--color-signal-red)] font-bold">{Math.round(abandonmentRisk * 100)}%</span>
          </div>
          <input
            id="sim-abandonment-risk"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={abandonmentRisk}
            onChange={(e) => setAbandonmentRisk(parseFloat(e.target.value))}
            className="w-full accent-[var(--color-signal-red)]"
            aria-label="Abandonment Risk signal"
          />
        </div>
      </div>
    </div>
  );
}
