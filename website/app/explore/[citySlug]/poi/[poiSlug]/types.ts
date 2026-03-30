export interface POIDetail {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  longDescription?: string;
  primaryPhotoUrl?: string;
  photos?: { url: string; caption?: string; isPrimary?: boolean }[];
  category?: { name: string; color?: string; emoji?: string };
  categoryName?: string;
  categoryColor?: string;
  categoryEmoji?: string;
  priority?: string;
  estimatedTimeToSpend?: string;
  bestTimeToVisit?: string;
  entryFee?: string;
  bestSeason?: string;
  localTip?: string;
  warningNote?: string;
  warning?: string;
  openingHours?: Record<string, string>;
  dressCode?: string;
  phone?: string;
  website?: string;
  instagram?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
  wifiAvailable?: boolean;
  parkingAvailable?: boolean;
  wheelchairAccessible?: boolean;
  petFriendly?: boolean;
  hasWifi?: boolean;
  hasParking?: boolean;
  isWheelchairAccessible?: boolean;
  isPetFriendly?: boolean;
  cityId?: string;
}

export interface NearbyPOI {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  category?: { name: string; emoji?: string; color?: string };
  photos?: { url: string }[];
  primaryPhotoUrl?: string;
}

export interface InfoTile {
  icon: string;
  label: string;
  value: string;
}
