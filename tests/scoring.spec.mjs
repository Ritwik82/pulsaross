import { test, expect } from "@playwright/test";
import {
  SCORE_WEIGHTS,
  scoreRecency,
  scoreMomentum,
  scoreIssueHealth,
  normalizeContributorCount,
  computeAbandonmentRisk,
  computeCompositeScore,
  buildScoreBreakdown,
} from "../scripts/scoring.mjs";

const DAY_MS = 86_400_000;
const daysAgo = (n) => new Date(Date.now() - n * DAY_MS).toISOString();
const daysAhead = (n) => new Date(Date.now() + n * DAY_MS).toISOString();

test("score weights sum to 1.0", async () => {
  const total = Object.values(SCORE_WEIGHTS).reduce((a, b) => a + b, 0);
  expect(total).toBeCloseTo(1, 9);
});

test("recency: pushed now scores ~1", async () => {
  expect(scoreRecency(daysAgo(0))).toBeGreaterThan(0.99);
});

test("recency: pushed 45 days ago scores 0.5", async () => {
  expect(scoreRecency(daysAgo(45))).toBeCloseTo(0.5, 2);
});

test("recency: pushed 120 days ago scores 0", async () => {
  expect(scoreRecency(daysAgo(120))).toBe(0);
});

test("recency: future timestamp clamps to 1", async () => {
  expect(scoreRecency(daysAhead(5))).toBe(1);
});

test("recency: missing or invalid timestamps score 0 (finite, never NaN)", async () => {
  for (const bad of [null, undefined, "", "not-a-date"]) {
    const v = scoreRecency(bad);
    expect(Number.isFinite(v)).toBe(true);
    expect(v).toBe(0);
  }
});

test("momentum: zero stars scores 0", async () => {
  expect(scoreMomentum(0, daysAgo(50))).toBe(0);
});

test("momentum: 100 stars at 50 days scores ~0.77", async () => {
  expect(scoreMomentum(100, daysAgo(50))).toBeCloseTo(0.77, 1);
});

test("momentum: missing created_at scores 0 (finite, never NaN)", async () => {
  const v = scoreMomentum(10, undefined);
  expect(Number.isFinite(v)).toBe(true);
  expect(v).toBe(0);
});

test("issue health: no issues scores 1.0", async () => {
  expect(scoreIssueHealth(0, 0)).toBe(1.0);
});

test("issue health: PRs are subtracted before bucketing (8 issues, 5 PRs -> 0.8)", async () => {
  expect(scoreIssueHealth(8, 5)).toBe(0.8);
});

test("issue health: missing fields treated as zero issues (1.0, never NaN)", async () => {
  const v = scoreIssueHealth(null, undefined);
  expect(Number.isFinite(v)).toBe(true);
  expect(v).toBe(1.0);
});

test("issue health: 200 issues scores 0.2; 60 issues scores 0.4", async () => {
  expect(scoreIssueHealth(200, 0)).toBe(0.2);
  expect(scoreIssueHealth(60, 0)).toBe(0.4);
});

test("contributors: 0 -> 0, 1 -> 0.05, 20 -> 1, 50 caps at 1", async () => {
  expect(normalizeContributorCount(0)).toBe(0);
  expect(normalizeContributorCount(1)).toBeCloseTo(0.05, 9);
  expect(normalizeContributorCount(20)).toBe(1);
  expect(normalizeContributorCount(50)).toBe(1);
});

test("contributors: missing count normalizes to 0 (never NaN)", async () => {
  for (const bad of [null, undefined]) {
    const v = normalizeContributorCount(bad);
    expect(Number.isFinite(v)).toBe(true);
    expect(v).toBe(0);
  }
});

test("archived-like repo (pushed 400 days ago): recency 0, abandonment risk 1", async () => {
  expect(scoreRecency(daysAgo(400))).toBe(0);
  expect(computeAbandonmentRisk(daysAgo(400))).toBe(1);
});

test("fresh repo (pushed 5 days ago): abandonment risk 0", async () => {
  expect(computeAbandonmentRisk(daysAgo(5))).toBe(0);
});

test("abandonment: future timestamp is 0 risk; missing timestamp is full risk", async () => {
  expect(computeAbandonmentRisk(daysAhead(30))).toBe(0);
  expect(computeAbandonmentRisk(null)).toBe(1);
});

test("composite: hand-computed weighted sum locks the weights", async () => {
  // 0.24*1 + 0.20*0.5 + 0.16*0.8 + 0.08*1 + 0.12*0.5 + 0.20*1 = 0.808
  expect(
    computeCompositeScore({
      recency: 1,
      momentum: 0.5,
      issue_health: 0.8,
      license: 1,
      contributors: 0.5,
      abandonment_risk: 1,
    })
  ).toBe(0.808);
});

test("composite: missing fields default to 0; extra keys (e.g. forks) are ignored", async () => {
  expect(computeCompositeScore({})).toBe(0);
  expect(computeCompositeScore({ recency: 1, forks: 0 })).toBe(0.24);
});

test("composite: NaN inputs sanitize to 0 instead of poisoning the score", async () => {
  const v = computeCompositeScore({
    recency: NaN,
    momentum: NaN,
    issue_health: NaN,
    license: NaN,
    contributors: NaN,
    abandonment_risk: NaN,
  });
  expect(Number.isFinite(v)).toBe(true);
  expect(v).toBe(0);
});

// ─── buildScoreBreakdown: the guard inversion ───────────────────────────────
// The breakdown stores the GUARD (1 - raw risk) so every signal contributes
// positively. abandonment_risk carries the largest weight in the model (0.20),
// so inverting it by mistake would add 0.20 to every abandoned repo instead
// of subtracting it — a 20-point swing that silently ranks dead projects up.
// These tests exist to make that inversion impossible to break unnoticed.

test("breakdown: dead repo stores the GUARD, not raw risk (0.20 swing locked)", async () => {
  const { breakdown } = buildScoreBreakdown({
    pushed_at: daysAgo(400),
    stars: 500,
    created_at: daysAgo(500),
    open_issues_count: 0,
    open_prs: 0,
    license: 1,
    contributor_count: 20,
  });
  // Raw risk is 1 (fully abandoned) => guard must be 0.
  expect(computeAbandonmentRisk(daysAgo(400))).toBe(1);
  expect(breakdown.abandonment_risk).toBe(0);
});

test("breakdown: healthy repo stores a full guard (1 - 0 risk)", async () => {
  const { breakdown } = buildScoreBreakdown({
    pushed_at: daysAgo(1),
    stars: 500,
    created_at: daysAgo(500),
    open_issues_count: 0,
    open_prs: 0,
    license: 1,
    contributor_count: 20,
  });
  expect(computeAbandonmentRisk(daysAgo(1))).toBe(0);
  expect(breakdown.abandonment_risk).toBe(1);
});

test("breakdown: an abandoned repo must score LOWER than an active one", async () => {
  const active = buildScoreBreakdown({
    pushed_at: daysAgo(2),
    stars: 500,
    created_at: daysAgo(500),
    open_issues_count: 0,
    open_prs: 0,
    license: 1,
    contributor_count: 20,
  });
  const abandoned = buildScoreBreakdown({
    pushed_at: daysAgo(400),
    stars: 500,
    created_at: daysAgo(500),
    open_issues_count: 0,
    open_prs: 0,
    license: 1,
    contributor_count: 20,
  });
  expect(abandoned.score).toBeLessThan(active.score);
});

test("breakdown: score always equals the composite of its own breakdown", async () => {
  const { breakdown, score } = buildScoreBreakdown({
    pushed_at: daysAgo(45),
    stars: 100,
    created_at: daysAgo(200),
    open_issues_count: 8,
    open_prs: 5,
    license: 1,
    contributor_count: 6,
  });
  expect(score).toBe(computeCompositeScore(breakdown));
});

test("breakdown: all six keys present, matching the weight table", async () => {
  const { breakdown } = buildScoreBreakdown({
    pushed_at: daysAgo(10),
    stars: 10,
    created_at: daysAgo(100),
    open_issues_count: 0,
    open_prs: 0,
    license: 0,
    contributor_count: 0,
  });
  expect(Object.keys(breakdown).sort()).toEqual(Object.keys(SCORE_WEIGHTS).sort());
});

test("breakdown: every signal stays in [0,1] so no key can exceed full marks", async () => {
  const { breakdown } = buildScoreBreakdown({
    pushed_at: daysAgo(0),
    stars: 1_000_000,
    created_at: daysAgo(0),
    open_issues_count: 0,
    open_prs: 0,
    license: 1,
    contributor_count: 5_000,
  });
  for (const [k, v] of Object.entries(breakdown)) {
    expect(v, `${k} out of range`).toBeGreaterThanOrEqual(0);
    expect(v, `${k} out of range`).toBeLessThanOrEqual(1);
  }
});

test("breakdown: fully dead repo with no metadata still scores finite, never NaN", async () => {
  const { breakdown, score } = buildScoreBreakdown({});
  expect(Number.isFinite(score)).toBe(true);
  expect(score).toBeGreaterThanOrEqual(0);
  expect(breakdown.abandonment_risk).toBe(0);
});

test("breakdown: PR subtraction and contributor cap survive the assembly path", async () => {
  const { breakdown } = buildScoreBreakdown({
    pushed_at: daysAgo(5),
    stars: 10,
    created_at: daysAgo(50),
    open_issues_count: 8,
    open_prs: 5,
    license: 1,
    contributor_count: 50,
  });
  // 8 issues - 5 PRs = 3 => 0.8 bucket
  expect(breakdown.issue_health).toBe(0.8);
  // 50 contributors caps at 20 => 1.0
  expect(breakdown.contributors).toBe(1);
});
