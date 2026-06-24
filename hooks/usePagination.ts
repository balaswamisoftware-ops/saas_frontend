"use client";

import { useMemo, useState } from "react";
import type { ListParams } from "@/lib/api/types";

interface UsePaginationOptions {
  initialPage?: number;
  initialLimit?: number;
  initialSort?: string;
  initialOrder?: "asc" | "desc";
}

/**
 * Local pagination/sort/search state plus a memoised `params` object ready to
 * hand to any resource `list()` call. Pairs with `useResource`.
 */
export function usePagination(opts: UsePaginationOptions = {}) {
  const [page, setPage] = useState(opts.initialPage ?? 1);
  const [limit, setLimit] = useState(opts.initialLimit ?? 20);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState(opts.initialSort ?? "createdAt");
  const [order, setOrder] = useState<"asc" | "desc">(opts.initialOrder ?? "desc");

  const params: ListParams = useMemo(
    () => ({ page, limit, search: search || undefined, sort, order }),
    [page, limit, search, sort, order]
  );

  return {
    page,
    limit,
    search,
    sort,
    order,
    params,
    setPage,
    setLimit,
    /** Resets to page 1 when changing the query. */
    setSearch: (v: string) => {
      setSearch(v);
      setPage(1);
    },
    setSort,
    setOrder,
    toggleOrder: () => setOrder((o) => (o === "asc" ? "desc" : "asc")),
  };
}
