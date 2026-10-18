export type HostType = "CLUB" | "ADMIN";

export function getHostType(): HostType {
  const hostname = window.location.hostname.toLowerCase();
  const searchParams = new URLSearchParams(window.location.search);
  const portalParam = searchParams.get("portal")?.toUpperCase();

  // URL query parameter takes priority (useful for local dev and testing)
  if (portalParam === "ADMIN" || portalParam === "CLUB") {
    localStorage.setItem("padel_dev_portal", portalParam);
    return portalParam;
  }

  // Local storage override for dev and preview
  const savedDevPortal = localStorage.getItem("padel_dev_portal");
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".vercel.app")
  ) {
    if (savedDevPortal === "ADMIN" || savedDevPortal === "CLUB") {
      return savedDevPortal as HostType;
    }
    return "CLUB";
  }

  const adminHost = (import.meta.env.VITE_ADMIN_HOST || "").toLowerCase();
  const clubHost = (import.meta.env.VITE_CLUB_HOST || "").toLowerCase();

  if (adminHost && hostname === adminHost) {
    return "ADMIN";
  }
  if (clubHost && hostname === clubHost) {
    return "CLUB";
  }

  // Fallback heuristic: subdomain starts with admin. vs club.
  if (hostname.startsWith("admin.")) {
    return "ADMIN";
  }

  return "CLUB";
}

export function setDevHostType(type: HostType): void {
  localStorage.setItem("padel_dev_portal", type);
  const url = new URL(window.location.href);
  url.searchParams.set("portal", type.toLowerCase());
  window.location.href = url.toString();
}
