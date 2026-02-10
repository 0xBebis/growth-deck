import dynamic from "next/dynamic";
import { getPlaybookEntries, getWritingRules } from "@/lib/cache/request-cache";
import { getOrCreateWritingRules } from "./actions";

const PlaybookContainer = dynamic(
  () => import("@/components/playbook/playbook-container").then((mod) => mod.PlaybookContainer),
  {
    loading: () => (
      <div className="space-y-6 p-6">
        <div className="h-8 w-48 animate-pulse rounded bg-zinc-800" />
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-zinc-800" />
          ))}
        </div>
      </div>
    ),
  }
);

export default async function PlaybookPage() {
  const [entries, writingRules] = await Promise.all([
    getPlaybookEntries(),
    getWritingRules().then((rules) => rules || getOrCreateWritingRules()),
  ]);

  return <PlaybookContainer entries={entries} writingRules={writingRules!} />;
}
