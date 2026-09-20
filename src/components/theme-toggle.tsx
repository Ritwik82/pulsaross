"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  DARK_THEMES,
  LIGHT_THEMES,
  THEME_META_COLORS,
  isDarkTheme,
  isThemeName,
  type ThemeName,
} from "@/lib/theme-script";

const THEME_LABELS: Record<ThemeName, string> = {
  espresso: "Espresso",
  caramel: "Caramel",
  terminal: "Terminal",
  midnight: "Midnight",
  latte: "Latte",
  cream: "Cream",
  blush: "Blush",
  azure: "Azure",
  mint: "Mint",
  "mint-dark": "Mint Dark",
};

// Swatch colors mirror each theme's accent token in globals.css.
const THEME_SWATCHES: Record<ThemeName, string> = {
  espresso: "#d9a05b",
  caramel: "#e8a33d",
  terminal: "#2cc9ee",
  midnight: "#86aee8",
  latte: "#8b4d15",
  cream: "#8f501f",
  blush: "#a6534f",
  azure: "#2a5f9e",
  mint: "#006239",
  "mint-dark": "#4ade80",
};

function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

function getSnapshot() {
  return isThemeName(document.documentElement.dataset.theme)
    ? document.documentElement.dataset.theme
    : "terminal";
}

function getServerSnapshot(): ThemeName {
  return "terminal";
}

// Module-scope helper: the React Compiler immutability rule forbids mutating
// captured DOM nodes inside component functions, so the DOM write lives here.
function applyTheme(next: ThemeName) {
  document.documentElement.dataset.theme = next;
  localStorage.setItem("pulsaross-theme", next);
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", THEME_META_COLORS[next]);
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"light" | "dark">(isDarkTheme(theme) ? "dark" : "light");
  const rootRef = useRef<HTMLDivElement | null>(null);

  function select(next: ThemeName) {
    applyTheme(next);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const themes = mode === "dark" ? DARK_THEMES : LIGHT_THEMES;

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Change theme"
        aria-haspopup="menu"
        aria-expanded={open}
        className="state-layer flex h-8 items-center gap-1.5 border px-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] touch-none"
        style={{
          borderColor: "var(--color-border)",
          color: "var(--color-text-dim)",
        }}
      >
        <span
          aria-hidden="true"
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: THEME_SWATCHES[theme] }}
        />
        <span className="hidden sm:inline font-mono text-[10px] tracking-wider">
          {THEME_LABELS[theme]}
        </span>
        <svg
          aria-hidden="true"
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 150ms ease" }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Theme"
          className="absolute right-0 top-full mt-1 z-[70] glass border py-1 w-40"
          style={{
            boxShadow: "var(--card-shadow)",
            borderColor: "var(--color-border)",
          }}
        >
          <div
            className="grid grid-cols-2 gap-1 px-2 pb-1 mb-1 border-b"
            style={{ borderColor: "var(--color-border)" }}
            role="group"
            aria-label="Light or dark mode"
          >
            {(["light", "dark"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                aria-pressed={mode === m}
                className="font-mono text-[10px] tracking-wider py-1 text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-accent)]"
                style={{
                  color: mode === m ? "var(--color-accent)" : "var(--color-text-dim)",
                  backgroundColor: mode === m ? "var(--color-accent-dim)" : "transparent",
                }}
              >
                {m === "dark" ? "DARK" : "LIGHT"}
              </button>
            ))}
          </div>

          {themes.map((t) => {
            const selected = t === theme;
            return (
              <button
                key={t}
                role="menuitemradio"
                aria-checked={selected}
                onClick={() => select(t)}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-accent)]"
                style={{
                  backgroundColor: selected ? "var(--color-accent-dim)" : "transparent",
                  color: selected ? "var(--color-accent)" : "var(--color-text-dim)",
                }}
              >
                <span
                  aria-hidden="true"
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: THEME_SWATCHES[t] }}
                />
                <span className="font-mono text-[10px] tracking-wider">
                  {THEME_LABELS[t]}
                </span>
                {selected && (
                  <svg
                    aria-hidden="true"
                    className="ml-auto"
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}