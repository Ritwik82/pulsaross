// Design tokens — single source for Tailwind/CSS + JS (brand, ui-styling, design-system)
// Keep globals.css as output; this file is the contract for JS/TS usage.
export const tokens = {
  bg: "var(--color-bg)",
  surface: "var(--color-surface)",
  surfaceHover: "var(--color-surface-hover)",
  surfaceElevated: "var(--color-surface-elevated)",
  border: "var(--color-border)",
  borderHover: "var(--color-border-hover)",
  text: "var(--color-text)",
  textMuted: "var(--color-text-muted)",
  textDim: "var(--color-text-dim)",
  accent: "var(--color-accent)",
  accentDim: "var(--color-accent-dim)",
  accentBorder: "var(--color-accent-border)",
  signal: {
    green: "var(--color-signal-green)",
    blue: "var(--color-signal-blue)",
    purple: "var(--color-signal-purple)",
    amber: "var(--color-signal-amber)",
    orange: "var(--color-signal-orange)",
    red: "var(--color-signal-red)",
  },
  ruled: "var(--color-ruled)",
  margin: "var(--color-margin)",
} as const;
export type Token = typeof tokens;
