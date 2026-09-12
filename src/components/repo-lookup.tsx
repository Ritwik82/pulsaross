"use client";

import { useState, useCallback, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  toggleLocalWatchlist,
  useLocalWatchlist,
} from "@/lib/local-watchlist";
import type { GenreId } from "@/lib/data";
import { daysSince } from "@/lib/utils";

const TOKEN_KEY = "pulsaross-github-token";

function subscribeToken(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function readToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(TOKEN_KEY) ?? "";
}

function writeToken(t: string) {
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
}

function parseOwnerRepo(input: string): { owner: string; repo: string } | null {
  const trimmed = input.trim().replace(/^https?:\/\/github\.com\//, "").replace(/\/$/, "");
  const parts = trimmed.split("/");
  if (parts.length === 2 && parts[0] && parts[1]) {
    return { owner: parts[0], repo: parts[1] };
  }
  return null;
}

interface RepoInfo {
  full_name: string;
  description: string | null;
  stargazers_count: number;
  language: string | null;
  pushed_at: string;
  archived: boolean;
  license: { spdx_id: string } | null;
  open_issues_count: number;
  forks_count: number;
  html_url: string;
  default_branch: string;
}

interface CatalogMatch {
  id: string;
  name: string;
  score: number;
  genre: GenreId;
}

function healthScore(r: RepoInfo): number {
  const d = daysSince(r.pushed_at) ?? 9999;
  const recency = d <= 7 ? 1 : d <= 30 ? 0.8 : d <= 90 ? 0.6 : d <= 180 ? 0.4 : d <= 270 ? 0.2 : 0.05;
  const stars = Math.min(r.stargazers_count / 5000, 1);
  const issues = r.open_issues_count === 0 ? 1 : Math.max(0, 1 - r.open_issues_count / 200);
  const license = r.license ? 1 : 0.4;
  const archived = r.archived ? 0 : 1;
  return Math.round((recency * 0.3 + stars * 0.2 + issues * 0.2 + license * 0.15 + archived * 0.15) * 100) / 100;
}

function healthLabel(score: number): { label: string; color: string } {
  if (score >= 0.7) return { label: "Active & Maintained", color: "var(--color-signal-green)" };
  if (score >= 0.4) return { label: "Moderate Activity", color: "var(--color-signal-amber)" };
  return { label: "Low / At Risk", color: "var(--color-signal-red)" };
}

export function RepoLookup() {
  const [input, setInput] = useState("");
  const savedToken = useSyncExternalStore(subscribeToken, readToken, () => "");
  const [tokenInput, setTokenInput] = useState<string | null>(null);
  const currentToken = tokenInput ?? savedToken;
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [repo, setRepo] = useState<RepoInfo | null>(null);
  const [catalogMatch, setCatalogMatch] = useState<CatalogMatch | null>(null);
  const local = useLocalWatchlist();
  const tracked = repo ? local.some((l) => l.repo === repo.full_name || l.id === repo.full_name) : false;

  const lookup = useCallback(async () => {
    const parsed = parseOwnerRepo(input);
    if (!parsed) {
      setError("Enter owner/repo or a GitHub URL");
      return;
    }
    setError(null);
    setLoading(true);
    setRepo(null);
    setCatalogMatch(null);
    try {
      const token = currentToken.trim();
      writeToken(token);
      const headers: Record<string, string> = { Accept: "application/vnd.github.v3+json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`, { headers });
      if (!res.ok) {
        if (res.status === 404) throw new Error("Repo not found");
        if (res.status === 403) {
          setShowToken(true);
          throw new Error("Rate limit exceeded (60 req/hr). Enter a GitHub PAT below to boost to 5,000 req/hr.");
        }
        throw new Error(`GitHub ${res.status}`);
      }
      const repoData: RepoInfo = await res.json();
      setRepo(repoData);

      // Cross-reference with canonical catalog for score consistency
      try {
        const [o, r] = repoData.full_name.split("/");
        if (o && r) {
          const catRes = await fetch(`/api/score/${encodeURIComponent(o)}/${encodeURIComponent(r)}`);
          if (catRes.ok) {
            const p = await catRes.json();
            const projectData = p.data ?? p;
            if (projectData && typeof projectData.score === "number") {
              setCatalogMatch({
                id: projectData.id,
                name: projectData.name,
                score: projectData.score,
                genre: projectData.genre ?? "other",
              });
            }
          }
        }
      } catch {
        // Silently fallback to ad-hoc estimate
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Lookup failed");
    } finally {
      setLoading(false);
    }
  }, [input, currentToken]);

  const toggleTrack = () => {
    if (!repo) return;
    toggleLocalWatchlist({
      id: catalogMatch?.id ?? repo.full_name,
      name: catalogMatch?.name ?? repo.full_name.split("/")[1],
      repo: repo.full_name,
      genre: catalogMatch?.genre ?? "other",
      source: "local",
    });
  };

  const finalScore = catalogMatch ? catalogMatch.score : repo ? healthScore(repo) : 0;
  const health = repo ? healthLabel(finalScore) : null;

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-3">
        <span className="font-mono text-xs text-[var(--color-accent)] font-bold">{">_"}</span>
        <h3
          className="text-sm font-semibold tracking-tight text-[var(--color-text)]"
        >
          Scan Any GitHub Repository
        </h3>
      </div>

      <div className="glass p-5 rounded-xl border border-[var(--color-border)]" style={{ boxShadow: "var(--card-shadow)" }}>
        {/* Input row */}
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && lookup()}
            placeholder="owner/repo or GitHub URL (e.g. obtainium-app/Obtainium)"
            className="flex-1 rounded-lg border px-3.5 py-2 font-mono text-xs outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-accent)]/60 transition-colors"
            style={{
              borderColor: "var(--color-border)",
              backgroundColor: "var(--color-bg)",
              color: "var(--color-text)",
            }}
          />
          <button
            onClick={lookup}
            disabled={loading || !input.trim()}
            className="font-mono text-[11px] tracking-wider font-semibold uppercase px-5 py-2 rounded-lg border transition-all hover:opacity-90 active:scale-[0.97] disabled:opacity-40 shadow-sm"
            style={{
              color: "var(--color-accent)",
              borderColor: "var(--color-accent-border)",
              backgroundColor: "var(--color-accent-dim)",
            }}
          >
            {loading ? "Scanning..." : "Check"}
          </button>
        </div>

        {/* Token toggle */}
        <button
          onClick={() => setShowToken(!showToken)}
          className="font-mono text-[9px] tracking-wider uppercase mb-2 transition-colors"
          style={{ color: "var(--color-text-dim)" }}
        >
          {showToken ? "▾ Hide" : "▸ Add"} GitHub PAT (optional, boosts to 5k req/hr)
        </button>

        {showToken && (
          <div className="mb-2 space-y-1.5">
            <input
              type="password"
              value={currentToken}
              onChange={(e) => {
                setTokenInput(e.target.value);
                writeToken(e.target.value);
              }}
              placeholder="Paste GitHub PAT (e.g. ghp_xxxxxxxxxxxx or github_pat_xxxx)"
              className="w-full border px-3 py-1.5 font-mono text-[11px] outline-none focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
              style={{
                borderColor: "var(--color-border)",
                backgroundColor: "var(--color-bg)",
                color: "var(--color-text)",
              }}
            />
            <p className="font-mono text-[9px]" style={{ color: "var(--color-text-dim)" }}>
              Stored locally in your browser only. Needs 0 permissions (public read).{" "}
              <a
                href="https://github.com/settings/tokens/new?description=PulsarOSS-Readonly&scopes="
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-[var(--color-accent)]"
              >
                Generate token on GitHub ↗
              </a>
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="font-mono text-[10px] mt-2" style={{ color: "var(--color-signal-red)" }}>
            {error}
          </p>
        )}

        {/* Result */}
        {repo && health && (
          <div className="mt-4 border-t pt-4" style={{ borderColor: "var(--color-ruled)" }}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-mono text-[10px] tracking-wider" style={{ color: "var(--color-text-dim)" }}>
                    {repo.full_name}
                  </p>
                  {catalogMatch && (
                    <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-emerald-950/60 border border-emerald-700/60 text-emerald-400">
                      ✓ Catalog Specimen
                    </span>
                  )}
                </div>
                <p className="font-mono text-sm font-bold truncate" style={{ color: "var(--color-text)" }}>
                  {repo.description || "No description"}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-bold font-mono accent-text">{(finalScore * 10).toFixed(1)}</p>
                <p className="font-mono text-[9px] tracking-wider" style={{ color: health.color }}>
                  {health.label}
                </p>
                <p className="font-mono text-[8px] text-[var(--color-text-dim)] mt-0.5">
                  {catalogMatch ? "6-Signal Catalog Engine" : "Quick 5-factor estimate"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono mb-3" style={{ color: "var(--color-text-dim)" }}>
              {repo.language && <span>● {repo.language}</span>}
              <span>★ {repo.stargazers_count.toLocaleString()}</span>
              <span>{daysSince(repo.pushed_at) ?? 0}d ago</span>
              {repo.archived && <span style={{ color: "var(--color-signal-red)" }}>ARCHIVED</span>}
              {repo.license && <span>{repo.license.spdx_id}</span>}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={toggleTrack}
                className="font-mono text-[10px] tracking-widest uppercase px-3 py-1.5 border transition-colors hover:opacity-80"
                style={{
                  color: tracked ? "var(--color-signal-green)" : "var(--color-accent)",
                  borderColor: tracked ? "var(--color-signal-green)" : "var(--color-accent-border)",
                  backgroundColor: tracked ? "transparent" : "var(--color-accent-dim)",
                }}
              >
                {tracked ? "TRACKED" : "TRACK"}
              </button>
              {catalogMatch && (
                <Link
                  href={`/project/${catalogMatch.id}`}
                  className="font-mono text-[10px] tracking-widest uppercase px-3 py-1.5 border transition-colors hover:opacity-80 rounded"
                  style={{
                    color: "var(--color-accent)",
                    borderColor: "var(--color-accent-border)",
                    backgroundColor: "var(--color-accent-dim)",
                  }}
                >
                  Diagnostic Dossier →
                </Link>
              )}
              <a
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[10px] tracking-widest uppercase px-3 py-1.5 border transition-colors hover:opacity-80"
                style={{
                  color: "var(--color-text-dim)",
                  borderColor: "var(--color-border)",
                }}
              >
                GitHub ↗
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
