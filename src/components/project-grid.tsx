"use client";

import { useState, useMemo, startTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import type { Project, Genre, GenreId } from "@/lib/data";
import { FilterChipGroup } from "./filter-chip";

const GitHubIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.54 2.87 8.39 6.84 9.75.5.1.68-.22.68-.49 0-.24-.01-.88-.01-1.73-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.36-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.7 0 0 .84-.27 2.75 1.05.8-.23 1.65-.34 2.5-.34s1.7.11 2.5.34c1.91-1.32 2.75-1.05 2.75-1.05.55 1.4.2 2.44.1 2.7.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.79-4.57 5.05.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.6.69.49A10.04 10.04 0 0 0 22 12.25C22 6.58 17.52 2 12 2z" />
  </svg>
);

function scoreColor(score: number): string {
  const s = score * 10;
  if (s >= 7) return "var(--color-signal-green)";
  if (s >= 4) return "var(--color-signal-amber)";
  return "var(--color-signal-red)";
}

type SortField = "score" | "stars" | "newest" | "recency" | "abandonment";

function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((Date.now() - t) / 86400000));
}

function ArchiveRow({
  project,
  index,
  genreMap,
}: {
  project: Project;
  index: number;
  genreMap: Map<string, string>;
}) {
  const specimenId = String(index + 1);
  const days = daysSince(project.last_release_at);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.18 }}
      className="glass group relative flex items-center gap-3 px-4 min-h-[44px] transition-colors hover:border-[var(--color-accent-border)]"
    >
      {/* Corner tick */}
      <span
        className="absolute left-0 top-1/2 -translate-y-1/2 h-3 w-0.5"
        style={{ backgroundColor: "var(--color-accent)" }}
      />

      {/* Specimen code */}
      <span
        className="hidden sm:block font-mono text-[10px] tracking-[0.15em] uppercase w-14 shrink-0"
        style={{ color: "var(--color-text-dim)" }}
      >
        {specimenId}
      </span>

      {/* Name + owner link */}
      <Link
        href={`/project/${project.id}`}
        className="min-w-0 flex-1 flex items-baseline gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
        aria-label={`Open ${project.name} on PulsarOss`}
      >
        <span
          className="text-sm font-semibold tracking-tight truncate transition-colors group-hover:text-[var(--color-accent)]"
          style={{ color: "var(--color-text)" }}
        >
          {project.name}
        </span>
        <span
          className="hidden md:inline font-mono text-[10px] truncate"
          style={{ color: "var(--color-text-dim)" }}
        >
          {project.owner}
        </span>
      </Link>

      {/* Genre chip */}
      <span
        className="hidden lg:inline font-mono text-[10px] tracking-widest uppercase px-1.5 py-0.5 shrink-0"
        style={{ backgroundColor: "var(--color-accent-dim)", color: "var(--color-accent)" }}
      >
        {genreMap.get(project.genre) ?? project.genre}
      </span>

      {/* Score bar + number */}
      <span className="flex items-center gap-2 shrink-0">
        <span
          className="hidden md:block w-20 h-[10px] overflow-hidden rounded-sm"
          style={{ backgroundColor: "var(--color-ruled)" }}
        >
          <span
            className="block h-full transition-[width] duration-500"
            style={{ width: `${project.score * 100}%`, backgroundColor: scoreColor(project.score) }}
          />
        </span>
        <span
          className="font-mono text-xs font-bold w-9 text-right"
          style={{ color: scoreColor(project.score) }}
        >
          {(project.score * 10).toFixed(1)}
        </span>
      </span>

      {/* Last release */}
      <span
        className="hidden lg:inline font-mono text-[10px] w-16 text-right shrink-0"
        style={{ color: "var(--color-text-dim)" }}
      >
        {days != null ? `${days}d ago` : "—"}
      </span>

      {/* Target SDK */}
      {project.target_sdk != null && (
        <span
          className="hidden xl:inline font-mono text-[10px] px-1.5 py-0.5 rounded border border-[var(--color-border)] text-[var(--color-text-dim)] shrink-0"
        >
          SDK {project.target_sdk}
        </span>
      )}

      {/* Stars */}
      <span
        className="hidden sm:inline font-mono text-[10px] w-12 text-right shrink-0"
        style={{ color: "var(--color-text-muted)" }}
      >
        ★{project.stars >= 1000 ? `${(project.stars / 1000).toFixed(1)}k` : project.stars}
      </span>

      {/* GitHub link */}
      <a
        href={project.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Open ${project.name} on GitHub`}
        className="ml-2 opacity-70 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] transition-opacity shrink-0 z-10"
        style={{ color: "var(--color-accent)" }}
      >
        <GitHubIcon />
      </a>
    </motion.div>
  );
}

export function ProjectGrid({
  projects,
  genres,
}: {
  projects: Project[];
  genres: Genre[];
}) {
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

  const [collapsed, setCollapsed] = useState(false);
  const PAGE_SIZE = 24;
  const [lang, setLang] = useState("all");
  const [minScore, setMinScore] = useState("all");
  const [minStars, setMinStars] = useState("all");
  const [genreFilter, setGenreFilter] = useState("all");
  const [shizukuFilter, setShizukuFilter] = useState("all");
  const [activeDays, setActiveDays] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortField>("score");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [showGeneric, setShowGeneric] = useState(true);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const languages = useMemo(() => {
    const langs = projects.map((p) => p.language).filter(Boolean) as string[];
    return [...new Set(langs)].sort();
  }, [projects]);

  // Derive page reset automatically whenever filters/sort/search change
  const filtersKey = JSON.stringify([
    search,
    lang,
    minScore,
    minStars,
    genreFilter,
    shizukuFilter,
    activeDays,
    showGeneric,
    sort,
    sortDir,
  ]);
  const [pageState, setPageState] = useState<{ key: string; page: number }>({ key: "", page: 0 });
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
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      );
    }
    if (lang !== "all") list = list.filter((p) => p.language === lang);
    if (genreFilter !== "all") list = list.filter((p) => p.genre === genreFilter);
    if (shizukuFilter === "shizuku") list = list.filter((p) => p.shizuku);
    if (shizukuFilter === "non-shizuku") list = list.filter((p) => !p.shizuku);
    if (minScore !== "all") list = list.filter((p) => p.score >= Number(minScore));
    if (minStars !== "all") list = list.filter((p) => p.stars >= Number(minStars));
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
  }, [projects, lang, minScore, minStars, genreFilter, shizukuFilter, activeDays, search, sort, sortDir, showGeneric]);

  const hasActiveFilters =
    search ||
    lang !== "all" ||
    minScore !== "all" ||
    minStars !== "all" ||
    genreFilter !== "all" ||
    shizukuFilter !== "all" ||
    activeDays !== "all" ||
    !showGeneric ||
    sort !== "score" ||
    sortDir !== "desc";

  return (
    <section id="archive" className="py-12 md:py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="mb-8">
          <h2
            className="text-4xl md:text-5xl font-bold tracking-tight mb-4"
            style={{ color: "var(--color-text)" }}
          >
            Everything we&apos;re tracking
          </h2>
          <p
            className="text-base max-w-xl leading-relaxed"
            style={{ color: "var(--color-text-muted)" }}
          >
            The complete OSS catalog with all filters and sort options. Scores are
            mechanical health signals (recency, momentum, issue activity, contributors,
            license, abandonment risk).
          </p>
          <p className="specimen-number mt-2">{projects.length} apps cataloged</p>
        </div>

        {/* Collapse toggle */}
        <div
          className="glass mb-8"
          style={{ boxShadow: "var(--card-shadow)" }}
        >
          <button
            onClick={() => setCollapsed((c) => !c)}
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Expand archive" : "Collapse archive"}
            className="w-full flex items-center justify-between p-5 font-mono text-[10px] tracking-[0.2em] uppercase transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
            style={{ color: "var(--color-text)" }}
          >
            <span>{collapsed ? `Archived Instruments (${projects.length})` : "Collapse Archive"}</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transform: collapsed ? "rotate(0deg)" : "rotate(180deg)",
                transition: "transform 200ms ease",
              }}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </div>

        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              {/* Controls */}
              <div className="glass mb-8 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="status-dot" />
                  <span
                    className="font-mono text-[10px] tracking-[0.2em] uppercase"
                    style={{ color: "var(--color-accent)" }}
                  >
                    Instrument Controls
                  </span>
                  {hasActiveFilters && (
                    <button
                      onClick={() => {
                        startTransition(() => {
                          setSearch("");
                          setLang("all");
                          setMinScore("all");
                          setMinStars("all");
                          setGenreFilter("all");
                          setShizukuFilter("all");
                          setActiveDays("all");
                          setSort("score");
                          setSortDir("desc");
                          setShowGeneric(true);
                        });
                      }}
                      className="ml-auto font-mono text-[10px] tracking-wider px-2.5 py-1 border transition-colors"
                      style={{ borderColor: "var(--color-border)", color: "var(--color-text-dim)" }}
                    >
                      RESET
                    </button>
                  )}
                </div>

                <div className="ruled-divider mb-4" />

                {/* Search */}
                <div className="relative mb-4">
                  <svg
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
                    width="14"
                    height="14"
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
                    type="search"
                    placeholder="Search by name or description..."
                    value={search}
                    onChange={(e) => startTransition(() => setSearch(e.target.value))}
                    className="w-full border py-2 pl-9 pr-4 font-mono text-xs outline-none transition-colors focus-visible:ring-1 focus-visible:ring-[var(--color-accent)]/50"
                    style={{
                      borderColor: "var(--color-border)",
                      backgroundColor: "var(--color-bg)",
                      color: "var(--color-text)",
                    }}
                    aria-label="Search projects by name or description"
                    autoComplete="off"
                    name="search"
                  />
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-3">
                  <FilterChipGroup
                    label="Genre"
                    options={genreOptions}
                    value={genreFilter}
                    onChange={setGenreFilter}
                  />
                  <FilterChipGroup
                    label="Lang"
                    options={[
                      { value: "all", label: "ALL" },
                      ...languages.map((l) => ({ value: l, label: l.toUpperCase() })),
                    ]}
                    value={lang}
                    onChange={setLang}
                  />
                  <FilterChipGroup
                    label="Access"
                    options={[
                      { value: "all", label: "ALL" },
                      { value: "shizuku", label: "⚡ SHIZUKU" },
                      { value: "non-shizuku", label: "STANDARD" },
                    ]}
                    value={shizukuFilter}
                    onChange={setShizukuFilter}
                  />
                  <div className="flex flex-wrap gap-4 items-center">
                    <FilterChipGroup
                      label="Sort"
                      options={[
                        { value: "score", label: "SCORE" },
                        { value: "stars", label: "STARS" },
                        { value: "newest", label: "NEW" },
                        { value: "recency", label: "ACTIVE" },
                        { value: "abandonment", label: "RISK" },
                      ]}
                      value={sort}
                      onChange={setSort}
                    />
                    <FilterChipGroup
                      label="Order"
                      options={[
                        { value: "desc", label: "↓ HIGH→LOW" },
                        { value: "asc", label: "↑ LOW→HIGH" },
                      ]}
                      value={sortDir}
                      onChange={setSortDir}
                    />
                  </div>
                  {/* Advanced filters toggle */}
                  <button
                    onClick={() => setAdvancedOpen((o) => !o)}
                    aria-expanded={advancedOpen}
                    aria-controls="advanced-filters"
                    className="font-mono text-[10px] tracking-wider px-2.5 py-1 border transition-colors hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
                    style={{
                      borderColor: "var(--color-border)",
                      color: "var(--color-text-dim)",
                      backgroundColor: "var(--color-surface)",
                    }}
                  >
                    {advancedOpen ? "HIDE ADVANCED" : "SHOW ADVANCED"}
                  </button>
                  <AnimatePresence>
                    {advancedOpen && (
                      <motion.div
                        id="advanced-filters"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col gap-3 overflow-hidden border-t pt-3"
                        style={{ borderColor: "var(--color-border)" }}
                      >
                        <div className="flex flex-wrap gap-4">
                          <FilterChipGroup
                            label="Score"
                            options={[
                              { value: "all", label: "ANY" },
                              { value: "0.3", label: "3+" },
                              { value: "0.5", label: "5+" },
                              { value: "0.7", label: "7+" },
                            ]}
                            value={minScore}
                            onChange={setMinScore}
                          />
                          <FilterChipGroup
                            label="Stars"
                            options={[
                              { value: "all", label: "ANY" },
                              { value: "80", label: "80+" },
                              { value: "500", label: "500+" },
                              { value: "1000", label: "1k+" },
                              { value: "5000", label: "5k+" },
                            ]}
                            value={minStars}
                            onChange={setMinStars}
                          />
                          <FilterChipGroup
                            label="Active"
                            options={[
                              { value: "all", label: "ANY" },
                              { value: "7", label: "7d" },
                              { value: "14", label: "14d" },
                              { value: "30", label: "30d" },
                            ]}
                            value={activeDays}
                            onChange={setActiveDays}
                          />
                        </div>
                        <div className="flex flex-wrap gap-4">
                          <FilterChipGroup
                            label="Generic"
                            options={[
                              { value: "true", label: "SHOWING" },
                              { value: "false", label: "HIDDEN" },
                            ]}
                            value={showGeneric ? "true" : "false"}
                            onChange={(v) => startTransition(() => setShowGeneric(v === "true"))}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Rows */}
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center gap-4 py-20 text-center glass">
                  <svg
                    aria-hidden="true"
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ color: "var(--color-text-dim)" }}
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                    <path d="M8 11h6" />
                  </svg>
                  <p className="font-mono text-[10px] tracking-widest uppercase mb-2" style={{ color: "var(--color-text-dim)" }}>
                    No matches
                  </p>
                  <p className="text-sm max-w-md mx-auto leading-relaxed mb-4" style={{ color: "var(--color-text-muted)" }}>
                    Your filters are too restrictive — no projects match all criteria.
                  </p>
                  <p className="text-sm max-w-md mx-auto leading-relaxed mb-4" style={{ color: "var(--color-text-muted)" }}>
                    Try broadening your search, resetting filters, or checking a different genre.
                  </p>
                  <button
                    onClick={() => {
                      startTransition(() => {
                        setSearch("");
                        setLang("all");
                        setMinScore("all");
                        setMinStars("all");
                        setGenreFilter("all");
                        setShizukuFilter("all");
                        setActiveDays("all");
                        setSort("score");
                        setSortDir("desc");
                        setShowGeneric(true);
                      });
                    }}
                    className="font-mono text-[10px] tracking-wider px-3 py-1.5 border transition-colors hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
                    style={{ borderColor: "var(--color-accent-border)", color: "var(--color-accent)", backgroundColor: "var(--color-accent-dim)" }}
                  >
                    Reset all filters
                  </button>
                </div>
              ) : (() => {
                const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
                const clampedPage = Math.min(page, totalPages - 1);
                const visible = filtered.slice(clampedPage * PAGE_SIZE, clampedPage * PAGE_SIZE + PAGE_SIZE);
                return (
                  <>
                    {/* Title row — aligned to table columns */}
                    <div
                      className="glass hidden sm:flex items-center gap-3 px-4 min-h-[28px] text-[10px] font-mono tracking-[0.12em] uppercase"
                      style={{ color: "var(--color-text-dim)", opacity: 0.85, borderBottom: "1px solid var(--color-border)" }}
                    >
                      <span className="w-14 shrink-0">#</span>
                      <span className="flex-1 min-w-0">Project</span>
                      <span className="hidden lg:inline shrink-0 text-left" style={{ width: "5rem" }}>
                        Genre
                      </span>
                      <span className="shrink-0 flex items-center gap-2" style={{ width: "7.5rem" }}>
                        <span className="hidden md:block w-20" aria-hidden="true" />
                        <span className="w-9 text-right">Score</span>
                      </span>
                      <span className="hidden lg:inline w-16 text-right shrink-0">Updated</span>
                      <span className="hidden xl:inline w-14 text-center shrink-0">Target</span>
                      <span className="hidden sm:inline w-12 text-right shrink-0">Stars</span>
                      <span className="ml-2 w-[14px] shrink-0" aria-hidden="true" />
                    </div>
                    <div className="flex flex-col gap-2">
                      {visible.map((p, i) => (
                        <ArchiveRow
                          key={p.id}
                          project={p}
                          index={clampedPage * PAGE_SIZE + i}
                          genreMap={genreMap}
                        />
                      ))}
                    </div>
                    {totalPages > 1 && (
                      <div className="glass flex items-center justify-between mt-8 p-4">
                        <button
                          onClick={() => setPage((p) => Math.max(0, p - 1))}
                          disabled={clampedPage === 0}
                          aria-disabled={clampedPage === 0}
                          className="font-mono text-[10px] tracking-wider px-3 py-1.5 border disabled:opacity-40 transition-colors"
                          style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                        >
                          ← Prev
                        </button>
                        <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "var(--color-text-dim)" }}>
                          {clampedPage + 1} / {totalPages}
                        </span>
                        <button
                          onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                          disabled={clampedPage >= totalPages - 1}
                          aria-disabled={clampedPage >= totalPages - 1}
                          className="font-mono text-[10px] tracking-wider px-3 py-1.5 border disabled:opacity-40 transition-colors"
                          style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                        >
                          Next →
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
