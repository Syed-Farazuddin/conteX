"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { Sidebar } from "@/components/dashboard/sidebar";
import { PageViewTracker } from "@/lib/analytics/use-tracker";
import { Spinner } from "@/components/ui/ui";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-zinc-400">
        <Spinner className="size-6" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <PageViewTracker />
      <Sidebar />
      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-6xl px-6 py-8 lg:px-10">{children}</div>
      </main>
    </div>
  );
}
