<p align="center">
  <a href="https://pulsaross.vercel.app">
    <img src="public/icon.svg" width="72" height="72" alt="PulsarOss — wave logo from top-left header" />
  </a>
</p>

<h1 align="center">PulsarOss</h1>

<p align="center">
  Tired of installing a great FOSS app only to find it was abandoned a year ago?<br/>
  This checks that <em>before</em> you install — and keeps an eye on the apps you already use.
</p>

<p align="center">
  <a href="https://pulsaross.vercel.app"><img src="https://img.shields.io/badge/Live-pulsaross.vercel.app-14deb5?style=flat-square" alt="Live" /></a>
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square" alt="Next.js" />
  <img src="https://img.shields.io/badge/Tailwind-38bdf8?style=flat-square" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Vercel-Hobby-000?style=flat-square" alt="Vercel" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="MIT" />
</p>

<p align="center">
  <a href="https://pulsaross.vercel.app"><strong>pulsaross.vercel.app →</strong></a>
</p>

---

## ✨ What it is

### 📋 Your Watchlist
The apps **you** actually use, checked for:
- 🕒 Staleness — how long since the last push or release
- 🔄 Updates — is there a newer release than your installed version
- ⚠️ Abandonment risk — will this likely go stale soon

### 🌱 Fresh Finds — <em>New & actively maintained</em>
Open-source Android projects launched in the last 9 months:
- ✨ Shizuku customization and utility apps
- 🛠️ Everyday FOSS tools (Termux, media, system utilities)
- 🎛️ Filterable by genre, access, and risk

---

## 📊 Scoring — transparent, not a black box

Each project gets a composite score from **6 mechanical signals**:

| Signal | Weight | Source |
|--------|--------|--------|
| ⏱️ Recency (days since last push) | 24% | GitHub `pushed_at` |
| 📈 Momentum (stars ÷ repo age) | 20% | `stargazers_count` + `created_at` |
| 💬 Issue health (open issues minus open PRs) | 16% | GitHub Issues + Search API |
| 📄 License presence | 8% | `license` field |
| 👥 Contributor count (capped at 20) | 12% | Contributors API |
| 🚨 Abandonment risk | 20% | Days since push + issue response |

Three flags: 🏷️ **Genre**, 🔌 **Shizuku**, 🧩 **Generic** (common ideas need extra proof to surface).

---

## 👤 Watchlist source

Empty by default — you build it in the browser with Track buttons or an Obtainium import. Nothing personal ships in the repo.

<details>
<summary>🧑‍💻 For contributors — run locally</summary>

```bash
npm install
npm run dev
# → http://localhost:3000
```

Data refresh (every 12h via GitHub Action):

```bash
GITHUB_TOKEN=your_token node scripts/refresh-data.mjs
```

Deploy: `vercel deploy` or push to GitHub — Vercel auto-deploys.

Tech: Next.js (App Router) + Tailwind + Framer Motion + Vercel Hobby + GitHub REST API

</details>

---

<p align="center">
  <sub>Built by <a href="https://github.com/Ritwik82">Ritwik</a> • <a href="https://github.com/Ritwik82/pulsaross">View on GitHub</a> • Scores are automated health signals, not endorsements</sub>
</p>
