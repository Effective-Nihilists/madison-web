// Auth-agnostic same-origin API client.
//
// This is a Mode B (`auth.mode: 'self'`) app: for UNAUTHENTICATED visitors the
// framework does NOT mount <AppProvider>, so calling `useApp()` (or using its
// `socket`) THROWS and blanks the whole React tree. To stay safe for logged-out
// visitors we fetch over plain same-origin HTTP instead. This works for public
// `req()` endpoints AND for `authReq()` admin endpoints (the browser sends the
// auth cookie via `credentials: 'include'`).
//
// Mirrors the framework's own logged-out failover `postAppRequest` in
// src/client/AppApi.ts — `POST /api/<name> { input }` → `{ result } | { error }`.
export async function apiPost<T>(
  name: string,
  input: Record<string, unknown> = {},
): Promise<T> {
  const res = await fetch(`/api/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ input }),
  });
  const json = (await res.json().catch(() => ({}))) as {
    result?: unknown;
    error?: string;
  };
  if (!res.ok || json.error)
    throw new Error(json.error ?? `request ${name} failed: HTTP ${res.status}`);
  return json.result as T;
}
