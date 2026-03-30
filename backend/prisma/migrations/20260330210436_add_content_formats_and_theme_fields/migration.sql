-- AlterTable
ALTER TABLE "city_themes" ADD COLUMN     "motifIds" TEXT[],
ADD COLUMN     "photoFilter" TEXT;

-- AlterTable
ALTER TABLE "collections" ADD COLUMN     "activeMonths" INTEGER[],
ADD COLUMN     "icon" TEXT,
ADD COLUMN     "travelTime" TEXT,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'curated';

-- AlterTable
ALTER TABLE "pois" ADD COLUMN     "zone" TEXT NOT NULL DEFAULT 'city_center';

-- CreateIndex
CREATE INDEX "collections_cityId_type_idx" ON "collections"("cityId", "type");
