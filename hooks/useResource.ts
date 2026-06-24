"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ResourceClient } from "@/lib/api/services";
import type { ApiErrorShape, ListParams, PageMeta } from "@/lib/api/types";

interface UseResourceState<T> {
  items: T[];
  meta: PageMeta | null;
  loading: boolean;
  error: ApiErrorShape | null;
  reload: () => void;
  create: (body: Partial<T>) => Promise<T>;
  update: (id: string, body: Partial<T>) => Promise<T>;
  remove: (id: string) => Promise<void>;
}

/**
 * Binds a typed `ResourceClient` to React state: fetches a list with the given
 * params and exposes mutation helpers that optimistically refresh the list.
 * One hook powers every list page in the app.
 */
export function useResource<T extends { id?: string }>(
  resource: ResourceClient<T>,
  params: ListParams = {},
  enabled = true
): UseResourceState<T> {
  const [items, setItems] = useState<T[]>([]);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<ApiErrorShape | null>(null);
  const reqId = useRef(0);
  const paramsKey = JSON.stringify(params);

  // Callers often pass a freshly-built client every render (e.g.
  // `tenantApi(slug).roles`). Keep the latest in a ref so its changing identity
  // does NOT re-trigger the fetch effect — otherwise it loops forever. The
  // effect re-runs only when the actual params or `enabled` change.
  const resourceRef = useRef(resource);
  resourceRef.current = resource;

  const reload = useCallback(() => {
    if (!enabled) return;
    const id = ++reqId.current;
    setLoading(true);
    setError(null);
    resourceRef.current
      .list(JSON.parse(paramsKey) as ListParams)
      .then((res) => {
        if (id !== reqId.current) return;
        setItems(res.items);
        setMeta(res.meta);
      })
      .catch((err: ApiErrorShape) => id === reqId.current && setError(err))
      .finally(() => id === reqId.current && setLoading(false));
  }, [enabled, paramsKey]);

  useEffect(reload, [reload]);

  const create = useCallback(
    async (body: Partial<T>) => {
      const created = await resourceRef.current.create(body);
      reload();
      return created;
    },
    [reload]
  );

  const update = useCallback(
    async (id: string, body: Partial<T>) => {
      const updated = await resourceRef.current.update(id, body);
      reload();
      return updated;
    },
    [reload]
  );

  const remove = useCallback(
    async (id: string) => {
      await resourceRef.current.remove(id);
      reload();
    },
    [reload]
  );

  return { items, meta, loading, error, reload, create, update, remove };
}
