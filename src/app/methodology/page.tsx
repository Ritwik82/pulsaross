import type { Metadata } from "next";
import { getProjects } from "@/lib/data";
import { NavBar } from "@/components/nav-bar";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { ScoreCalculator } from "@/components/score-calculator";
import { Footer } from "@/components/footer";
import { signals } from "@/lib/signals";

export const metadata: Metadata = {
  title: "Scoring Methodology & API Reference",
  description:
    "Mathematical specification of the 6 transparent health signals, composite score formula, and public REST API documentation.",
};

export default function MethodologyPage() {
  const data = getProjects();

  return (
    <div
      id="main-content"
      className="w-full min-h-screen font-sans flex flex-col relative"
      style={{ color: "var(--color-text)" }}
    >
      <NavBar projects={data.projects} />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 space-y-12">
        <BreadcrumbNav
          items={[
            { label: "Home", href: "/" },
            { label: "Scoring Methodology & API" },
          ]}
        />

        {/* Page Header */}
        <header className="space-y-3 pb-6 border-b border-[var(--color-border)]">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-[var(--color-accent-border)] bg-[var(--color-accent-dim)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" />
            <span className="font-mono text-[10px] font-bold tracking-widest uppercase text-[var(--color-accent)]">
              Formal Specification
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--color-text)]">
            How the health score is calculated.
          </h1>
          <p className="text-sm sm:text-base text-[var(--color-text-muted)] max-w-2xl leading-relaxed">
            Every cataloged repository receives a composite 0–10 score built from six deterministic health signals. No opaque AI ratings or paid endorsements — every score is mathematically verifiable from public upstream metadata.
          </p>
        </header>

        {/* 6 Signal Specifications */}
        <section aria-label="Signal Specifications" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[var(--color-text)] tracking-tight">
              The 6 Health Signal Engines
            </h2>
            <span className="font-mono text-xs text-[var(--color-text-dim)]">
              Total Weight: 100%
            </span>
          </div>

          <div className="space-y-4">
            {signals.map((sig) => (
              <div
                key={sig.id}
                className="glass p-5 rounded-xl border border-[var(--color-border)] space-y-3"
                style={{ boxShadow: "var(--card-shadow)" }}
              >
                <div className="flex items-center justify-between gap-3 pb-2 border-b border-[var(--color-border)]/50">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${sig.dotClass}`} aria-hidden="true" />
                    <span className="font-mono text-xs font-bold text-[var(--color-text-dim)]">
                      {sig.id}
                    </span>
                    <h3 className="text-base font-bold text-[var(--color-text)] tracking-tight">
                      {sig.name}
                    </h3>
                  </div>

                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded border border-[var(--color-accent-border)] bg-[var(--color-accent-dim)] text-[var(--color-accent)]">
                    {Math.round(parseFloat(sig.weight) * 100)}% Weight
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-[var(--color-text-muted)] leading-relaxed">
                  {sig.description}
                </p>

                <div className="text-xs text-[var(--color-text-muted)] bg-[var(--color-bg)]/60 p-3 rounded-lg border border-[var(--color-border)]/60 space-y-1.5 font-mono">
                  <p className="text-[var(--color-text)]">
                    <strong className="text-[var(--color-text-dim)] uppercase tracking-wider text-[10px] block">Formula:</strong>
                    <code>{sig.formula}</code>
                  </p>
                  <p className="text-[var(--color-text-dim)] text-[11px]">
                    <strong>Why it matters:</strong> {sig.why}
                  </p>
                  {sig.source && (
                    <p className="text-[var(--color-text-dim)] text-[10px]">
                      Source: {sig.source}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Composite Normalization Formula Card */}
        <section aria-label="Composite Formula">
          <div
            className="glass p-6 rounded-xl border-2 border-[var(--color-accent-border)] bg-[var(--color-accent-dim)] space-y-3"
            style={{ boxShadow: "var(--card-shadow)" }}
          >
            <div className="flex items-center gap-2">
              <span className="status-dot" />
              <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-[var(--color-accent)]">
                Composite Normalization Formula
              </h2>
            </div>
            <pre className="p-3 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-xs font-mono text-[var(--color-text)] overflow-x-auto">
              score = (0.24×Recency + 0.20×Momentum + 0.16×IssueHealth + 0.12×Contributors + 0.08×License + 0.20×(1 − AbandonmentRisk)) × 10
            </pre>
            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
              Output scores range from 0.0 to 10.0. Scores ≥ 7.0 represent actively maintained, healthy packages; scores between 4.0 and 6.9 indicate slowing releases or moderate issues; scores &lt; 4.0 flag high abandonment or incompatibility risks.
            </p>
          </div>
        </section>

        {/* Interactive Score Simulator */}
        <section aria-label="Interactive Simulator">
          <ScoreCalculator />
        </section>

        {/* Absorbed API Reference Section */}
        <section id="api-specs" aria-label="API Specification" className="space-y-6 pt-6 border-t border-[var(--color-border)]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-[var(--color-signal-purple)] font-bold">{">_"}</span>
              <h2 className="text-xl font-bold text-[var(--color-text)] tracking-tight">
                Developer API &amp; Feed Reference
              </h2>
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">
              All scoring data is exposed through open, unauthenticated REST and RSS endpoints with ETag caching.
            </p>
          </div>

          <div className="space-y-4">
            {/* Endpoint 1 */}
            <div className="glass p-5 rounded-xl border border-[var(--color-border)] space-y-3">
              <div className="flex items-center justify-between gap-3 pb-2 border-b border-[var(--color-border)]">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="px-2 py-0.5 rounded font-bold bg-[var(--color-signal-green)]/15 text-[var(--color-signal-green)] border border-[var(--color-signal-green)]/30">
                    GET
                  </span>
                  <code className="text-[var(--color-text)] font-bold">/api/score/{`{owner}`}/{`{repo}`}</code>
                </div>
                <span className="font-mono text-[10px] text-[var(--color-text-dim)]">JSON (ETag)</span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)]">
                Fetches real-time composite score, 6 signal breakdowns, and target SDK compatibility for any tracked repository.
              </p>
              <pre className="p-3 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-xs font-mono text-[var(--color-accent)] overflow-x-auto">
                curl -i https://pulsaross.vercel.app/api/score/JunkFood02/Seal
              </pre>
            </div>

            {/* Endpoint 2 */}
            <div className="glass p-5 rounded-xl border border-[var(--color-border)] space-y-3">
              <div className="flex items-center justify-between gap-3 pb-2 border-b border-[var(--color-border)]">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="px-2 py-0.5 rounded font-bold bg-[var(--color-signal-green)]/15 text-[var(--color-signal-green)] border border-[var(--color-signal-green)]/30">
                    GET
                  </span>
                  <code className="text-[var(--color-text)] font-bold">/api/feed</code>
                </div>
                <span className="font-mono text-[10px] text-[var(--color-text-dim)]">RSS 2.0 XML</span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)]">
                Public RSS 2.0 feed delivering updates on newly cataloged apps and health status changes. Filterable via <code>?repos=owner/repo,owner2/repo2</code>.
              </p>
              <pre className="p-3 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-xs font-mono text-[var(--color-accent)] overflow-x-auto">
                curl -i https://pulsaross.vercel.app/api/feed
              </pre>
            </div>

            {/* Endpoint 3 */}
            <div className="glass p-5 rounded-xl border border-[var(--color-border)] space-y-3">
              <div className="flex items-center justify-between gap-3 pb-2 border-b border-[var(--color-border)]">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="px-2 py-0.5 rounded font-bold bg-[var(--color-signal-green)]/15 text-[var(--color-signal-green)] border border-[var(--color-signal-green)]/30">
                    GET
                  </span>
                  <code className="text-[var(--color-text)] font-bold">/api/openapi</code>
                </div>
                <span className="font-mono text-[10px] text-[var(--color-text-dim)]">OpenAPI 3.1 Spec</span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)]">
                Machine-readable OpenAPI 3.1 schema defining all parameters, response envelopes, and error codes.
              </p>
              <div className="flex items-center gap-3 pt-1">
                <a
                  href="/api/openapi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs font-bold text-[var(--color-accent)] hover:underline inline-flex items-center gap-1"
                >
                  <span>Open Raw /api/openapi JSON</span>
                  <span>↗</span>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer generatedAt={data.generated_at} />
    </div>
  );
}
