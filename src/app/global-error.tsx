"use client";
import { useEffect } from "react";
import { logger } from "@/lib/logger";
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    logger.error("unhandled app error", { digest: error.digest ?? null, message: error.message });
  }, [error]);
  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--color-bg)", color: "var(--color-text)" }}>
        <div className="max-w-lg text-center glass p-8">
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase mb-3" style={{ color: "var(--color-text-dim)" }}>Telemetry interrupted</p>
          <h1 className="text-2xl font-bold tracking-tight mb-3">Something broke in the lab.</h1>
          <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--color-text-muted)" }}>
            Pulsaross hit an unhandled error. The signal is still recorded — try again. If this persists, the calibration data may need a refresh.
          </p>
          <button onClick={() => reset()} className="font-mono text-xs border px-4 py-2" style={{ borderColor: "var(--color-accent-border)", color: "var(--color-accent)" }}>
            Retry
          </button>
          {error.digest && <p className="font-mono text-[10px] mt-4" style={{ color: "var(--color-text-dim)" }}>ref: {error.digest}</p>}
        </div>
      </body>
    </html>
  );
}
