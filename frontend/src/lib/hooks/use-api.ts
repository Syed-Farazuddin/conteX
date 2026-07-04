"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { ApiError } from "@/lib/api/client";

export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

// Loads data from an authenticated endpoint, re-fetching when `path` changes.
export function useApiData<T>(path: string | null): ApiState<T> {
  const { authFetch } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!path) return;
    setLoading(true);
    setError(null);
    try {
      setData(await authFetch<T>(path));
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to load data.",
      );
    } finally {
      setLoading(false);
    }
  }, [path, authFetch]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload };
}
