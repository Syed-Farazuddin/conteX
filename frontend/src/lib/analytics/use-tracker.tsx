"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";

// Lightweight first-party product-analytics client. Events are sent to the
// ConteX API and stored against the org for the "Product Usage" dashboard.

function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  const KEY = "contex_session";
  let id = window.sessionStorage.getItem(KEY);
  if (!id) {
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `s_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
    window.sessionStorage.setItem(KEY, id);
  }
  return id;
}

export function useTracker() {
  const { authFetch, user } = useAuth();

  const track = useCallback(
    (eventType: string, properties?: Record<string, unknown>, path?: string) => {
      if (!user) return; // only track authenticated, org-scoped activity
      void authFetch("/api/analytics/track", {
        method: "POST",
        body: JSON.stringify({
          eventType,
          path: path ?? (typeof window !== "undefined" ? window.location.pathname : undefined),
          source: "web",
          sessionId: getSessionId(),
          properties,
        }),
      }).catch(() => {
        // analytics is best-effort; never surface tracking failures
      });
    },
    [authFetch, user],
  );

  return { track };
}

// Drop this inside an authenticated layout to record a page_view per route.
export function PageViewTracker() {
  const pathname = usePathname();
  const { track } = useTracker();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    track("page_view", undefined, pathname);
  }, [pathname, track]);

  return null;
}
