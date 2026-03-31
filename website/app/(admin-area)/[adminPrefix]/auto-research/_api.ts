import type { Proposal, ProposalStats } from "./_components";

const ADMIN_PREFIX =
  process.env.NEXT_PUBLIC_ADMIN_PREFIX || "nucleus-admin-x7k9m2";
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api/v1";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("pm_token");
}

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}/${ADMIN_PREFIX}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
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

export interface FetchProposalsParams {
  citySlug?: string;
  status?: string;
  type?: string;
  minScore?: number;
  page?: number;
}

export interface FetchProposalsResponse {
  data: Proposal[];
  pagination: { page: number; totalPages: number; total: number };
  stats: ProposalStats;
}

export async function fetchProposals(
  params: FetchProposalsParams,
): Promise<FetchProposalsResponse> {
  const sp = new URLSearchParams();
  if (params.citySlug) sp.set("citySlug", params.citySlug);
  if (params.status) sp.set("status", params.status);
  if (params.type) sp.set("type", params.type);
  if (params.minScore) sp.set("minScore", String(params.minScore));
  sp.set("page", String(params.page || 1));
  return apiFetch<FetchProposalsResponse>(
    `/auto-research/proposals?${sp}`,
  );
}

export async function reviewProposal(
  id: string,
  action: "approve" | "reject" | "defer",
  note?: string,
): Promise<void> {
  await apiFetch(`/auto-research/proposals/${id}/review`, {
    method: "POST",
    body: JSON.stringify({ action, note }),
  });
}
