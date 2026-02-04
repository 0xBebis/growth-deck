"use client";

import { signOut } from "next-auth/react";

interface UserMenuProps {
  name: string | null | undefined;
  image: string | null | undefined;
}

export function UserMenu({ name, image }: UserMenuProps) {
  return (
    <div className="flex items-center gap-3">
      {image ? (
        <img
          src={image}
          alt={name || "User"}
          className="h-8 w-8 rounded-full ring-2 ring-border/50"
        />
      ) : (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-medium text-primary ring-2 ring-primary/30">
          {name?.[0] || "?"}
        </div>
      )}
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="text-xs text-muted-foreground hover:text-foreground transition-smooth"
      >
        Sign out
      </button>
    </div>
  );
}
