"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateUserRole } from "@/app/(dashboard)/settings/actions";
import type { User, ShowToast } from "../shared/types";

interface TeamSectionProps {
  users: User[];
  currentUserId: string;
  showToast: ShowToast;
}

export function TeamSection({ users, currentUserId, showToast }: TeamSectionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleRoleChange(userId: string, role: "ADMIN" | "CONTRIBUTOR") {
    startTransition(async () => {
      try {
        await updateUserRole(userId, role);
        showToast("success", "Role updated");
        router.refresh();
      } catch (e) {
        showToast("error", e instanceof Error ? e.message : "Failed to update role");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Team Members</h2>
        <p className="text-sm text-muted-foreground">
          Manage user roles and permissions
        </p>
      </div>

      <div className="rounded-xl glass overflow-hidden">
        <div className="divide-y divide-border/30">
          {users.map((user) => (
            <div key={user.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                {user.image ? (
                  <img src={user.image} alt="" className="w-8 h-8 rounded-full" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs text-foreground">
                    {user.name?.[0] || "?"}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{user.name || "Unknown"}</span>
                    {user.id === currentUserId && (
                      <span className="px-1.5 py-0.5 rounded-md bg-white/10 text-[10px] text-muted-foreground">You</span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{user.email}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                  user.role === "ADMIN" ? "bg-purple-500/20 text-purple-400" : "bg-zinc-500/20 text-zinc-400"
                }`}>
                  {user.role}
                </span>
                {user.id !== currentUserId && (
                  <button
                    onClick={() => handleRoleChange(user.id, user.role === "ADMIN" ? "CONTRIBUTOR" : "ADMIN")}
                    disabled={isPending}
                    className="px-2 py-1 text-xs glass border-border/50 rounded-md hover:bg-white/5 disabled:opacity-50 transition-smooth"
                  >
                    {user.role === "ADMIN" ? "Demote" : "Promote"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
