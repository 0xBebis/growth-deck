import { NextResponse } from "next/server";
import { runHNListener } from "@/lib/listeners/hackernews";
import { saveDiscoveredPosts } from "@/lib/listeners/reddit";
import { verifyCronAuth } from "@/lib/utils/cron-auth";

export async function GET(request: Request) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  try {
    const results = await runHNListener();
    const saved = await saveDiscoveredPosts(results);

    return NextResponse.json({
      success: true,
      found: results.length,
      saved,
    });
  } catch (error) {
    console.error("HN listener error:", error);
    return NextResponse.json(
      { error: "HN listener failed" },
      { status: 500 }
    );
  }
}
