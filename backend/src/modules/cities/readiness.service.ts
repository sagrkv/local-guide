import { prisma } from '../../lib/prisma.js';
import { POIStatus, ContentStatus } from '@prisma/client';

export interface ReadinessItem {
  done: boolean;
  current?: number;
  required?: number;
  total?: number;
}

export interface CityReadiness {
  score: number;
  canPublish: boolean;
  essential: {
    cityCreated: ReadinessItem;
    themeDefined: ReadinessItem;
    minPOIs: ReadinessItem;
    minCategories: ReadinessItem;
    poisHaveDescription: ReadinessItem;
    poisHaveCoordinates: ReadinessItem;
    minItineraries: ReadinessItem;
    minMoods: ReadinessItem;
    taglineWritten: ReadinessItem;
  };
  recommended: {
    fiftyPOIs: ReadinessItem;
    dayTrip: ReadinessItem;
    localsWeek: ReadinessItem;
    poisWithTips: ReadinessItem;
    poisWithPhotos: ReadinessItem;
    multipleItineraries: ReadinessItem;
  };
}

const MIN_POIS = 30;
const MIN_CATEGORIES = 3;
const MIN_ITINERARIES = 1;
const MIN_MOODS = 3;
const FIFTY_POIS = 50;
const MIN_POIS_WITH_TIPS = 10;
const MIN_POIS_WITH_PHOTOS = 10;
const MULTIPLE_ITINERARIES = 2;

export const readinessService = {
  async getCityReadiness(cityId: string): Promise<CityReadiness> {
    const [
      city,
      themeCount,
      publishedPOICount,
      distinctCategories,
      poisWithoutDescription,
      poisWithoutCoordinates,
      publishedItineraryCount,
      moodCollectionCount,
      poisWithTips,
      poisWithPhotos,
      dayTripCount,
      localsWeekCount,
    ] = await Promise.all([
      // City itself
      prisma.city.findUnique({
        where: { id: cityId },
        select: { id: true, tagline: true },
      }),

      // CityTheme exists
      prisma.cityTheme.count({
        where: { cityId },
      }),

      // Published POIs count
      prisma.pOI.count({
        where: { cityId, status: POIStatus.PUBLISHED },
      }),

      // Distinct categories among published POIs
      prisma.pOI.groupBy({
        by: ['categoryId'],
        where: { cityId, status: POIStatus.PUBLISHED },
      }),

      // Published POIs without shortDescription
      prisma.pOI.count({
        where: {
          cityId,
          status: POIStatus.PUBLISHED,
          OR: [
            { shortDescription: null },
            { shortDescription: '' },
          ],
        },
      }),

      // Published POIs without valid coordinates
      prisma.pOI.count({
        where: {
          cityId,
          status: POIStatus.PUBLISHED,
          OR: [
            { latitude: 0 },
            { longitude: 0 },
          ],
        },
      }),

      // Published itineraries
      prisma.itinerary.count({
        where: { cityId, status: ContentStatus.PUBLISHED },
      }),

      // Mood collections (any status counts toward readiness)
      prisma.collection.count({
        where: { cityId, type: 'mood' },
      }),

      // POIs with localTip
      prisma.pOI.count({
        where: {
          cityId,
          status: POIStatus.PUBLISHED,
          localTip: { not: null },
          NOT: { localTip: '' },
        },
      }),

      // POIs with at least one photo
      prisma.pOI.count({
        where: {
          cityId,
          status: POIStatus.PUBLISHED,
          photos: { some: {} },
        },
      }),

      // Day trip collections
      prisma.collection.count({
        where: { cityId, type: 'day_trip' },
      }),

      // Locals week collections
      prisma.collection.count({
        where: { cityId, type: 'locals_week' },
      }),
    ]);

    const cityExists = city !== null;
    const taglineExists = cityExists && !!city.tagline && city.tagline.trim().length > 0;
    const themeExists = themeCount > 0;
    const distinctCategoryCount = distinctCategories.length;
    const poisAllHaveDescription = publishedPOICount > 0 && poisWithoutDescription === 0;
    const poisAllHaveCoordinates = publishedPOICount > 0 && poisWithoutCoordinates === 0;

    const essential = {
      cityCreated: { done: cityExists },
      themeDefined: { done: themeExists },
      minPOIs: {
        done: publishedPOICount >= MIN_POIS,
        current: publishedPOICount,
        required: MIN_POIS,
      },
      minCategories: {
        done: distinctCategoryCount >= MIN_CATEGORIES,
        current: distinctCategoryCount,
        required: MIN_CATEGORIES,
      },
      poisHaveDescription: {
        done: poisAllHaveDescription,
        current: publishedPOICount - poisWithoutDescription,
        total: publishedPOICount,
      },
      poisHaveCoordinates: {
        done: poisAllHaveCoordinates,
        current: publishedPOICount - poisWithoutCoordinates,
        total: publishedPOICount,
      },
      minItineraries: {
        done: publishedItineraryCount >= MIN_ITINERARIES,
        current: publishedItineraryCount,
        required: MIN_ITINERARIES,
      },
      minMoods: {
        done: moodCollectionCount >= MIN_MOODS,
        current: moodCollectionCount,
        required: MIN_MOODS,
      },
      taglineWritten: { done: taglineExists },
    };

    const recommended = {
      fiftyPOIs: {
        done: publishedPOICount >= FIFTY_POIS,
        current: publishedPOICount,
        required: FIFTY_POIS,
      },
      dayTrip: {
        done: dayTripCount > 0,
        current: dayTripCount,
        required: 1,
      },
      localsWeek: {
        done: localsWeekCount > 0,
        current: localsWeekCount,
        required: 1,
      },
      poisWithTips: {
        done: poisWithTips >= MIN_POIS_WITH_TIPS,
        current: poisWithTips,
        required: MIN_POIS_WITH_TIPS,
      },
      poisWithPhotos: {
        done: poisWithPhotos >= MIN_POIS_WITH_PHOTOS,
        current: poisWithPhotos,
        required: MIN_POIS_WITH_PHOTOS,
      },
      multipleItineraries: {
        done: publishedItineraryCount >= MULTIPLE_ITINERARIES,
        current: publishedItineraryCount,
        required: MULTIPLE_ITINERARIES,
      },
    };

    const essentialItems = Object.values(essential);
    const recommendedItems = Object.values(recommended);
    const allItems = [...essentialItems, ...recommendedItems];

    const doneCount = allItems.filter((item) => item.done).length;
    const score = allItems.length > 0 ? Math.round((doneCount / allItems.length) * 100) : 0;
    const canPublish = essentialItems.every((item) => item.done);

    return {
      score,
      canPublish,
      essential,
      recommended,
    };
  },
};
