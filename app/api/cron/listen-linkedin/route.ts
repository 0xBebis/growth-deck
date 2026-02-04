import { NextResponse } from "next/server";
import { runLinkedInListener } from "@/lib/listeners/linkedin";
import { saveDiscoveredPosts } from "@/lib/listeners/reddit";
import { verifyCronAuth } from "@/lib/utils/cron-auth";

export async function GET(request: Request) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  try {
    const results = await runLinkedInListener();
    const saved = await saveDiscoveredPosts(results);

    return NextResponse.json({
      success: true,
      found: results.length,
      saved,
    });
  } catch (error) {
    console.error("LinkedIn listener error:", error);
    return NextResponse.json(
      { error: "LinkedIn listener failed" },
      { status: 500 }
    );
  }
}
