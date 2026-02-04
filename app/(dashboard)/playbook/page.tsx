import { prisma } from "@/lib/prisma";
import { PlaybookContainer } from "@/components/playbook/playbook-container";
import { getOrCreateWritingRules } from "./actions";

export default async function PlaybookPage() {
  const [entries, writingRules] = await Promise.all([
    prisma.playbookEntry.findMany({
      orderBy: { platform: "asc" },
    }),
    getOrCreateWritingRules(),
  ]);

  return <PlaybookContainer entries={entries} writingRules={writingRules} />;
}
