"use client";

import { useOfflineMap } from "@/hooks/useOfflineMap";

interface OfflineBannerProps {
  citySlug: string;
}

export function OfflineBanner({ citySlug }: OfflineBannerProps) {
  const { isOffline, isDownloaded } = useOfflineMap(citySlug);

  if (!isOffline) return null;

  return (
    <div
      className="w-full text-center py-2 px-4 text-sm font-medium z-50 relative"
      style={{
        backgroundColor: isDownloaded ? "#FEF3C7" : "#FEE2E2",
        color: isDownloaded ? "#92400E" : "#991B1B",
        fontFamily: "var(--c-font-body)",
      }}
    >
      {isDownloaded
        ? "You\u2019re offline \u2014 showing saved data"
        : "You\u2019re offline \u2014 some content may be unavailable"}
    </div>
  );
}

export default OfflineBanner;
