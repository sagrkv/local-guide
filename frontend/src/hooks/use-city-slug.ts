"use client";

import { useParams } from "next/navigation";

export function useCitySlug(): string | null {
  const params = useParams();
  const citySlug = params?.citySlug;
  if (typeof citySlug === "string") return citySlug;
  return null;
}
