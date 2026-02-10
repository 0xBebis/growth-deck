import dynamic from "next/dynamic";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getCompanyProfile, getLlmConfig, getSlackConfig } from "@/lib/cache/request-cache";

const SettingsContainer = dynamic(
  () => import("@/components/settings/settings-container").then((mod) => mod.SettingsContainer),
  {
    loading: () => (
      <div className="space-y-6 p-6">
        <div className="flex gap-2 border-b border-zinc-800 pb-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-9 w-24 animate-pulse rounded bg-zinc-800" />
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-zinc-800" />
          ))}
        </div>
      </div>
    ),
  }
);

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const params = await searchParams;
  const tab = params.tab || "profile";

  const user = await prisma.user.findUnique({
    where: { email: session.user?.email ?? "" },
  });
  const isAdmin = user?.role === "ADMIN";

  // Use cached functions for frequently accessed config
  const [companyProfile, llmConfig, slackConfig, platformAccounts, users] =
    await Promise.all([
      getCompanyProfile(),
      getLlmConfig(),
      getSlackConfig(),
      prisma.platformAccount.findMany({
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
        include: { user: { select: { name: true } } },
      }),
      prisma.user.findMany({ orderBy: { createdAt: "asc" } }),
    ]);

  return (
    <SettingsContainer
      profile={companyProfile}
      llmConfig={llmConfig}
      platformAccounts={platformAccounts}
      slackConfig={slackConfig}
      users={users}
      currentUserId={user?.id ?? ""}
      isAdmin={isAdmin}
      initialTab={tab}
    />
  );
}
