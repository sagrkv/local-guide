import { config } from '../../config.js';

interface CityBounds {
  northLat: number;
  southLat: number;
  eastLng: number;
  westLng: number;
}

interface PlaceResult {
  placeId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  types: string[];
  rating?: number;
  userRatingCount?: number;
  phone?: string;
  website?: string;
  openingHours?: string[];
  photos?: Array<{ name: string; widthPx: number; heightPx: number }>;
  editorialSummary?: string;
}

interface PlaceDetails extends PlaceResult {
  googleMapsUri?: string;
  reviews?: Array<{
    rating: number;
    text: string;
    authorName: string;
    publishTime: string;
  }>;
}

interface POIFormattedPlace {
  name: string;
  googlePlaceId: string;
  latitude: number;
  longitude: number;
  address?: string;
  phone?: string;
  website?: string;
  shortDescription?: string;
  openingHours?: string[];
}

const MOCK_PLACES: PlaceResult[] = [
  {
    placeId: 'mock-place-1',
    name: 'Mock Temple',
    address: '123 Temple Street, City Center',
    latitude: 12.9716,
    longitude: 77.5946,
    types: ['tourist_attraction', 'place_of_worship'],
    rating: 4.5,
    userRatingCount: 1200,
    editorialSummary: 'A beautiful historic temple in the heart of the city.',
  },
  {
    placeId: 'mock-place-2',
    name: 'Mock Market',
    address: '456 Market Road, Old Town',
    latitude: 12.9756,
    longitude: 77.5906,
    types: ['shopping_mall', 'tourist_attraction'],
    rating: 4.2,
    userRatingCount: 800,
    editorialSummary: 'A vibrant local market with traditional goods.',
  },
];

const MOCK_PLACE_DETAILS: PlaceDetails = {
  placeId: 'mock-place-1',
  name: 'Mock Temple',
  address: '123 Temple Street, City Center',
  latitude: 12.9716,
  longitude: 77.5946,
  types: ['tourist_attraction', 'place_of_worship'],
  rating: 4.5,
  userRatingCount: 1200,
  phone: '+91 1234567890',
  website: 'https://example.com',
  openingHours: ['Monday: 6:00 AM - 8:00 PM', 'Tuesday: 6:00 AM - 8:00 PM'],
  editorialSummary: 'A beautiful historic temple in the heart of the city.',
  googleMapsUri: 'https://maps.google.com/?cid=mock-place-1',
};

function parseGooglePlace(place: any): PlaceResult {
  return {
    placeId: place.id || '',
    name: place.displayName?.text || '',
    address: place.formattedAddress || '',
    latitude: place.location?.latitude || 0,
    longitude: place.location?.longitude || 0,
    types: place.types || [],
    rating: place.rating,
    userRatingCount: place.userRatingCount,
    phone: place.internationalPhoneNumber,
    website: place.websiteUri,
    openingHours: place.currentOpeningHours?.weekdayDescriptions,
    photos: place.photos?.map((p: any) => ({
      name: p.name,
      widthPx: p.widthPx,
      heightPx: p.heightPx,
    })),
    editorialSummary: place.editorialSummary?.text,
  };
}

function parseGooglePlaceDetails(place: any): PlaceDetails {
  return {
    ...parseGooglePlace(place),
    googleMapsUri: place.googleMapsUri,
    reviews: place.reviews?.map((r: any) => ({
      rating: r.rating,
      text: r.text?.text || '',
      authorName: r.authorAttribution?.displayName || '',
      publishTime: r.publishTime || '',
    })),
  };
}

export const placesService = {
  async searchPlaces(query: string, bounds: CityBounds): Promise<{ results: PlaceResult[]; isMock: boolean }> {
    if (!config.googlePlacesApiKey) {
      return {
        results: MOCK_PLACES,
        isMock: true,
      };
    }

    try {
      const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': config.googlePlacesApiKey,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.types,places.rating,places.userRatingCount,places.internationalPhoneNumber,places.websiteUri,places.currentOpeningHours,places.photos,places.editorialSummary',
        },
        body: JSON.stringify({
          textQuery: query,
          locationRestriction: {
            rectangle: {
              low: { latitude: bounds.southLat, longitude: bounds.westLng },
              high: { latitude: bounds.northLat, longitude: bounds.eastLng },
            },
          },
          maxResultCount: 20,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Google Places API error: ${response.status} ${errorText}`);
      }

      const data = (await response.json()) as { places?: any[] };
      const results = (data.places || []).map(parseGooglePlace);

      return { results, isMock: false };
    } catch (err) {
      throw err;
    }
  },

  async getPlaceDetails(placeId: string): Promise<{ place: PlaceDetails; isMock: boolean }> {
    if (!config.googlePlacesApiKey) {
      return {
        place: { ...MOCK_PLACE_DETAILS, placeId },
        isMock: true,
      };
    }

    try {
      const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
        method: 'GET',
        headers: {
          'X-Goog-Api-Key': config.googlePlacesApiKey,
          'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,types,rating,userRatingCount,internationalPhoneNumber,websiteUri,currentOpeningHours,photos,editorialSummary,googleMapsUri,reviews',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Google Places API error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      const place = parseGooglePlaceDetails(data);

      return { place, isMock: false };
    } catch (err) {
      throw err;
    }
  },

  formatPlaceForPOI(place: PlaceResult): POIFormattedPlace {
    return {
      name: place.name,
      googlePlaceId: place.placeId,
      latitude: place.latitude,
      longitude: place.longitude,
      address: place.address,
      phone: place.phone,
      website: place.website,
      shortDescription: place.editorialSummary,
      openingHours: place.openingHours,
    };
  },
};
