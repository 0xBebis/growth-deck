import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getMonthlySpend, getWeeklySpend } from "@/lib/openrouter/cost-tracker";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [monthlySpend, weeklySpend] = await Promise.all([
    getMonthlySpend(),
    getWeeklySpend(),
  ]);

  return NextResponse.json({ monthlySpend, weeklySpend });
}
