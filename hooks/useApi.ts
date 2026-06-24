"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ApiErrorShape } from "@/lib/api/types";

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: ApiErrorShape | null;
  refetch: () => void;
}

/**
 * Declarative data-fetching hook. Runs `fetcher` on mount and whenever a dep
 * changes, exposing `{ data, loading, error, refetch }`. Stale responses from
 * superseded calls are ignored so the latest request always wins.
 */
export function useApi<T>(fetcher: () => Promise<T>, deps: unknown[] = [], enabled = true): UseApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<ApiErrorShape | null>(null);
  const reqId = useRef(0);

  const run = useCallback(() => {
    if (!enabled) return;
    const id = ++reqId.current;
    setLoading(true);
    setError(null);
    fetcher()
      .then((res) => {
        if (id === reqId.current) setData(res);
      })
      .catch((err: ApiErrorShape) => {
        if (id === reqId.current) setError(err);
      })
      .finally(() => {
        if (id === reqId.current) setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  useEffect(run, [run]);

  return { data, loading, error, refetch: run };
}
