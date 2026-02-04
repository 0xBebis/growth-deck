import { SessionProvider } from "next-auth/react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MetricsBar } from "@/components/layout/metrics-bar";
import { SkipLink } from "@/components/layout/skip-link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <SkipLink />
      <div className="flex min-h-dvh gradient-mesh">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <MetricsBar />
          <main id="main-content" className="flex-1 overflow-auto p-4 md:p-6 safe-bottom" tabIndex={-1}>
            {children}
          </main>
        </div>
      </div>
    </SessionProvider>
  );
}
