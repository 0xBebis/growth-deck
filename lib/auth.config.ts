import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

const allowedDomain = process.env.AUTH_ALLOWED_DOMAIN || "bytemasons.com";

export default {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      if (!profile?.email) return false;
      const emailVerified = profile.email_verified as boolean | undefined;
      return emailVerified === true && profile.email.endsWith(`@${allowedDomain}`);
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role ?? "CONTRIBUTOR";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
} satisfies NextAuthConfig;
