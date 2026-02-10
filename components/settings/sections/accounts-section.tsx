"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createPlatformAccount,
  deletePlatformAccount,
  togglePlatformAccountDefault,
} from "@/app/(dashboard)/settings/actions";
import { PLATFORM_LABELS } from "@/lib/utils/constants";
import { getPlatformStyle, getPlatformIcon } from "@/lib/utils/platform";
import type { PlatformAccount, ShowToast } from "../shared/types";

interface AccountsSectionProps {
  accounts: PlatformAccount[];
  showToast: ShowToast;
}

export function AccountsSection({ accounts, showToast }: AccountsSectionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleCreate(formData: FormData) {
    startTransition(async () => {
      try {
        await createPlatformAccount(formData);
        showToast("success", "Account added");
        router.refresh();
      } catch (e) {
        showToast("error", e instanceof Error ? e.message : "Failed to add account");
      }
    });
  }

  async function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deletePlatformAccount(id);
        showToast("success", "Account removed");
        router.refresh();
      } catch (e) {
        showToast("error", e instanceof Error ? e.message : "Failed to remove");
      }
    });
  }

  async function handleSetDefault(id: string) {
    startTransition(async () => {
      try {
        await togglePlatformAccountDefault(id);
        showToast("success", "Default account updated");
        router.refresh();
      } catch (e) {
        showToast("error", e instanceof Error ? e.message : "Failed to update");
      }
    });
  }

  // Group accounts by platform
  const grouped = accounts.reduce((acc, a) => {
    if (!acc[a.platform]) acc[a.platform] = [];
    acc[a.platform].push(a);
    return acc;
  }, {} as Record<string, PlatformAccount[]>);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Platform Accounts</h2>
        <p className="text-sm text-muted-foreground">
          Add accounts you&apos;ll use to post replies
        </p>
      </div>

      {/* Add Account Form */}
      <form action={handleCreate} className="rounded-xl glass p-4">
        <h3 className="text-sm font-medium mb-3 text-foreground">Add Account</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1 text-foreground">Platform</label>
            <select name="platform" className="w-full rounded-lg glass border-border/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="X" className="bg-popover text-popover-foreground">X (Twitter)</option>
              <option value="LINKEDIN" className="bg-popover text-popover-foreground">LinkedIn</option>
              <option value="REDDIT" className="bg-popover text-popover-foreground">Reddit</option>
              <option value="HN" className="bg-popover text-popover-foreground">Hacker News</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 text-foreground">Type</label>
            <select name="accountType" className="w-full rounded-lg glass border-border/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="COMPANY" className="bg-popover text-popover-foreground">Company</option>
              <option value="PERSONAL" className="bg-popover text-popover-foreground">Personal</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 text-foreground">Display Name</label>
            <input
              name="displayName"
              required
              placeholder="e.g. Cod3x Official"
              className="w-full rounded-lg glass border-border/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 text-foreground">Handle</label>
            <input
              name="accountHandle"
              placeholder="e.g. @cod3x"
              className="w-full rounded-lg glass border-border/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-smooth glow-sm"
        >
          {isPending ? "Adding..." : "Add Account"}
        </button>
      </form>

      {/* Account List by Platform */}
      <div className="space-y-4">
        {["X", "LINKEDIN", "REDDIT", "HN"].map((platform) => {
          const platformAccounts = grouped[platform] || [];
          return (
            <div key={platform} className="rounded-xl glass overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border-b border-border/30">
                <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold ${getPlatformStyle(platform)}`}>
                  {getPlatformIcon(platform)}
                </span>
                <span className="text-sm font-medium text-foreground">{PLATFORM_LABELS[platform] || platform}</span>
                <span className="text-xs text-muted-foreground">({platformAccounts.length})</span>
              </div>
              {platformAccounts.length > 0 ? (
                <div className="divide-y divide-border/30">
                  {platformAccounts.map((account) => (
                    <div key={account.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{account.displayName}</span>
                          {account.accountHandle && (
                            <span className="text-xs text-muted-foreground">{account.accountHandle}</span>
                          )}
                          {account.isDefault && (
                            <span className="px-1.5 py-0.5 rounded-md bg-green-500/20 text-green-400 text-[10px] font-medium">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted-foreground">{account.accountType}</span>
                          {account.user?.name && (
                            <span className="text-[10px] text-muted-foreground">• Owner: {account.user.name}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!account.isDefault && (
                          <button
                            onClick={() => handleSetDefault(account.id)}
                            disabled={isPending}
                            className="px-2 py-1 text-xs glass border-border/50 rounded-md hover:bg-white/5 disabled:opacity-50 transition-smooth"
                          >
                            Set Default
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(account.id)}
                          disabled={isPending}
                          className="px-2 py-1 text-xs text-red-400 border border-red-500/20 rounded-md hover:bg-red-500/10 disabled:opacity-50 transition-smooth"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                  No accounts added
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
