/**
 * NextAuth.js type augmentations for proper TypeScript support.
 * Extends the default Session and User types to include custom fields.
 */

import type { UserRole } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }

  // role is optional here since the adapter creates users without it initially
  // (role defaults to CONTRIBUTOR in the database schema)
  interface User {
    role?: UserRole;
  }
}
