import { NextResponse } from "next/server";
export async function GET() {
  const spec = {
    openapi: "3.1.0",
    info: { title: "Pulsaross API", version: "1.0.0", description: "FOSS Android health scores — 6 signals, ETag, rate-limited." },
    servers: [{ url: "https://pulsaross.vercel.app" }],
    paths: {
      "/api/score/{owner}/{repo}": {
        get: {
          summary: "Get project health score",
          parameters: [
            { name: "owner", in: "path", required: true, schema: { type: "string", pattern: "^[A-Za-z0-9._-]+$" } },
            { name: "repo", in: "path", required: true, schema: { type: "string", pattern: "^[A-Za-z0-9._-]+$" } },
            { name: "envelope", in: "query", schema: { type: "string", enum: ["1"] } },
          ],
          responses: {
            "200": { description: "Project + score_breakdown", headers: { "Cache-Control": { schema: { type: "string" } }, ETag: { schema: { type: "string" } }, "x-request-id": { schema: { type: "string" } } } },
            "304": { description: "Not modified (ETag)" },
            "400": { description: "INVALID_PARAM" },
            "404": { description: "NOT_FOUND" },
            "429": { description: "RATE_LIMITED + Retry-After" },
          },
        },
      },
      "/api/feed": {
        get: {
          summary: "RSS 2.0 release & health feed",
          parameters: [
            { name: "repos", in: "query", schema: { type: "string" }, description: "Comma-separated repo IDs to filter" },
          ],
          responses: {
            "200": { description: "RSS 2.0 XML feed", headers: { "Content-Type": { schema: { type: "string", example: "application/xml" } } } },
          },
        },
      },
    },
  };
  return NextResponse.json(spec, { headers: { "Cache-Control": "public, max-age=3600", "X-Content-Type-Options": "nosniff" } });
}
