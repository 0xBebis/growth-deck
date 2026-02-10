"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";

const LAST_SESSION_KEY = "growthdeck_last_session_id";

interface UseFreshLoginReturn {
  isFreshLogin: boolean;
  clearFreshLogin: () => void;
}

/**
 * Hook to detect fresh login (new session) vs page refresh.
 *
 * Uses sessionStorage to track session fingerprint:
 * - sessionStorage clears when browser closes, so reopening triggers fresh login
 * - session.expires changes per login, creating unique fingerprints
 * - Page refreshes preserve sessionStorage, so modal only shows on actual logins
 */
export function useFreshLogin(): UseFreshLoginReturn {
  const { data: session, status } = useSession();
  const [isFreshLogin, setIsFreshLogin] = useState(false);

  useEffect(() => {
    // Wait for session to be loaded
    if (status !== "authenticated" || !session?.user?.id) {
      return;
    }

    // Create a unique session fingerprint
    // Using user ID + expires timestamp ensures uniqueness per login
    const currentSessionId = `${session.user.id}_${session.expires}`;

    // Check if this is a new session
    const lastSessionId = sessionStorage.getItem(LAST_SESSION_KEY);

    if (lastSessionId !== currentSessionId) {
      // This is a fresh login (new session)
      setIsFreshLogin(true);
      sessionStorage.setItem(LAST_SESSION_KEY, currentSessionId);
    }
  }, [session, status]);

  const clearFreshLogin = useCallback(() => {
    setIsFreshLogin(false);
  }, []);

  return { isFreshLogin, clearFreshLogin };
}
