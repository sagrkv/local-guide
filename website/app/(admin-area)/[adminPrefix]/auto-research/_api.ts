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
    const message =
      typeof err.error === "string"
        ? err.error
        : err.error?.message ?? err.message ?? "Request failed";
    throw new Error(message);
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

const PROPOSAL_TYPE_MAP: Record<string, string> = {
  ADD: "add_poi",
  REMOVE: "remove_poi",
  FLAG: "flag_review",
};

export async function fetchProposals(
  params: FetchProposalsParams,
): Promise<FetchProposalsResponse> {
  const sp = new URLSearchParams();
  if (params.citySlug) sp.set("citySlug", params.citySlug);
  if (params.status) sp.set("status", params.status.toLowerCase());
  if (params.type) sp.set("proposalType", PROPOSAL_TYPE_MAP[params.type] ?? params.type.toLowerCase());
  if (params.minScore) sp.set("minScore", String(params.minScore));
  sp.set("page", String(params.page || 1));
  const raw = await apiFetch<any>(`/auto-research/proposals?${sp}`);
  // Normalize response — API returns `meta` not `pagination`
  return {
    data: raw.data ?? [],
    pagination: raw.pagination ?? {
      page: raw.meta?.page ?? 1,
      totalPages: raw.meta?.totalPages ?? 1,
      total: raw.meta?.total ?? 0,
    },
    stats: raw.stats ?? { pending: 0, approvedToday: 0, rejectedToday: 0, averageScore: 0 },
  };
}

export async function reviewProposal(
  id: string,
  action: "approve" | "reject" | "defer",
  note?: string,
): Promise<void> {
  await apiFetch(`/auto-research/proposals/${id}/${action}`, {
    method: "POST",
    body: JSON.stringify({ reviewNote: note }),
  });
}
