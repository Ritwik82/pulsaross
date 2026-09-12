"use client";

import { useState, useMemo, useRef, useEffect, useDeferredValue } from "react";
import { useRouter } from "next/navigation";
import type { Project } from "@/lib/data";

export function CatalogSearch({
  projects,
  onNavigate,
  inputId,
}: {
  projects: Project[];
  onNavigate?: () => void;
  inputId?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const boxRef = useRef<HTMLDivElement | null>(null);

  const results = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    if (!q) return [];
    return projects
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.owner.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      )
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }, [deferredQuery, projects]);

  const listboxOpen = focused && query.trim().length > 0;

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function go(id: string) {
    onNavigate?.();
    router.push(`/project/${encodeURIComponent(id)}`);
  }

  return (
    <div ref={boxRef} className="relative w-full">
      <div className="relative">
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: "var(--color-text-dim)" }}
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          id={inputId}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(-1);
          }}
          onFocus={() => setFocused(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (listboxOpen && activeIndex >= 0 && results[activeIndex]) {
                go(results[activeIndex].id);
              } else if (query.trim()) {
                onNavigate?.();
                setFocused(false);
                router.push(`/catalog?q=${encodeURIComponent(query.trim())}`);
              }
              return;
            }
            if (!listboxOpen) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              if (results.length > 0) setActiveIndex((i) => (i + 1) % results.length);
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              if (results.length > 0) setActiveIndex((i) => (i <= 0 ? results.length - 1 : i - 1));
            }
          }}
          placeholder="Search"
          aria-label="Search the whole catalog"
          aria-expanded={listboxOpen}
          aria-controls="catalog-search-listbox"
          aria-activedescendant={
            listboxOpen && activeIndex >= 0 && results[activeIndex]
              ? `search-option-${results[activeIndex].id}`
              : undefined
          }
          role="combobox"
          autoComplete="off"
          className="w-full border py-1.5 pl-8 pr-3 font-mono text-[10px] tracking-wider outline-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-bg)",
            color: "var(--color-text)",
          }}
        />
      </div>
      {listboxOpen && (
        <div
          id="catalog-search-listbox"
          role="listbox"
          className="absolute right-0 top-full mt-1 w-full max-h-96 overflow-y-auto border z-[70] glass"
          style={{ boxShadow: "var(--card-shadow)" }}
        >
          {results.length === 0 ? (
            <p
              className="px-4 py-3 font-mono text-[10px]"
              style={{ color: "var(--color-text-dim)" }}
            >
              No matches for “{query}”
            </p>
          ) : (
            results.map((p, i) => (
              <a
                key={p.id}
                id={`search-option-${p.id}`}
                href={`/project/${p.id}`}
                onClick={() => onNavigate?.()}
                role="option"
                aria-selected={i === activeIndex}
                onMouseEnter={() => setActiveIndex(i)}
                className="flex items-center justify-between gap-3 px-4 py-2.5 transition-colors hover:opacity-80 focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
                style={{
                  color: "var(--color-text)",
                  borderBottom: "1px solid var(--color-ruled)",
                  backgroundColor:
                    i === activeIndex ? "var(--color-accent-dim)" : undefined,
                }}
              >
                <span className="min-w-0">
                  <span className="block font-mono text-[11px] font-bold truncate">
                    {p.name}
                  </span>
                  <span className="block font-mono text-[10px] truncate" style={{ color: "var(--color-text-dim)" }}>
                    {p.owner} · {p.genre_label}
                  </span>
                </span>
                <span
                  className="font-mono text-xs font-bold shrink-0"
                  style={{ color: "var(--color-accent)" }}
                >
                  {(p.score * 10).toFixed(1)}
                </span>
              </a>
            ))
          )}
        </div>
      )}
    </div>
  );
}
