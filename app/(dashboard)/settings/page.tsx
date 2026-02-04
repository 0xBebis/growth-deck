import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SettingsContainer } from "@/components/settings/settings-container";

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

  const [companyProfile, keywords, platformAccounts, llmConfig, slackConfig, users] =
    await Promise.all([
      prisma.companyProfile.findFirst(),
      prisma.keyword.findMany({ orderBy: { category: "asc" } }),
      prisma.platformAccount.findMany({
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
        include: { user: { select: { name: true } } },
      }),
      prisma.llmConfig.findFirst(),
      prisma.slackConfig.findFirst(),
      prisma.user.findMany({ orderBy: { createdAt: "asc" } }),
    ]);

  return (
    <SettingsContainer
      profile={companyProfile}
      llmConfig={llmConfig}
      platformAccounts={platformAccounts}
      keywords={keywords}
      slackConfig={slackConfig}
      users={users}
      currentUserId={user?.id ?? ""}
      isAdmin={isAdmin}
      initialTab={tab}
    />
  );
}
