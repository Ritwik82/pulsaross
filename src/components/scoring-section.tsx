"use client";

import { motion } from "framer-motion";
import { ScrollSection, StaggerGroup, StaggerItem } from "./scroll-section";
import { signals } from "@/lib/signals";
export { signals };

export function ScoringSection() {
  return (
    <ScrollSection
      id="methodology"
      className="relative py-24 md:py-32 px-4"
    >
      <div className="max-w-4xl mx-auto">
        {/* Section header — notebook style */}
        <div className="mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold tracking-tight mb-4"
            style={{ color: "var(--color-text)" }}
          >
            How the score works.
            <br />
            <span style={{ color: "var(--color-text-muted)" }}>Six signals. One honest number.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base max-w-xl leading-relaxed"
            style={{ color: "var(--color-text-muted)" }}
          >
            Every project gets a 1–10 health score from six transparent signals.
            No black boxes — each signal has a clear formula and public data source.
            The final score is a weighted sum, normalized to 0–10.
          </motion.p>
        </div>

        {/* Signal overview bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-12 flex flex-wrap gap-2"
          style={{ fontSize: "11px" }}
        >
          {signals.map((signal) => (
            <span
              key={signal.id}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded border"
              style={{
                borderColor: "var(--color-accent-border)",
                backgroundColor: "var(--color-accent-dim)",
                color: "var(--color-accent)",
              }}
            >
              <span className={`w-2 h-2 rounded-full ${signal.dotClass}`} aria-hidden="true" />
              <span className="font-mono tracking-wider">{signal.name}</span>
              <span className="font-mono font-bold ml-1" style={{ color: "var(--color-text)" }}>
                {Math.round(parseFloat(signal.weight) * 100)}%
              </span>
            </span>
          ))}
        </motion.div>

        {/* Notebook entries */}
        <StaggerGroup className="space-y-0">
          {signals.map((signal) => (
            <StaggerItem key={signal.id}>
              <div
                className="relative border-b py-6"
                style={{ borderColor: "var(--color-ruled)" }}
              >
                {/* Margin line */}
                <div
                  className="absolute left-8 top-0 bottom-0 w-px"
                  style={{ backgroundColor: "var(--color-margin)" }}
                />

                <div className="pl-14">
                  {/* Entry header */}
                  <div className="flex items-center gap-4 mb-3">
                    {/* Signal dot */}
                    <div className={`w-2.5 h-2.5 rounded-full ${signal.dotClass}`} aria-hidden="true" />

                    {/* ID + Name */}
                    <span
                      className="font-mono text-[10px] tracking-widest"
                      style={{ color: "var(--color-text-dim)" }}
                    >
                      {signal.id}
                    </span>
                    <h3
                      className="text-lg font-bold tracking-tight"
                      style={{ color: "var(--color-text)" }}
                    >
                      {signal.name}
                    </h3>

                    {/* Weight */}
                    <span
                      className="font-mono text-xs font-bold ml-auto px-2 py-0.5 border"
                      style={{
                        color: "var(--color-accent)",
                        borderColor: "var(--color-accent-border)",
                        backgroundColor: "var(--color-accent-dim)",
                      }}
                    >
                      {Math.round(parseFloat(signal.weight) * 100)}%
                    </span>
                  </div>

                  {/* What it measures */}
                  <p
                    className="text-sm leading-relaxed mb-2"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {signal.description}
                  </p>

                  {/* Why it matters */}
                  <p
                    className="text-sm leading-relaxed mb-2"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    <strong style={{ color: "var(--color-text)" }}>Why it matters:</strong> {signal.why}
                  </p>

                  {/* Formula */}
                  <p
                    className="font-mono text-[11px] tracking-wide"
                    style={{ color: "var(--color-text-dim)" }}
                  >
                    {signal.formula}
                  </p>

                  {/* Source */}
                  <p
                    className="font-mono text-[10px] tracking-wide mt-1"
                    style={{ color: "var(--color-text-dim)" }}
                  >
                    Source: {signal.source}
                  </p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>

        {/* Final score entry */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 border-2 p-6"
          style={{
            borderColor: "var(--color-accent-border)",
            backgroundColor: "var(--color-accent-dim)",
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="status-dot" />
            <span
              className="font-mono text-[10px] tracking-widest uppercase"
              style={{ color: "var(--color-accent)" }}
            >
              Final Calculation
            </span>
          </div>
          <p className="font-mono text-sm mb-2" style={{ color: "var(--color-text)" }}>
            score = Σ(signal_i × weight_i) × 10 → normalized to [0, 10]
          </p>
          <p className="text-sm mb-4" style={{ color: "var(--color-text-muted)" }}>
            Higher is healthier. A score of 7+ means actively maintained; below 4 signals risk.
          </p>
        </motion.div>
      </div>
    </ScrollSection>
  );
}
