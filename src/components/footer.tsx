import Link from "next/link";
import { RelativeTime } from "@/components/relative-time";

export function Footer({ generatedAt }: { generatedAt?: string }) {
  return (
    <footer
      className="border-t py-12 px-4 bg-[var(--color-surface)]/40 mt-auto"
      style={{ borderColor: "var(--color-border)" }}
    >
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10 text-xs">
        {/* Column 1: Station Identity */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="status-dot" />
            <span
              className="font-mono text-xs font-bold tracking-[0.2em] uppercase text-[var(--color-text)]"
            >
              PULSAROSS
            </span>
          </div>
          <p className="text-[var(--color-text-muted)] text-[11px] leading-relaxed">
            Automated health telemetry and maintenance tracking for 500+ open-source Android apps.
          </p>
          {generatedAt && (
            <p className="font-mono text-[10px] text-[var(--color-text-dim)]">
              Calibrated: <RelativeTime iso={generatedAt} />
            </p>
          )}
        </div>

        {/* Column 2: Navigation */}
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[10px] tracking-widest uppercase font-bold text-[var(--color-accent)] mb-1">
            Navigation
          </span>
          <Link href="/" className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors">
            Overview Dashboard
          </Link>
          <Link href="/catalog" className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors">
            Catalog Workbench
          </Link>
          <Link href="/watchlist" className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors">
            Watchlist Management
          </Link>
          <Link href="/methodology" className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors">
            Scoring Methodology
          </Link>
        </div>

        {/* Column 3: Telemetry & API */}
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[10px] tracking-widest uppercase font-bold text-[var(--color-accent)] mb-1">
            Developer &amp; Feed
          </span>
          <a
            href="/api/openapi"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors inline-flex items-center gap-1"
          >
            <span>OpenAPI 3.1 Spec</span>
            <span className="text-[10px]">↗</span>
          </a>
          <a
            href="/api/feed"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors inline-flex items-center gap-1"
          >
            <span>RSS 2.0 Health Feed</span>
            <span className="text-[10px]">↗</span>
          </a>
          <Link href="/methodology#api-specs" className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors">
            REST API Reference
          </Link>
          <a
            href="https://github.com/Ritwik82/pulsaross/tree/main/userscript"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors inline-flex items-center gap-1"
          >
            <span>Tampermonkey Script</span>
            <span className="text-[10px]">↗</span>
          </a>
        </div>

        {/* Column 4: Community & Project */}
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[10px] tracking-widest uppercase font-bold text-[var(--color-accent)] mb-1">
            Community
          </span>
          <a
            href="https://github.com/Ritwik82/pulsaross"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors inline-flex items-center gap-1"
          >
            <span>GitHub Repository</span>
            <span className="text-[10px]">↗</span>
          </a>
          <a
            href="https://github.com/Ritwik82"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors inline-flex items-center gap-1"
          >
            <span>Maintainer (Ritwik)</span>
            <span className="text-[10px]">↗</span>
          </a>
          <a
            href="https://github.com/ImranR98/Obtainium"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors inline-flex items-center gap-1"
          >
            <span>Obtainium App</span>
            <span className="text-[10px]">↗</span>
          </a>
          <a
            href="https://f-droid.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors inline-flex items-center gap-1"
          >
            <span>F-Droid Ecosystem</span>
            <span className="text-[10px]">↗</span>
          </a>
        </div>
      </div>

      <div
        className="max-w-6xl mx-auto pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left"
        style={{ borderColor: "var(--color-border)" }}
      >
        <p className="text-[11px] text-[var(--color-text-dim)]">
          Scores are mechanical health signals calculated from public GitHub and F-Droid metadata — not endorsements or security audits.
        </p>
        <p className="font-mono text-[10px] text-[var(--color-text-dim)] shrink-0">
          MIT License · Zero Trackers
        </p>
      </div>
    </footer>
  );
}
