// Pure scoring math for Pulsaross — single source of truth.
// Extracted from scripts/refresh-data.mjs (which imports from here).
// Test-locked by tests/scoring.spec.mjs: do not change weights or thresholds
// without updating the spec first (red → green).
//
// Weights: recency 0.24, momentum 0.20, issue_health 0.16, license 0.08,
// contributors 0.12, abandonment_risk 0.20 (sums to 1.0).
// In score_breakdown, abandonment_risk stores the GUARD (1 − raw risk) so all
// six signals contribute positively to the composite.

// Assemble a score_breakdown from raw signal inputs and the composite it
// yields. The guard inversion lives here, not at the call site, so the
// highest-weight signal in the model (abandonment_risk, 0.20) is covered by
// the test suite instead of being a one-token typo away from inverting every
// dead repo's score. `raw` is the risk curve's output; the guard is stored.
export function buildScoreBreakdown(signals) {
  const s = signals ?? {};
  const abandonmentRisk = computeAbandonmentRisk(s.pushed_at);
  const breakdown = {
    recency: scoreRecency(s.pushed_at),
    momentum: scoreMomentum(s.stars, s.created_at),
    issue_health: scoreIssueHealth(s.open_issues_count, s.open_prs),
    license: s.license ?? 0,
    contributors: normalizeContributorCount(s.contributor_count),
    abandonment_risk: 1 - abandonmentRisk,
  };
  return { breakdown, score: computeCompositeScore(breakdown) };
}

export const SCORE_WEIGHTS = { recency: 0.24, momentum: 0.20, issue_health: 0.16, license: 0.08, contributors: 0.12, abandonment_risk: 0.20 };

function clamp(v, min = 0, max = 1) {
  return Math.max(min, Math.min(max, v));
}

export function daysSince(iso) {
  return (Date.now() - new Date(iso).getTime()) / 86_400_000;
}

function finiteTime(iso) {
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t : null;
}

export function scoreRecency(pushedAt) {
  const t = finiteTime(pushedAt);
  if (t === null) return 0;
  const days = (Date.now() - t) / 86_400_000;
  return clamp(1 - days / 90);
}

// Absolute reference curve, not run-relative: 10 stars/day sustained is full
// marks. A 100-star 50-day repo scores log10(101)/log10(501) ≈ 0.77, a
// 10-star 50-day repo log10(11)/log10(501) ≈ 0.40 — young repos discriminate.
export function scoreMomentum(stars, createdAt) {
  const t = finiteTime(createdAt);
  if (t === null) return 0;
  const age = Math.max((Date.now() - t) / 86_400_000, 1);
  const s = Number.isFinite(Number(stars)) ? Number(stars) : 0;
  return clamp(Math.log10(1 + s) / Math.log10(1 + 10 * age));
}

// Proxy: open_issues_count includes open PRs, so subtract them — otherwise a
// PR-active repo reads as issue-burdened (8 issues + 5 PRs = 13 → 0.6 instead
// of 0.8). PR count comes from one search call (total_count), no pagination.
export function scoreIssueHealth(openIssues, openPRs) {
  const issues = Math.max(0, (openIssues ?? 0) - (openPRs ?? 0));
  if (issues === 0) return 1.0;
  if (issues < 10) return 0.8;
  if (issues < 50) return 0.6;
  if (issues < 100) return 0.4;
  return 0.2;
}

// Pure count → normalized mapping used by scoreContributors (which stays in
// refresh-data.mjs because it needs the network). Cap: 20 contributors is
// full marks.
export function normalizeContributorCount(count) {
  const n = Number.isFinite(Number(count)) ? Number(count) : 0;
  return clamp(Math.min(Math.max(n, 0), 20) / 20);
}

export function computeAbandonmentRisk(pushedAt) {
  const t = finiteTime(pushedAt);
  if (t === null) return 1;
  const days = (Date.now() - t) / 86_400_000;
  if (days < 14) return 0;
  if (days < 90) return (days - 14) / 76;
  return 1;
}

// Weighted composite of a score_breakdown. Missing or non-finite signals
// count as 0 so one bad field can never poison the whole score to NaN.
export function computeCompositeScore(breakdown) {
  const b = breakdown ?? {};
  return parseFloat(
    Object.entries(SCORE_WEIGHTS)
      .reduce((sum, [k, w]) => sum + (Number.isFinite(b[k]) ? b[k] : 0) * w, 0)
      .toFixed(3)
  );
}
