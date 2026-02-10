import { withAuth } from "@/lib/api";
import { getMonthlySpend, getWeeklySpend } from "@/lib/openrouter/cost-tracker";

export const GET = withAuth(async () => {
  const [monthlySpend, weeklySpend] = await Promise.all([
    getMonthlySpend(),
    getWeeklySpend(),
  ]);

  return { monthlySpend, weeklySpend };
});
