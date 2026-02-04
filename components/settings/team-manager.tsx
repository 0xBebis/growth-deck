"use client";

import { updateUserRole } from "@/app/(dashboard)/settings/actions";

interface TeamManagerProps {
  users: Array<{
    id: string;
    name: string | null;
    email: string;
    role: string;
    image: string | null;
  }>;
  currentUserId: string;
}

export function TeamManager({ users, currentUserId }: TeamManagerProps) {
  return (
    <div className="max-w-2xl space-y-3">
      <h3 className="text-sm font-semibold">Team Members</h3>
      {users.map((user) => (
        <div
          key={user.id}
          className="flex items-center justify-between rounded-md border p-3"
        >
          <div className="flex items-center gap-3">
            {user.image ? (
              <img
                src={user.image}
                alt={user.name || ""}
                className="h-8 w-8 rounded-full"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
                {user.name?.[0] || "?"}
              </div>
            )}
            <div>
              <p className="text-sm font-medium">{user.name || user.email}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                user.role === "ADMIN"
                  ? "bg-purple-100 text-purple-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {user.role}
            </span>
            {user.id !== currentUserId && (
              <form
                action={updateUserRole.bind(
                  null,
                  user.id,
                  user.role === "ADMIN" ? "CONTRIBUTOR" : "ADMIN"
                )}
              >
                <button
                  type="submit"
                  className="rounded border px-2 py-1 text-xs hover:bg-muted"
                >
                  {user.role === "ADMIN" ? "Demote" : "Promote"}
                </button>
              </form>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
