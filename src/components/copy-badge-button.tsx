"use client";

import { useState } from "react";

export function CopyBadgeButton({ repoId }: { projectUrl?: string; repoId: string }) {
  const [copied, setCopied] = useState(false);

  const badgeMarkdown = `[![PulsarOss Health](https://pulsaross.vercel.app/api/score/${repoId})](https://pulsaross.vercel.app/project/${repoId})`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(badgeMarkdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <button
      onClick={copy}
      aria-label="Copy health badge markdown"
      className="w-full font-mono text-[10px] tracking-wider uppercase px-3 py-2 rounded border border-[var(--color-border)] text-[var(--color-text-dim)] bg-[var(--color-bg)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent-border)] transition-colors flex items-center justify-between"
    >
      <span>{copied ? "Copied to Clipboard! ✓" : "Copy Badge Markdown"}</span>
      <span className="text-[9px]">MD</span>
    </button>
  );
}
