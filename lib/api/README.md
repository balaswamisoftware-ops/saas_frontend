# Frontend ↔ Backend integration

This app talks to the **Seva ERP backend** through a small, reusable layer.
Use it instead of importing from `data/mock.ts`.

## Setup

```bash
npm install
# .env.local already points at the backend:
# NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
npm run dev
```

Start the backend first (`cd ../seva-erp-backed && npm run seed && npm run dev`).

## Layers

| File | Responsibility |
|------|----------------|
| `lib/api/client.ts`    | axios instance, JWT attach, **transparent refresh** on 401, typed `api.get/post/...` + `api.list` |
| `lib/api/services.ts`  | `createResource<T>()` factory + typed clients: `authApi`, `tenantsApi`, `platformApi`, `tenantApi(slug)` |
| `lib/api/tokenStore.ts`| token persistence (localStorage) |
| `stores/auth.store.ts` | Zustand session store (`login`, `logout`, `hydrate`, `hasPermission`) |
| `hooks/*`              | reusable React hooks |

## Hooks

```ts
useAuth({ hydrate })   // session user + login/logout; hydrate on app mount
usePermissions()       // can() / canAny() / canAll() — RBAC in the UI
usePagination()        // page/limit/search/sort state + ready-made `params`
useResource(client, p) // list + create/update/remove for ANY resource
useApi(fetcher, deps)  // generic { data, loading, error, refetch }
useForm({...})         // controlled form + maps backend validation errors
useEmployees(slug?)    // employee management (platform or tenant)
useAuditLogs(slug?)    // audit trail + revert (tenant Owner)
```

## Migrating a page off mock data

Before (mock):

```tsx
import { devotees } from "@/data/mock";
```

After (real API):

```tsx
"use client";
import { tenantApi } from "@/lib/api/services";
import { useResource, usePagination } from "@/hooks";

function DevoteesTable({ slug }: { slug: string }) {
  const pagination = usePagination();
  const { items, meta, loading, create, update, remove } = useResource(
    tenantApi(slug).devotees,
    pagination.params
  );
  // render items, wire pagination.setPage(meta), call create/update/remove
}
```

Because `DataTable` `render` functions cannot cross the server→client boundary,
keep these in a `"use client"` table component (the existing `UserTable` pattern).

## Auth bootstrap

Call `useAuth({ hydrate: true })` once near the root of each console layout so a
stored session is restored on reload. Gate routes on `isAuthenticated` and use
`usePermissions().can("devotees:create")` to show/hide actions.
