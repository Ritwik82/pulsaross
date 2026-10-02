import { NextResponse } from "next/server";
import { getProjects } from "@/lib/data";
import { logger } from "@/lib/logger";

// ponytail: same per-instance token bucket as /api/score and /api/badge. Resets on deploy. Upgrade to KV/Redis if abuse observed.
const buckets = new Map<string, { count: number; reset: number }>();
const WINDOW_MS = 60_000;
const MAX_REQ = 30;
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  if (buckets.size > 500) {
    for (const [key, val] of buckets) {
      if (now > val.reset) buckets.delete(key);
    }
  }
  const b = buckets.get(ip);
  if (!b || now > b.reset) {
    buckets.set(ip, { count: 1, reset: now + WINDOW_MS });
    return false;
  }
  if (b.count >= MAX_REQ) return true;
  b.count++;
  return false;
}

// Bounds the attacker-controlled `repos` query value before split/filter.
const MAX_REPOS_PARAM_LENGTH = 4000;
const MAX_REPOS_FILTER = 100;

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(request: Request) {
  const ip = request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    logger.warn("feed rate limited", {});
    return new NextResponse("rate limited", {
      status: 429,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        // no-store, never public: a shared cache would replay this 429 to
        // every visitor for 60s, not just the throttled IP.
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Retry-After": "60",
      },
    });
  }
  const { searchParams } = new URL(request.url);
  const reposParam = searchParams.get("repos");
  if (reposParam && reposParam.length > MAX_REPOS_PARAM_LENGTH) {
    return new NextResponse("invalid repos parameter", {
      status: 400,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        // Deterministic rejection, trivial to recompute — caching buys nothing.
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }
  let data;
  try {
    data = getProjects();
  } catch (e) {
    logger.error("feed data load failed", { message: e instanceof Error ? e.message : String(e) });
    return new NextResponse("internal error", {
      status: 500,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        // no-store: caching a 500 would spread one incident to every visitor.
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  let targetProjects = data.projects;

  if (reposParam) {
    const list = reposParam.split(",").map((r) => r.trim().toLowerCase()).filter(Boolean).slice(0, MAX_REPOS_FILTER);
    targetProjects = data.projects.filter(
      (p) => list.includes(p.id.toLowerCase()) || list.includes(`${p.owner}/${p.name}`.toLowerCase())
    );
  }

  // Sort by recent release date or added date
  const items = [...targetProjects]
    .sort((a, b) => new Date(b.last_release_at || b.created_at).getTime() - new Date(a.last_release_at || a.created_at).getTime())
    .slice(0, 30);

  const rssItemsXml = items
    .map((p) => {
      const pubDate = new Date(p.last_release_at || p.created_at).toUTCString();
      return `
    <item>
      <title>${escapeXml(p.name)} (${p.owner}) - Health Score ${(p.score * 10).toFixed(1)}/10</title>
      <link>https://pulsaross.vercel.app/project/${encodeURIComponent(p.id)}</link>
      <guid isPermaLink="true">https://pulsaross.vercel.app/project/${encodeURIComponent(p.id)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(p.description || "Android open-source project cataloged on Pulsaross.")}</description>
    </item>`;
    })
    .join("\n");

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Pulsaross Watchlist &amp; OSS Signal Feed</title>
    <link>https://pulsaross.vercel.app</link>
    <description>Automated Android FOSS app health and release monitoring feed.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${rssItemsXml}
  </channel>
</rss>`;

  return new NextResponse(rssXml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
