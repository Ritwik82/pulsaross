// Unit tests for the pure scoring math. Runs under `node --test` with no
// browser, no build, no server — unlike scoring.spec.mjs (same assertions,
// Playwright) which is kept for the `npm test` suite.
//
//   node --test tests/scoring.unit.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
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

test("score weights sum to 1.0", () => {
  const total = Object.values(SCORE_WEIGHTS).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(total - 1) < 1e-9, `weights summed to ${total}`);
});

test("recency: pushed now scores ~1", () => {
  assert.ok(scoreRecency(daysAgo(0)) > 0.99);
});

test("recency: pushed 45 days ago scores 0.5", () => {
  assert.ok(Math.abs(scoreRecency(daysAgo(45)) - 0.5) < 0.01);
});

test("recency: pushed 120 days ago scores 0", () => {
  assert.equal(scoreRecency(daysAgo(120)), 0);
});

test("recency: future timestamp clamps to 1", () => {
  assert.equal(scoreRecency(daysAhead(5)), 1);
});

test("recency: missing or invalid timestamps score 0 (finite, never NaN)", () => {
  for (const bad of [null, undefined, "", "not-a-date"]) {
    const v = scoreRecency(bad);
    assert.ok(Number.isFinite(v), `${bad} produced ${v}`);
    assert.equal(v, 0);
  }
});

test("momentum: zero stars scores 0", () => {
  assert.equal(scoreMomentum(0, daysAgo(50)), 0);
});

test("momentum: 100 stars at 50 days scores ~0.77", () => {
  assert.ok(Math.abs(scoreMomentum(100, daysAgo(50)) - 0.77) < 0.05);
});

test("momentum: missing created_at scores 0 (finite, never NaN)", () => {
  const v = scoreMomentum(10, undefined);
  assert.ok(Number.isFinite(v));
  assert.equal(v, 0);
});

test("issue health: no issues scores 1.0", () => {
  assert.equal(scoreIssueHealth(0, 0), 1.0);
});

test("issue health: PRs are subtracted before bucketing (8 issues, 5 PRs -> 0.8)", () => {
  assert.equal(scoreIssueHealth(8, 5), 0.8);
});

test("issue health: missing fields treated as zero issues (1.0, never NaN)", () => {
  const v = scoreIssueHealth(null, undefined);
  assert.ok(Number.isFinite(v));
  assert.equal(v, 1.0);
});

test("issue health: 200 issues scores 0.2; 60 issues scores 0.4", () => {
  assert.equal(scoreIssueHealth(200, 0), 0.2);
  assert.equal(scoreIssueHealth(60, 0), 0.4);
});

test("contributors: 0 -> 0, 1 -> 0.05, 20 -> 1, 50 caps at 1", () => {
  assert.equal(normalizeContributorCount(0), 0);
  assert.ok(Math.abs(normalizeContributorCount(1) - 0.05) < 1e-9);
  assert.equal(normalizeContributorCount(20), 1);
  assert.equal(normalizeContributorCount(50), 1);
});

test("contributors: missing count normalizes to 0 (never NaN)", () => {
  for (const bad of [null, undefined]) {
    const v = normalizeContributorCount(bad);
    assert.ok(Number.isFinite(v), `${bad} produced ${v}`);
    assert.equal(v, 0);
  }
});

test("archived-like repo (pushed 400 days ago): recency 0, abandonment risk 1", () => {
  assert.equal(scoreRecency(daysAgo(400)), 0);
  assert.equal(computeAbandonmentRisk(daysAgo(400)), 1);
});

test("fresh repo (pushed 5 days ago): abandonment risk 0", () => {
  assert.equal(computeAbandonmentRisk(daysAgo(5)), 0);
});

test("abandonment: future timestamp is 0 risk; missing timestamp is full risk", () => {
  assert.equal(computeAbandonmentRisk(daysAhead(30)), 0);
  assert.equal(computeAbandonmentRisk(null), 1);
});

test("composite: hand-computed weighted sum locks the weights", () => {
  // 0.24*1 + 0.20*0.5 + 0.16*0.8 + 0.08*1 + 0.12*0.5 + 0.20*1 = 0.808
  assert.equal(
    computeCompositeScore({
      recency: 1,
      momentum: 0.5,
      issue_health: 0.8,
      license: 1,
      contributors: 0.5,
      abandonment_risk: 1,
    }),
    0.808
  );
});

test("composite: missing fields default to 0; extra keys (e.g. forks) are ignored", () => {
  assert.equal(computeCompositeScore({}), 0);
  assert.equal(computeCompositeScore({ recency: 1, forks: 0 }), 0.24);
});

test("composite: NaN inputs sanitize to 0 instead of poisoning the score", () => {
  const v = computeCompositeScore({
    recency: NaN,
    momentum: NaN,
    issue_health: NaN,
    license: NaN,
    contributors: NaN,
    abandonment_risk: NaN,
  });
  assert.ok(Number.isFinite(v));
  assert.equal(v, 0);
});

// ─── buildScoreBreakdown: the guard inversion ───────────────────────────────
// The breakdown stores the GUARD (1 - raw risk) so every signal contributes
// positively. abandonment_risk carries the largest weight in the model (0.20),
// so inverting it by mistake would ADD 0.20 to every abandoned repo instead of
// subtracting it — a 20-point swing that silently ranks dead projects up.

test("breakdown: dead repo stores the GUARD, not raw risk (0.20 swing locked)", () => {
  const { breakdown } = buildScoreBreakdown({
    pushed_at: daysAgo(400),
    stars: 500,
    created_at: daysAgo(500),
    open_issues_count: 0,
    open_prs: 0,
    license: 1,
    contributor_count: 20,
  });
  assert.equal(computeAbandonmentRisk(daysAgo(400)), 1);
  assert.equal(breakdown.abandonment_risk, 0);
});

test("breakdown: healthy repo stores a full guard (1 - 0 risk)", () => {
  const { breakdown } = buildScoreBreakdown({
    pushed_at: daysAgo(1),
    stars: 500,
    created_at: daysAgo(500),
    open_issues_count: 0,
    open_prs: 0,
    license: 1,
    contributor_count: 20,
  });
  assert.equal(computeAbandonmentRisk(daysAgo(1)), 0);
  assert.equal(breakdown.abandonment_risk, 1);
});

test("breakdown: an abandoned repo must score LOWER than an active one", () => {
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
  assert.ok(abandoned.score < active.score, `abandoned ${abandoned.score} !< active ${active.score}`);
});

test("breakdown: score always equals the composite of its own breakdown", () => {
  const { breakdown, score } = buildScoreBreakdown({
    pushed_at: daysAgo(45),
    stars: 100,
    created_at: daysAgo(200),
    open_issues_count: 8,
    open_prs: 5,
    license: 1,
    contributor_count: 6,
  });
  assert.equal(score, computeCompositeScore(breakdown));
});

test("breakdown: all six keys present, matching the weight table", () => {
  const { breakdown } = buildScoreBreakdown({
    pushed_at: daysAgo(10),
    stars: 10,
    created_at: daysAgo(100),
    open_issues_count: 0,
    open_prs: 0,
    license: 0,
    contributor_count: 0,
  });
  assert.deepEqual(Object.keys(breakdown).sort(), Object.keys(SCORE_WEIGHTS).sort());
});

test("breakdown: every signal stays in [0,1] so no key can exceed full marks", () => {
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
    assert.ok(v >= 0, `${k} = ${v} below 0`);
    assert.ok(v <= 1, `${k} = ${v} above 1`);
  }
});

test("breakdown: fully dead repo with no metadata still scores finite, never NaN", () => {
  const { breakdown, score } = buildScoreBreakdown({});
  assert.ok(Number.isFinite(score));
  assert.ok(score >= 0);
  assert.equal(breakdown.abandonment_risk, 0);
});

test("breakdown: PR subtraction and contributor cap survive the assembly path", () => {
  const { breakdown } = buildScoreBreakdown({
    pushed_at: daysAgo(5),
    stars: 10,
    created_at: daysAgo(50),
    open_issues_count: 8,
    open_prs: 5,
    license: 1,
    contributor_count: 50,
  });
  assert.equal(breakdown.issue_health, 0.8);
  assert.equal(breakdown.contributors, 1);
});
