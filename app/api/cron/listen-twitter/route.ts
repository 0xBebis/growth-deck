import { NextResponse } from "next/server";
import { runTwitterListener } from "@/lib/listeners/twitter";
import { saveDiscoveredPosts } from "@/lib/listeners/reddit";
import { verifyCronAuth } from "@/lib/utils/cron-auth";

export async function GET(request: Request) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  try {
    const results = await runTwitterListener();
    const saved = await saveDiscoveredPosts(results);

    return NextResponse.json({
      success: true,
      found: results.length,
      saved,
    });
  } catch (error) {
    console.error("Twitter listener error:", error);
    return NextResponse.json(
      { error: "Twitter listener failed" },
      { status: 500 }
    );
  }
}
