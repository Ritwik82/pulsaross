import { NextResponse } from "next/server";
import { getProjects } from "@/lib/data";

const SAFE_PARAM = /^[A-Za-z0-9._-]+$/;

function badgeColor(score: number): string {
  const s = score * 10;
  if (s >= 8) return "#059669";
  if (s >= 6) return "#2563eb";
  if (s >= 4) return "#d97706";
  return "#dc2626";
}

function renderBadgeSvg(label: string, value: string, color: string): string {
  const leftWidth = 66;
  const rightWidth = 52;
  const totalWidth = leftWidth + rightWidth;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" role="img" aria-label="${label}: ${value}">
  <title>${label}: ${value}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="${leftWidth}" height="20" fill="#1e1e24"/>
    <rect x="${leftWidth}" width="${rightWidth}" height="20" fill="${color}"/>
    <rect width="${totalWidth}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110">
    <text aria-hidden="true" x="${leftWidth * 5}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)">${label}</text>
    <text x="${leftWidth * 5}" y="140" transform="scale(.1)" fill="#fff">${label}</text>
    <text aria-hidden="true" x="${(leftWidth + rightWidth / 2) * 10}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)">${value}</text>
    <text x="${(leftWidth + rightWidth / 2) * 10}" y="140" transform="scale(.1)" fill="#fff">${value}</text>
  </g>
</svg>`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ owner: string; repo: string }> }
) {
  const { owner, repo } = await params;
  if (!SAFE_PARAM.test(owner) || !SAFE_PARAM.test(repo)) {
    const svg = renderBadgeSvg("pulsaross", "invalid", "#6b7280");
    return new NextResponse(svg, {
      status: 400,
      headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=300" },
    });
  }

  const data = getProjects();
  const ownerLower = owner.toLowerCase();
  const repoLower = repo.toLowerCase();
  const project = data.projects.find(
    (p) => p.owner.toLowerCase() === ownerLower && p.name.toLowerCase() === repoLower
  );

  if (!project) {
    const svg = renderBadgeSvg("pulsaross", "not found", "#6b7280");
    return new NextResponse(svg, {
      status: 404,
      headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=300" },
    });
  }

  const scoreText = `${(project.score * 10).toFixed(1)}/10`;
  const color = badgeColor(project.score);
  const svg = renderBadgeSvg("pulsaross", scoreText, color);
  const etag = `"${project.score.toString(36)}-${(project.last_release_at ?? project.created_at).replace(/[^0-9]/g, "")}"`;

  if (request.headers.get("if-none-match") === etag) {
    return new NextResponse(null, { status: 304, headers: { ETag: etag, "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" } });
  }

  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      ETag: etag,
    },
  });
}
