import { NextResponse } from "next/server";
import { getProjects } from "@/lib/data";

const SAFE_PARAM = /^[A-Za-z0-9._-]+$/;

// ponytail: in-memory token bucket, per-instance. Resets on deploy. Upgrade to KV/Redis if abuse observed.
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
function reqId(request: Request): string {
  return request.headers.get("x-request-id") ?? crypto.randomUUID();
}
function err(status: number, error: string, code: string, id: string, extra?: Record<string, string>) {
  return NextResponse.json({ error, code, requestId: id }, { status, headers: { "x-request-id": id, ...extra } });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ owner: string; repo: string }> }
) {
  const id = reqId(request);
  const ip = request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return err(429, "rate limited", "RATE_LIMITED", id, { "Retry-After": "60" });
  }
  const { owner, repo } = await params;
  if (!SAFE_PARAM.test(owner) || !SAFE_PARAM.test(repo)) {
    return err(400, "invalid owner or repo", "INVALID_PARAM", id);
  }
  const data = getProjects();
  const ownerLower = owner.toLowerCase();
  const repoLower = repo.toLowerCase();
  const project = data.projects.find(
    (p) => p.owner.toLowerCase() === ownerLower && p.name.toLowerCase() === repoLower
  );
  if (!project) {
    return err(404, "not found", "NOT_FOUND", id);
  }
  const etag = `"${project.score.toString(36)}-${(project.last_release_at ?? project.created_at).replace(/[^0-9]/g, "")}-${project.stars.toString(36)}"`;
  const ifNone = request.headers.get("if-none-match");
  if (ifNone === etag) {
    return new NextResponse(null, { status: 304, headers: { ETag: etag, "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400", "x-request-id": id } });
  }
  const url = new URL(request.url);
  const wantEnvelope = url.searchParams.get("envelope") === "1";
  const body = wantEnvelope ? { data: project, meta: { etag, requestId: id, cachedUntil: new Date(Date.now() + 3600_000).toISOString() } } : project;
  return NextResponse.json(body, {
    headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400", ETag: etag, "X-Content-Type-Options": "nosniff", "x-request-id": id },
  });
}
