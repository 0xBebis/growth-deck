import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ModelSelector } from "./model-selector";
import { SpendBadge } from "./spend-badge";
import { UserMenu } from "./user-menu";

export async function Header() {
  const session = await auth();
  const llmConfig = await prisma.llmConfig.findFirst();
  const defaultModelId = llmConfig?.defaultModelId ?? "moonshotai/kimi-k2.5";

  return (
    <header className="flex h-14 items-center justify-between glass-subtle border-b border-border/50 px-4">
      <div />
      <div className="flex items-center gap-3">
        <ModelSelector currentModelId={defaultModelId} />
        <SpendBadge />
        <UserMenu
          name={session?.user?.name}
          image={session?.user?.image}
        />
      </div>
    </header>
  );
}
