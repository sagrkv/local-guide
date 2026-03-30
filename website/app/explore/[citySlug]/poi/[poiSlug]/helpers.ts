import type { POIDetail, InfoTile } from "./types";

export function getHeroUrl(poi: POIDetail): string | null {
  if (poi.primaryPhotoUrl) return poi.primaryPhotoUrl;
  const primary = poi.photos?.find((p) => p.isPrimary);
  if (primary?.url) return primary.url;
  if (poi.photos?.[0]?.url) return poi.photos[0].url;
  return null;
}

export function getLat(poi: POIDetail): number {
  return poi.latitude ?? poi.lat ?? 0;
}

export function getLng(poi: POIDetail): number {
  return poi.longitude ?? poi.lng ?? 0;
}

export function getCatName(poi: POIDetail): string | undefined {
  return poi.category?.name ?? poi.categoryName;
}

export function getCatEmoji(poi: POIDetail): string | undefined {
  return poi.category?.emoji ?? poi.categoryEmoji;
}

function formatSeason(s: string): string {
  const map: Record<string, string> = {
    SPRING: "Spring",
    SUMMER: "Summer",
    AUTUMN: "Autumn",
    WINTER: "Winter",
    MONSOON: "Monsoon",
  };
  return map[s] || s;
}

function formatTime(t: string): string {
  const map: Record<string, string> = {
    EARLY_MORNING: "Early Morning",
    MORNING: "Morning",
    AFTERNOON: "Afternoon",
    EVENING: "Evening",
    NIGHT: "Night",
  };
  return map[t] || t;
}

function formatHours(hours: Record<string, string>): string {
  const entries = Object.entries(hours);
  if (entries.length === 0) return "";
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const today = days[new Date().getDay()];
  const todayVal = hours[today];
  if (todayVal) return todayVal === "closed" ? "Closed today" : `Today: ${todayVal}`;
  return entries[0][1];
}

/** Build practical info tiles from POI data. Only includes fields that exist. */
export function buildInfoTiles(poi: POIDetail): InfoTile[] {
  const tiles: InfoTile[] = [];

  if (poi.openingHours && Object.keys(poi.openingHours).length > 0) {
    tiles.push({ icon: "\uD83D\uDD50", label: "Hours", value: formatHours(poi.openingHours) });
  }
  if (poi.entryFee) {
    tiles.push({ icon: "\uD83D\uDCB0", label: "Entry", value: poi.entryFee });
  }
  if (poi.dressCode) {
    tiles.push({ icon: "\uD83D\uDC54", label: "Dress Code", value: poi.dressCode });
  }
  if (poi.estimatedTimeToSpend) {
    tiles.push({ icon: "\u23F1\uFE0F", label: "Time to Spend", value: poi.estimatedTimeToSpend });
  }
  if (poi.bestTimeToVisit && poi.bestTimeToVisit !== "ANY_TIME") {
    tiles.push({ icon: "\uD83C\uDF05", label: "Best Time", value: formatTime(poi.bestTimeToVisit) });
  }
  if (poi.bestSeason && poi.bestSeason !== "ALL_YEAR") {
    tiles.push({ icon: "\uD83D\uDCC5", label: "Best Season", value: formatSeason(poi.bestSeason) });
  }
  if (poi.wheelchairAccessible || poi.isWheelchairAccessible) {
    tiles.push({ icon: "\u267F", label: "Accessible", value: "Wheelchair accessible" });
  }
  if (poi.petFriendly || poi.isPetFriendly) {
    tiles.push({ icon: "\uD83D\uDC15", label: "Pets", value: "Pet friendly" });
  }
  if (poi.wifiAvailable || poi.hasWifi) {
    tiles.push({ icon: "\uD83D\uDCF6", label: "WiFi", value: "WiFi available" });
  }
  if (poi.parkingAvailable || poi.hasParking) {
    tiles.push({ icon: "\uD83C\uDD7F\uFE0F", label: "Parking", value: "Parking available" });
  }

  return tiles;
}
