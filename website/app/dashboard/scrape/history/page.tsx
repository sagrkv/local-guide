"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Redirect to main scrape page - history is now shown there
export default function ScrapeHistoryRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/scrape");
  }, [router]);

  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-6 w-6 border-2 border-accent border-t-transparent" />
    </div>
  );
}
