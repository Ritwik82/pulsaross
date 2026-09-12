"use client";

import { useState, useMemo, startTransition, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Project, Genre, GenreId } from "@/lib/data";
import { FilterChipGroup } from "./filter-chip";
import { daysSince, scoreColor, GitHubIcon } from "@/lib/utils";
import { ExportDrawer } from "./export-drawer";
import { useLocalWatchlist, toggleLocalWatchlist } from "@/lib/local-watchlist";

type SortField = "score" | "stars" | "newest" | "recency" | "abandonment";

export function CatalogWorkbench({
  projects,
  genres,
}: {
  projects: Project[];
  genres: Genre[];
}) {
  const searchParams = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // URL search params initialization
  const initialQuery = searchParams.get("q") ?? searchParams.get("search") ?? "";
  const initialGenre = searchParams.get("genre") ?? "all";
  const initialMinScore = searchParams.get("minScore") ?? "all";
  const initialMaxScore = searchParams.get("maxScore") ?? "all";
  const initialSort = (searchParams.get("sort") as SortField) ?? "score";
  const initialFresh = searchParams.get("fresh") === "true";
  const initialSdk = searchParams.get("sdk") ?? "all";

  const genreMap = useMemo(
    () => new Map<GenreId, string>(genres.map((g) => [g.id as GenreId, g.label])),
    [genres]
  );
  const genreOptions = useMemo(
    () => [
      { value: "all", label: "ALL" },
      ...genres.map((g) => ({ value: g.id as string, label: g.label.toUpperCase() })),
    ],
    [genres]
  );

  const PAGE_SIZE = 24;
  const [search, setSearch] = useState(initialQuery);
  const [genreFilter, setGenreFilter] = useState(initialGenre);
  const [lang, setLang] = useState("all");
  const [minScore, setMinScore] = useState(initialMinScore);
  const [maxScore, setMaxScore] = useState(initialMaxScore);
  const [sdkFilter, setSdkFilter] = useState(initialSdk);
  const [shizukuFilter, setShizukuFilter] = useState("all");
  const [activeDays, setActiveDays] = useState("all");
  const [freshOnly, setFreshOnly] = useState(initialFresh);
  const [sort, setSort] = useState<SortField>(initialSort);
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [showGeneric, setShowGeneric] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const local = useLocalWatchlist();
  const trackedIds = useMemo(() => new Set(local.map((l) => l.id)), [local]);

  const languages = useMemo(() => {
    const langs = projects.map((p) => p.language).filter(Boolean) as string[];
    return [...new Set(langs)].sort();
  }, [projects]);

  // Keyboard shortcut: Alt+F jumps focus to search
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === "f" || e.key === "F")) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Derived filter state key for pagination reset
  const filtersKey = JSON.stringify([
    search,
    lang,
    minScore,
    maxScore,
    sdkFilter,
    genreFilter,
    shizukuFilter,
    activeDays,
    freshOnly,
    showGeneric,
    sort,
    sortDir,
  ]);

  const [pageState, setPageState] = useState<{ key: string; page: number }>({
    key: filtersKey,
    page: 0,
  });
  const page = pageState.key === filtersKey ? pageState.page : 0;
  const setPage = (updater: number | ((p: number) => number)) => {
    setPageState((prev) => {
      const current = prev.key === filtersKey ? prev.page : 0;
      const next = typeof updater === "function" ? updater(current) : updater;
      return { key: filtersKey, page: next };
    });
  };

  const filtered = useMemo(() => {
    let list = projects;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.owner.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }
    if (lang !== "all") list = list.filter((p) => p.language === lang);
    if (genreFilter !== "all") list = list.filter((p) => p.genre === genreFilter);
    if (shizukuFilter === "shizuku") list = list.filter((p) => p.shizuku);
    if (shizukuFilter === "non-shizuku") list = list.filter((p) => !p.shizuku);
    if (minScore !== "all") list = list.filter((p) => p.score >= Number(minScore));
    if (maxScore !== "all") list = list.filter((p) => p.score <= Number(maxScore));

    if (sdkFilter === "modern") list = list.filter((p) => p.target_sdk != null && p.target_sdk >= 34);
    if (sdkFilter === "legacy") list = list.filter((p) => p.target_sdk != null && p.target_sdk < 30);
    if (sdkFilter === "blocked") list = list.filter((p) => p.target_sdk != null && p.target_sdk < 24);

    if (freshOnly) {
      list = list.filter((p) => {
        const days = daysSince(p.last_release_at);
        return days !== null && days <= 270;
      });
    }

    if (!showGeneric) list = list.filter((p) => !p.is_generic);
    if (activeDays !== "all") {
      list = list.filter((p) => {
        const days = (1 - p.score_breakdown.recency) * 90;
        return days <= Number(activeDays);
      });
    }

    const dir = sortDir === "asc" ? 1 : -1;
    return [...list].sort((a, b) => {
      if (sort === "newest")
        return dir * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      if (sort === "stars") return dir * (a.stars - b.stars);
      if (sort === "recency") return dir * (a.score_breakdown.recency - b.score_breakdown.recency);
      if (sort === "abandonment") return dir * (a.abandonment_risk - b.abandonment_risk);
      return dir * (a.score - b.score);
    });
  }, [
    projects,
    search,
    lang,
    genreFilter,
    shizukuFilter,
    minScore,
    maxScore,
    sdkFilter,
    freshOnly,
    showGeneric,
    activeDays,
    sort,
    sortDir,
  ]);

  const hasActiveFilters =
    Boolean(search) ||
    lang !== "all" ||
    genreFilter !== "all" ||
    shizukuFilter !== "all" ||
    minScore !== "all" ||
    maxScore !== "all" ||
    sdkFilter !== "all" ||
    freshOnly ||
    activeDays !== "all" ||
    !showGeneric ||
    sort !== "score" ||
    sortDir !== "desc";

  const resetFilters = () => {
    startTransition(() => {
      setSearch("");
      setGenreFilter("all");
      setLang("all");
      setMinScore("all");
      setMaxScore("all");
      setSdkFilter("all");
      setShizukuFilter("all");
      setActiveDays("all");
      setFreshOnly(false);
      setSort("score");
      setSortDir("desc");
      setShowGeneric(true);
    });
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const clampedPage = Math.min(page, totalPages - 1);
  const visible = filtered.slice(
    clampedPage * PAGE_SIZE,
    clampedPage * PAGE_SIZE + PAGE_SIZE
  );

  return (
    <div className="space-y-6">
      {/* Workbench Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[var(--color-accent)] font-bold">▦</span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text)]">
              Catalog Workbench
            </h1>
            <span className="font-mono text-xs px-2 py-0.5 rounded border border-[var(--color-border)] text-[var(--color-text-dim)] bg-[var(--color-surface)]">
              {filtered.length} of {projects.length}
            </span>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Explore and audit full telemetry across all open-source packages.
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="font-mono text-[10px] tracking-wider font-semibold uppercase px-2.5 py-1.5 rounded border border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent-border)] transition-colors"
            >
              RESET FILTERS
            </button>
          )}

          {/* Mobile filter toggle */}
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="lg:hidden font-mono text-[10px] tracking-wider uppercase px-3 py-1.5 rounded border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]"
          >
            {mobileFilterOpen ? "HIDE FILTERS" : "FACETS ▾"}
          </button>

          <ExportDrawer projects={projects} />
        </div>
      </div>

      {/* Main 2-Pane Workbench Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Facet Rail (lg: 3 cols) */}
        <aside
          className={`lg:col-span-3 space-y-5 glass p-4 rounded-xl border border-[var(--color-border)] ${
            mobileFilterOpen ? "block" : "hidden lg:block"
          }`}
          style={{ boxShadow: "var(--card-shadow)" }}
        >
          {/* Search Query Facet */}
          <div>
            <label
              htmlFor="workbench-search"
              className="block font-mono text-[10px] font-bold tracking-widest uppercase text-[var(--color-text-dim)] mb-1.5"
            >
              Search Query <span className="font-normal">(Alt+F)</span>
            </label>
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
                ref={searchInputRef}
                id="workbench-search"
                type="search"
                value={search}
                onChange={(e) => startTransition(() => setSearch(e.target.value))}
                placeholder="Name, owner, keyword..."
                className="w-full rounded border border-[var(--color-border)] bg-[var(--color-bg)] py-1.5 pl-8 pr-3 font-mono text-xs text-[var(--color-text)] outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-accent)]"
              />
            </div>
          </div>

          {/* Genre Facet */}
          <div>
            <FilterChipGroup
              label="Genre"
              options={genreOptions}
              value={genreFilter}
              onChange={setGenreFilter}
              useStartTransition
            />
          </div>

          {/* Target SDK Facet */}
          <div>
            <FilterChipGroup
              label="Android Target SDK"
              options={[
                { value: "all", label: "ALL" },
                { value: "modern", label: "⚡ MODERN (≥34)" },
                { value: "legacy", label: "LEGACY (<30)" },
                { value: "blocked", label: "⚠️ BLOCKED (<24)" },
              ]}
              value={sdkFilter}
              onChange={setSdkFilter}
              useStartTransition
            />
          </div>

          {/* Access / Shizuku Facet */}
          <div>
            <FilterChipGroup
              label="Access Model"
              options={[
                { value: "all", label: "ALL" },
                { value: "shizuku", label: "⚡ SHIZUKU" },
                { value: "non-shizuku", label: "STANDARD" },
              ]}
              value={shizukuFilter}
              onChange={setShizukuFilter}
              useStartTransition
            />
          </div>

          {/* Language Facet */}
          <div>
            <FilterChipGroup
              label="Language"
              options={[
                { value: "all", label: "ALL" },
                ...languages.slice(0, 8).map((l) => ({ value: l, label: l.toUpperCase() })),
              ]}
              value={lang}
              onChange={setLang}
              useStartTransition
            />
          </div>

          {/* Sorting Facets */}
          <div className="space-y-3 pt-2 border-t border-[var(--color-border)]">
            <FilterChipGroup
              label="Sort Field"
              options={[
                { value: "score", label: "SCORE" },
                { value: "stars", label: "STARS" },
                { value: "newest", label: "NEW" },
                { value: "recency", label: "ACTIVE" },
                { value: "abandonment", label: "RISK" },
              ]}
              value={sort}
              onChange={setSort}
              useStartTransition
            />
            <FilterChipGroup
              label="Order"
              options={[
                { value: "desc", label: "↓ HIGH→LOW" },
                { value: "asc", label: "↑ LOW→HIGH" },
              ]}
              value={sortDir}
              onChange={setSortDir}
              useStartTransition
            />
          </div>
        </aside>

        {/* Right Data Canvas (lg: 9 cols) */}
        <section className="lg:col-span-9 space-y-4" aria-label="Catalog Specimens Table">
          {/* Table Container */}
          <div
            className="glass rounded-xl border border-[var(--color-border)] overflow-hidden"
            style={{ boxShadow: "var(--card-shadow)" }}
          >
            {filtered.length === 0 ? (
              <div className="p-12 text-center">
                <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-text-dim)] mb-2">
                  No matching specimens found
                </p>
                <p className="text-sm text-[var(--color-text-muted)] max-w-md mx-auto mb-4">
                  No open-source packages match your current filter criteria.
                </p>
                <button
                  onClick={resetFilters}
                  className="font-mono text-xs font-semibold px-4 py-2 rounded bg-[var(--color-accent)] text-[var(--color-bg)] uppercase tracking-wider hover:opacity-90 transition-opacity"
                >
                  Reset all filters
                </button>
              </div>
            ) : (
              <>
                {/* Table Header Row */}
                <div className="hidden sm:flex items-center gap-3 px-4 py-2.5 border-b border-[var(--color-border)] bg-[var(--color-surface-hover)] font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-dim)]">
                  <span className="w-12 shrink-0">#</span>
                  <span className="flex-1 min-w-0">Specimen</span>
                  <span className="hidden lg:inline w-24 shrink-0">Genre</span>
                  <span className="w-28 shrink-0 text-right">Score</span>
                  <span className="hidden md:inline w-20 text-right shrink-0">Updated</span>
                  <span className="hidden xl:inline w-20 text-center shrink-0">Target</span>
                  <span className="w-16 text-right shrink-0">Stars</span>
                  <span className="w-24 shrink-0 text-center">Actions</span>
                </div>

                {/* Table Body Rows */}
                <div className="divide-y divide-[var(--color-border)]/40">
                  {visible.map((p, i) => {
                    const specimenNum = String(clampedPage * PAGE_SIZE + i + 1).padStart(3, "0");
                    const days = daysSince(p.last_release_at);
                    const isTracked = trackedIds.has(p.id);

                    return (
                      <div
                        key={p.id}
                        className="group flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-4 py-2.5 hover:bg-[var(--color-surface-hover)] transition-colors"
                      >
                        {/* Specimen Index */}
                        <span className="hidden sm:block font-mono text-[10px] text-[var(--color-text-dim)] w-12 shrink-0">
                          {specimenNum}
                        </span>

                        {/* Specimen Name & Owner */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/project/${p.id}`}
                              className="font-semibold text-xs text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors truncate"
                              aria-label={`Open ${p.name} on PulsarOss`}
                            >
                              {p.name}
                            </Link>
                            {p.shizuku && (
                              <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-purple-950/60 border border-purple-700/60 text-purple-300">
                                ⚡
                              </span>
                            )}
                          </div>
                          <p className="font-mono text-[10px] text-[var(--color-text-dim)] truncate">
                            {p.owner}
                          </p>
                        </div>

                        {/* Genre Badge */}
                        <span className="hidden lg:inline font-mono text-[10px] text-[var(--color-accent)] w-24 shrink-0 truncate">
                          {genreMap.get(p.genre) ?? p.genre_label}
                        </span>

                        {/* Health Score */}
                        <div className="w-28 shrink-0 flex items-center justify-end gap-2">
                          <div className="hidden sm:block w-14 h-1.5 rounded-full bg-[var(--color-surface)] overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${p.score * 100}%`,
                                backgroundColor: scoreColor(p.score),
                              }}
                            />
                          </div>
                          <span
                            className="font-mono text-xs font-bold w-8 text-right"
                            style={{ color: scoreColor(p.score) }}
                          >
                            {(p.score * 10).toFixed(1)}
                          </span>
                        </div>

                        {/* Last Update */}
                        <span className="hidden md:inline font-mono text-[10px] text-[var(--color-text-dim)] w-20 text-right shrink-0">
                          {days != null ? `${days}d ago` : "—"}
                        </span>

                        {/* Target SDK */}
                        <span className="hidden xl:inline font-mono text-[9px] text-[var(--color-text-dim)] w-20 text-center shrink-0">
                          {p.target_sdk != null ? `SDK ${p.target_sdk}` : "—"}
                        </span>

                        {/* Stars */}
                        <span className="font-mono text-[10px] text-[var(--color-text-muted)] w-16 text-right shrink-0">
                          ★ {p.stars >= 1000 ? `${(p.stars / 1000).toFixed(1)}k` : p.stars}
                        </span>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-1.5 w-24 shrink-0">
                          <button
                            onClick={() =>
                              toggleLocalWatchlist({
                                id: p.id,
                                name: p.name,
                                repo: p.id,
                                genre: p.genre,
                                source: "local",
                              })
                            }
                            aria-pressed={isTracked}
                            aria-label={isTracked ? `Stop tracking ${p.name}` : `Track ${p.name}`}
                            className="font-mono text-[9px] font-semibold px-2 py-0.5 rounded border transition-colors"
                            style={{
                              color: isTracked ? "var(--color-signal-green)" : "var(--color-text-dim)",
                              borderColor: isTracked ? "var(--color-signal-green)" : "var(--color-border)",
                              backgroundColor: isTracked ? "rgba(74, 222, 128, 0.1)" : "transparent",
                            }}
                          >
                            {isTracked ? "TRACKED" : "TRACK"}
                          </button>

                          <a
                            href={p.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Open ${p.name} on GitHub`}
                            className="p-1 rounded border border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent-border)] transition-colors"
                          >
                            <GitHubIcon size={12} />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Pagination Bar */}
          {totalPages > 1 && (
            <div className="glass flex items-center justify-between p-3 rounded-xl border border-[var(--color-border)] font-mono text-xs">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={clampedPage === 0}
                aria-disabled={clampedPage === 0}
                className="px-3 py-1.5 rounded border border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-accent-border)] disabled:opacity-40 transition-colors uppercase tracking-wider text-[10px]"
              >
                ← Prev
              </button>

              <span className="text-[10px] text-[var(--color-text-dim)] uppercase tracking-widest">
                Page {clampedPage + 1} of {totalPages}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={clampedPage >= totalPages - 1}
                aria-disabled={clampedPage >= totalPages - 1}
                className="px-3 py-1.5 rounded border border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-accent-border)] disabled:opacity-40 transition-colors uppercase tracking-wider text-[10px]"
              >
                Next →
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
