-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'CURATOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "CityStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "POIStatus" AS ENUM ('AI_SUGGESTED', 'UNDER_REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "POIPriority" AS ENUM ('MUST_VISIT', 'RECOMMENDED', 'HIDDEN_GEM', 'OPTIONAL');

-- CreateEnum
CREATE TYPE "BestSeason" AS ENUM ('SPRING', 'SUMMER', 'AUTUMN', 'WINTER', 'MONSOON', 'ALL_YEAR');

-- CreateEnum
CREATE TYPE "TimeOfDay" AS ENUM ('EARLY_MORNING', 'MORNING', 'AFTERNOON', 'EVENING', 'NIGHT', 'ANY_TIME');

-- CreateEnum
CREATE TYPE "TransportMode" AS ENUM ('WALK', 'BICYCLE', 'AUTO_RICKSHAW', 'TAXI', 'BUS', 'METRO', 'TRAIN', 'BOAT', 'CABLE_CAR', 'NONE');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DiscoveryJobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO', 'DOCUMENT');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'VIEWER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tagline" TEXT,
    "description" TEXT,
    "country" TEXT NOT NULL DEFAULT 'India',
    "state" TEXT,
    "heroImageUrl" TEXT,
    "ogImageUrl" TEXT,
    "centerLat" DOUBLE PRECISION NOT NULL,
    "centerLng" DOUBLE PRECISION NOT NULL,
    "defaultZoom" INTEGER NOT NULL DEFAULT 13,
    "boundsNorthLat" DOUBLE PRECISION,
    "boundsSouthLat" DOUBLE PRECISION,
    "boundsEastLng" DOUBLE PRECISION,
    "boundsWestLng" DOUBLE PRECISION,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "language" TEXT NOT NULL DEFAULT 'en',
    "status" "CityStatus" NOT NULL DEFAULT 'DRAFT',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "city_themes" (
    "id" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "colorPrimary" TEXT NOT NULL DEFAULT '#1E3A5F',
    "colorSecondary" TEXT NOT NULL DEFAULT '#F5E6D3',
    "colorAccent" TEXT NOT NULL DEFAULT '#D4A574',
    "colorBackground" TEXT NOT NULL DEFAULT '#FAFAF8',
    "colorText" TEXT NOT NULL DEFAULT '#1A1A1A',
    "displayFontUrl" TEXT,
    "displayFontFamily" TEXT NOT NULL DEFAULT '''Playfair Display'', serif',
    "bodyFontUrl" TEXT,
    "bodyFontFamily" TEXT NOT NULL DEFAULT '''Inter'', sans-serif',
    "logoUrl" TEXT,
    "emblemUrl" TEXT,
    "backgroundPatternUrl" TEXT,
    "mapStyleJson" JSONB,
    "mapTileUrl" TEXT,
    "iconPack" TEXT NOT NULL DEFAULT 'default',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "city_themes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pois" (
    "id" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortDescription" TEXT,
    "longDescription" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "googlePlaceId" TEXT,
    "categoryId" TEXT NOT NULL,
    "subcategory" TEXT,
    "estimatedTimeToSpend" TEXT,
    "bestTimeToVisit" "TimeOfDay" NOT NULL DEFAULT 'ANY_TIME',
    "bestSeason" "BestSeason" NOT NULL DEFAULT 'ALL_YEAR',
    "entryFee" TEXT,
    "openingHours" JSONB,
    "dressCode" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "instagram" TEXT,
    "address" TEXT,
    "directionsNote" TEXT,
    "nearestLandmark" TEXT,
    "parkingAvailable" BOOLEAN NOT NULL DEFAULT false,
    "wheelchairAccessible" BOOLEAN NOT NULL DEFAULT false,
    "petFriendly" BOOLEAN NOT NULL DEFAULT false,
    "wifiAvailable" BOOLEAN NOT NULL DEFAULT false,
    "familyFriendly" BOOLEAN NOT NULL DEFAULT true,
    "budgetFriendly" BOOLEAN NOT NULL DEFAULT false,
    "localTip" TEXT,
    "warningNote" TEXT,
    "status" "POIStatus" NOT NULL DEFAULT 'AI_SUGGESTED',
    "curatedById" TEXT,
    "aiSuggestedAt" TIMESTAMP(3),
    "humanApprovedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "qualityScore" INTEGER,
    "rejectionReason" TEXT,
    "priority" "POIPriority" NOT NULL DEFAULT 'RECOMMENDED',
    "iconOverride" TEXT,
    "colorOverride" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pois_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "poi_photos" (
    "id" TEXT NOT NULL,
    "poiId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "source" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "poi_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "emoji" TEXT,
    "isGlobal" BOOLEAN NOT NULL DEFAULT true,
    "cityId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags_on_pois" (
    "poiId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_on_pois_pkey" PRIMARY KEY ("poiId","tagId")
);

-- CreateTable
CREATE TABLE "itineraries" (
    "id" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "duration" TEXT NOT NULL,
    "coverImageUrl" TEXT,
    "difficulty" TEXT,
    "estimatedBudget" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "itineraries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itinerary_stops" (
    "id" TEXT NOT NULL,
    "itineraryId" TEXT NOT NULL,
    "poiId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "timeOfDay" "TimeOfDay" NOT NULL DEFAULT 'ANY_TIME',
    "duration" TEXT,
    "note" TEXT,
    "transportToNext" "TransportMode" NOT NULL DEFAULT 'NONE',
    "transportNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "itinerary_stops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collections" (
    "id" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "coverImageUrl" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection_items" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "poiId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collection_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "alt" TEXT,
    "type" "MediaType" NOT NULL DEFAULT 'IMAGE',
    "cityId" TEXT,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discovery_jobs" (
    "id" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "categorySlug" TEXT,
    "searchQuery" TEXT,
    "source" TEXT NOT NULL DEFAULT 'google_places',
    "status" "DiscoveryJobStatus" NOT NULL DEFAULT 'PENDING',
    "candidatesFound" INTEGER NOT NULL DEFAULT 0,
    "approved" INTEGER NOT NULL DEFAULT 0,
    "rejected" INTEGER NOT NULL DEFAULT 0,
    "duplicatesSkipped" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "errorStack" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discovery_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_clerkId_key" ON "users"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "cities_slug_key" ON "cities"("slug");

-- CreateIndex
CREATE INDEX "cities_status_idx" ON "cities"("status");

-- CreateIndex
CREATE INDEX "cities_slug_idx" ON "cities"("slug");

-- CreateIndex
CREATE INDEX "cities_sortOrder_idx" ON "cities"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "city_themes_cityId_key" ON "city_themes"("cityId");

-- CreateIndex
CREATE UNIQUE INDEX "pois_googlePlaceId_key" ON "pois"("googlePlaceId");

-- CreateIndex
CREATE INDEX "pois_cityId_status_idx" ON "pois"("cityId", "status");

-- CreateIndex
CREATE INDEX "pois_cityId_categoryId_idx" ON "pois"("cityId", "categoryId");

-- CreateIndex
CREATE INDEX "pois_cityId_priority_idx" ON "pois"("cityId", "priority");

-- CreateIndex
CREATE INDEX "pois_status_idx" ON "pois"("status");

-- CreateIndex
CREATE INDEX "pois_categoryId_idx" ON "pois"("categoryId");

-- CreateIndex
CREATE INDEX "pois_latitude_longitude_idx" ON "pois"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "pois_qualityScore_idx" ON "pois"("qualityScore");

-- CreateIndex
CREATE INDEX "pois_sortOrder_idx" ON "pois"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "pois_cityId_slug_key" ON "pois"("cityId", "slug");

-- CreateIndex
CREATE INDEX "poi_photos_poiId_sortOrder_idx" ON "poi_photos"("poiId", "sortOrder");

-- CreateIndex
CREATE INDEX "poi_photos_poiId_isPrimary_idx" ON "poi_photos"("poiId", "isPrimary");

-- CreateIndex
CREATE INDEX "categories_isGlobal_idx" ON "categories"("isGlobal");

-- CreateIndex
CREATE INDEX "categories_cityId_idx" ON "categories"("cityId");

-- CreateIndex
CREATE INDEX "categories_sortOrder_idx" ON "categories"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_cityId_key" ON "categories"("slug", "cityId");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tags_slug_key" ON "tags"("slug");

-- CreateIndex
CREATE INDEX "itineraries_cityId_status_idx" ON "itineraries"("cityId", "status");

-- CreateIndex
CREATE INDEX "itineraries_cityId_sortOrder_idx" ON "itineraries"("cityId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "itineraries_cityId_slug_key" ON "itineraries"("cityId", "slug");

-- CreateIndex
CREATE INDEX "itinerary_stops_itineraryId_idx" ON "itinerary_stops"("itineraryId");

-- CreateIndex
CREATE INDEX "itinerary_stops_poiId_idx" ON "itinerary_stops"("poiId");

-- CreateIndex
CREATE UNIQUE INDEX "itinerary_stops_itineraryId_order_key" ON "itinerary_stops"("itineraryId", "order");

-- CreateIndex
CREATE INDEX "collections_cityId_status_idx" ON "collections"("cityId", "status");

-- CreateIndex
CREATE INDEX "collections_cityId_sortOrder_idx" ON "collections"("cityId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "collections_cityId_slug_key" ON "collections"("cityId", "slug");

-- CreateIndex
CREATE INDEX "collection_items_collectionId_idx" ON "collection_items"("collectionId");

-- CreateIndex
CREATE INDEX "collection_items_poiId_idx" ON "collection_items"("poiId");

-- CreateIndex
CREATE UNIQUE INDEX "collection_items_collectionId_poiId_key" ON "collection_items"("collectionId", "poiId");

-- CreateIndex
CREATE UNIQUE INDEX "collection_items_collectionId_order_key" ON "collection_items"("collectionId", "order");

-- CreateIndex
CREATE INDEX "media_cityId_idx" ON "media"("cityId");

-- CreateIndex
CREATE INDEX "media_uploadedById_idx" ON "media"("uploadedById");

-- CreateIndex
CREATE INDEX "media_type_idx" ON "media"("type");

-- CreateIndex
CREATE INDEX "discovery_jobs_cityId_idx" ON "discovery_jobs"("cityId");

-- CreateIndex
CREATE INDEX "discovery_jobs_status_idx" ON "discovery_jobs"("status");

-- CreateIndex
CREATE INDEX "discovery_jobs_createdById_idx" ON "discovery_jobs"("createdById");

-- CreateIndex
CREATE INDEX "discovery_jobs_createdAt_idx" ON "discovery_jobs"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_resource_idx" ON "audit_logs"("resource");

-- CreateIndex
CREATE UNIQUE INDEX "settings_key_key" ON "settings"("key");

-- AddForeignKey
ALTER TABLE "city_themes" ADD CONSTRAINT "city_themes_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pois" ADD CONSTRAINT "pois_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pois" ADD CONSTRAINT "pois_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pois" ADD CONSTRAINT "pois_curatedById_fkey" FOREIGN KEY ("curatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poi_photos" ADD CONSTRAINT "poi_photos_poiId_fkey" FOREIGN KEY ("poiId") REFERENCES "pois"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags_on_pois" ADD CONSTRAINT "tags_on_pois_poiId_fkey" FOREIGN KEY ("poiId") REFERENCES "pois"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags_on_pois" ADD CONSTRAINT "tags_on_pois_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itineraries" ADD CONSTRAINT "itineraries_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itineraries" ADD CONSTRAINT "itineraries_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itinerary_stops" ADD CONSTRAINT "itinerary_stops_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "itineraries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itinerary_stops" ADD CONSTRAINT "itinerary_stops_poiId_fkey" FOREIGN KEY ("poiId") REFERENCES "pois"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collections" ADD CONSTRAINT "collections_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collections" ADD CONSTRAINT "collections_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_items" ADD CONSTRAINT "collection_items_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_items" ADD CONSTRAINT "collection_items_poiId_fkey" FOREIGN KEY ("poiId") REFERENCES "pois"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discovery_jobs" ADD CONSTRAINT "discovery_jobs_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discovery_jobs" ADD CONSTRAINT "discovery_jobs_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
