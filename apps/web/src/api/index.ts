// Base URL for every API call, including the /api/v1 prefix.
//
// In production this is a RELATIVE path ("/api/v1") so requests hit the
// frontend's own origin and get proxied to the API by a platform rewrite rule
// (see `render.yaml`). That keeps the auth cookie first-party. Pointing this at
// the API's absolute URL makes `token` a third-party cookie, which iOS Safari
// blocks — login silently no-ops and refreshes bounce to the landing page.
export const apiBaseUrl =
  import.meta.env.VITE_API_URL ?? "http://localhost:3001/api/v1";
