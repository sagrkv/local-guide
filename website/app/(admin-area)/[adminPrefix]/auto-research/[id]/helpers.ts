import type { Source } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api/v1";
const ADMIN_PREFIX = process.env.NEXT_PUBLIC_ADMIN_PREFIX || "nucleus-admin-x7k9m2";

export async function adminFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("pm_token") : null;
  const hasBody = options.body !== undefined;
  const res = await fetch(`${API_BASE_URL}/${ADMIN_PREFIX}${endpoint}`, {
    ...options,
    headers: {
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || err.message || "Request failed");
  }
  return res.json();
}

export function scoreColor(value: number): string {
  if (value >= 7.5) return "bg-emerald-500";
  if (value >= 5) return "bg-amber-500";
  return "bg-red-500";
}

export function scoreBadgeColor(value: number): string {
  if (value >= 7.5) return "bg-emerald-500/10 text-emerald-400";
  if (value >= 5) return "bg-amber-500/10 text-amber-400";
  return "bg-red-500/10 text-red-400";
}

export function scoreTextColor(value: number): string {
  if (value >= 7.5) return "text-emerald-400";
  if (value >= 5) return "text-amber-400";
  return "text-red-400";
}

export function sourceIcon(type: Source["type"]): string {
  switch (type) {
    case "article": return "\u{1F4F0}";
    case "reddit": return "\u{1F5E3}\uFE0F";
    case "instagram": return "\u{1F4F8}";
    case "blog": return "\u{270D}\uFE0F";
    case "review": return "\u2B50";
    default: return "\u{1F517}";
  }
}

export function sourceLabel(type: Source["type"]): string {
  switch (type) {
    case "article": return "Article";
    case "reddit": return "Reddit";
    case "instagram": return "Instagram";
    case "blog": return "Blog";
    case "review": return "Review";
    default: return "Source";
  }
}
