"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ThemeToggle } from "./theme-toggle";
import { CatalogSearch } from "./catalog-search";
import { CommandPalette } from "./command-palette";
import { navRoutes } from "@/lib/nav";
import type { Project } from "@/lib/data";
import { useLocalWatchlist } from "@/lib/local-watchlist";

export function NavBar({ projects }: { projects: Project[] }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const local = useLocalWatchlist();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        const el = document.activeElement as HTMLElement | null;
        if (el && el instanceof HTMLElement) el.blur();
        return;
      }
      // Hotkey collision resolved: / remains inline catalog search focus
      if (e.key === "/" && window.matchMedia("(min-width: 640px)").matches) {
        const target = e.target as HTMLElement | null;
        const typing =
          target &&
          (target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.tagName === "SELECT" ||
            target.isContentEditable);
        if (!typing) {
          e.preventDefault();
          const input = document.getElementById("desktop-catalog-search");
          if (input && input instanceof HTMLInputElement) input.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const openRail = () => {
    window.dispatchEvent(new CustomEvent("pulsaross-toggle-rail"));
  };

  return (
    <>
      <nav
        aria-label="Primary"
        className="sticky top-0 z-50 border-b relative"
        style={{
          backgroundColor: "color-mix(in srgb, var(--color-bg) 85%, transparent)",
          backdropFilter: "blur(12px)",
          borderColor: "var(--color-border)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 flex items-center h-11">
          {/* Station identifier — Pulse wordmark */}
          <Link href="/" className="flex items-center gap-2 mr-4 no-underline group">
            <svg
              aria-hidden="true"
              className="wordmark-wave shrink-0"
              width="20"
              height="12"
              viewBox="0 0 24 12"
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M0 6h4l2-4 3 8 3-12 3 10 2-4h7" />
            </svg>
            <span
              className="wordmark-text font-mono text-xs font-bold tracking-widest text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors"
            >
              PULSAROSS
            </span>
          </Link>

          {/* System status — live indicator */}
          <div
            className="sys-active hidden lg:flex items-center gap-1.5 mr-4"
            role="status"
          >
            <span className="sys-dot" aria-hidden="true" />
            <span
              className="font-mono text-[10px] tracking-[0.2em]"
              style={{ color: "var(--color-text-dim)" }}
            >
              SYSTEM ACTIVE
            </span>
          </div>

          {/* Separator */}
          <div
            className="hidden sm:block w-px h-4 mr-4"
            style={{ backgroundColor: "var(--color-border)" }}
          />

          {/* Route links — desktop */}
          <div className="hidden sm:flex items-center gap-1">
            {navRoutes.map((r) => {
              const isActive = r.href === "/" ? pathname === "/" : pathname.startsWith(r.href);
              return (
                <Link
                  key={r.href}
                  href={r.href}
                  aria-current={isActive ? "page" : undefined}
                  className="font-mono text-[10px] tracking-widest px-2.5 py-1 rounded transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
                  style={{
                    color: isActive ? "var(--color-accent)" : "var(--color-text-dim)",
                    backgroundColor: isActive ? "var(--color-accent-dim)" : "transparent",
                  }}
                >
                  {r.label}
                </Link>
              );
            })}
          </div>

          {/* Right side controls */}
          <div className="ml-auto flex items-center gap-2">
            {/* Global search — desktop with / shortcut */}
            <div className="hidden sm:block w-44 mr-1">
              <CatalogSearch projects={projects} inputId="desktop-catalog-search" />
            </div>

            {/* Command Palette Trigger Button (Cmd+K) */}
            <button
              onClick={() => setPaletteOpen(true)}
              aria-label="Open command palette (Cmd+K)"
              className="hidden md:inline-flex items-center gap-1.5 font-mono text-[10px] tracking-wider px-2 py-1 rounded border border-[var(--color-border)] text-[var(--color-text-dim)] bg-[var(--color-surface)] hover:border-[var(--color-accent-border)] hover:text-[var(--color-accent)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
            >
              <span>CMD</span>
              <kbd className="text-[9px] px-1 py-0.2 rounded bg-[var(--color-bg)] border border-[var(--color-border)]">
                ⌘K
              </kbd>
            </button>

            {/* Watchlist Rail Trigger Button with Badge */}
            <button
              onClick={openRail}
              aria-label="Open watchlist panel (Cmd+B)"
              className="relative inline-flex items-center gap-1.5 font-mono text-[10px] tracking-wider px-2 py-1 rounded border border-[var(--color-border)] text-[var(--color-text)] bg-[var(--color-surface)] hover:border-[var(--color-accent-border)] hover:text-[var(--color-accent)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
            >
              <span>⚡</span>
              <span className="hidden sm:inline">WATCHLIST</span>
              {local.length > 0 && (
                <span className="font-mono text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-[var(--color-accent)] text-[var(--color-bg)]">
                  {local.length}
                </span>
              )}
            </button>

            <ThemeToggle />

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Toggle navigation menu"
              aria-expanded={menuOpen}
              className="sm:hidden flex h-8 w-8 items-center justify-center rounded border transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-text)",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                {menuOpen ? (
                  <path d="M6 6l12 12M18 6L6 18" />
                ) : (
                  <path d="M4 7h16M4 12h16M4 17h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Navigation"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="sm:hidden overflow-hidden border-t"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
            >
              <div className="px-4 py-3 flex flex-col gap-1">
                <div className="pb-2 mb-1 border-b" style={{ borderColor: "var(--color-border)" }}>
                  <CatalogSearch projects={projects} onNavigate={() => setMenuOpen(false)} />
                </div>
                {navRoutes.map((r) => {
                  const isActive = r.href === "/" ? pathname === "/" : pathname.startsWith(r.href);
                  return (
                    <Link
                      key={r.href}
                      href={r.href}
                      onClick={() => setMenuOpen(false)}
                      className="font-mono text-[11px] tracking-widest py-2 px-2 rounded transition-colors"
                      style={{
                        color: isActive ? "var(--color-accent)" : "var(--color-text-dim)",
                        backgroundColor: isActive ? "var(--color-accent-dim)" : "transparent",
                      }}
                    >
                      {r.label}
                    </Link>
                  );
                })}
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setPaletteOpen(true);
                  }}
                  className="font-mono text-[11px] tracking-widest py-2 px-2 text-left border-t mt-1 flex items-center justify-between"
                  style={{
                    color: "var(--color-accent)",
                    borderColor: "var(--color-border)",
                  }}
                >
                  <span>COMMAND PALETTE</span>
                  <span className="text-[10px] text-[var(--color-text-dim)]">⌘K</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Global Command Palette */}
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        projects={projects}
      />
    </>
  );
}
