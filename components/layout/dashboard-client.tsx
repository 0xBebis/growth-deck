"use client";

import { useState, useEffect } from "react";
import { useFreshLogin } from "@/lib/hooks/use-fresh-login";
import { FocusScrapeModal, type FocusScrapeResult } from "@/components/discovery/focus-scrape-modal";

const FOCUS_RESULTS_KEY = "growthdeck_focus_scrape_results";

interface DashboardClientProps {
  children: React.ReactNode;
}

/**
 * Client wrapper for dashboard layout that handles:
 * - Fresh login detection
 * - Focus scrape modal display
 * - Passing results to feed via sessionStorage
 */
export function DashboardClient({ children }: DashboardClientProps) {
  const { isFreshLogin, clearFreshLogin } = useFreshLogin();
  const [showModal, setShowModal] = useState(false);

  // Show modal when fresh login detected
  useEffect(() => {
    if (isFreshLogin) {
      // Small delay to let the page render first
      const timer = setTimeout(() => {
        setShowModal(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isFreshLogin]);

  const handleClose = () => {
    setShowModal(false);
    clearFreshLogin();
  };

  const handleComplete = (results: FocusScrapeResult[]) => {
    // Store results in sessionStorage for FeedContainer to pick up
    if (results.length > 0) {
      sessionStorage.setItem(FOCUS_RESULTS_KEY, JSON.stringify(results));
      // Dispatch custom event to notify FeedContainer
      window.dispatchEvent(new CustomEvent("focus-scrape-complete", { detail: results }));
    }
  };

  return (
    <>
      {children}
      <FocusScrapeModal
        isOpen={showModal}
        onClose={handleClose}
        onComplete={handleComplete}
      />
    </>
  );
}

// Export the storage key for use in other components
export { FOCUS_RESULTS_KEY };
