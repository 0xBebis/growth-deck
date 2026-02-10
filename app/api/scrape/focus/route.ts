import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { optimizeFocusQueries } from "@/lib/scrape/focus-optimizer";
import { runFocusScrape } from "@/lib/scrape/focus-scraper";
import type { Platform } from "@prisma/client";

const VALID_PLATFORMS: Platform[] = ["X", "REDDIT", "LINKEDIN", "HN"];

export async function POST(request: NextRequest) {
  // Auth check
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { focus?: string; platforms?: string[] };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { focus, platforms } = body;

  // Validation
  if (!focus || typeof focus !== "string" || focus.trim().length < 10) {
    return Response.json(
      { error: "Focus description must be at least 10 characters" },
      { status: 400 }
    );
  }

  if (!Array.isArray(platforms) || platforms.length === 0) {
    return Response.json(
      { error: "At least one platform must be selected" },
      { status: 400 }
    );
  }

  // Filter to valid platforms only
  const selectedPlatforms = platforms.filter((p): p is Platform =>
    VALID_PLATFORMS.includes(p as Platform)
  );

  if (selectedPlatforms.length === 0) {
    return Response.json(
      { error: "No valid platforms selected" },
      { status: 400 }
    );
  }

  // Create streaming response for real-time progress
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // Controller may be closed
        }
      };

      try {
        // Phase 1: AI Optimization
        const optimizedQueries = await optimizeFocusQueries(focus.trim(), selectedPlatforms);
        send({ type: "optimized", queries: optimizedQueries });

        // Phase 2: Run scrapes per platform (sequential to avoid rate limits)
        const allResults: Awaited<ReturnType<typeof runFocusScrape>> = [];

        for (const platform of selectedPlatforms) {
          send({ type: "platform_start", platform });

          const queries = optimizedQueries[platform] || [];
          let platformResults: Awaited<ReturnType<typeof runFocusScrape>> = [];

          try {
            platformResults = await runFocusScrape(platform, queries);
          } catch (error) {
            console.error(`Error scraping ${platform}:`, error);
            // Continue with other platforms even if one fails
          }

          allResults.push(...platformResults);
          send({
            type: "platform_complete",
            platform,
            count: platformResults.length,
            results: platformResults,
          });
        }

        send({ type: "complete", totalResults: allResults.length });
      } catch (error) {
        console.error("Focus scrape error:", error);
        send({
          type: "error",
          message: error instanceof Error ? error.message : "Scrape failed",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable nginx buffering
    },
  });
}
