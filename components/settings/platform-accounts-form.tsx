"use client";

import { createPlatformAccount, deletePlatformAccount } from "@/app/(dashboard)/settings/actions";
import { PlatformIcon } from "@/components/shared/platform-icon";

interface PlatformAccountsFormProps {
  accounts: Array<{
    id: string;
    platform: string;
    accountType: string;
    displayName: string;
    accountHandle: string | null;
    isActive: boolean;
    isDefault: boolean;
    user: { name: string | null } | null;
  }>;
}

export function PlatformAccountsForm({ accounts }: PlatformAccountsFormProps) {
  return (
    <div className="max-w-2xl space-y-4">
      <form action={createPlatformAccount} className="space-y-3 rounded-lg border p-4">
        <h3 className="text-sm font-semibold">Add Account</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium">Platform</label>
            <select name="platform" className="w-full rounded-md border px-3 py-2 text-sm">
              <option value="X">X (Twitter)</option>
              <option value="LINKEDIN">LinkedIn</option>
              <option value="REDDIT">Reddit</option>
              <option value="HN">Hacker News</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Type</label>
            <select name="accountType" className="w-full rounded-md border px-3 py-2 text-sm">
              <option value="COMPANY">Company</option>
              <option value="PERSONAL">Personal</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Display Name</label>
            <input
              name="displayName"
              required
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="e.g. Cod3x Official"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Handle</label>
            <input
              name="accountHandle"
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="e.g. @cod3x"
            />
          </div>
        </div>
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Add Account
        </button>
      </form>

      <div className="space-y-2">
        {accounts.map((account) => (
          <div key={account.id} className="flex items-center justify-between rounded-md border p-3">
            <div className="flex items-center gap-3">
              <PlatformIcon platform={account.platform} />
              <div>
                <span className="text-sm font-medium">{account.displayName}</span>
                {account.accountHandle && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    {account.accountHandle}
                  </span>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">
                    {account.accountType}
                  </span>
                  {account.isDefault && (
                    <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] text-green-700">
                      Default
                    </span>
                  )}
                  {account.user?.name && (
                    <span className="text-[10px] text-muted-foreground">
                      Owner: {account.user.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <form action={deletePlatformAccount.bind(null, account.id)}>
              <button
                type="submit"
                className="rounded border px-2 py-1 text-xs text-destructive hover:bg-red-50"
              >
                Remove
              </button>
            </form>
          </div>
        ))}
        {accounts.length === 0 && (
          <p className="text-sm text-muted-foreground">No accounts connected yet.</p>
        )}
      </div>
    </div>
  );
}
