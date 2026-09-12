export interface HealthSignal {
  id: string;
  name: string;
  weight: string;
  dotClass: string;
  description: string;
  formula: string;
  source: string;
  why: string;
}

export const signals: HealthSignal[] = [
  {
    id: "S-01",
    name: "Recency",
    weight: "0.24",
    dotClass: "signal-dot-green",
    description:
      "Days since the last push, decaying to zero over a 90-day window. Fresh activity signals a living project.",
    formula: "recency = 1 − days_since_push / 90, clamped [0, 1]",
    source: "GitHub `pushed_at`",
    why: "Stale code is the #1 failure on Android. Anything under 14 days counts as fresh; 90 days of silence reads as gone.",
  },
  {
    id: "S-02",
    name: "Momentum",
    weight: "0.20",
    dotClass: "signal-dot-blue",
    description:
      "Star velocity relative to repo age — rewards sustained growth over flash-in-the-pan spikes. Absolute reference scale, not run-relative.",
    formula: "momentum = ln(1 + stars) / ln(1 + 10 × age_days), clamped [0, 1] (10 stars/day = full marks)",
    source: "GitHub repo `stargazers_count` + `created_at`",
    why: "A busy community keeps a project honest. An absolute curve means a quiet week in the whole catalog can't inflate every repo's score.",
  },
  {
    id: "S-03",
    name: "Issue Health",
    weight: "0.16",
    dotClass: "signal-dot-purple",
    description:
      "Open-issue load as a maintenance proxy, with open pull requests excluded — GitHub counts PRs as issues, which would punish PR-active repos.",
    formula: "issue_health = steps(open_issues − open_prs): 0 → 1.0 · <10 → 0.8 · <50 → 0.6 · <100 → 0.4 · else 0.2",
    source: "GitHub `open_issues_count` − open-PR search count",
    why: "Repos with <10 recent issues default to 0.8 to avoid punishing new or quiet repos; excluding PRs stops healthy review traffic from reading as a bug backlog.",
  },
  {
    id: "S-04",
    name: "Contributors",
    weight: "0.12",
    dotClass: "signal-dot-orange",
    description:
      "More contributors means a healthier, bus-factor-resistant community. Capped at 20 for scoring.",
    formula: "contributors = min(count, 20) / 20",
    source: "GitHub Contributors API",
    why: "One-maintainer projects are one bad week away from abandonment; the cap stops 200-contributor mega-repos from walloping the scale.",
  },
  {
    id: "S-05",
    name: "License",
    weight: "0.08",
    dotClass: "signal-dot-purple",
    description:
      "Whether the project declares an open-source license. Legal clarity matters for actually using the code.",
    formula: "license = 1 if SPDX present, else 0",
    source: "GitHub `license` field",
    why: "No license = can't legally use or redistribute the app. Small weight because it's binary, but it's a hard gate to trust.",
  },
  {
    id: "S-06",
    name: "Abandonment Risk ↓",
    weight: "0.20",
    dotClass: "signal-dot-red",
    description:
      "Inverted: starts costing points once a repo sits idle past 14 days, fully consumed by day 90. Your time is the resource this signal protects — stale apps don't get to ride on momentum.",
    formula: "risk = 0 (<14d) ramping to 1 (≥90d) · score uses (1 − risk)",
    source: "GitHub `pushed_at` timestamp",
    why: "Warns within 14 days but isn't a false-positive on normal release cadence (<7d would cry wolf); 90 days is the loss limit.",
  },
];
